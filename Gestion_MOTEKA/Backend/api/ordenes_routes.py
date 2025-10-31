from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from core.extensions import db
from core.auth import role_required
from models.ordenes import (
    OrdenTrabajo,
    EstadoOrden,
    Pago,
    EstadoOrdenEnum,
    TipoPagoEnum,
)
from models.vehiculos import Motocicleta
from models.personas import Cliente, Empleado, Usuario
from datetime import datetime, timedelta
from decimal import Decimal

ordenes_bp = Blueprint('ordenes', __name__, url_prefix='/api/ordenes')


# =========================
# helper: usuario actual
# =========================
def _get_current_user_ctx():
    """
    Lee el JWT y devuelve:
    - usuario (row de Usuario)
    - empleado_id (si el usuario está vinculado a un empleado)
    - rol (string: 'mecanico', 'gerente', 'encargado', etc.)
    """
    claims = get_jwt()
    data_user = claims.get("user") or {}
    user_id = data_user.get("id")
    rol = data_user.get("rol")

    if not user_id:
        return None, None, None

    usuario = Usuario.query.get(user_id)
    if not usuario:
        return None, None, None

    return usuario, usuario.empleado_id, rol


# =========================
# GET /api/ordenes
# listado + filtros
# =========================
@ordenes_bp.route('', methods=['GET'])
@jwt_required()
def get_ordenes():
    cliente_id = request.args.get('cliente_id', type=int)
    cliente_nombre = request.args.get('cliente_nombre', '').strip()

    motocicleta_id = request.args.get('motocicleta_id', type=int)
    mecanico_id = request.args.get('mecanico_id', type=int)

    estado = request.args.get('estado', '').strip()
    desde = request.args.get('desde', '').strip()
    hasta = request.args.get('hasta', '').strip()
    placa = request.args.get('placa', '').strip()

    # base query
    query = (
        OrdenTrabajo.query
        .join(Cliente)
        .join(Motocicleta)
        .outerjoin(Empleado)
    )

    # --- filtros dinámicos ---

    if cliente_id:
        query = query.filter(OrdenTrabajo.cliente_id == cliente_id)

    if cliente_nombre:
        query = query.filter(Cliente.nombre.ilike(f'%{cliente_nombre}%'))

    if motocicleta_id:
        query = query.filter(OrdenTrabajo.motocicleta_id == motocicleta_id)

    if mecanico_id:
        query = query.filter(OrdenTrabajo.mecanico_asignado_id == mecanico_id)

    if estado:
        # validamos que sea un estado válido del enum
        try:
            estado_enum = EstadoOrdenEnum[estado]
            query = query.filter(OrdenTrabajo.estado == estado_enum)
        except KeyError:
            # si mandan algo raro lo ignoramos en vez de romper 💅
            pass

    if desde:
        try:
            # quiero aceptar "2025-10-31T00:00:00Z"
            fecha_desde = datetime.fromisoformat(desde.replace('Z', '+00:00'))
            query = query.filter(OrdenTrabajo.fecha_ingreso >= fecha_desde)
        except Exception:
            pass

    if hasta:
        try:
            fecha_hasta = datetime.fromisoformat(hasta.replace('Z', '+00:00'))
            query = query.filter(OrdenTrabajo.fecha_ingreso <= fecha_hasta)
        except Exception:
            pass

    if placa:
        query = query.filter(Motocicleta.placa.ilike(f'%{placa}%'))

    # orden más reciente primero
    ordenes = query.order_by(OrdenTrabajo.fecha_ingreso.desc()).all()

    return jsonify([o.to_dict(include_relations=True) for o in ordenes]), 200


# =========================
# POST /api/ordenes
# crear orden nueva
# =========================
@ordenes_bp.route('', methods=['POST'])
@jwt_required()
@role_required('gerente', 'encargado')  # mecánico NO crea orden directa
def create_orden():
    data = request.get_json() or {}

    cliente_id = data.get('cliente_id')
    motocicleta_id = data.get('motocicleta_id')
    observaciones = data.get('observaciones')
    mecanico_id = data.get('mecanico_id')

    if not cliente_id or not motocicleta_id:
        return jsonify({"error": "cliente_id y motocicleta_id son requeridos"}), 400

    cliente = Cliente.query.get(cliente_id)
    if not cliente:
        return jsonify({"error": "El cliente especificado no existe"}), 404

    moto = Motocicleta.query.get(motocicleta_id)
    if not moto:
        return jsonify({"error": "La motocicleta especificada no existe"}), 404

    if moto.cliente_id != cliente_id:
        return jsonify({"error": "La motocicleta no pertenece al cliente"}), 400

    if mecanico_id:
        mecanico = Empleado.query.get(mecanico_id)
        if not mecanico:
            return jsonify({"error": "El mecánico especificado no existe"}), 404

    nueva_orden = OrdenTrabajo(
        cliente_id=cliente_id,
        motocicleta_id=motocicleta_id,
        mecanico_asignado_id=mecanico_id,
        estado=EstadoOrdenEnum.EN_ESPERA,
        observaciones=observaciones
    )

    db.session.add(nueva_orden)
    db.session.flush()  # para que ya tenga id

    estado_inicial = EstadoOrden(
        orden_id=nueva_orden.id,
        estado=EstadoOrdenEnum.EN_ESPERA,
        notas="Orden creada"
    )
    db.session.add(estado_inicial)

    db.session.commit()

    return jsonify(nueva_orden.to_dict(include_relations=True)), 201


# =========================
# PATCH /api/ordenes/<id>/estado
# cambiar estado con reglas de permiso
# =========================
@ordenes_bp.route('/<int:id>/estado', methods=['PATCH'])
@jwt_required()
def cambiar_estado(id):
    """
    Reglas:
    - gerente / encargado -> pueden cambiar el estado a cualquiera, incluida CANCELADA.
    - mecanico:
        - solo si la orden le pertenece (mecanico_asignado_id == su empleado_id)
        - NO puede poner CANCELADA.
    """
    orden = OrdenTrabajo.query.get(id)
    if not orden:
        return jsonify({"error": "Orden no encontrada"}), 404

    data = request.get_json() or {}
    estado_str = data.get('estado')
    if not estado_str:
        return jsonify({"error": "El estado es requerido"}), 400

    try:
        nuevo_estado = EstadoOrdenEnum[estado_str]
    except KeyError:
        return jsonify({"error": "Estado inválido"}), 400

    # quién está logueado
    usuario, empleado_id, rol = _get_current_user_ctx()
    if not usuario:
        return jsonify({"error": "No se pudo identificar al usuario actual"}), 401

    # validaciones de permiso según rol
    if rol == 'mecanico':
        # Debe ser el asignado
        if not empleado_id or orden.mecanico_asignado_id != empleado_id:
            return jsonify({"error": "No puede cambiar el estado de una orden que no le fue asignada"}), 403

        # No le dejamos CANCELAR
        if nuevo_estado == EstadoOrdenEnum.CANCELADA:
            return jsonify({"error": "No tiene permiso para cancelar la orden"}), 403

    elif rol in ['gerente', 'encargado']:
        # gerente / encargado = todo bien, puede cualquier estado
        pass
    else:
        return jsonify({"error": "No tiene permisos para cambiar estado"}), 403

    # aplicar cambio
    orden.estado = nuevo_estado

    # si finaliza / cancela, marcamos salida si no tenía
    if nuevo_estado in [EstadoOrdenEnum.FINALIZADA, EstadoOrdenEnum.CANCELADA]:
        if not orden.fecha_salida:
            orden.fecha_salida = datetime.utcnow()

    historial = EstadoOrden(
        orden_id=orden.id,
        estado=nuevo_estado,
        notas=data.get('notas', '')
    )
    db.session.add(historial)

    db.session.commit()

    return jsonify(orden.to_dict(include_relations=True)), 200


# =========================
# GET /api/ordenes/<id>/historial
# historial de estado
# =========================
@ordenes_bp.route('/<int:id>/historial', methods=['GET'])
@jwt_required()
def historial_orden(id):
    orden = OrdenTrabajo.query.get(id)
    if not orden:
        return jsonify({"error": "Orden no encontrada"}), 404

    data = [h.to_dict() for h in orden.historial]
    return jsonify(data), 200


# =========================
# GET /api/ordenes/dashboard_hoy
# data rápida para dashboard
# =========================
@ordenes_bp.route('/dashboard_hoy', methods=['GET'])
@jwt_required()
@role_required('gerente', 'encargado', 'mecanico')
def dashboard_hoy():
    """
    Devuelve:
    - resumen de HOY por estado
    - órdenes activas HOY (solo EN_ESPERA / EN_REPARACION)

    Esto es útil para el dashboard frontal.
    """
    # rango hoy en UTC
    now = datetime.utcnow()
    start_today = datetime(now.year, now.month, now.day)
    end_today = start_today + timedelta(days=1)

    base_today = (
        OrdenTrabajo.query
        .filter(
            OrdenTrabajo.fecha_ingreso >= start_today,
            OrdenTrabajo.fecha_ingreso < end_today
        )
    )

    total_hoy = base_today.count()
    espera_hoy = base_today.filter(OrdenTrabajo.estado == EstadoOrdenEnum.EN_ESPERA).count()
    reparacion_hoy = base_today.filter(OrdenTrabajo.estado == EstadoOrdenEnum.EN_REPARACION).count()
    finalizadas_hoy = base_today.filter(OrdenTrabajo.estado == EstadoOrdenEnum.FINALIZADA).count()
    canceladas_hoy = base_today.filter(OrdenTrabajo.estado == EstadoOrdenEnum.CANCELADA).count()

    # órdenes activas hoy (pendientes en taller)
    activas_rows = (
        base_today
        .filter(OrdenTrabajo.estado.in_([
            EstadoOrdenEnum.EN_ESPERA,
            EstadoOrdenEnum.EN_REPARACION
        ]))
        .order_by(OrdenTrabajo.fecha_ingreso.asc())
        .all()
    )

    activas_data = []
    for o in activas_rows:
        activas_data.append({
            "id": o.id,
            "estado": o.estado.value if o.estado else None,
            "fecha_ingreso": o.fecha_ingreso.isoformat() if o.fecha_ingreso else None,
            "cliente": o.cliente.nombre if getattr(o, "cliente", None) else None,
            "moto": (
                o.motocicleta.placa
                if getattr(o, "motocicleta", None) and o.motocicleta.placa
                else (o.motocicleta.vin if getattr(o, "motocicleta", None) else None)
            ),
            "mecanico": (
                o.mecanico_asignado.nombre
                if getattr(o, "mecanico_asignado", None)
                else "Sin asignar"
            ),
        })

    return jsonify({
        "resumen_hoy": {
            "total": total_hoy,
            "en_espera": espera_hoy,
            "en_reparacion": reparacion_hoy,
            "finalizadas": finalizadas_hoy,
            "canceladas": canceladas_hoy,
        },
        "ordenes_activas_hoy": activas_data
    }), 200