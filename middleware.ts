import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { stackServerApp } from "@/lib/stack";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas
  const rutasPublicas = [
    "/handler",
    "/suscripcion-vencida",
    "/acceso-bloqueado",
    "/_next",
    "/favicon.ico",
  ];

  const esPublica = rutasPublicas.some(ruta => pathname.startsWith(ruta));
  if (esPublica) return NextResponse.next();

  // Modo demo para producción — sin autenticación
  if (process.env.DEMO_MODE === "true") {
    return NextResponse.next();
  }

  // Modo normal — con autenticación
  try {
    const user = await stackServerApp.getUser({ tokenStore: request });
    if (!user) {
      const loginUrl = new URL("/handler/sign-in", request.url);
      loginUrl.searchParams.set("after_auth_return_to", pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};