
import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

async function main(): Promise<void> {
  const fullName = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  // Validate administrator details.
  if (!fullName || !email || !password) {
    throw new Error(
      "Missing administrator details. Check ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD."
    );
  }

  if (fullName.length < 2 || fullName.length > 120) {
    throw new Error("Full name must be between 2 and 120 characters.");
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email) || email.length > 254) {
    throw new Error("Please provide a valid administrator email.");
  }

  if (password.length < 12 || password.length > 128) {
    throw new Error(
      "Administrator password must be between 12 and 128 characters."
    );
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing from your .env file.");
  }

  // Connect to PostgreSQL using the Prisma 7 driver adapter.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    // Prevent duplicate administrator accounts.
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      throw new Error(
        "An administrator with this email already exists. No account was created."
      );
    }

    // Securely hash the administrator password.
    const passwordHash = await bcrypt.hash(password, 12);

    // Create the first SUPER_ADMIN account.
    const admin = await prisma.adminUser.create({
      data: {
        fullName,
        email,
        passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log("\n======================================");
    console.log(" E-SERVICE HUB ADMIN ACCOUNT CREATED");
    console.log("======================================");
    console.log("Name:", admin.fullName);
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);
    console.log("Active:", admin.isActive);
    console.log("Account ID:", admin.id);
    console.log("Created:", admin.createdAt);
    console.log("======================================\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : "An unexpected error occurred.";

  console.error("\nAdministrator setup failed:", message);
  process.exitCode = 1;
});
