
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

// ==========================================
// POST: SUBMIT A NEW SERVICE REQUEST
// ==========================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";

    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const department =
      typeof body.department === "string" ? body.department.trim() : "";

    const service =
      typeof body.service === "string" ? body.service.trim() : "";

    const details =
      typeof body.details === "string" ? body.details.trim() : "";

    // Validate required fields
    if (!fullName || !phone || !department || !service || !details) {
      return NextResponse.json(
        {
          success: false,
          message: "Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    // Validate field lengths
    if (
      fullName.length > 120 ||
      phone.length > 20 ||
      email.length > 254 ||
      department.length > 120 ||
      service.length > 160 ||
      details.length < 10 ||
      details.length > 5000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Some submitted information is invalid or too long.",
        },
        { status: 400 }
      );
    }

    // Validate phone number
    const phoneDigits = phone.replace(/\D/g, "");

    if (
      !/^[+0-9()\s-]+$/.test(phone) ||
      phoneDigits.length < 7 ||
      phoneDigits.length > 15
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid phone number.",
        },
        { status: 400 }
      );
    }

    // Validate optional email
    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    // Generate unique service request reference
    const reference = `ESH-${randomUUID().toUpperCase()}`;

    // Save customer and request together
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        reference,
        department,
        service,
        description: details,

        customer: {
          create: {
            fullName,
            phone,
            email: email || null,
          },
        },
      },

      select: {
        reference: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your service request has been submitted successfully.",
        request: serviceRequest,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("SERVICE REQUEST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to process your request at this time. Please try again.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// GET: TRACK AN EXISTING SERVICE REQUEST
// ==========================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const reference = searchParams
      .get("reference")
      ?.trim()
      .toUpperCase();

    // Validate reference input
    if (!reference) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide your request reference number.",
        },
        { status: 400 }
      );
    }

    // Validate ESH reference format
    const referencePattern =
      /^ESH-[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/;

    if (!referencePattern.test(reference)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid reference number format.",
        },
        { status: 400 }
      );
    }

    // Find request in PostgreSQL
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: {
        reference,
      },

      select: {
        reference: true,
        department: true,
        service: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Handle missing request
    if (!serviceRequest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No service request was found with that reference number.",
        },
        { status: 404 }
      );
    }

    // Return request information
    return NextResponse.json(
      {
        success: true,
        message: "Service request retrieved successfully.",
        request: serviceRequest,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("REQUEST TRACKING ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to track your request at this time. Please try again.",
      },
      { status: 500 }
    );
  }
}
