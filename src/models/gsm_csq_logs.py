import datetime
from connection import DB, MARSHMALLOW

class GsmCsqLogs(DB.Model):
    __tablename__ = "gsm_csq_logs"

    __bind_key__ = "comms_db"

    log_id = DB.Column(DB.Integer, primary_key=True)
    gsm_id = DB.Column(
        DB.Integer, DB.ForeignKey("gsm_modules.gsm_id"))
    ts = DB.Column(DB.DateTime, default=datetime.datetime.utcnow)
    csq_val = DB.Column(DB.Integer, nullable=True)
 
    def __repr__(self):
        return f"{self.ts}\n"

class GsmCsqLogsSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = GsmCsqLogs
