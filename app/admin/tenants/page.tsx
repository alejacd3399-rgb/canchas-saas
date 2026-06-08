"use client";

import { useState, useEffect } from "react";

interface Tenant {
  id: string;
  businessName: string;
  slug: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  licencia: {
    planName: string;
    expiresAt: string;
    activa: boolean;
  } | null;
  stats: { reservas: number; clientes: number };
}

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY ?? "";

export default function AdminTenantsPage() {
  const [tenants, setTenants]         = useState<Tenant[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState("");
  const [exito, setExito]             = useState("");

  // Edición
  const [tenantEditando, setTenantEditando]   = useState<Tenant | null>(null);
  const [formEditar, setFormEditar] = useState({
    businessName: "", email: "", phone: "", isActive: true,
  });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion]         = useState("");

  const [form, setForm] = useState({
    businessName: "", slug: "", email: "", phone: "",
    planName: "Plan Básico", price: "50000",
    startsAt:  new Date().toISOString().split("T")[0],
    expiresAt: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split("T")[0];
    })(),
  });

  useEffect(() => {
    async function cargar() {
      try {
        const res  = await fetch("/api/admin/tenants", {
          headers: { "x-admin-key": ADMIN_KEY },
        });
        const data = await res.json();
        if (Array.isArray(data)) setTenants(data);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  async function recargarTenants() {
    const res  = await fetch("/api/admin/tenants", {
      headers: { "x-admin-key": ADMIN_KEY },
    });
    const data = await res.json();
    if (Array.isArray(data)) setTenants(data);
  }

  async function crearTenant() {
    if (!form.businessName || !form.slug) {
      setError("Nombre y slug son obligatorios"); return;
    }
    setGuardando(true);
    setError("");
    setExito("");
    try {
      const res = await fetch("/api/admin/tenants", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al crear"); return; }
      setExito(`✅ Tenant "${form.businessName}" creado exitosamente`);
      setMostrarForm(false);
      setForm({
        businessName: "", slug: "", email: "", phone: "",
        planName: "Plan Básico", price: "50000",
        startsAt:  new Date().toISOString().split("T")[0],
        expiresAt: (() => {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          return d.toISOString().split("T")[0];
        })(),
      });
      await recargarTenants();
    } catch { setError("Error de conexión"); }
    finally  { setGuardando(false); }
  }

  async function guardarEdicionTenant() {
    if (!tenantEditando) return;
    if (!formEditar.businessName) { setErrorEdicion("El nombre es obligatorio"); return; }
    setGuardandoEdicion(true);
    setErrorEdicion("");
    try {
      const res = await fetch(`/api/admin/tenants/${tenantEditando.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
        body:    JSON.stringify(formEditar),
      });
      const data = await res.json();
      if (!res.ok) { setErrorEdicion(data.error ?? "Error"); return; }
      setTenantEditando(null);
      await recargarTenants();
    } catch { setErrorEdicion("Error de conexión"); }
    finally  { setGuardandoEdicion(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500">
            {tenants.length} negocio{tenants.length !== 1 ? "s" : ""} registrado{tenants.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm
                     font-medium px-4 py-2 rounded-xl transition-colors">
          {mostrarForm ? "Cancelar" : "+ Nuevo tenant"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600
                        text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
      )}
      {exito && (
        <div className="bg-green-50 border border-green-100 text-green-700
                        text-sm rounded-xl px-4 py-3 mb-4">{exito}</div>
      )}

      {mostrarForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Nuevo tenant</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre del negocio *</label>
              <input type="text" placeholder="Ej: Canchas El Pibe"
                value={form.businessName}
                onChange={e => setForm({ ...form, businessName: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Slug (URL única) *</label>
              <input type="text" placeholder="Ej: elpibe"
                value={form.slug}
                onChange={e => setForm({
                  ...form, slug: e.target.value.toLowerCase().replace(/\s/g, "-")
                })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <p className="text-xs text-gray-400 mt-1">Solo letras minúsculas y guiones</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input type="email" placeholder="correo@negocio.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
              <input type="text" placeholder="300 000 0000"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Plan</label>
              <input type="text" value={form.planName}
                onChange={e => setForm({ ...form, planName: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Precio mensualidad</label>
              <input type="number" value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Inicio licencia</label>
              <input type="date" value={form.startsAt}
                onChange={e => setForm({ ...form, startsAt: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Vencimiento licencia</label>
              <input type="date" value={form.expiresAt}
                onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2
                           text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
          <button onClick={crearTenant} disabled={guardando}
            className="mt-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300
                       text-white text-sm font-medium px-6 py-2 rounded-xl transition-colors">
            {guardando ? "Creando..." : "Crear tenant"}
          </button>
        </div>
      )}

      {cargando ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando tenants...</div>
      ) : tenants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">🏪</p>
          <p className="text-gray-500 text-sm">No hay tenants registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Negocio</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Slug</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Plan</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Vence</th>
                <th className="text-center text-xs text-gray-400 font-medium px-5 py-3">Estado</th>
                <th className="text-center text-xs text-gray-400 font-medium px-5 py-3">Datos</th>
                <th className="text-center text-xs text-gray-400 font-medium px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant, i) => (
                <tr key={tenant.id}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900">{tenant.businessName}</p>
                    {tenant.email && (
                      <p className="text-xs text-gray-400">{tenant.email}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded-lg">{tenant.slug}</code>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {tenant.licencia?.planName ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {tenant.licencia
                      ? new Date(tenant.licencia.expiresAt).toLocaleDateString("es-CO")
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {tenant.licencia?.activa ? (
                      <span className="text-xs px-2 py-1 rounded-full font-medium
                                       bg-green-100 text-green-700">✅ Activa</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full font-medium
                                       bg-red-100 text-red-700">🔴 Vencida</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center text-xs text-gray-500">
                    {tenant.stats.reservas} res · {tenant.stats.clientes} cli
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => {
                        setTenantEditando(tenant);
                        setFormEditar({
                          businessName: tenant.businessName,
                          email:        tenant.email ?? "",
                          phone:        "",
                          isActive:     tenant.isActive,
                        });
                        setErrorEdicion("");
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium
                                 border border-blue-200 hover:border-blue-400
                                 px-3 py-1 rounded-lg transition-colors">
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal editar tenant */}
      {tenantEditando && (
        <div className="fixed inset-0 bg-black/40 flex items-center
                        justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Editar tenant
            </h2>

            {errorEdicion && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl
                              px-4 py-3 mb-4">{errorEdicion}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
                <input type="text"
                  value={formEditar.businessName}
                  onChange={e => setFormEditar({ ...formEditar, businessName: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2
                             text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input type="email"
                  value={formEditar.email}
                  onChange={e => setFormEditar({ ...formEditar, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2
                             text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
                <input type="text"
                  value={formEditar.phone}
                  onChange={e => setFormEditar({ ...formEditar, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2
                             text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <input type="checkbox" id="tenantActivo"
                  checked={formEditar.isActive}
                  onChange={e => setFormEditar({ ...formEditar, isActive: e.target.checked })}
                  className="w-4 h-4 rounded" />
                <label htmlFor="tenantActivo" className="text-sm text-gray-600">
                  Tenant activo
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setTenantEditando(null)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm
                           font-medium py-2 rounded-xl hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={guardarEdicionTenant} disabled={guardandoEdicion}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300
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