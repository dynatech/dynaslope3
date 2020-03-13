import datetime
from connection import DB, MARSHMALLOW


class LoggerModels(DB.Model):
    __tablename__ = "loggers"

    __bind_key__ = "mia_comms_db_3"

    logger_id = DB.Column(DB.Integer, primary_key=True)
    site_id = DB.Column(
        DB.Integer, DB.ForeignKey("sites.site_id"))
    logger_name = DB.Column(DB.String(7))
    date_activated = DB.Column(DB.DateTime, default=datetime.datetime.utcnow)
    date_deactivated = DB.Column(DB.DateTime, default=datetime.datetime.utcnow)
    latitude = DB.Column(DB.Integer, nullable=True)
    latitude = DB.Column(DB.Integer, nullable=True)
    model_id = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return f"{self.logger_name}\n"


class LoggerModelsSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = LoggerModels
