import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/lib/stack";
import { getTenantByStackAuthId } from "@/lib/tenant";

// GET /api/canchas — listar canchas del tenant
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser({ tokenStore: request });
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const tenantUser = await getTenantByStackAuthId(user.id);
    if (!tenantUser) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    const canchas = await prisma.field.findMany({
      where: {
        tenantId: tenantUser.tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(canchas);
  } catch (error) {
    console.error("Error listando canchas:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/canchas — crear cancha nueva
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser({ tokenStore: request });
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const tenantUser = await getTenantByStackAuthId(user.id);
    if (!tenantUser) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { name, fieldType, pricePerHour, surface } = body;

    // Validaciones básicas
    if (!name || !fieldType || !pricePerHour) {
      return NextResponse.json(
        { error: "Nombre, tipo y precio son obligatorios" },
        { status: 400 }
      );
    }

    const cancha = await prisma.field.create({
      data: {
        tenantId: tenantUser.tenantId,
        name,
        fieldType,
        pricePerHour,
        surface: surface ?? "synthetic",
        isActive: true,
      },
    });

    return NextResponse.json(cancha, { status: 201 });
  } catch (error) {
    console.error("Error creando cancha:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}