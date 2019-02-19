import datetime
from connection import DB, MARSHMALLOW

class UserAlertInfo(DB.Model):
	__tablename__ = "user_alert_info"

	__bind_key__ = "comms_db"

	uai_id = DB.Column(DB.Integer, primary_key=True)
	send_alert = DB.Column(DB.Integer, nullable=False)
	user_id = DB.Column(DB.Integer, nullable=False)

	def __repr__(self):
		return f"Type <{self.send_alert}>"

class UserAlertInfoSchema(MARSHMALLOW.ModelSchema):
	class Meta:
		model = UserAlertInfo