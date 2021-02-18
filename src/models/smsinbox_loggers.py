import datetime
from connection import DB, MARSHMALLOW


class SmsInboxLoggers(DB.Model):
    __tablename__ = "smsinbox_loggers"

    __bind_key__ = "comms_db_3"

    inbox_id = DB.Column(DB.Integer, primary_key=True)
    ts_sms = DB.Column(DB.DateTime, default=datetime.datetime.now)
    ts_stored = DB.Column(DB.DateTime, default=datetime.datetime.now)
    mobile_id = DB.Column(
        DB.Integer, DB.ForeignKey("user_mobile.mobile_id"))
    sms_msg = DB.Column(DB.String(1000))
    read_status = DB.Column(DB.Integer, nullable=False)
    web_status = DB.Column(DB.Integer, nullable=False)
    gsm_id = DB.Column(DB.Integer, nullable=True)

    def __repr__(self):
        return f"Type <{self.__class__.__name__}>"


class SmsInboxLoggersSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    class Meta:
        model = SmsInboxLoggers
