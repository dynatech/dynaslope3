import datetime
from connection import DB, MARSHMALLOW

class SmsOutboxUserStatus(DB.Model):
	__tablename__ = "smsoutbox_user_status"

	__bind_key__ = "comms_db"

	stat_id = DB.Column(DB.Integer, primary_key=True)
	outbox_id = DB.Column(DB.Integer, nullable=True)
	mobile_id = DB.Column(DB.Integer, nullable=False)
	ts_sent = DB.Column(DB.DateTime, default=datetime.datetime.utcnow)
	send_status = DB.Column(DB.Integer, nullable=False)
	event_id_reference = DB.Column(DB.Integer, nullable=False)
	gsm_id = DB.Column(DB.Integer, nullable=True)

	def __repr__(self):
		return f"Type <{self.__class__.__name__}>"

class SmsOutboxUserStatusSchema(MARSHMALLOW.ModelSchema):
	class Meta:
		model = SmsOutboxUserStatus