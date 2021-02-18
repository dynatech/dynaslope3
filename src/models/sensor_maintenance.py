from marshmallow import fields
from connection import DB, MARSHMALLOW


class SensorMaintenance(DB.Model):
    """
    Class representation of sensor_maintenance table
    """
    __tablename__ = "sensor_maintenance"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    sensor_maintenance_id = DB.Column(DB.Integer, primary_key=True)
    remarks = DB.Column(DB.String(455))
    working_nodes = DB.Column(DB.Integer)
    anomalous_nodes = DB.Column(DB.Integer)
    rain_gauge_status = DB.Column(DB.String(45))
    timestamp = DB.Column(DB.String(45))

    def __repr__(self):
        return f"Class Representation"


class HardwareMaintenance(DB.Model):
    """
    Class representation of hardware_maintenance_logs table
    """
    __tablename__ = "hardware_maintenance_logs"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": "senslopedb"}

    hardware_maintenance_id = DB.Column(DB.Integer, primary_key=True)
    site_id = DB.Column(DB.Integer)
    hardware_maintained = DB.Column(DB.String(200))
    hardware_id = DB.Column(DB.String(200))
    status = DB.Column(DB.Integer)
    desc_summary = DB.Column(DB.String(1000))

    def __repr__(self):
        return f"Class Representation"


class HardwareMaintenanceSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of HardwareMaintenance class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = HardwareMaintenance


class SensorMaintenanceSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of SensorMaintenance class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = SensorMaintenance
