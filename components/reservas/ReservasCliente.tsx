"use client";

import { useState, useEffect } from "react";
import BuscadorCliente from "@/components/clientes/BuscadorCliente";

interface Cancha  { id: string; name: string; pricePerHour: number; isActive: boolean; }
interface Cliente { id: string; fullName: string; phone: string; reservationsCount: number; }
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

const SEMAFORO: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  paid:    { bg: "bg-green-100", text: "text-green-700", label: "Pagado",    dot: "bg-green-500"  },
  partial: { bg: "bg-amber-100", text: "text-amber-700", label: "Abono",     dot: "bg-amber-500"  },
  unpaid:  { bg: "bg-red-100",   text: "text-red-700",   label: "Pendiente", dot: "bg-red-500"    },
};

const METODOS_PAGO = [
  { value: "cash",     label: "Efectivo" },
  { value: "nequi",    label: "Nequi"    },
  { value: "transfer", label: "Transferencia" },
  { value: "other",    label: "Otro"     },
];

function hoy() { return new Date().toISOString().split("T")[0]; }

export default function ReservasCliente() {
  const [fecha, setFecha]             = useState(hoy());
  const [reservas, setReservas]       = useState<Reserva[]>([]);
  const [canchas, setCanchas]         = useState<Cancha[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState("");

  // Modal de pago
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null);
  const [formPago, setFormPago] = useState({
    amount:        "",
    paymentMethod: "nequi",
    reference:     "",
    notes:         "",
  });
  const [guardandoPago, setGuardandoPago] = useState(false);
  const [errorPago, setErrorPago]         = useState("");

  // Formulario nueva reserva
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [form, setForm] = useState({
    fieldId:   "",
    startTime: "08:00",
    endTime:   "09:00",
    notes:     "",
  });

  useEffect(() => { cargarCanchas(); }, []);
  useEffect(() => { cargarReservas(); }, [fecha]); // eslint-disable-line

  async function cargarCanchas() {
    try {
      const res  = await fetch("/api/canchas");
      const data = await res.json();
      if (Array.isArray(data)) {
        const activas = data.filter((c: Cancha) => c.isActive);
        setCanchas(activas);
        if (activas.length > 0) setForm(f => ({ ...f, fieldId: activas[0].id }));
      }
    } catch { console.error("Error cargando canchas"); }
  }

  async function cargarReservas() {
    setCargando(true);
    try {
      const res  = await fetch(`/api/reservas?fecha=${fecha}`);
      const data = await res.json();
      if (Array.isArray(data)) setReservas(data);
      else setReservas([]);
    } finally { setCargando(false); }
  }

  async function crearReserva() {
    if (!clienteSeleccionado) { setError("Debes seleccionar un cliente"); return; }
    if (!form.fieldId)        { setError("Debes seleccionar una cancha");  return; }

    setGuardando(true);
    setError("");

    try {
      const res = await fetch("/api/reservas", {
        method:  "POST",
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
      if (!res.ok) { setError(data.error ?? "Error al crear la reserva"); return; }

      await cargarReservas();
      setMostrarForm(false);
      setClienteSeleccionado(null);
      setForm(f => ({ ...f, startTime: "08:00", endTime: "09:00", notes: "" }));

    } catch { setError("Error de conexión"); }
    finally  { setGuardando(false); }
  }

  async function registrarPago() {
    if (!reservaSeleccionada || !formPago.amount) {
      setErrorPago("El monto es obligatorio");
      return;
    }

    setGuardandoPago(true);
    setErrorPago("");

    try {
      const res = await fetch("/api/pagos", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: reservaSeleccionada.id,
          amount:        Number(formPago.amount),
          paymentMethod: formPago.paymentMethod,
          reference:     formPago.reference || null,
          notes:         formPago.notes     || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setErrorPago(data.error ?? "Error al registrar pago"); return; }

      // Éxito — cerrar modal y recargar
      setReservaSeleccionada(null);
      setFormPago({ amount: "", paymentMethod: "nequi", reference: "", notes: "" });
      await cargarReservas();

    } catch { setErrorPago("Error de conexión"); }
    finally  { setGuardandoPago(false); }
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
          <input type="date" value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-500" />
          <button onClick={() => setMostrarForm(!mostrarForm)}
            className="bg-green-600 hover:bg-green-700 text-white text-sm
                       font-medium px-4 py-2 rounded-xl transition-colors">
            {mostrarForm ? "Cancelar" : "+ Nueva reserva"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600
                        text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
      )}

      {/* Formulario nueva reserva */}
      {mostrarForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Nueva reserva — {fecha}
          </h2>
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 font-medium">
              1. Busca el cliente por celular
            </p>
            <BuscadorCliente onClienteSeleccionado={setClienteSeleccionado} />
          </div>

          {clienteSeleccionado && (
            <div className="border-t border-gray-50 pt-4">
              <p className="text-xs text-gray-500 mb-3 font-medium">
                2. Completa los detalles
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cancha *</label>
                  <select value={form.fieldId}
                    onChange={e => setForm({ ...form, fieldId: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2
                               text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    {canchas.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hora inicio *</label>
                  <input type="time" value={form.startTime}
                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2
                               text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hora fin *</label>
                  <input type="time" value={form.endTime}
                    onChange={e => setForm({ ...form, endTime: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2
                               text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">Notas (opcional)</label>
                  <input type="text" placeholder="Ej: Trae sus propios petos"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2
                               text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <button onClick={crearReserva} disabled={guardando}
                className="mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300
                           text-white text-sm font-medium px-6 py-2 rounded-xl transition-colors">
                {guardando ? "Guardando..." : "Confirmar reserva"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista de reservas */}
      {cargando ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : reservas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-500 text-sm">No hay reservas para el {fecha}</p>
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
                <th className="text-right text-xs text-gray-400 font-medium px-5 py-3">Abonado</th>
                <th className="text-center text-xs text-gray-400 font-medium px-5 py-3">Estado</th>
                <th className="text-center text-xs text-gray-400 font-medium px-5 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((reserva, i) => {
                const s = SEMAFORO[reserva.paymentStatus];
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
                    <td className="px-5 py-3 text-sm text-gray-600">{reserva.field.name}</td>
                    <td className="px-5 py-3 text-sm text-right font-medium text-gray-900">
                      ${Number(reserva.totalAmount).toLocaleString("es-CO")}
                    </td>
                    <td className="px-5 py-3 text-sm text-right text-gray-600">
                      ${Number(reserva.paidAmount).toLocaleString("es-CO")}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {reserva.paymentStatus !== "paid" && (
                        <button
                          onClick={() => {
                            setReservaSeleccionada(reserva);
                            setErrorPago("");
                            setFormPago({ amount: "", paymentMethod: "nequi", reference: "", notes: "" });
                          }}
                          className="text-xs text-green-600 hover:text-green-800
                                     font-medium border border-green-200 hover:border-green-400
                                     px-3 py-1 rounded-lg transition-colors">
                          💰 Registrar pago
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de pago */}
      {reservaSeleccionada && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">

            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Registrar pago
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {reservaSeleccionada.customer.fullName} —{" "}
              {reservaSeleccionada.startTime} a {reservaSeleccionada.endTime}
            </p>

            {/* Resumen financiero */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4 flex justify-between text-sm">
              <div>
                <p className="text-xs text-gray-400">Total</p>
                <p className="font-semibold text-gray-900">
                  ${Number(reservaSeleccionada.totalAmount).toLocaleString("es-CO")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Ya abonado</p>
                <p className="font-semibold text-green-600">
                  ${Number(reservaSeleccionada.paidAmount).toLocaleString("es-CO")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Pendiente</p>
                <p className="font-semibold text-red-500">
                  ${(Number(reservaSeleccionada.totalAmount) -
                     Number(reservaSeleccionada.paidAmount)).toLocaleString("es-CO")}
                </p>
              </div>
            </div>

            {errorPago && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl
                              px-4 py-3 mb-4">{errorPago}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Monto a abonar *</label>
                <input type="number"
                  placeholder={`Máx: $${(Number(reservaSeleccionada.totalAmount) -
                    Number(reservaSeleccionada.paidAmount)).toLocaleString("es-CO")}`}
                  value={formPago.amount}
                  onChange={e => setFormPago({ ...formPago, amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2
                             text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Método de pago</label>
                <select value={formPago.paymentMethod}
                  onChange={e => setFormPago({ ...formPago, paymentMethod: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2
                             text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {METODOS_PAGO.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Referencia Nequi (opcional)
                </label>
                <input type="text" placeholder="Número de comprobante"
                  value={formPago.reference}
                  onChange={e => setFormPago({ ...formPago, reference: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2
                             text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setReservaSeleccionada(null)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm
                           font-medium py-2 rounded-xl hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={registrarPago} disabled={guardandoPago}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300
                           text-white text-sm font-medium py-2 rounded-xl transition-colors">
                {guardandoPago ? "Guardando..." : "Confirmar pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}