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
    const { fullName, email, notes } = body;

    const cliente = await prisma.customer.findFirst({
      where: { id, tenantId: tenantUser.tenantId, deletedAt: null },
    });
    if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const actualizado = await prisma.customer.update({
      where: { id },
      data: {
        fullName: fullName ?? cliente.fullName,
        email:    email    ?? cliente.email,
        notes:    notes    ?? cliente.notes,
      },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("Error editando cliente:", error);
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

    const cliente = await prisma.customer.findFirst({
      where: { id, tenantId: tenantUser.tenantId, deletedAt: null },
    });
    if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    // Soft delete
    await prisma.customer.update({
      where: { id },
      data:  { deletedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error eliminando cliente:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}