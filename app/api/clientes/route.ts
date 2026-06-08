import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/lib/stack";
import { getTenantByStackAuthId } from "@/lib/tenant";

// GET /api/clientes?phone=3001234567 — buscar por celular
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

    const phone = request.nextUrl.searchParams.get("phone");

    // Si viene teléfono → buscar ese cliente específico
    if (phone) {
      const cliente = await prisma.customer.findFirst({
        where: {
          tenantId: tenantUser.tenantId,
          phone,
          deletedAt: null,
        },
      });

      // Devuelve el cliente o null (no es error si no existe)
      return NextResponse.json({ cliente: cliente ?? null });
    }

    // Sin teléfono → listar todos los clientes
    const clientes = await prisma.customer.findMany({
      where: {
        tenantId: tenantUser.tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clientes);

  } catch (error) {
    console.error("Error en clientes:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/clientes — crear cliente nuevo
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
    const { phone, fullName, email, notes } = body;

    if (!phone || !fullName) {
      return NextResponse.json(
        { error: "Celular y nombre son obligatorios" },
        { status: 400 }
      );
    }

    // Verificar que no exista ya ese celular en este tenant
    const existe = await prisma.customer.findFirst({
      where: {
        tenantId: tenantUser.tenantId,
        phone,
        deletedAt: null,
      },
    });

    if (existe) {
      return NextResponse.json(
        { error: "Ya existe un cliente con ese celular" },
        { status: 409 }
      );
    }

    const cliente = await prisma.customer.create({
      data: {
        tenantId: tenantUser.tenantId,
        phone,
        fullName,
        email: email ?? null,
        notes: notes ?? null,
      },
    });

    return NextResponse.json(cliente, { status: 201 });

  } catch (error) {
    console.error("Error creando cliente:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}