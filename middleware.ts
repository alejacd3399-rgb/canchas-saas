import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { stackServerApp } from "@/lib/stack";

// En Next.js 16 la función se llama "proxy" en lugar de "middleware"
export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // ── 1. Rutas públicas: dejar pasar sin verificar ──────────────
  const rutasPublicas = [
    "/handler",
    "/suscripcion-vencida",
    "/acceso-bloqueado",
    "/_next",
    "/favicon.ico",
  ];

  const esPublica = rutasPublicas.some((ruta) =>
    pathname.startsWith(ruta)
  );
  if (esPublica) return NextResponse.next();

  // ── 2. Verificar autenticación con Stack Auth ─────────────────
  const user = await stackServerApp.getUser({ tokenStore: request });

  if (!user) {
    const loginUrl = new URL("/handler/sign-in", request.url);
    loginUrl.searchParams.set("after_auth_return_to", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 3. Rutas del admin: no necesitan slug de tenant ───────────
  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // ── 4. Extraer slug del tenant ────────────────────────────────
  let tenantSlug: string | null = null;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    tenantSlug = request.headers.get("x-tenant-slug");
  } else {
    const partes = hostname.split(".");
    if (partes.length >= 3) {
      tenantSlug = partes[0];
    }
  }

  if (!tenantSlug) return NextResponse.next();

  // ── 5. Verificar licencia activa ──────────────────────────────
  try {
    const verificacionUrl = new URL(
      `/api/tenant/verificar-licencia?slug=${tenantSlug}`,
      request.url
    );

    const respuesta = await fetch(verificacionUrl, {
      headers: {
        "x-internal-key": process.env.INTERNAL_API_KEY ?? "",
      },
    });

    const datos = await respuesta.json();

    if (!datos.activo) {
      return NextResponse.redirect(
        new URL("/suscripcion-vencida", request.url)
      );
    }

    // ── 6. Pasar tenant_id a las páginas via header ───────────
    const response = NextResponse.next();
    response.headers.set("x-tenant-id", datos.tenantId);
    response.headers.set("x-tenant-slug", tenantSlug);
    return response;

  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};