import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [motos, setMotos] = useState<any[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [motoId, setMotoId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [search, setSearch] = useState('');
  const [historialOrden, setHistorialOrden] = useState<any[]>([]);
  const [showHistorial, setShowHistorial] = useState(false);

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

  useEffect(() => {
    fetchClientes();
    fetchOrdenes();
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
        observaciones
      });
      setClienteId('');
      setMotoId('');
      setObservaciones('');
      fetchOrdenes();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleCambiarEstado = async (ordenId: number, nuevoEstado: string) => {
    try {
      await api.patch(`/api/ordenes/${ordenId}/estado`, { estado: nuevoEstado });
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

  const handleExportar = async (formato: string) => {
    try {
      const response = await api.get(`/api/reportes/ordenes?formato=${formato}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ordenes_trabajo.${formato}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert('Error al exportar');
    }
  };

  return (
    <div>
      <h1>Órdenes de Trabajo</h1>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', marginTop: '1rem' }}>
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required style={{ padding: '0.5rem', flex: '1', minWidth: '200px' }}>
            <option value="">Seleccione cliente*</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={motoId} onChange={(e) => setMotoId(e.target.value)} required disabled={!clienteId} style={{ padding: '0.5rem', flex: '1', minWidth: '200px' }}>
            <option value="">Seleccione motocicleta*</option>
            {motos.map(m => <option key={m.id} value={m.id}>{m.placa || m.vin || `Moto ${m.id}`} - {m.marca?.nombre} {m.modelo?.nombre}</option>)}
          </select>
          <input type="text" placeholder="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} style={{ padding: '0.5rem', flex: '2', minWidth: '200px' }} />
          <button type="submit" style={{ padding: '0.5rem 1rem', background: '#f63b3bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Crear Orden</button>
        </form>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
          <input type="text" placeholder="Buscar por cliente..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '0.5rem', width: '300px' }} />
          <div>
            <button onClick={() => handleExportar('csv')} style={{ padding: '0.5rem 1rem', marginRight: '0.5rem' }}>CSV</button>
            <button onClick={() => handleExportar('xlsx')} style={{ padding: '0.5rem 1rem', marginRight: '0.5rem' }}>XLSX</button>
            <button onClick={() => handleExportar('pdf')} style={{ padding: '0.5rem 1rem' }}>PDF</button>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
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
                <tr key={orden.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem' }}>{orden.id}</td>
                  <td style={{ padding: '0.75rem' }}>{orden.cliente?.nombre}</td>
                  <td style={{ padding: '0.75rem' }}>{orden.motocicleta?.placa || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>
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
                  </td>
                  <td style={{ padding: '0.75rem' }}>{new Date(orden.fecha_ingreso).toLocaleString()}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <button onClick={() => handleVerHistorial(orden.id)} style={{ padding: '0.25rem 0.5rem' }}>Historial</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showHistorial && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowHistorial(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '600px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h2>Historial de Estados</h2>
            <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Estado</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Fecha</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Notas</th>
                </tr>
              </thead>
              <tbody>
                {historialOrden.map((h) => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem' }}>{h.estado}</td>
                    <td style={{ padding: '0.5rem' }}>{new Date(h.creado_en).toLocaleString()}</td>
                    <td style={{ padding: '0.5rem' }}>{h.notas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setShowHistorial(false)} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
