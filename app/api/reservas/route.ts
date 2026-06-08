import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/lib/stack";
import { getTenantByStackAuthId } from "@/lib/tenant";

// GET /api/reservas?fecha=2026-06-08
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser({ tokenStore: request });
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const tenantUser = await getTenantByStackAuthId(user.id);
    if (!tenantUser) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

    const fecha = request.nextUrl.searchParams.get("fecha");
    if (!fecha) return NextResponse.json({ error: "Fecha requerida" }, { status: 400 });

    const reservas = await prisma.reservation.findMany({
      where: {
        tenantId: tenantUser.tenantId,
        reservationDate: new Date(fecha),
        deletedAt: null,
        status: { not: "cancelled" },
      },
      include: {
        field:    { select: { id: true, name: true } },
        customer: { select: { id: true, fullName: true, phone: true } },
      },
      orderBy: [{ fieldId: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(reservas);
  } catch (error) {
    console.error("Error listando reservas:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/reservas — crear reserva
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser({ tokenStore: request });
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const tenantUser = await getTenantByStackAuthId(user.id);
    if (!tenantUser) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

    const body = await request.json();
    const { fieldId, customerId, reservationDate, startTime, endTime, notes } = body;

    if (!fieldId || !customerId || !reservationDate || !startTime || !endTime) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // ── Verificar que la cancha pertenece al tenant ──────────────
    const cancha = await prisma.field.findFirst({
      where: { id: fieldId, tenantId: tenantUser.tenantId, deletedAt: null },
    });
    if (!cancha) return NextResponse.json({ error: "Cancha no encontrada" }, { status: 404 });

    // ── Anti-doble booking: verificar slot libre ─────────────────
    const conflicto = await prisma.reservation.findFirst({
      where: {
        tenantId:        tenantUser.tenantId,
        fieldId,
        reservationDate: new Date(reservationDate),
        status:          { not: "cancelled" },
        deletedAt:       null,
        OR: [
          // Caso 1: nueva reserva empieza dentro de una existente
          { startTime: { lte: startTime }, endTime: { gt: startTime } },
          // Caso 2: nueva reserva termina dentro de una existente
          { startTime: { lt: endTime },    endTime: { gte: endTime } },
          // Caso 3: nueva reserva envuelve a una existente
          { startTime: { gte: startTime }, endTime: { lte: endTime } },
        ],
      },
    });

    if (conflicto) {
      return NextResponse.json(
        { error: "❌ Ese horario ya está reservado. Elige otro slot." },
        { status: 409 }
      );
    }

    // ── Calcular duración y precio ───────────────────────────────
    const [hI, mI] = startTime.split(":").map(Number);
    const [hF, mF] = endTime.split(":").map(Number);
    const duracionMinutos = (hF * 60 + mF) - (hI * 60 + mI);
    const totalAmount = (Number(cancha.pricePerHour) * duracionMinutos) / 60;

    // ── Crear reserva ────────────────────────────────────────────
    const reserva = await prisma.reservation.create({
      data: {
        tenantId:        tenantUser.tenantId,
        fieldId,
        customerId,
        createdBy:       tenantUser.id,
        reservationDate: new Date(reservationDate),
        startTime,
        endTime,
        durationMinutes: duracionMinutos,
        totalAmount,
        paidAmount:      0,
        paymentStatus:   "unpaid",
        status:          "confirmed",
        notes:           notes ?? null,
      },
      include: {
        field:    { select: { name: true } },
        customer: { select: { fullName: true, phone: true } },
      },
    });

    // ── Incrementar contador de reservas del cliente ─────────────
    await prisma.customer.update({
      where: { id: customerId },
      data:  { reservationsCount: { increment: 1 } },
    });

    return NextResponse.json(reserva, { status: 201 });
  } catch (error) {
    console.error("Error creando reserva:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}