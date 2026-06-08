import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/lib/stack";
import { getTenantByStackAuthId } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser({ tokenStore: request });
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const tenantUser = await getTenantByStackAuthId(user.id);
    if (!tenantUser) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

    const fecha = request.nextUrl.searchParams.get("fecha")
      ?? new Date().toISOString().split("T")[0];

    // Traer todas las reservas activas del día
    const reservas = await prisma.reservation.findMany({
      where: {
        tenantId:        tenantUser.tenantId,
        reservationDate: new Date(fecha),
        deletedAt:       null,
        status:          { not: "cancelled" },
      },
      select: {
        totalAmount:   true,
        paidAmount:    true,
        paymentStatus: true,
      },
    });

    // Calcular totales
    const totalFacturado = reservas.reduce(
      (sum, r) => sum + Number(r.totalAmount), 0
    );
    const totalCobrado = reservas.reduce(
      (sum, r) => sum + Number(r.paidAmount), 0
    );
    const totalPendiente = totalFacturado - totalCobrado;

    // Contar por semáforo
    const pagadas  = reservas.filter(r => r.paymentStatus === "paid").length;
    const parciales = reservas.filter(r => r.paymentStatus === "partial").length;
    const pendientes = reservas.filter(r => r.paymentStatus === "unpaid").length;

    return NextResponse.json({
      fecha,
      totalReservas:   reservas.length,
      totalFacturado,
      totalCobrado,
      totalPendiente,
      semaforo: { pagadas, parciales, pendientes },
    });

  } catch (error) {
    console.error("Error en dashboard:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}