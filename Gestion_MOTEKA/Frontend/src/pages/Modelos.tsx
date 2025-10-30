import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function Modelos() {
  const [modelos, setModelos] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [nombre, setNombre] = useState('');
  const [marcaId, setMarcaId] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterMarca, setFilterMarca] = useState('');

  const fetchMarcas = async () => {
    const response = await api.get('/api/marcas');
    setMarcas(response.data);
  };

  const fetchModelos = async () => {
    const response = await api.get(`/api/modelos?marca_id=${filterMarca}`);
    setModelos(response.data);
  };

  useEffect(() => {
    fetchMarcas();
  }, []);

  useEffect(() => {
    fetchModelos();
  }, [filterMarca]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/modelos/${editingId}`, { nombre, marca_id: parseInt(marcaId) });
      } else {
        await api.post('/api/modelos', { nombre, marca_id: parseInt(marcaId) });
      }
      setNombre('');
      setMarcaId('');
      setEditingId(null);
      fetchModelos();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar modelo?')) return;
    try {
      await api.delete(`/api/modelos/${id}`);
      fetchModelos();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div>
      <h1>Modelos de Motocicletas</h1>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', marginTop: '1rem' }}>
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
          <select value={marcaId} onChange={(e) => setMarcaId(e.target.value)} required style={{ padding: '0.5rem', width: '200px' }}>
            <option value="">Seleccione marca</option>
            {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          <input type="text" placeholder="Nombre modelo" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ padding: '0.5rem', width: '200px' }} />
          <button type="submit" style={{ padding: '0.5rem 1rem', background: '#f63b3bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setNombre(''); setMarcaId(''); }}>Cancelar</button>}
        </form>
        
        <select value={filterMarca} onChange={(e) => setFilterMarca(e.target.value)} style={{ padding: '0.5rem', marginBottom: '1rem' }}>
          <option value="">Todas las marcas</option>
          {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Modelo</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Marca</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {modelos.map((modelo) => (
              <tr key={modelo.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem' }}>{modelo.id}</td>
                <td style={{ padding: '0.75rem' }}>{modelo.nombre}</td>
                <td style={{ padding: '0.75rem' }}>{modelo.marca?.nombre}</td>
                <td style={{ padding: '0.75rem' }}>
                  <button onClick={() => { setEditingId(modelo.id); setNombre(modelo.nombre); setMarcaId(modelo.marca_id); }}>Editar</button>
                  <button onClick={() => handleDelete(modelo.id)} style={{ marginLeft: '0.5rem', background: '#dc2626', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
