import datetime
from connection import DB, MARSHMALLOW

class Users(DB.Model):
	__tablename__ = "users"

	__bind_key__ = "comms_db"

	user_id = DB.Column(DB.Integer, primary_key=True)
	salutation = DB.Column(DB.String(15))
	firstname = DB.Column(DB.String(45))
	middlename = DB.Column(DB.String(45))
	lastname = DB.Column(DB.String(45))
	nickname = DB.Column(DB.String(45))
	sex = DB.Column(DB.String(1))
	status = DB.Column(DB.Integer, nullable=True)
	birthday = DB.Column(DB.Integer, nullable=True)

	def __repr__(self):
		return f"Type <{self.firstname}>"

class UsersSchema(MARSHMALLOW.ModelSchema):
	class Meta:
		model = Users