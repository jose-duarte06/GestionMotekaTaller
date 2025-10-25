# MOTEKA - Sistema de Gestión de Taller de Motocicletas

## Descripción del Proyecto

MOTEKA es un sistema completo de gestión para talleres de motocicletas desarrollado con Flask (Backend) y React + TypeScript (Frontend). El sistema permite gestionar clientes, motocicletas, órdenes de trabajo, pagos y generar reportes exportables.

## Stack Tecnológico

### Backend
- Flask 3.x con SQLAlchemy 2.x
- PostgreSQL (base de datos Replit)
- JWT para autenticación
- Sistema de roles (gerente, encargado, mecánico)
- Exportación de reportes (CSV, XLSX, PDF)

### Frontend
- React 18 + TypeScript
- Vite 5.x
- React Router 6.x
- Axios para API calls
- Dark theme UI

## Estructura del Proyecto

```
Gestion_MOTEKA/
├── Backend/          # API Flask
│   ├── core/        # Configuración y extensiones
│   ├── models/      # Modelos SQLAlchemy
│   └── api/         # Rutas de API
└── Frontend/         # React + TypeScript
    └── src/
        ├── lib/     # Utilidades (API, auth)
        ├── pages/   # Páginas de la aplicación
        └── layouts/ # Layouts (Public, Auth)
```

## Credenciales de Acceso

**Usuario admin inicial:**
- Usuario: `admin`
- Contraseña: `admin123`
- Rol: gerente

## Funcionalidades Principales

### Gestión de Catálogos
- Marcas de motocicletas
- Modelos por marca
- Sistema de validación de duplicados

### Gestión de Personas
- Clientes con búsqueda avanzada
- Empleados
- Usuarios con roles y permisos

### Gestión de Vehículos
- Registro completo de motocicletas
- Vinculación con clientes y modelos
- Información detallada (placa, VIN, cilindraje, etc.)

### Órdenes de Trabajo
- Estados: EN_ESPERA, EN_REPARACION, FINALIZADA, CANCELADA
- Historial de cambios de estado
- Asignación de mecánicos
- Registro de pagos (EFECTIVO, TARJETA, TRANSFERENCIA)
- Validaciones de negocio

### Reportes
- Exportación en CSV (UTF-8 con BOM)
- Exportación en XLSX (con autosize)
- Exportación en PDF (horizontal A4)
- Filtros avanzados

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Usuario actual

### Catálogos
- `/api/roles` - Gestión de roles
- `/api/marcas` - Marcas de motos
- `/api/modelos` - Modelos de motos

### Gestión
- `/api/clientes` - CRUD de clientes
- `/api/motocicletas` - CRUD de motocicletas
- `/api/ordenes` - Gestión de órdenes
  - `/api/ordenes/:id/estado` - Cambiar estado
  - `/api/ordenes/:id/historial` - Ver historial
  - `/api/ordenes/:id/pagos` - Gestión de pagos

### Reportes
- `/api/reportes/ordenes` - Exportar órdenes (CSV/XLSX/PDF)

## Variables de Entorno

### Backend (.env)
```
DATABASE_URL=${DATABASE_URL}
JWT_SECRET_KEY=admin
FLASK_ENV=development
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
SEED_ADMIN_PASS=admin123
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

## Arquitectura de Datos

### Modelos Principales
1. **Roles** - Sistema de permisos
2. **Usuarios** - Autenticación y autorización
3. **Clientes** - Propietarios de vehículos
4. **Empleados** - Mecánicos y personal
5. **MarcaMoto** - Catálogo de marcas
6. **ModeloMoto** - Catálogo de modelos
7. **Motocicleta** - Registro de vehículos
8. **OrdenTrabajo** - Órdenes de servicio
9. **EstadoOrden** - Historial de estados
10. **Pago** - Registro de pagos

### Relaciones Clave
- Modelos pertenecen a Marcas (FK)
- Motocicletas pertenecen a Clientes (FK)
- Motocicletas tienen Modelos opcionales (FK)
- Órdenes vinculan Cliente + Motocicleta
- Historial registra cambios de estado
- Pagos asociados a Órdenes

## Validaciones Implementadas

1. **Unicidad**: Marcas, combinación marca+modelo, placa, VIN, correos
2. **Integridad referencial**: No eliminar si hay dependencias
3. **Reglas de negocio**:
   - Motocicleta debe pertenecer al cliente en órdenes
   - No cambiar cliente de motocicleta
   - Fecha salida automática al finalizar/cancelar
   - Pagos > 0
   - No eliminar órdenes con pagos

## Comandos Útiles

### Backend
```bash
cd Gestion_MOTEKA/Backend
python app.py  # Inicia servidor en puerto 5000
```

### Frontend
```bash
cd Gestion_MOTEKA/Frontend
npm run dev    # Inicia Vite en puerto 5000
```

## Notas de Desarrollo

- El sistema usa PostgreSQL de Replit automáticamente
- Las migraciones se crean automáticamente al iniciar
- El seed inicial crea roles y usuario admin
- JWT tokens con claims adicionales para datos de usuario
- CORS configurado para desarrollo local y Replit
- Frontend configurado para proxy de Replit (host 0.0.0.0)

## Próximas Características

- Dashboard con estadísticas
- Notificaciones en tiempo real
- Gestión de inventario de repuestos
- Paquetes de servicio predefinidos
- Sistema de citas
- Subida de fotos de motocicletas

## Actualización: 25 de Octubre, 2024

Sistema completamente funcional con todas las características especificadas implementadas.
