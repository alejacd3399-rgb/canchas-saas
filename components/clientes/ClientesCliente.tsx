"use client";

import { useState, useEffect } from "react";
import BuscadorCliente from "./BuscadorCliente";

interface Cliente {
  id: string;
  phone: string;
  fullName: string;
  email?: string | null;
  notes?: string | null;
  reservationsCount: number;
}

interface LoyaltyConfig {
  reservationsForReward: number;
  rewardDescription: string;
  isActive: boolean;
}

export default function ClientesCliente() {
  const [clientes, setClientes]                         = useState<Cliente[]>([]);
  const [cargando, setCargando]                         = useState(true);
  const [mostrarBuscador, setMostrarBuscador]           = useState(false);
  const [loyalty, setLoyalty]                           = useState<LoyaltyConfig | null>(null);
  const [mostrarConfigLoyalty, setMostrarConfigLoyalty] = useState(false);
  const [formLoyalty, setFormLoyalty] = useState({
    reservationsForReward: "5",
    rewardDescription:     "1 reserva gratis de 1 hora",
  });
  const [guardandoLoyalty, setGuardandoLoyalty] = useState(false);

  // Edición
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [formEditar, setFormEditar] = useState({
    fullName: "", email: "", notes: "",
  });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion]         = useState("");

  useEffect(() => {
    async function cargar() {
      await Promise.all([cargarClientes(), cargarLoyalty()]);
    }
    cargar();
  }, []);

  async function cargarClientes() {
    try {
      const res  = await fetch("/api/clientes");
      const data = await res.json();
      if (Array.isArray(data)) setClientes(data);
    } finally {
      setCargando(false);
    }
  }

  async function cargarLoyalty() {
    try {
      const res  = await fetch("/api/fidelizacion");
      const data = await res.json();
      if (data && !data.error) {
        setLoyalty(data);
        setFormLoyalty({
          reservationsForReward: String(data.reservationsForReward),
          rewardDescription:     data.rewardDescription,
        });
      }
    } catch { console.error("Error cargando fidelización"); }
  }

  async function guardarLoyalty() {
    setGuardandoLoyalty(true);
    try {
      const res = await fetch("/api/fidelizacion", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationsForReward: Number(formLoyalty.reservationsForReward),
          rewardDescription:     formLoyalty.rewardDescription,
        }),
      });
      const data = await res.json();
      if (!data.error) { setLoyalty(data); setMostrarConfigLoyalty(false); }
    } finally { setGuardandoLoyalty(false); }
  }

  async function guardarEdicion() {
    if (!clienteEditando) return;
    if (!formEditar.fullName) { setErrorEdicion("El nombre es obligatorio"); return; }

    setGuardandoEdicion(true);
    setErrorEdicion("");

    try {
      const res = await fetch(`/api/clientes/${clienteEditando.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formEditar.fullName,
          email:    formEditar.email    || null,
          notes:    formEditar.notes    || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorEdicion(data.error ?? "Error al guardar"); return; }

      setClienteEditando(null);
      await cargarClientes();
    } catch { setErrorEdicion("Error de conexión"); }
    finally  { setGuardandoEdicion(false); }
  }

  async function eliminarCliente(id: string, nombre: string) {
    if (!confirm(`¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      if (res.ok) await cargarClientes();
    } catch { console.error("Error eliminando cliente"); }
  }

  function alCrearCliente() {
    cargarClientes();
    setMostrarBuscador(false);
  }

  function tieneReservaGratis(cliente: Cliente): boolean {
    if (!loyalty || !loyalty.isActive) return false;
    return cliente.reservationsCount > 0 &&
           cliente.reservationsCount % loyalty.reservationsForReward === 0;
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} registrado{clientes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMostrarConfigLoyalty(!mostrarConfigLoyalty)}
            className="border border-gray-200 text-gray-600 hover:bg-gray-50
                       text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            🎁 Fidelización
          </button>
          <button onClick={() => setMostrarBuscador(!mostrarBuscador)}
            className="bg-green-600 hover:bg-green-700 text-white text-sm
                       font-medium px-4 py-2 rounded-xl transition-colors">
            {mostrarBuscador ? "Cancelar" : "+ Nuevo cliente"}
          </button>
        </div>
      </div>

      {/* Config fidelización */}
      {mostrarConfigLoyalty && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            ⚙️ Configuración de fidelización
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Reservas para ganar recompensa
              </label>
              <input type="number" min="1"
                value={formLoyalty.reservationsForReward}
                onChange={e => setFormLoyalty({ ...formLoyalty, reservationsForReward: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Descripción de la recompensa
              </label>
              <input type="text"
                value={formLoyalty.rewardDescription}
                onChange={e => setFormLoyalty({ ...formLoyalty, rewardDescription: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <button onClick={guardarLoyalty} disabled={guardandoLoyalty}
            className="mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300
                       text-white text-sm font-medium px-6 py-2 rounded-xl transition-colors">
            {guardandoLoyalty ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      )}

      {/* Banner fidelización */}
      {loyalty && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl
                        px-4 py-3 mb-4 flex items-center gap-3">
          <span className="text-xl">🎁</span>
          <p className="text-sm text-amber-800">
            <strong>Fidelización activa:</strong> cada{" "}
            <strong>{loyalty.reservationsForReward}</strong> reservas →{" "}
            {loyalty.rewardDescription}
          </p>
        </div>
      )}

      {/* Buscador */}
      {mostrarBuscador && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Buscar o crear cliente
          </h2>
          <BuscadorCliente onClienteSeleccionado={alCrearCliente} />
        </div>
      )}

      {/* Lista */}
      {cargando ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : clientes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12
                        text-center shadow-sm">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-gray-500 text-sm">No hay clientes registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Cliente</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Celular</th>
                <th className="text-center text-xs text-gray-400 font-medium px-5 py-3">Reservas</th>
                <th className="text-center text-xs text-gray-400 font-medium px-5 py-3">Fidelización</th>
                <th className="text-center text-xs text-gray-400 font-medium px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente, i) => (
                <tr key={cliente.id}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900">{cliente.fullName}</p>
                    {cliente.email && (
                      <p className="text-xs text-gray-400">{cliente.email}</p>
                    )}
                    {cliente.notes && (
                      <p className="text-xs text-gray-300 italic">{cliente.notes}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{cliente.phone}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-sm font-semibold text-green-700">
                      {cliente.reservationsCount}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {tieneReservaGratis(cliente) ? (
                      <span className="text-xs px-2 py-1 rounded-full font-medium
                                       bg-amber-100 text-amber-700">
                        🎁 ¡Reserva gratis!
                      </span>
                    ) : loyalty ? (
                      <span className="text-xs text-gray-400">
                        {loyalty.reservationsForReward -
                         (cliente.reservationsCount % loyalty.reservationsForReward)
                        } para premio
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setClienteEditando(cliente);
                          setFormEditar({
                            fullName: cliente.fullName,
                            email:    cliente.email    ?? "",
                            notes:    cliente.notes    ?? "",
                          });
                          setErrorEdicion("");
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium
                                   border border-blue-200 hover:border-blue-400
                                   px-3 py-1 rounded-lg transition-colors">
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => eliminarCliente(cliente.id, cliente.fullName)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium
                                   border border-red-200 hover:border-red-400
                                   px-3 py-1 rounded-lg transition-colors">
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal editar cliente */}
      {clienteEditando && (
        <div className="fixed inset-0 bg-black/40 flex items-center
                        justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Editar cliente
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              📱 {clienteEditando.phone}
            </p>

            {errorEdicion && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl
                              px-4 py-3 mb-4">{errorEdicion}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Nombre completo *
                </label>
                <input type="text"
                  value={formEditar.fullName}
                  onChange={e => setFormEditar({ ...formEditar, fullName: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2
                             text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Correo (opcional)
                </label>
                <input type="email"
                  value={formEditar.email}
                  onChange={e => setFormEditar({ ...formEditar, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2
                             text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Notas (opcional)
                </label>
                <input type="text"
                  value={formEditar.notes}
                  onChange={e => setFormEditar({ ...formEditar, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2
                             text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setClienteEditando(null)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm
                           font-medium py-2 rounded-xl hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={guardarEdicion} disabled={guardandoEdicion}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300
                           text-white text-sm font-medium py-2 rounded-xl transition-colors">
                {guardandoEdicion ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}