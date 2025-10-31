import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { hasRole } from '@/lib/auth';

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDash = async () => {
      try {
        const resp = await api.get('/api/dashboard/resumen');
        setData(resp.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error cargando dashboard');
      } finally {
        setCargando(false);
      }
    };
    fetchDash();
  }, []);

  if (cargando) {
    return (
      <div style={pageWrapper}>
        <div style={{ color: '#000', fontSize: '0.9rem' }}>Cargando dashboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageWrapper}>
        <div style={{ color: 'crimson', fontSize: '0.9rem' }}>{error}</div>
      </div>
    );
  }

  const resumen = data?.resumen_hoy || {};
  const activas = data?.ordenes_activas_hoy || [];
  const actividad = data?.actividad_reciente || [];

  const ingresosHoyQ = data?.ingresos_hoy_q ?? null;
  const mecDisp = data?.mecanicos_disponibles ?? 0;
  const mecTot = data?.mecanicos_total ?? 0;

  return (
    <div style={pageWrapper}>
      {/* Título general */}
      <h1 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#222', marginBottom: '0.25rem' }}>
        Panel general
      </h1>
      <p style={{ color: '#555', fontSize: '0.8rem', marginTop: 0, marginBottom: '1rem' }}>
        Resumen del taller (hoy)
      </p>

      {/* Cards resumen arriba */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
          width: '100%',
          maxWidth: '1300px'
        }}
      >
        <StatCard
          label="Órdenes creadas hoy"
          value={resumen.total ?? 0}
        />
        <StatCard
          label="En espera"
          value={resumen.en_espera ?? 0}
        />
        <StatCard
          label="En reparación"
          value={resumen.en_reparacion ?? 0}
        />
        <StatCard
          label="Finalizadas"
          value={resumen.finalizadas ?? 0}
        />
        <StatCard
          label="Canceladas"
          value={resumen.canceladas ?? 0}
        />
        <StatCard
          label="Clientes activos"
          value={data?.clientes_activos ?? 0}
        />
        
        <StatCard
          label="Mecánicos disponibles"
          value={`${mecDisp}/${mecTot}`}
        />
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '1rem',
          width: '100%',
          maxWidth: '1300px',
          marginBottom: '1.5rem'
        }}
      >
        {/* Módulos del sistema */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          <Panel title="Módulos del sistema">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
                gap: '1rem'
              }}
            >
              <ModuleCard
                title="Clientes"
                desc="Administrar información de clientes"
                to="/clientes"
              />
              <ModuleCard
                title="Órdenes de trabajo"
                desc="Ingreso, estado y cierre de órdenes"
                to="/ordenes"
              />
              <ModuleCard
                title="Reportes"
                desc="Exportar historial y reportes técnicos"
                to="/ordenes"
              />
            </div>
          </Panel>
        </div>

        {/* Acciones rápidas + Actividad reciente */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          <Panel title="Acciones rápidas">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {hasRole('gerente', 'encargado') && (
                <QuickButton to="/ordenes" label="Nueva orden" />
              )}
              {hasRole('gerente', 'encargado') && (
                <QuickButton to="/clientes" label="Nuevo cliente" />
              )}
              <QuickButton to="/ordenes" label="Ver reportes" />
            </div>
          </Panel>

          <Panel title="Actividad reciente">
            <div
              style={{
                maxHeight: '240px',
                overflowY: 'auto',
                paddingRight: '0.5rem',
                fontSize: '0.8rem'
              }}
            >
              {actividad.length === 0 && (
                <div
                  style={{
                    border: '1px dashed #ccc',
                    borderRadius: '4px',
                    padding: '0.75rem',
                    textAlign: 'center',
                    color: '#777'
                  }}
                >
                  Sin actividad reciente
                </div>
              )}

              {actividad.map((evt: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    borderBottom: '1px solid #eee',
                    padding: '0.5rem 0'
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#222' }}>
                    {evt.titulo}
                  </div>
                  <div style={{ color: '#555' }}>{evt.detalle}</div>
                  <div style={{ color: '#999', fontSize: '0.7rem' }}>
                    {evt.hace}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      {/* Tabla de órdenes activas hoy */}
      <section style={{ width: '100%', maxWidth: '1300px', marginBottom: '2rem' }}>
        <Panel title="Órdenes de hoy en curso">
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '700px',
                fontSize: '0.8rem',
                color: '#222'
              }}
            >
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <Th>ID</Th>
                  <Th>Estado</Th>
                  <Th>Cliente</Th>
                  <Th>Moto</Th>
                  <Th>Mecánico</Th>
                  <Th>Ingreso</Th>
                </tr>
              </thead>
              <tbody>
                {activas.length === 0 && (
                  <tr>
                    <Td colSpan={6} style={{ textAlign: 'center', color: '#777' }}>
                      No hay órdenes activas hoy.
                    </Td>
                  </tr>
                )}

                {activas.map((o: any) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #eee' }}>
                    <Td>{o.id}</Td>
                    <Td>{o.estado}</Td>
                    <Td>{o.cliente || '—'}</Td>
                    <Td>{o.moto || '—'}</Td>
                    <Td>{o.mecanico || '—'}</Td>
                    <Td>
                      {o.fecha_ingreso
                        ? new Date(o.fecha_ingreso).toLocaleString()
                        : '—'}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      <div style={{ height: '3rem' }} />
    </div>
  );
}

/* -------- componentes UI reutilizables -------- */

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '6px',
        padding: '0.75rem 1rem',
        minHeight: '90px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          fontSize: '1.2rem',
          fontWeight: 600,
          color: '#222',
          lineHeight: 1.2,
          marginBottom: '0.25rem'
        }}
      >
        {value ?? 0}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#666' }}>{label}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: any }) {
  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '6px',
        padding: '1rem'
      }}
    >
      <h2
        style={{
          margin: 0,
          marginBottom: '0.75rem',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#222'
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function ModuleCard({ title, desc, to }: { title: string; desc: string; to: string }) {
  return (
    <Link
      to={to}
      style={{
        display: 'block',
        backgroundColor: '#fafafa',
        border: '1px solid #ddd',
        borderRadius: '6px',
        padding: '0.75rem 1rem',
        textDecoration: 'none',
        color: '#222'
      }}
    >
      <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>
        {title}
      </div>
      <div style={{ fontSize: '0.75rem', color: '#666', lineHeight: 1.4 }}>{desc}</div>
    </Link>
  );
}

function QuickButton({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      style={{
        backgroundColor: '#f9f9f9',
        border: '1px solid #bbb',
        borderRadius: '4px',
        padding: '0.5rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: 500,
        textDecoration: 'none',
        color: '#222'
      }}
    >
      {label}
    </Link>
  );
}

function Th({ children }: { children: any }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '0.5rem 0.75rem',
        fontSize: '0.7rem',
        fontWeight: 600,
        color: '#222',
        borderBottom: '1px solid #ddd'
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  style
}: {
  children: any;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: '0.5rem 0.75rem',
        fontSize: '0.8rem',
        color: '#222',
        ...(style || {})
      }}
    >
      {children}
    </td>
  );
}

/* wrapper página */
const pageWrapper: React.CSSProperties = {
  backgroundColor: '#eef1f6', // parecido al gris claro que ya usas
  minHeight: '100vh',
  padding: '1rem 1rem 3rem 1rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};