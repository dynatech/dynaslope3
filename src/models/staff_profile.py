import datetime
from connection import DB, MARSHMALLOW

class StaffProfile(DB.Model):
	__tablename__ = "staff_profile"

	__bind_key__ = "comms_db"

	sid = DB.Column(DB.Integer, primary_key=True)
	fk_mid = DB.Column(DB.Integer, nullable=False)
	full_name = DB.Column(DB.String(200))
	position = DB.Column(DB.String(200))
	team_name = DB.Column(DB.String(200))
	education_attainment = DB.Column(DB.String(200))

	def __repr__(self):
		return f"Type <{self.education_attainment}>"

class StaffProfileSchema(MARSHMALLOW.ModelSchema):
	class Meta:
		model = StaffProfile