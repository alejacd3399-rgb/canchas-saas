import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function verificarAdmin(request: NextRequest) {
  const claveAdmin = request.headers.get("x-admin-key");
  if (claveAdmin && claveAdmin === process.env.INTERNAL_API_KEY) {
    return { email: process.env.ADMIN_EMAIL };
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verificarAdmin(request);
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { businessName, email, phone, isActive } = body;

    const tenant = await prisma.tenant.findFirst({
      where: { id, deletedAt: null },
    });
    if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

    const actualizado = await prisma.tenant.update({
      where: { id },
      data: {
        businessName: businessName ?? tenant.businessName,
        email:        email        ?? tenant.email,
        phone:        phone        ?? tenant.phone,
        isActive:     isActive     ?? tenant.isActive,
      },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("Error editando tenant:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}