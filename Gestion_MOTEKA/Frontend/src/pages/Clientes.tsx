import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [formData, setFormData] = useState({ nombre: '', telefono: '', correo: '', direccion: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const fetchClientes = async () => {
    const response = await api.get(`/api/clientes?q=${search}`);
    setClientes(response.data);
  };

  useEffect(() => {
    fetchClientes();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/clientes/${editingId}`, formData);
      } else {
        await api.post('/api/clientes', formData);
      }
      setFormData({ nombre: '', telefono: '', correo: '', direccion: '' });
      setEditingId(null);
      fetchClientes();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar cliente?')) return;
    try {
      await api.delete(`/api/clientes/${id}`);
      fetchClientes();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div>
      <h1>Clientes</h1>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', marginTop: '1rem' }}>
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <input type="text" placeholder="Nombre*" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required style={{ padding: '0.5rem' }} />
          <input type="text" placeholder="Teléfono" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} style={{ padding: '0.5rem' }} />
          <input type="email" placeholder="Correo" value={formData.correo} onChange={(e) => setFormData({...formData, correo: e.target.value})} style={{ padding: '0.5rem' }} />
          <input type="text" placeholder="Dirección" value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} style={{ padding: '0.5rem' }} />
          <div style={{ gridColumn: 'span 2' }}>
            <button type="submit" style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{editingId ? 'Actualizar' : 'Crear'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ nombre: '', telefono: '', correo: '', direccion: '' }); }} style={{ marginLeft: '0.5rem', padding: '0.5rem 1rem' }}>Cancelar</button>}
          </div>
        </form>
        
        <input type="text" placeholder="Buscar por nombre, teléfono o correo..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '0.5rem', marginBottom: '1rem', width: '400px' }} />
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nombre</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Teléfono</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Correo</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem' }}>{cliente.id}</td>
                <td style={{ padding: '0.75rem' }}>{cliente.nombre}</td>
                <td style={{ padding: '0.75rem' }}>{cliente.telefono}</td>
                <td style={{ padding: '0.75rem' }}>{cliente.correo}</td>
                <td style={{ padding: '0.75rem' }}>
                  <button onClick={() => { setEditingId(cliente.id); setFormData(cliente); }}>Editar</button>
                  <button onClick={() => handleDelete(cliente.id)} style={{ marginLeft: '0.5rem', background: '#dc2626', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
