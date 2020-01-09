import datetime
from connection import DB, MARSHMALLOW

class LoggerModels(DB.Model):
    __tablename__ = "logger_models"

    __bind_key__ = "comms_db_3"

    model_id = DB.Column(DB.Integer, primary_key=True)
    has_tilt = DB.Column(DB.Integer, nullable=True)
    has_rain = DB.Column(DB.Integer, nullable=True)
    has_piezo = DB.Column(DB.Integer, nullable=True)
    has_soms = DB.Column(DB.Integer, nullable=True)
    logger_type = DB.Column(DB.String(10))
 
    def __repr__(self):
        return f"{self.logger_type}\n"

class LoggerModelsSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = LoggerModels
