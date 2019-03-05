import datetime
from connection import DB, MARSHMALLOW

class SmsOutboxLoggers(DB.Model):
	__tablename__ = "smsoutbox_loggers"

	__bind_key__ = "comms_db"

	outbox_id = DB.Column(DB.Integer, primary_key=True)
	ts_written = DB.Column(DB.DateTime, default=datetime.datetime.utcnow)
	source = DB.Column(DB.String(10))
	sms_msg = DB.Column(DB.String(1000))

	def __repr__(self):
		return f"Type <{self.sms_msg}>"

class SmsOutboxLoggersSchema(MARSHMALLOW.ModelSchema):
	class Meta:
		model = SmsOutboxLoggers