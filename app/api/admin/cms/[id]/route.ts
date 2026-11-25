import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  const admin = await prisma.adminUser.findUnique({ where: { id: session.id }, select: { role: true, isActive: true } });
  if (!admin || !admin.isActive || !["SUPER_ADMIN", "ADMIN"].includes(admin.role)) {
    return NextResponse.json({ success: false, message: "Not authorised." }, { status: 403 });
  }

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
  const bodyText = typeof body.body === "string" ? body.body.trim() : "";
  const status = body.status === "PUBLISHED" ? "PUBLISHED" : body.status === "ARCHIVED" ? "ARCHIVED" : "DRAFT";
  if (title.length < 3 || !/^[-a-z0-9]+$/.test(slug) || bodyText.length < 10) {
    return NextResponse.json({ success: false, message: "Invalid content." }, { status: 400 });
  }

  try {
    const existing = await prisma.cmsContent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, message: "Content not found." }, { status: 404 });
    const content = await prisma.cmsContent.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        body: bodyText,
        status,
        publishedAt: status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : null,
      },
    });
    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("CMS_UPDATE_ERROR:", error);
    return NextResponse.json({ success: false, message: "Content could not be updated." }, { status: 409 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  const admin = await prisma.adminUser.findUnique({ where: { id: session.id }, select: { role: true, isActive: true } });
  if (!admin || !admin.isActive || admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, message: "Only a super administrator can delete content." }, { status: 403 });
  }
  await prisma.cmsContent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
