import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/lib/stack";
import { getTenantByStackAuthId } from "@/lib/tenant";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await stackServerApp.getUser({ tokenStore: request });
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const tenantUser = await getTenantByStackAuthId(user.id);
    if (!tenantUser) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

    const { id } = await params;
    const body = await request.json();
    const { name, fieldType, pricePerHour, surface, isActive } = body;

    const cancha = await prisma.field.findFirst({
      where: { id, tenantId: tenantUser.tenantId, deletedAt: null },
    });
    if (!cancha) return NextResponse.json({ error: "Cancha no encontrada" }, { status: 404 });

    const actualizada = await prisma.field.update({
      where: { id },
      data: {
        name:         name         ?? cancha.name,
        fieldType:    fieldType    ?? cancha.fieldType,
        pricePerHour: pricePerHour ?? cancha.pricePerHour,
        surface:      surface      ?? cancha.surface,
        isActive:     isActive     ?? cancha.isActive,
      },
    });

    return NextResponse.json(actualizada);
  } catch (error) {
    console.error("Error editando cancha:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await stackServerApp.getUser({ tokenStore: request });
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const tenantUser = await getTenantByStackAuthId(user.id);
    if (!tenantUser) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

    const { id } = await params;

    await prisma.field.update({
      where: { id },
      data:  { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error eliminando cancha:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}