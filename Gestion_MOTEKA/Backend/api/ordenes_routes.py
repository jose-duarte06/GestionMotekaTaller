from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from core.extensions import db
from core.auth import role_required
from models.ordenes import OrdenTrabajo, EstadoOrden, Pago, EstadoOrdenEnum, TipoPagoEnum
from models.vehiculos import Motocicleta
from models.personas import Cliente, Empleado
from models.catalogos import ModeloMoto, MarcaMoto
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
    q = request.args.get('q', '').strip()
    
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
@role_required('gerente', 'encargado', 'mecanico')
def create_orden():
    data = request.get_json()
    
    if not data or not data.get('cliente_id') or not data.get('motocicleta_id'):
        return jsonify({"error": "cliente_id y motocicleta_id son requeridos"}), 400
    
    cliente = Cliente.query.get(data['cliente_id'])
    if not cliente:
        return jsonify({"error": "El cliente especificado no existe"}), 404
    
    moto = Motocicleta.query.get(data['motocicleta_id'])
    if not moto:
        return jsonify({"error": "La motocicleta especificada no existe"}), 404
    
    if moto.cliente_id != data['cliente_id']:
        return jsonify({"error": "La motocicleta no pertenece al cliente"}), 400
    
    if data.get('mecanico_asignado_id'):
        mecanico = Empleado.query.get(data['mecanico_asignado_id'])
        if not mecanico:
            return jsonify({"error": "El mecánico especificado no existe"}), 404
    
    nueva_orden = OrdenTrabajo(
        cliente_id=data['cliente_id'],
        motocicleta_id=data['motocicleta_id'],
        mecanico_asignado_id=data.get('mecanico_asignado_id'),
        estado=EstadoOrdenEnum.EN_ESPERA,
        observaciones=data.get('observaciones')
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
@role_required('gerente', 'encargado', 'mecanico')
def cambiar_estado(id):
    orden = OrdenTrabajo.query.get(id)
    if not orden:
        return jsonify({"error": "Orden no encontrada"}), 404
    
    data = request.get_json()
    if not data or not data.get('estado'):
        return jsonify({"error": "El estado es requerido"}), 400
    
    try:
        nuevo_estado = EstadoOrdenEnum[data['estado']]
    except KeyError:
        return jsonify({"error": "Estado inválido"}), 400
    
    orden.estado = nuevo_estado
    
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


@ordenes_bp.route('/<int:id>/historial', methods=['GET'])
@jwt_required()
def get_historial(id):
    orden = OrdenTrabajo.query.get(id)
    if not orden:
        return jsonify({"error": "Orden no encontrada"}), 404
    
    historial = EstadoOrden.query.filter_by(orden_id=id).order_by(EstadoOrden.creado_en).all()
    return jsonify([h.to_dict() for h in historial]), 200


@ordenes_bp.route('/<int:id>/pagos', methods=['POST'])
@jwt_required()
@role_required('gerente', 'encargado')
def create_pago(id):
    orden = OrdenTrabajo.query.get(id)
    if not orden:
        return jsonify({"error": "Orden no encontrada"}), 404
    
    data = request.get_json()
    if not data or not data.get('tipo') or not data.get('monto'):
        return jsonify({"error": "tipo y monto son requeridos"}), 400
    
    try:
        tipo_pago = TipoPagoEnum[data['tipo']]
    except KeyError:
        return jsonify({"error": "Tipo de pago inválido"}), 400
    
    monto = Decimal(str(data['monto']))
    if monto <= 0:
        return jsonify({"error": "El monto debe ser mayor a 0"}), 400
    
    nuevo_pago = Pago(
        orden_id=id,
        tipo=tipo_pago,
        monto=monto
    )
    
    db.session.add(nuevo_pago)
    db.session.commit()
    
    return jsonify(nuevo_pago.to_dict()), 201


@ordenes_bp.route('/<int:id>/pagos', methods=['GET'])
@jwt_required()
def get_pagos(id):
    orden = OrdenTrabajo.query.get(id)
    if not orden:
        return jsonify({"error": "Orden no encontrada"}), 404
    
    pagos = Pago.query.filter_by(orden_id=id).order_by(Pago.pagado_en.desc()).all()
    return jsonify([p.to_dict() for p in pagos]), 200


@ordenes_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@role_required('gerente', 'encargado')
def delete_orden(id):
    orden = OrdenTrabajo.query.get(id)
    if not orden:
        return jsonify({"error": "Orden no encontrada"}), 404
    
    if orden.pagos:
        return jsonify({"error": "No puede eliminar la orden: tiene pagos registrados"}), 409
    
    db.session.delete(orden)
    db.session.commit()
    
    return jsonify({"mensaje": "Orden eliminada exitosamente"}), 200
