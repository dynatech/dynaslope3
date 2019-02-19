import datetime
from connection import DB, MARSHMALLOW

class SmsOutboxUsers(DB.Model):
	__tablename__ = "smsoutbox_users"

	__bind_key__ = "comms_db"

	outbox_id = DB.Column(DB.Integer, primary_key=True)
	ts_written = DB.Column(DB.DateTime, default=datetime.datetime.utcnow)
	sms_msg = DB.Column(DB.String(1000))

	def __repr__(self):
		return f"Type <{self.sms_msg}>"

class SmsOutboxUsersSchema(MARSHMALLOW.ModelSchema):
	class Meta:
		model = SmsOutboxUsers