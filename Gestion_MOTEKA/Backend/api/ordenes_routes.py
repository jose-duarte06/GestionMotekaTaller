from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from core.extensions import db
from core.auth import role_required
from models.ordenes import OrdenTrabajo, EstadoOrden, Pago, EstadoOrdenEnum, TipoPagoEnum
from models.vehiculos import Motocicleta
from models.personas import Cliente, Empleado
from datetime import datetime
from decimal import Decimal

ordenes_bp = Blueprint('ordenes', __name__, url_prefix='/api/ordenes')

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

    query = OrdenTrabajo.query.join(Cliente).join(Motocicleta).outerjoin(Empleado)

    if cliente_id:
        query = query.filter(OrdenTrabajo.cliente_id == cliente_id)

    if cliente_nombre:
        query = query.filter(Cliente.nombre.ilike(f'%{cliente_nombre}%'))

    if motocicleta_id:
        query = query.filter(OrdenTrabajo.motocicleta_id == motocicleta_id)

    if mecanico_id:
        query = query.filter(OrdenTrabajo.mecanico_asignado_id == mecanico_id)

    if estado:
        try:
            estado_enum = EstadoOrdenEnum[estado]
            query = query.filter(OrdenTrabajo.estado == estado_enum)
        except KeyError:
            pass

    if desde:
        try:
            fecha_desde = datetime.fromisoformat(desde.replace('Z', '+00:00'))
            query = query.filter(OrdenTrabajo.fecha_ingreso >= fecha_desde)
        except:
            pass

    if hasta:
        try:
            fecha_hasta = datetime.fromisoformat(hasta.replace('Z', '+00:00'))
            query = query.filter(OrdenTrabajo.fecha_ingreso <= fecha_hasta)
        except:
            pass

    if placa:
        query = query.filter(Motocicleta.placa.ilike(f'%{placa}%'))

    ordenes = query.order_by(OrdenTrabajo.fecha_ingreso.desc()).all()
    return jsonify([o.to_dict(include_relations=True) for o in ordenes]), 200


@ordenes_bp.route('', methods=['POST'])
@jwt_required()
@role_required('gerente', 'encargado')  # 🔒 mecánico no crea orden directa
def create_orden():
    data = request.get_json() or {}

    cliente_id = data.get('cliente_id')
    motocicleta_id = data.get('motocicleta_id')
    observaciones = data.get('observaciones')
    mecanico_id = data.get('mecanico_id')  # 👈 este viene del front

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
        mecanico_asignado_id=mecanico_id,  # 👈 guardamos acá
        estado=EstadoOrdenEnum.EN_ESPERA,
        observaciones=observaciones
    )

    db.session.add(nueva_orden)
    db.session.flush()

    estado_inicial = EstadoOrden(
        orden_id=nueva_orden.id,
        estado=EstadoOrdenEnum.EN_ESPERA,
        notas="Orden creada"
    )
    db.session.add(estado_inicial)

    db.session.commit()

    return jsonify(nueva_orden.to_dict(include_relations=True)), 201


@ordenes_bp.route('/<int:id>/estado', methods=['PATCH'])
@jwt_required()
@role_required('gerente', 'encargado')  # 🔒 mecánico no cambia estado
def cambiar_estado(id):
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