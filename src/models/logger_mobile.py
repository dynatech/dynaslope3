import datetime
from connection import DB, MARSHMALLOW

class LoggerMobile(DB.Model):
    __tablename__ = "logger_mobile"

    __bind_key__ = "comms_db_3"

    mobile_id = DB.Column(DB.Integer, primary_key=True)
    logger_id = DB.Column(DB.Integer, nullable=False)
    date_activated = DB.Column(DB.DateTime, default=datetime.datetime.utcnow)
    sim_num = DB.Column(DB.String(12))
    gsm_id = DB.Column(DB.Integer, nullable=False)
 
    def __repr__(self):
        return f"{self.date_activated}\n"

class LoggerMobileSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = LoggerMobile
