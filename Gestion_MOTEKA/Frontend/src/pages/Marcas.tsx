import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function Marcas() {
  const [marcas, setMarcas] = useState<any[]>([]);
  const [nombre, setNombre] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const fetchMarcas = async () => {
    try {
      const response = await api.get(`/api/marcas?q=${search}`);
      setMarcas(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMarcas();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/marcas/${editingId}`, { nombre });
      } else {
        await api.post('/api/marcas', { nombre });
      }
      setNombre('');
      setEditingId(null);
      fetchMarcas();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar marca?')) return;
    try {
      await api.delete(`/api/marcas/${id}`);
      fetchMarcas();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div>
      <h1>Marcas de Motocicletas</h1>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', marginTop: '1rem' }}>
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Nombre de marca"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            style={{ padding: '0.5rem', marginRight: '1rem', width: '300px' }}
          />
          <button type="submit" style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setNombre(''); }} style={{ marginLeft: '0.5rem', padding: '0.5rem 1rem' }}>
              Cancelar
            </button>
          )}
        </form>
        
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '0.5rem', marginBottom: '1rem', width: '300px' }}
        />
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nombre</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {marcas.map((marca) => (
              <tr key={marca.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem' }}>{marca.id}</td>
                <td style={{ padding: '0.75rem' }}>{marca.nombre}</td>
                <td style={{ padding: '0.75rem' }}>
                  <button onClick={() => { setEditingId(marca.id); setNombre(marca.nombre); }} style={{ marginRight: '0.5rem' }}>Editar</button>
                  <button onClick={() => handleDelete(marca.id)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
