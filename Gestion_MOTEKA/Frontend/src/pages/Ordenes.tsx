import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { hasRole, getUser } from '../lib/auth';

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [motos, setMotos] = useState<any[]>([]);
  const [mecanicos, setMecanicos] = useState<any[]>([]);

  const [clienteId, setClienteId] = useState('');
  const [motoId, setMotoId] = useState('');
  const [mecanicoId, setMecanicoId] = useState('');

  const [observaciones, setObservaciones] = useState('');
  const [search, setSearch] = useState('');

  const [historialOrden, setHistorialOrden] = useState<any[]>([]);
  const [showHistorial, setShowHistorial] = useState(false);

  // ---------- estado para crear reporte técnico ----------
  const [showReporteModal, setShowReporteModal] = useState(false);
  const [ordenParaReporte, setOrdenParaReporte] = useState<number | null>(null);
  const [textoReporte, setTextoReporte] = useState('');
  const [errorReporte, setErrorReporte] = useState('');
  const [guardandoReporte, setGuardandoReporte] = useState(false);

  // ---------- ver reportes técnicos ----------
  const [showVerReportes, setShowVerReportes] = useState(false);
  const [ordenParaVerReportes, setOrdenParaVerReportes] = useState<number | null>(null);
  const [listaReportes, setListaReportes] = useState<any[]>([]);
  const [cargandoReportes, setCargandoReportes] = useState(false);

  // ---------- futuro: reasignar mecánico (UI todavia no renderizada) ----------
  const [reasignandoOrdenId, setReasignandoOrdenId] = useState<number | null>(null);
  const [nuevoMecanicoId, setNuevoMecanicoId] = useState<string>('');
  const [errorReasignar, setErrorReasignar] = useState<string>('');

  // ---------- nuevo: exportar historial por cliente específico ----------
  const [clienteExportId, setClienteExportId] = useState('');

  const currentUser = getUser(); // {id, usuario, rol, rol_id}

  const fetchOrdenes = async () => {
    const response = await api.get(`/api/ordenes?cliente_nombre=${search}`);
    setOrdenes(response.data);
  };

  const fetchClientes = async () => {
    const response = await api.get('/api/clientes');
    setClientes(response.data);
  };

  const fetchMotos = async (cId: string) => {
    if (!cId) {
        setMotos([]);
        return;
    }
    const response = await api.get(`/api/motocicletas?cliente_id=${cId}`);
    setMotos(response.data);
  };

  const fetchMecanicos = async () => {
    if (!hasRole('gerente', 'encargado', 'mecanico')) return;
    const response = await api.get('/api/mecanicos');
    setMecanicos(response.data || []);
  };

  useEffect(() => {
    fetchClientes();
    fetchOrdenes();
    fetchMecanicos();
  }, []);

  useEffect(() => {
    fetchOrdenes();
  }, [search]);

  useEffect(() => {
    fetchMotos(clienteId);
    setMotoId('');
  }, [clienteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/ordenes', {
        cliente_id: parseInt(clienteId),
        motocicleta_id: parseInt(motoId),
        observaciones,
        mecanico_id: mecanicoId ? parseInt(mecanicoId) : null,
      });

      setClienteId('');
      setMotoId('');
      setMecanicoId('');
      setObservaciones('');

      fetchOrdenes();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleCambiarEstado = async (ordenId: number, nuevoEstado: string) => {
    try {
      await api.patch(`/api/ordenes/${ordenId}/estado`, { estado: nuevoEstado });
      // acá en el backend ya debería estar el trigger de mandar correo al cliente cuando cambia estado
      fetchOrdenes();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleVerHistorial = async (ordenId: number) => {
    try {
      const response = await api.get(`/api/ordenes/${ordenId}/historial`);
      setHistorialOrden(response.data);
      setShowHistorial(true);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  // =========================
  // NUEVO SISTEMA DE EXPORTES
  // =========================
  //
  // Ya NO usamos CSV.
  // Soporta:
  //   - formato: 'xlsx' o 'pdf'
  //   - onlyCliente?: si true, incluye cliente_id en query
  //
  // Backend esperado:
  //   GET /api/reportes/ordenes?formato=pdf
  //   GET /api/reportes/ordenes?formato=xlsx
  //   GET /api/reportes/ordenes?formato=pdf&cliente_id=7
  //
  const handleExportar = async (formato: string, onlyCliente?: boolean) => {
    try {
      const params: any = { formato };

      // si pidió "solo este cliente", mandamos cliente_id
      if (onlyCliente && clienteExportId) {
        params.cliente_id = parseInt(clienteExportId);
      }

      const response = await api.get('/api/reportes/ordenes', {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');

      const baseName = onlyCliente
        ? `historial_cliente_${clienteExportId || 'sin_id'}`
        : 'ordenes_taller';

      link.href = url;
      link.setAttribute(
        'download',
        `${baseName}.${formato === 'xlsx' ? 'xlsx' : 'pdf'}`
      );

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al exportar');
    }
  };

  // ---------- abrir modal para crear reporte técnico ----------
  const abrirModalReporte = (ordenId: number) => {
    setOrdenParaReporte(ordenId);
    setTextoReporte('');
    setErrorReporte('');
    setShowReporteModal(true);
  };

  // ---------- guardar reporte técnico ----------
  const guardarReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordenParaReporte) return;
    if (!textoReporte.trim()) {
      setErrorReporte('El reporte no puede ir vacío');
      return;
    }

    try {
      setGuardandoReporte(true);
      setErrorReporte('');
      await api.post('/api/reportes_trabajo', {
        orden_id: ordenParaReporte,
        descripcion: textoReporte.trim()
      });

      setShowReporteModal(false);
      setOrdenParaReporte(null);
      setTextoReporte('');
    } catch (err: any) {
      setErrorReporte(err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setGuardandoReporte(false);
    }
  };

  // ---------- ver lista de reportes de una orden ----------
  const abrirVerReportes = async (ordenId: number) => {
    setOrdenParaVerReportes(ordenId);
    setShowVerReportes(true);
    setCargandoReportes(true);

    try {
      const resp = await api.get('/api/reportes_trabajo', {
        params: { orden_id: ordenId }
      });
      setListaReportes(resp.data || []);
    } catch {
      setListaReportes([]);
    } finally {
      setCargandoReportes(false);
    }
  };

  // helper UI: ¿mostrar combo de estado editable?
  const puedeEditarEstado = (orden: any) => {
    // gerente / encargado siempre
    if (hasRole('gerente', 'encargado')) return true;

    // mecánico puede intentar cambiarlo (backend valida si es suyo)
    if (hasRole('mecanico')) return true;

    return false;
  };

  return (
    <div>
      <h1>Órdenes de Trabajo</h1>

      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', marginTop: '1rem' }}>
        {/* FORM CREAR ORDEN */}
        {hasRole('gerente', 'encargado') && (
          <form
            onSubmit={handleSubmit}
            style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
          >
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              required
              style={{ padding: '0.5rem', flex: '1', minWidth: '200px' }}
            >
              <option value="">Seleccione cliente*</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>

            <select
              value={motoId}
              onChange={(e) => setMotoId(e.target.value)}
              required
              disabled={!clienteId}
              style={{ padding: '0.5rem', flex: '1', minWidth: '200px' }}
            >
              <option value="">Seleccione motocicleta*</option>
              {motos.map((m) => (
                <option key={m.id} value={m.id}>
                  {(m.placa || m.vin || `Moto ${m.id}`) +
                    ' - ' +
                    (m.marca?.nombre || '¿?') +
                    ' ' +
                    (m.modelo?.nombre || '')}
                </option>
              ))}
            </select>

            <select
              value={mecanicoId}
              onChange={(e) => setMecanicoId(e.target.value)}
              style={{ padding: '0.5rem', flex: '1', minWidth: '200px' }}
            >
              <option value="">Asignar mecánico (opcional)</option>
              {mecanicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              style={{ padding: '0.5rem', flex: '2', minWidth: '200px' }}
            />

            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                background: '#f63b3bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Crear Orden
            </button>
          </form>
        )}

        {/* FILTROS / EXPORTS */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1rem',
            alignItems: 'flex-start'
          }}
        >
          {/* filtro para la tabla */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.8rem', color: '#444' }}>
              Buscar en pantalla (por nombre de cliente)
            </label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '0.5rem', width: '250px' }}
            />
          </div>

          {/* selector y botones de historial por cliente */}
          {hasRole('gerente', 'encargado') && (
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '220px' }}>
              <label style={{ fontSize: '0.8rem', color: '#444' }}>
                Historial de este cliente
              </label>

              <select
                value={clienteExportId}
                onChange={(e) => setClienteExportId(e.target.value)}
                style={{ padding: '0.5rem', minWidth: '220px' }}
              >
                <option value="">-- Seleccione cliente --</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>

              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleExportar('xlsx', true)}
                  disabled={!clienteExportId}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#111',
                    color: 'white',
                    border: '1px solid #000',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  XLSX cliente
                </button>

                <button
                  onClick={() => handleExportar('pdf', true)}
                  disabled={!clienteExportId}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f63b3b',
                    color: 'white',
                    border: '1px solid #f63b3b',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  PDF cliente
                </button>
              </div>
            </div>
          )}

          {/* export global taller */}
          {hasRole('gerente', 'encargado') && (
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '220px' }}>
              <label style={{ fontSize: '0.8rem', color: '#444' }}>
                Reporte global del taller
              </label>

              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleExportar('xlsx', false)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#111',
                    color: 'white',
                    border: '1px solid #000',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  XLSX global
                </button>

                <button
                  onClick={() => handleExportar('pdf', false)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f63b3b',
                    color: 'white',
                    border: '1px solid #f63b3b',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  PDF global
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TABLA ORDENES */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: '#ffffffff' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Cliente</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Placa</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Estado</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Fecha Ingreso</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((orden) => (
                <tr key={orden.id} style={{ borderBottom: '1px solid #890000ff' }}>
                  <td style={{ padding: '0.75rem' }}>{orden.id}</td>
                  <td style={{ padding: '0.75rem' }}>{orden.cliente?.nombre}</td>
                  <td style={{ padding: '0.75rem' }}>{orden.motocicleta?.placa || 'N/A'}</td>

                  <td style={{ padding: '0.75rem' }}>
                    {puedeEditarEstado(orden) ? (
                      <select
                        value={orden.estado}
                        onChange={(e) => handleCambiarEstado(orden.id, e.target.value)}
                        style={{ padding: '0.25rem' }}
                      >
                        <option value="EN_ESPERA">EN_ESPERA</option>
                        <option value="EN_REPARACION">EN_REPARACION</option>
                        <option value="FINALIZADA">FINALIZADA</option>
                        <option value="CANCELADA">CANCELADA</option>
                      </select>
                    ) : (
                      <span>{orden.estado}</span>
                    )}
                  </td>

                  <td style={{ padding: '0.75rem' }}>
                    {orden.fecha_ingreso
                      ? new Date(orden.fecha_ingreso).toLocaleString()
                      : '—'}
                  </td>

                  <td
                    style={{
                      padding: '0.75rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <button
                      onClick={() => handleVerHistorial(orden.id)}
                      style={{ padding: '0.25rem 0.5rem' }}
                    >
                      Historial
                    </button>

                    {hasRole('mecanico', 'gerente', 'encargado') && (
                      <button
                        onClick={() => abrirModalReporte(orden.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#111',
                          color: 'white',
                          border: '1px solid #000',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Reporte
                      </button>
                    )}

                    {hasRole('mecanico', 'gerente', 'encargado') && (
                      <button
                        onClick={() => abrirVerReportes(orden.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#444',
                          color: 'white',
                          border: '1px solid #444',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Ver reportes
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Historial de estados */}
      {showHistorial && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowHistorial(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Historial de Estados</h2>
            <table
              style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}
            >
              <thead>
                <tr style={{ background: '#c33333ff' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Estado</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Fecha</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Notas</th>
                </tr>
              </thead>
              <tbody>
                {historialOrden.map((h) => (
                  <tr
                    key={h.id}
                    style={{ borderBottom: '1px solid #e2e8f0' }}
                  >
                    <td style={{ padding: '0.5rem' }}>{h.estado}</td>
                    <td style={{ padding: '0.5rem' }}>
                      {new Date(h.creado_en).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.5rem' }}>{h.notas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => setShowHistorial(false)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: '#f63b3bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Crear reporte técnico */}
      {showReporteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Reporte técnico (Orden #{ordenParaReporte})</h2>
            <form onSubmit={guardarReporte}>
              <div style={{ marginTop: '1rem' }}>
                <label>Descripción del trabajo realizado</label>
                <textarea
                  value={textoReporte}
                  onChange={(e) => setTextoReporte(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    resize: 'vertical',
                    marginTop: '0.5rem'
                  }}
                />
              </div>

              {errorReporte && (
                <div style={{ color: 'crimson', marginTop: '0.5rem' }}>
                  {errorReporte}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  marginTop: '1rem'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowReporteModal(false);
                    setOrdenParaReporte(null);
                  }}
                  disabled={guardandoReporte}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoReporte}
                  style={{
                    background: '#111',
                    color: '#fff',
                    border: '1px solid #000',
                    borderRadius: '4px',
                    padding: '0.5rem 1rem'
                  }}
                >
                  {guardandoReporte ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ver reportes técnicos */}
      {showVerReportes && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => {
            setShowVerReportes(false);
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Reportes técnicos (Orden #{ordenParaVerReportes})</h2>

            {cargandoReportes ? (
              <div style={{ marginTop: '1rem' }}>Cargando…</div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                {listaReportes.length === 0 && (
                  <div style={{ color: '#666' }}>No hay reportes</div>
                )}

                {listaReportes.map((r: any) => (
                  <div
                    key={r.id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      padding: '0.75rem'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: '#555',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <b>{r.mecanico_nombre || '—'}</b> |{' '}
                      {new Date(r.creado_en).toLocaleString()}
                    </div>

                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {r.descripcion}
                    </div>

                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: '#777',
                        marginTop: '0.5rem'
                      }}
                    >
                      Cliente: {r.cliente_nombre || '—'}
                      <br />
                      Moto: {r.moto_placa || r.moto_vin || '—'}
                      <br />
                      Modelo/Marca: {r.modelo_nombre || '—'} /{' '}
                      {r.marca_nombre || '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
              <button
                onClick={() => {
                  setShowVerReportes(false);
                }}
                style={{
                  background: '#f63b3bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  padding: '0.5rem 1rem'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}