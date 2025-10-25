import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function Motos() {
  const [motos, setMotos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    cliente_id: '', modelo_id: '', placa: '', vin: '', anio: '', cilindraje_cc: '',
    color: '', kilometraje_km: '', ultima_revision: '', notas: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const fetchMotos = async () => {
    const response = await api.get(`/api/motocicletas?q=${search}`);
    setMotos(response.data);
  };

  const fetchClientes = async () => {
    const response = await api.get('/api/clientes');
    setClientes(response.data);
  };

  const fetchModelos = async () => {
    const response = await api.get('/api/modelos');
    setModelos(response.data);
  };

  useEffect(() => {
    fetchClientes();
    fetchModelos();
  }, []);

  useEffect(() => {
    fetchMotos();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        cliente_id: parseInt(formData.cliente_id),
        modelo_id: formData.modelo_id ? parseInt(formData.modelo_id) : null,
        anio: formData.anio ? parseInt(formData.anio) : null,
        cilindraje_cc: formData.cilindraje_cc ? parseInt(formData.cilindraje_cc) : null,
        kilometraje_km: formData.kilometraje_km ? parseInt(formData.kilometraje_km) : 0,
      };
      if (editingId) {
        await api.put(`/api/motocicletas/${editingId}`, data);
      } else {
        await api.post('/api/motocicletas', data);
      }
      setFormData({ cliente_id: '', modelo_id: '', placa: '', vin: '', anio: '', cilindraje_cc: '', color: '', kilometraje_km: '', ultima_revision: '', notas: '' });
      setEditingId(null);
      fetchMotos();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div>
      <h1>Motocicletas</h1>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', marginTop: '1rem' }}>
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <select value={formData.cliente_id} onChange={(e) => setFormData({...formData, cliente_id: e.target.value})} required style={{ padding: '0.5rem' }}>
            <option value="">Cliente*</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={formData.modelo_id} onChange={(e) => setFormData({...formData, modelo_id: e.target.value})} style={{ padding: '0.5rem' }}>
            <option value="">Modelo (opcional)</option>
            {modelos.map(m => <option key={m.id} value={m.id}>{m.marca?.nombre} - {m.nombre}</option>)}
          </select>
          <input type="text" placeholder="Placa" value={formData.placa} onChange={(e) => setFormData({...formData, placa: e.target.value})} style={{ padding: '0.5rem' }} />
          <input type="text" placeholder="VIN" value={formData.vin} onChange={(e) => setFormData({...formData, vin: e.target.value})} style={{ padding: '0.5rem' }} />
          <input type="number" placeholder="Año" value={formData.anio} onChange={(e) => setFormData({...formData, anio: e.target.value})} style={{ padding: '0.5rem' }} />
          <input type="number" placeholder="Cilindraje (cc)" value={formData.cilindraje_cc} onChange={(e) => setFormData({...formData, cilindraje_cc: e.target.value})} style={{ padding: '0.5rem' }} />
          <input type="text" placeholder="Color" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} style={{ padding: '0.5rem' }} />
          <input type="number" placeholder="Kilometraje" value={formData.kilometraje_km} onChange={(e) => setFormData({...formData, kilometraje_km: e.target.value})} style={{ padding: '0.5rem' }} />
          <input type="date" placeholder="Última revisión" value={formData.ultima_revision} onChange={(e) => setFormData({...formData, ultima_revision: e.target.value})} style={{ padding: '0.5rem' }} />
          <div style={{ gridColumn: 'span 3' }}>
            <textarea placeholder="Notas" value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} style={{ padding: '0.5rem', width: '100%', minHeight: '60px' }} />
          </div>
          <div style={{ gridColumn: 'span 3' }}>
            <button type="submit" style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{editingId ? 'Actualizar' : 'Crear'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ cliente_id: '', modelo_id: '', placa: '', vin: '', anio: '', cilindraje_cc: '', color: '', kilometraje_km: '', ultima_revision: '', notas: '' }); }} style={{ marginLeft: '0.5rem', padding: '0.5rem 1rem' }}>Cancelar</button>}
          </div>
        </form>
        
        <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '0.5rem', marginBottom: '1rem', width: '400px' }} />
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Placa</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Cliente</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Marca</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Modelo</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Año</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {motos.map((moto) => (
                <tr key={moto.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem' }}>{moto.placa || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{moto.cliente?.nombre}</td>
                  <td style={{ padding: '0.75rem' }}>{moto.marca?.nombre || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{moto.modelo?.nombre || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{moto.anio}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <button onClick={() => { setEditingId(moto.id); setFormData({ cliente_id: moto.cliente_id, modelo_id: moto.modelo_id || '', placa: moto.placa || '', vin: moto.vin || '', anio: moto.anio || '', cilindraje_cc: moto.cilindraje_cc || '', color: moto.color || '', kilometraje_km: moto.kilometraje_km || '', ultima_revision: moto.ultima_revision || '', notas: moto.notas || '' }); }}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
