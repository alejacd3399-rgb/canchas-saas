"use client";

import { useState, useEffect } from "react";
import BuscadorCliente from "./BuscadorCliente";

interface Cliente {
  id: string;
  phone: string;
  fullName: string;
  email?: string | null;
  reservationsCount: number;
}

interface LoyaltyConfig {
  reservationsForReward: number;
  rewardDescription: string;
  isActive: boolean;
}

export default function ClientesCliente() {
  const [clientes, setClientes]               = useState<Cliente[]>([]);
  const [cargando, setCargando]               = useState(true);
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [loyalty, setLoyalty]                 = useState<LoyaltyConfig | null>(null);
  const [mostrarConfigLoyalty, setMostrarConfigLoyalty] = useState(false);
  const [formLoyalty, setFormLoyalty] = useState({
    reservationsForReward: "5",
    rewardDescription: "1 reserva gratis de 1 hora",
  });
  const [guardandoLoyalty, setGuardandoLoyalty] = useState(false);

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
      if (!data.error) {
        setLoyalty(data);
        setMostrarConfigLoyalty(false);
      }
    } finally {
      setGuardandoLoyalty(false);
    }
  }

  function alCrearCliente() {
    cargarClientes();
    setMostrarBuscador(false);
  }

  // Verifica si el cliente tiene reserva gratis disponible
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
          <button
            onClick={() => setMostrarConfigLoyalty(!mostrarConfigLoyalty)}
            className="border border-gray-200 text-gray-600 hover:bg-gray-50
                       text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            🎁 Fidelización
          </button>
          <button
            onClick={() => setMostrarBuscador(!mostrarBuscador)}
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
              <input
                type="number"
                min="1"
                value={formLoyalty.reservationsForReward}
                onChange={e => setFormLoyalty({
                  ...formLoyalty,
                  reservationsForReward: e.target.value
                })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Ej: 5 = cada 5 reservas el cliente gana 1 gratis
              </p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Descripción de la recompensa
              </label>
              <input
                type="text"
                value={formLoyalty.rewardDescription}
                onChange={e => setFormLoyalty({
                  ...formLoyalty,
                  rewardDescription: e.target.value
                })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <button
            onClick={guardarLoyalty}
            disabled={guardandoLoyalty}
            className="mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300
                       text-white text-sm font-medium px-6 py-2 rounded-xl transition-colors">
            {guardandoLoyalty ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      )}

      {/* Banner config fidelización activa */}
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

      {/* Buscador nuevo cliente */}
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
        <div className="text-center py-12 text-gray-400 text-sm">
          Cargando clientes...
        </div>
      ) : clientes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12
                        text-center shadow-sm">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-gray-500 text-sm">No hay clientes registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100
                        shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                  Cliente
                </th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                  Celular
                </th>
                <th className="text-center text-xs text-gray-400 font-medium px-5 py-3">
                  Reservas
                </th>
                <th className="text-center text-xs text-gray-400 font-medium px-5 py-3">
                  Fidelización
                </th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente, i) => (
                <tr key={cliente.id}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {cliente.fullName}
                    </p>
                    {cliente.email && (
                      <p className="text-xs text-gray-400">{cliente.email}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {cliente.phone}
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}