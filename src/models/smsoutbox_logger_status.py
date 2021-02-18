import datetime
from connection import DB, MARSHMALLOW


class SmsOutboxLoggerStatus(DB.Model):
    __tablename__ = "smsoutbox_logger_status"

    __bind_key__ = "comms_db_3"

    stat_id = DB.Column(DB.Integer, primary_key=True)
    outbox_id = DB.Column(DB.Integer, nullable=True)
    ts_sent = DB.Column(DB.DateTime, default=datetime.datetime.now)
    mobile_id = DB.Column(DB.Integer, nullable=False)
    send_status = DB.Column(DB.Integer, nullable=False)
    web_status = DB.Column(DB.Integer, nullable=False)
    gsm_id = DB.Column(DB.Integer, nullable=True)

    def __repr__(self):
        return f"Type <{self.__class__.__name__}>"


class SmsOutboxLoggerStatusSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    class Meta:
        model = SmsOutboxLoggerStatus
