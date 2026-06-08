import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Barra lateral admin */}
      <aside className="w-56 bg-white border-r border-gray-100
                        flex flex-col min-h-screen">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                Panel Admin
              </p>
              <p className="text-xs text-gray-400">Administradora</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            <li>
              <Link href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                           text-sm text-gray-600 hover:bg-gray-50">
                <span>🏠</span> Inicio
              </Link>
            </li>
            <li>
              <Link href="/admin/tenants"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                           text-sm text-gray-600 hover:bg-gray-50">
                <span>🏪</span> Tenants
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-3 border-t border-gray-100">
          <Link href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-sm text-gray-500 hover:bg-gray-50">
            <span>↩️</span> Ir al dashboard
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>

    </div>
  );
}