"use client";

import { useState } from "react";

interface Cliente {
  id: string;
  phone: string;
  fullName: string;
  email?: string | null;
  notes?: string | null;
  reservationsCount: number;
}

interface BuscadorClienteProps {
  // Callback cuando se selecciona o crea un cliente
  onClienteSeleccionado?: (cliente: Cliente) => void;
}

export default function BuscadorCliente({ onClienteSeleccionado }: BuscadorClienteProps) {
  const [phone, setPhone]               = useState("");
  const [buscando, setBuscando]         = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [mostrarFormNuevo, setMostrarFormNuevo]   = useState(false);
  const [buscado, setBuscado]           = useState(false);
  const [error, setError]               = useState("");
  const [guardando, setGuardando]       = useState(false);

  // Formulario nuevo cliente
  const [formNuevo, setFormNuevo] = useState({
    fullName: "",
    email:    "",
    notes:    "",
  });

  async function buscarCliente() {
    if (!phone || phone.length < 7) {
      setError("Ingresa un número de celular válido");
      return;
    }

    setBuscando(true);
    setError("");
    setClienteEncontrado(null);
    setMostrarFormNuevo(false);
    setBuscado(false);

    try {
      const res  = await fetch(`/api/clientes?phone=${phone}`);
      const data = await res.json();

      setBuscado(true);

      if (data.cliente) {
        // Cliente encontrado ✅
        setClienteEncontrado(data.cliente);
        onClienteSeleccionado?.(data.cliente);
      } else {
        // No existe → mostrar formulario de nuevo cliente
        setMostrarFormNuevo(true);
      }
    } catch {
      setError("Error al buscar el cliente");
    } finally {
      setBuscando(false);
    }
  }

  async function crearCliente() {
    if (!formNuevo.fullName) {
      setError("El nombre es obligatorio");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          fullName: formNuevo.fullName,
          email:    formNuevo.email    || null,
          notes:    formNuevo.notes    || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al crear el cliente");
        return;
      }

      // Cliente creado ✅
      setClienteEncontrado(data);
      setMostrarFormNuevo(false);
      onClienteSeleccionado?.(data);

    } catch {
      setError("Error de conexión");
    } finally {
      setGuardando(false);
    }
  }

  function limpiar() {
    setPhone("");
    setClienteEncontrado(null);
    setMostrarFormNuevo(false);
    setBuscado(false);
    setError("");
    setFormNuevo({ fullName: "", email: "", notes: "" });
  }

  return (
    <div>
      {/* Barra de búsqueda */}
      <div className="flex gap-2 mb-4">
        <input
          type="tel"
          placeholder="Buscar por número de celular..."
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onKeyDown={e => e.key === "Enter" && buscarCliente()}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2
                     text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={buscarCliente}
          disabled={buscando}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300
                     text-white text-sm font-medium px-4 py-2 rounded-xl
                     transition-colors"
        >
          {buscando ? "Buscando..." : "Buscar"}
        </button>
        {buscado && (
          <button
            onClick={limpiar}
            className="text-gray-400 hover:text-gray-600 text-sm px-3
                       py-2 rounded-xl border border-gray-200 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600
                        text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Cliente encontrado */}
      {clienteEncontrado && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">
                ✅ Cliente encontrado
              </p>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {clienteEncontrado.fullName}
              </p>
              <p className="text-sm text-gray-500">{clienteEncontrado.phone}</p>
              {clienteEncontrado.email && (
                <p className="text-xs text-gray-400">{clienteEncontrado.email}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Reservas totales</p>
              <p className="text-2xl font-bold text-green-700">
                {clienteEncontrado.reservationsCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario nuevo cliente */}
      {mostrarFormNuevo && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-amber-800 mb-3">
            ⚠️ Cliente nuevo — completa sus datos
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                placeholder="Nombre del cliente"
                value={formNuevo.fullName}
                onChange={e => setFormNuevo({ ...formNuevo, fullName: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-amber-400
                           bg-white"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Correo (opcional)
              </label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={formNuevo.email}
                onChange={e => setFormNuevo({ ...formNuevo, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-amber-400
                           bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">
                Notas (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Prefiere cancha 1"
                value={formNuevo.notes}
                onChange={e => setFormNuevo({ ...formNuevo, notes: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-amber-400
                           bg-white"
              />
            </div>
          </div>

          <button
            onClick={crearCliente}
            disabled={guardando}
            className="mt-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300
                       text-white text-sm font-medium px-5 py-2 rounded-xl
                       transition-colors"
          >
            {guardando ? "Guardando..." : "Crear cliente"}
          </button>
        </div>
      )}
    </div>
  );
}