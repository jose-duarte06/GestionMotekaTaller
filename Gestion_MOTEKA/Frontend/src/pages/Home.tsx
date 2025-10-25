import { getUser } from '@/lib/auth';

export default function Home() {
  const user = getUser();

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Bienvenido a MOTEKA</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
        Sistema de Gestión de Taller de Motocicletas
      </p>
      
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2>Usuario actual:</h2>
        <p><strong>Nombre:</strong> {user?.usuario}</p>
        <p><strong>Rol:</strong> {user?.rol}</p>
      </div>
    </div>
  );
}
