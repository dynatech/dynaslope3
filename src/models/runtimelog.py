import datetime
from connection import DB, MARSHMALLOW

class RunTimeLog(DB.Model):
    __tablename__ = "runtimelog"

    __bind_key__ = "comms_db_3"

    log_id = DB.Column(DB.Integer, primary_key=True)
    ts = DB.Column(DB.DateTime, default=datetime.datetime.utcnow)
    script_name = DB.Column(DB.String(20))
    log_details = DB.Column(DB.String(20))
 
    def __repr__(self):
        return f"{self.script_name}\n"

class RunTimeLogSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = RunTimeLog
