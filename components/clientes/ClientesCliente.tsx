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

export default function ClientesCliente() {
  const [clientes, setClientes]               = useState<Cliente[]>([]);
  const [cargando, setCargando]               = useState(true);
  const [mostrarBuscador, setMostrarBuscador] = useState(false);

  // ── primero la función ──────────────────────────────────────
  async function cargarClientes() {
    try {
      const res  = await fetch("/api/clientes");
      const data = await res.json();
      if (Array.isArray(data)) setClientes(data);
    } finally {
      setCargando(false);
    }
  }

  // ── luego el useEffect que la llama ────────────────────────
  useEffect(() => {
    cargarClientes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function alCrearCliente() {
    cargarClientes();
    setMostrarBuscador(false);
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
        <button
          onClick={() => setMostrarBuscador(!mostrarBuscador)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm
                     font-medium px-4 py-2 rounded-xl transition-colors"
        >
          {mostrarBuscador ? "Cancelar" : "+ Nuevo cliente"}
        </button>
      </div>

      {/* Buscador / formulario nuevo */}
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente, i) => (
                <tr
                  key={cliente.id}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                >
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}