import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

async function authorized() {
  const session = await getAdminSession();
  if (!session) return null;
  return prisma.adminUser.findUnique({
    where: { id: session.id },
    select: { id: true, fullName: true, role: true, isActive: true },
  });
}

export async function GET() {
  const admin = await authorized();
  if (!admin || !admin.isActive) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }
  const content = await prisma.cmsContent.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ success: true, content });
}

export async function POST(request: NextRequest) {
  const admin = await authorized();
  if (!admin || !admin.isActive) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }
  if (!["SUPER_ADMIN", "ADMIN"].includes(admin.role)) {
    return NextResponse.json({ success: false, message: "Not authorised." }, { status: 403 });
  }

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
  const bodyText = typeof body.body === "string" ? body.body.trim() : "";
  const status = body.status === "PUBLISHED" ? "PUBLISHED" : body.status === "ARCHIVED" ? "ARCHIVED" : "DRAFT";

  if (title.length < 3 || title.length > 160 || !/^[-a-z0-9]+$/.test(slug) || bodyText.length < 10) {
    return NextResponse.json({ success: false, message: "Provide a valid title, slug and content." }, { status: 400 });
  }

  try {
    const content = await prisma.cmsContent.create({
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        body: bodyText,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        authorId: admin.id,
        authorName: admin.fullName,
      },
    });
    return NextResponse.json({ success: true, content }, { status: 201 });
  } catch (error) {
    console.error("CMS_CREATE_ERROR:", error);
    return NextResponse.json({ success: false, message: "Slug may already exist or content could not be saved." }, { status: 409 });
  }
}
