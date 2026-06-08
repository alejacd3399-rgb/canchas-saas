"use client";

import { useState, useEffect } from "react";

// Tipos
interface Cancha {
  id: string;
  name: string;
  fieldType: string;
  pricePerHour: number;
  surface: string;
  isActive: boolean;
}

const TIPOS_CANCHA = [
  { value: "futbol5",  label: "Fútbol 5"  },
  { value: "futbol7",  label: "Fútbol 7"  },
  { value: "futbol11", label: "Fútbol 11" },
];

const SUPERFICIES = [
  { value: "synthetic", label: "Sintética" },
  { value: "natural",   label: "Natural"   },
  { value: "hybrid",    label: "Híbrida"   },
];

export default function CanchasCliente() {
  const [canchas, setCanchas]         = useState<Cancha[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState("");

  // Estado del formulario
  const [form, setForm] = useState({
    name:         "",
    fieldType:    "futbol5",
    pricePerHour: "",
    surface:      "synthetic",
  });

  // Cargar canchas al entrar a la página
  useEffect(() => {
    cargarCanchas();
  }, []);

  async function cargarCanchas() {
  try {
    const res = await fetch("/api/canchas");
    const data = await res.json();
    
    // Verificar que la respuesta es un array
    if (Array.isArray(data)) {
      setCanchas(data);
    } else {
      console.error("Error de API:", data);
      setError(data.error ?? "Error al cargar canchas");
      setCanchas([]);
    }
  } catch {
    setError("No se pudieron cargar las canchas");
    setCanchas([]);
  } finally {
    setCargando(false);
  }
}

  async function crearCancha() {
    if (!form.name || !form.pricePerHour) {
      setError("El nombre y el precio son obligatorios");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      const res = await fetch("/api/canchas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          pricePerHour: parseFloat(form.pricePerHour),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al crear la cancha");
        return;
      }

      // Éxito: recargar lista y cerrar formulario
      await cargarCanchas();
      setMostrarForm(false);
      setForm({ name: "", fieldType: "futbol5", pricePerHour: "", surface: "synthetic" });

    } catch {
      setError("Error de conexión");
    } finally {
      setGuardando(false);
    }
  }

  // Etiqueta del tipo de cancha
  function etiquetaTipo(tipo: string) {
    return TIPOS_CANCHA.find(t => t.value === tipo)?.label ?? tipo;
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Canchas</h1>
          <p className="text-sm text-gray-500">
            {canchas.length} cancha{canchas.length !== 1 ? "s" : ""} registrada{canchas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm
                     font-medium px-4 py-2 rounded-xl transition-colors"
        >
          {mostrarForm ? "Cancelar" : "+ Nueva cancha"}
        </button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm
                        rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Formulario nueva cancha */}
      {mostrarForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Nueva cancha
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Nombre de la cancha *
              </label>
              <input
                type="text"
                placeholder="Ej: Cancha 1"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Precio por hora *
              </label>
              <input
                type="number"
                placeholder="Ej: 80000"
                value={form.pricePerHour}
                onChange={e => setForm({ ...form, pricePerHour: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Tipo de cancha *
              </label>
              <select
                value={form.fieldType}
                onChange={e => setForm({ ...form, fieldType: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {TIPOS_CANCHA.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Superficie
              </label>
              <select
                value={form.surface}
                onChange={e => setForm({ ...form, surface: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {SUPERFICIES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

          </div>

          <button
            onClick={crearCancha}
            disabled={guardando}
            className="mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300
                       text-white text-sm font-medium px-6 py-2 rounded-xl
                       transition-colors"
          >
            {guardando ? "Guardando..." : "Guardar cancha"}
          </button>
        </div>
      )}

      {/* Lista de canchas */}
      {cargando ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Cargando canchas...
        </div>
      ) : canchas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12
                        text-center shadow-sm">
          <p className="text-4xl mb-3">⚽</p>
          <p className="text-gray-500 text-sm">
            No hay canchas registradas todavía
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Haz clic en &quot;Nueva cancha&quot; para agregar la primera
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {canchas.map(cancha => (
            <div
              key={cancha.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{cancha.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {etiquetaTipo(cancha.fieldType)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium
                  ${cancha.isActive
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-500"
                  }`}>
                  {cancha.isActive ? "Activa" : "Inactiva"}
                </span>
              </div>

              <div className="border-t border-gray-50 pt-3">
                <p className="text-lg font-semibold text-gray-900">
                  $ {Number(cancha.pricePerHour).toLocaleString("es-CO")}
                  <span className="text-xs text-gray-400 font-normal"> / hora</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}