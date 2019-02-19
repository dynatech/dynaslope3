import datetime
from connection import DB, MARSHMALLOW

class GsmModules(DB.Model):
    __tablename__ = "gsm_modules"

    __bind_key__ = "comms_db"

    gsm_id = DB.Column(DB.Integer, primary_key=True)
    gsm_server_id = DB.Column(DB.Integer, nullable=True)
    gsm_name = DB.Column(DB.String(10))
    gsm_sim_num = DB.Column(DB.String(12))
    network_type = DB.Column(DB.String(10))
    ser_port = DB.Column(DB.String(20))
    pwr_on_pin = DB.Column(DB.Integer, nullable=True)
    ring_pin = DB.Column(DB.Integer, nullable=True)
    module_type = DB.Column(DB.Integer, nullable=True)
 
    def __repr__(self):
        return f"{self.gsm_name}\n"

class GsmModulesSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = GsmModules
