export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">
        Bienvenida 👋
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Resumen del día de hoy
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Total facturado</span>
            <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">$ 0</p>
          <p className="text-xs text-gray-400 mt-1">reservas de hoy</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Total cobrado</span>
            <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
          </div>
          <p className="text-2xl font-semibold text-green-600">$ 0</p>
          <p className="text-xs text-gray-400 mt-1">pagos recibidos hoy</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Pendiente</span>
            <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
          </div>
          <p className="text-2xl font-semibold text-red-500">$ 0</p>
          <p className="text-xs text-gray-400 mt-1">por cobrar hoy</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-sm font-medium text-gray-700 mb-4">
          Reservas de hoy
        </h2>
        <div className="text-center py-8">
          <p className="text-4xl mb-2">📅</p>
          <p className="text-sm text-gray-400">
            No hay reservas registradas para hoy
          </p>
        </div>
      </div>
    </div>
  );
}