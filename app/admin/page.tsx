import Link from "next/link";

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">
        Panel de administradora 👑
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Gestiona los tenants y suscripciones de la plataforma
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/tenants"
          className="bg-white rounded-2xl border border-gray-100 p-6
                     hover:border-purple-200 hover:shadow-sm transition-all shadow-sm">
          <p className="text-3xl mb-3">🏪</p>
          <h2 className="font-semibold text-gray-900 mb-1">Tenants</h2>
          <p className="text-sm text-gray-500">
            Ver, crear y gestionar dueños de canchas
          </p>
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm
                        opacity-60">
          <p className="text-3xl mb-3">📊</p>
          <h2 className="font-semibold text-gray-900 mb-1">Reportes</h2>
          <p className="text-sm text-gray-500">Próximamente</p>
        </div>
      </div>
    </div>
  );
}