import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// Verifica que quien llama es la administradora
async function verificarAdmin(request: NextRequest) {
  const claveAdmin = request.headers.get("x-admin-key");
  if (claveAdmin && claveAdmin === process.env.INTERNAL_API_KEY) {
    return { email: process.env.ADMIN_EMAIL };
  }
  return null;
}

// GET /api/admin/tenants — listar todos los tenants
export async function GET(request: NextRequest) {
  try {
    const admin = await verificarAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const hoy = new Date();

    const tenants = await prisma.tenant.findMany({
      where:   { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        licenses: {
          where:   { status: "active" },
          orderBy: { expiresAt: "desc" },
          take: 1,
        },
        _count: {
          select: { reservations: true, customers: true },
        },
      },
    });

    // Agregar estado de suscripción calculado
    const tenantsConEstado = tenants.map(tenant => {
      const licencia = tenant.licenses[0] ?? null;
      const activa   = licencia
        ? new Date(licencia.expiresAt) >= hoy && tenant.isActive
        : false;

      return {
        id:           tenant.id,
        businessName: tenant.businessName,
        slug:         tenant.slug,
        email:        tenant.email,
        isActive:     tenant.isActive,
        createdAt:    tenant.createdAt,
        licencia: licencia ? {
          planName:  licencia.planName,
          expiresAt: licencia.expiresAt,
          activa,
        } : null,
        stats: {
          reservas:  tenant._count.reservations,
          clientes:  tenant._count.customers,
        },
      };
    });

    return NextResponse.json(tenantsConEstado);

  } catch (error) {
    console.error("Error listando tenants:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/admin/tenants — crear tenant + licencia
export async function POST(request: NextRequest) {
  try {
    const admin = await verificarAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { businessName, slug, email, phone, planName,
            price, startsAt, expiresAt } = body;

    if (!businessName || !slug || !planName || !price || !startsAt || !expiresAt) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Verificar que el slug no exista
    const slugExiste = await prisma.tenant.findFirst({ where: { slug } });
    if (slugExiste) {
      return NextResponse.json(
        { error: "Ese slug ya está en uso" },
        { status: 409 }
      );
    }

    // Crear tenant + licencia en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          businessName,
          slug,
          email:    email    ?? null,
          phone:    phone    ?? null,
          isActive: true,
        },
      });

      const licencia = await tx.license.create({
        data: {
          tenantId:  tenant.id,
          planName,
          price:     Number(price),
          startsAt:  new Date(startsAt),
          expiresAt: new Date(expiresAt),
          status:    "active",
        },
      });

      return { tenant, licencia };
    });

    return NextResponse.json(resultado, { status: 201 });

  } catch (error) {
    console.error("Error creando tenant:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}