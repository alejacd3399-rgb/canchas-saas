"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStackApp } from "@stackframe/stack";

const navegacion = [
  { href: "/dashboard",          icono: "🏠", label: "Inicio"    },
  { href: "/dashboard/reservas", icono: "📅", label: "Reservas"  },
  { href: "/dashboard/canchas",  icono: "⚽", label: "Canchas"   },
  { href: "/dashboard/clientes", icono: "👥", label: "Clientes"  },
  { href: "/dashboard/pagos",    icono: "💰", label: "Pagos"     },
];

interface SidebarProps {
  userEmail: string;
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const app = useStackApp();

  async function cerrarSesion() {
    await app.signOut();
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col min-h-screen">

      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              Canchas SaaS
            </p>
            <p className="text-xs text-gray-400">Panel de gestión</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navegacion.map((item) => {
            const activo = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                    transition-colors duration-150
                    ${activo
                      ? "bg-green-50 text-green-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <span className="text-base">{item.icono}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-gray-100">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-gray-400 truncate">{userEmail}</p>
        </div>
        <button
          onClick={cerrarSesion}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                     text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <span>🚪</span>
          Cerrar sesión
        </button>
      </div>

    </aside>
  );
}