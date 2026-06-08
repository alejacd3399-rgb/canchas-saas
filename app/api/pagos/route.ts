import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/lib/stack";
import { getTenantByStackAuthId } from "@/lib/tenant";

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser({ tokenStore: request });
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const tenantUser = await getTenantByStackAuthId(user.id);
    if (!tenantUser) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

    const body = await request.json();
    const { reservationId, amount, paymentMethod, reference, notes } = body;

    if (!reservationId || !amount) {
      return NextResponse.json({ error: "Reserva y monto son obligatorios" }, { status: 400 });
    }

    if (Number(amount) <= 0) {
      return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
    }

    // Verificar que la reserva pertenece al tenant
    const reserva = await prisma.reservation.findFirst({
      where: {
        id:       reservationId,
        tenantId: tenantUser.tenantId,
        deletedAt: null,
      },
    });

    if (!reserva) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    // ── Transacción atómica: crear pago + actualizar semáforo ────
    const resultado = await prisma.$transaction(async (tx) => {

      // 1. Registrar el pago (inmutable — sin updated_at ni deleted_at)
      const pago = await tx.payment.create({
        data: {
          tenantId:      tenantUser.tenantId,
          reservationId,
          receivedBy:    tenantUser.id,
          amount:        Number(amount),
          paymentMethod: paymentMethod ?? "cash",
          reference:     reference ?? null,
          notes:         notes ?? null,
        },
      });

      // 2. Calcular nuevo paidAmount
      const nuevoPaidAmount = Number(reserva.paidAmount) + Number(amount);

      // 3. Determinar nuevo semáforo
      let nuevoEstado: "paid" | "partial" | "unpaid";
      if (nuevoPaidAmount >= Number(reserva.totalAmount)) {
        nuevoEstado = "paid";      // 🟢 Verde
      } else if (nuevoPaidAmount > 0) {
        nuevoEstado = "partial";   // 🟠 Naranja
      } else {
        nuevoEstado = "unpaid";    // 🔴 Rojo
      }

      // 4. Actualizar la reserva
      const reservaActualizada = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          paidAmount:    nuevoPaidAmount,
          paymentStatus: nuevoEstado,
        },
      });

      return { pago, reserva: reservaActualizada };
    });

    return NextResponse.json(resultado, { status: 201 });

  } catch (error) {
    console.error("Error registrando pago:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// GET /api/pagos?reservationId=xxx — historial de pagos de una reserva
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser({ tokenStore: request });
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const tenantUser = await getTenantByStackAuthId(user.id);
    if (!tenantUser) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

    const reservationId = request.nextUrl.searchParams.get("reservationId");
    if (!reservationId) {
      return NextResponse.json({ error: "reservationId requerido" }, { status: 400 });
    }

    const pagos = await prisma.payment.findMany({
      where: {
        reservationId,
        tenantId: tenantUser.tenantId,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(pagos);

  } catch (error) {
    console.error("Error listando pagos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}