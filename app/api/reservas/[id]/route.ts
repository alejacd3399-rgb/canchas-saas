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
    const { cancellationReason } = body;

    // Verificar que la reserva pertenece al tenant
    const reserva = await prisma.reservation.findFirst({
      where: {
        id,
        tenantId:  tenantUser.tenantId,
        deletedAt: null,
        status:    { not: "cancelled" },
      },
    });

    if (!reserva) {
      return NextResponse.json(
        { error: "Reserva no encontrada o ya cancelada" },
        { status: 404 }
      );
    }

    // Cancelar la reserva
    const reservaCancelada = await prisma.reservation.update({
      where: { id },
      data: {
        status:             "cancelled",
        cancellationReason: cancellationReason ?? "Sin motivo especificado",
      },
    });

    // Decrementar el contador de reservas del cliente
    await prisma.customer.update({
      where: { id: reserva.customerId },
      data:  { reservationsCount: { decrement: 1 } },
    });

    return NextResponse.json(reservaCancelada);

  } catch (error) {
    console.error("Error cancelando reserva:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}