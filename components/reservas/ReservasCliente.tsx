"use client";

import { useState, useEffect } from "react";
import BuscadorCliente from "@/components/clientes/BuscadorCliente";

interface Cancha {
  id: string;
  name: string;
  pricePerHour: number;
}

interface Cliente {
  id: string;
  fullName: string;
  phone: string;
  reservationsCount: number;
}

interface Reserva {
  id: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: "paid" | "partial" | "unpaid";
  status: string;
  notes?: string | null;
  field:    { name: string };
  customer: { fullName: string; phone: string };
}

// Colores del semáforo
const SEMAFORO: Record<string, { bg: string; text: string; label: string }> = {
  paid:    { bg: "bg-green-100",  text: "text-green-700",  label: "Pagado"   },
  partial: { bg: "bg-amber-100",  text: "text-amber-700",  label: "Abono"    },
  unpaid:  { bg: "bg-red-100",    text: "text-red-700",    label: "Pendiente"},
};

// Fecha de hoy en formato YYYY-MM-DD
function hoy() {
  return new Date().toISOString().split("T")[0];
}

export default function ReservasCliente() {
  const [fecha, setFecha]           = useState(hoy());
  const [reservas, setReservas]     = useState<Reserva[]>([]);
  const [canchas, setCanchas]       = useState<Cancha[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando]   = useState(false);
  const [error, setError]           = useState("");

  // Estado del formulario
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [form, setForm] = useState({
    fieldId:   "",
    startTime: "08:00",
    endTime:   "09:00",
    notes:     "",
  });

  useEffect(() => {
    cargarCanchas();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    cargarReservas();
  }, [fecha]); // eslint-disable-line react-hooks/exhaustive-deps

  async function cargarCanchas() {
    try {
      const res  = await fetch("/api/canchas");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCanchas(data.filter((c: Cancha & { isActive: boolean }) => c.isActive));
        if (data.length > 0) setForm(f => ({ ...f, fieldId: data[0].id }));
      }
    } catch {
      console.error("Error cargando canchas");
    }
  }

  async function cargarReservas() {
    setCargando(true);
    try {
      const res  = await fetch(`/api/reservas?fecha=${fecha}`);
      const data = await res.json();
      if (Array.isArray(data)) setReservas(data);
      else setReservas([]);
    } finally {
      setCargando(false);
    }
  }

  async function crearReserva() {
    if (!clienteSeleccionado) {
      setError("Debes seleccionar un cliente");
      return;
    }
    if (!form.fieldId) {
      setError("Debes seleccionar una cancha");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId:         form.fieldId,
          customerId:      clienteSeleccionado.id,
          reservationDate: fecha,
          startTime:       form.startTime,
          endTime:         form.endTime,
          notes:           form.notes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al crear la reserva");
        return;
      }

      // Éxito — recargar y cerrar formulario
      await cargarReservas();
      setMostrarForm(false);
      setClienteSeleccionado(null);
      setForm(f => ({ ...f, startTime: "08:00", endTime: "09:00", notes: "" }));

    } catch {
      setError("Error de conexión");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reservas</h1>
          <p className="text-sm text-gray-500">Agenda del día</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Selector de fecha */}
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="bg-green-600 hover:bg-green-700 text-white text-sm
                       font-medium px-4 py-2 rounded-xl transition-colors"
          >
            {mostrarForm ? "Cancelar" : "+ Nueva reserva"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600
                        text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Formulario nueva reserva */}
      {mostrarForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Nueva reserva — {fecha}
          </h2>

          {/* Paso 1: Buscar cliente */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 font-medium">
              1. Busca el cliente por celular
            </p>
            <BuscadorCliente
              onClienteSeleccionado={(c) => setClienteSeleccionado(c)}
            />
          </div>

          {/* Paso 2: Detalles de la reserva */}
          {clienteSeleccionado && (
            <div className="border-t border-gray-50 pt-4">
              <p className="text-xs text-gray-500 mb-3 font-medium">
                2. Completa los detalles de la reserva
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Cancha *
                  </label>
                  <select
                    value={form.fieldId}
                    onChange={e => setForm({ ...form, fieldId: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2
                               text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {canchas.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Hora inicio *
                  </label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2
                               text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Hora fin *
                  </label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={e => setForm({ ...form, endTime: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2
                               text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    Notas (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Trae sus propios petos"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2
                               text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <button
                onClick={crearReserva}
                disabled={guardando}
                className="mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300
                           text-white text-sm font-medium px-6 py-2 rounded-xl
                           transition-colors"
              >
                {guardando ? "Guardando..." : "Confirmar reserva"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista de reservas del día */}
      {cargando ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Cargando reservas...
        </div>
      ) : reservas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12
                        text-center shadow-sm">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-500 text-sm">
            No hay reservas para el {fecha}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Horario</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Cliente</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Cancha</th>
                <th className="text-right text-xs text-gray-400 font-medium px-5 py-3">Total</th>
                <th className="text-center text-xs text-gray-400 font-medium px-5 py-3">Estado pago</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((reserva, i) => {
                const semaforo = SEMAFORO[reserva.paymentStatus];
                return (
                  <tr key={reserva.id}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {reserva.startTime} – {reserva.endTime}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-gray-900">{reserva.customer.fullName}</p>
                      <p className="text-xs text-gray-400">{reserva.customer.phone}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {reserva.field.name}
                    </td>
                    <td className="px-5 py-3 text-sm text-right font-medium text-gray-900">
                      $ {Number(reserva.totalAmount).toLocaleString("es-CO")}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium
                                       ${semaforo.bg} ${semaforo.text}`}>
                        {semaforo.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}