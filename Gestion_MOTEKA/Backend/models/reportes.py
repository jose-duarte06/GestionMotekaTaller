from datetime import datetime
from core.extensions import db

class ReporteTrabajo(db.Model):
    """
    Registro de lo que hizo el mecánico en una orden.
    Esto sirve para historial técnico y para exportar PDF/Word.
    Le guardamos un 'snapshot' de datos importantes en el momento.
    """
    __tablename__ = 'reportes_trabajo'

    id = db.Column(db.Integer, primary_key=True)

    # A qué orden pertenece este reporte
    orden_id = db.Column(db.Integer, db.ForeignKey('ordenes_trabajo.id'), nullable=False)

    # Quién lo hizo (Empleado, no Usuario)
    mecanico_id = db.Column(db.Integer, db.ForeignKey('empleados.id'), nullable=False)

    # Texto libre del reporte (diagnóstico, reparación hecha, repuestos usados, etc.)
    descripcion = db.Column(db.Text, nullable=False)

    # Snapshot de contexto en el momento que se guardó el reporte
    cliente_nombre = db.Column(db.String(200))
    moto_placa = db.Column(db.String(50))
    moto_vin = db.Column(db.String(100))
    marca_nombre = db.Column(db.String(100))
    modelo_nombre = db.Column(db.String(100))
    mecanico_nombre = db.Column(db.String(200))

    creado_en = db.Column(db.DateTime, default=datetime.utcnow)

    # Relacionado a nivel ORM
    orden = db.relationship('OrdenTrabajo', backref='reportes', lazy=True)
    mecanico = db.relationship('Empleado', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "orden_id": self.orden_id,
            "mecanico_id": self.mecanico_id,
            "mecanico_nombre": self.mecanico_nombre,
            "descripcion": self.descripcion,
            "cliente_nombre": self.cliente_nombre,
            "moto_placa": self.moto_placa,
            "moto_vin": self.moto_vin,
            "marca_nombre": self.marca_nombre,
            "modelo_nombre": self.modelo_nombre,
            "creado_en": self.creado_en.isoformat() if self.creado_en else None,
        }
