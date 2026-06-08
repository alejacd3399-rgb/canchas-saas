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

    const config = await prisma.loyaltyConfig.findUnique({
      where: { tenantId: tenantUser.tenantId },
    });

    return NextResponse.json(config ?? null);

  } catch (error) {
    console.error("Error fidelización:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser({ tokenStore: request });
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const tenantUser = await getTenantByStackAuthId(user.id);
    if (!tenantUser) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

    const body = await request.json();
    const { reservationsForReward, rewardDescription } = body;

    if (!reservationsForReward || !rewardDescription) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    // Upsert — crea si no existe, actualiza si ya existe
    const config = await prisma.loyaltyConfig.upsert({
      where:  { tenantId: tenantUser.tenantId },
      create: {
        tenantId: tenantUser.tenantId,
        reservationsForReward: Number(reservationsForReward),
        rewardDescription,
        isActive: true,
      },
      update: {
        reservationsForReward: Number(reservationsForReward),
        rewardDescription,
      },
    });

    return NextResponse.json(config);

  } catch (error) {
    console.error("Error guardando fidelización:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}