export default function SuscripcionVencida() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">

        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔴</span>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Suscripción vencida
        </h1>

        <p className="text-gray-500 text-sm mb-6">
          Tu plan de acceso a la plataforma ha expirado.
          Para reactivar tu cuenta, comunícate con la administradora.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-1">
            Contacta a la administradora
          </p>
          <p>📱 WhatsApp: +57 300 000 0000</p>
          <p>✉️ correo@tucorreo.com</p>
        </div>

      </div>
    </div>
  );
}