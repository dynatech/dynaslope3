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
    report_message = DB.Column(DB.String(455))
    report_file_name = DB.Column(DB.String(45))
    working_nodes = DB.Column(DB.Integer)
    anamalous_node = DB.Column(DB.Integer)
    rain_gauge_status = DB.Column(DB.String(45))
    image_file_name = DB.Column(DB.String(45))
    timestamp = DB.Column(DB.String(45))

    def __repr__(self):
        return f"Class Representation"


class SensorMaintenanceSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of SensorMaintenance class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = SensorMaintenance
