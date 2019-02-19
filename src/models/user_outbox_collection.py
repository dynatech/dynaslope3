from connection import DB, MARSHMALLOW

class UserOutBoxCollection(DB.Model):
	__tablename__ = "user_outbox_collection"

	__bind_key__ = "comms_db"

	collection_id = DB.Column(DB.Integer, primary_key=True)
	outbox_id = DB.Column(DB.Integer, nullable=False)
	ws_status = DB.Column(DB.Integer, nullable=False)
	status = DB.Column(DB.String(45))

	def __repr__(self):
		return f"Type <{self.outbox_id}>"

class UserOutBoxCollectionSchema(MARSHMALLOW.ModelSchema):
	class Meta:
		model = UserOutBoxCollection