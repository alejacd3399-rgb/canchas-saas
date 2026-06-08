import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Solo el middleware puede llamar este endpoint
  const claveInterna = request.headers.get("x-internal-key");
  if (claveInterna !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Slug requerido" }, { status: 400 });
  }

  try {
    const hoy = new Date();

    const tenant = await prisma.tenant.findFirst({
      where: {
        slug,
        isActive: true,
        deletedAt: null,
      },
      include: {
        licenses: {
          where: {
            status: "active",
            startsAt: { lte: hoy },
            expiresAt: { gte: hoy },
          },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ activo: false, razon: "tenant_no_existe" });
    }

    const tieneLicencia = tenant.licenses.length > 0;
    if (!tieneLicencia) {
      return NextResponse.json({ activo: false, razon: "licencia_vencida" });
    }

    return NextResponse.json({
      activo: true,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      businessName: tenant.businessName,
    });

  } catch (error) {
    console.error("Error verificando licencia:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}