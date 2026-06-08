"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardData {
  fecha:           string;
  totalReservas:   number;
  totalFacturado:  number;
  totalCobrado:    number;
  totalPendiente:  number;
  semaforo: {
    pagadas:   number;
    parciales: number;
    pendientes: number;
  };
}

function hoy() { return new Date().toISOString().split("T")[0]; }

function formatCOP(valor: number) {
  return `$ ${valor.toLocaleString("es-CO")}`;
}

export default function DashboardPage() {
  const [fecha, setFecha]       = useState(hoy());
  const [data, setData]         = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);

  // ── primero la función ──────────────────────────
  async function cargarDashboard() {
    setCargando(true);
    try {
      const res  = await fetch(`/api/dashboard?fecha=${fecha}`);
      const json = await res.json();
      if (!json.error) setData(json);
    } finally {
      setCargando(false);
    }
  }

 useEffect(() => {
  async function cargarDashboard() {
    setCargando(true);
    try {
      const res  = await fetch(`/api/dashboard?fecha=${fecha}`);
      const json = await res.json();
      if (!json.error) setData(json);
    } finally {
      setCargando(false);
    }
  }
  cargarDashboard();
}, [fecha]);

  return (
    <div>
      {/* Encabezado con selector de fecha */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Bienvenida 👋
          </h1>
          <p className="text-sm text-gray-500">Resumen financiero del día</p>
        </div>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {cargando ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Cargando datos...
        </div>
      ) : (
        <>
          {/* Tarjetas del semáforo financiero */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Total facturado</span>
                <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCOP(data?.totalFacturado ?? 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {data?.totalReservas ?? 0} reserva{(data?.totalReservas ?? 0) !== 1 ? "s" : ""} hoy
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Total cobrado</span>
                <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
              </div>
              <p className="text-2xl font-semibold text-green-600">
                {formatCOP(data?.totalCobrado ?? 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {data?.semaforo.pagadas ?? 0} pagada{(data?.semaforo.pagadas ?? 0) !== 1 ? "s" : ""} completa{(data?.semaforo.pagadas ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Pendiente</span>
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
              </div>
              <p className="text-2xl font-semibold text-red-500">
                {formatCOP(data?.totalPendiente ?? 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {data?.semaforo.pendientes ?? 0} sin pago ·{" "}
                {data?.semaforo.parciales ?? 0} con abono
              </p>
            </div>

          </div>

          {/* Mini semáforo visual */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-4">
              Estado de pagos del día
            </h2>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                <span className="text-sm text-gray-600">
                  <strong>{data?.semaforo.pagadas ?? 0}</strong> pagadas
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="text-sm text-gray-600">
                  <strong>{data?.semaforo.parciales ?? 0}</strong> con abono
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                <span className="text-sm text-gray-600">
                  <strong>{data?.semaforo.pendientes ?? 0}</strong> pendientes
                </span>
              </div>
            </div>
          </div>

          {/* Accesos rápidos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/dashboard/reservas", icono: "📅", label: "Nueva reserva"  },
              { href: "/dashboard/canchas",  icono: "⚽", label: "Mis canchas"    },
              { href: "/dashboard/clientes", icono: "👥", label: "Clientes"       },
              { href: "/dashboard/pagos",    icono: "💰", label: "Ver pagos"      },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="bg-white rounded-2xl border border-gray-100 p-4
                           text-center hover:border-green-200 hover:shadow-sm
                           transition-all shadow-sm">
                <p className="text-2xl mb-1">{item.icono}</p>
                <p className="text-xs font-medium text-gray-600">{item.label}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}