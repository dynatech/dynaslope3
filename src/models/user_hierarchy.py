from connection import DB, MARSHMALLOW

class UserHierarchy(DB.Model):
	__tablename__ = "user_hierarchy"

	__bind_key__ = "comms_db"

	user_hierarchy_id = DB.Column(DB.Integer, primary_key=True)
	fk_user_id = DB.Column(DB.Integer, nullable=False)
	fk_user_organization_id = DB.Column(DB.Integer, nullable=False)
	fk_site_id = DB.Column(DB.Integer, nullable=False)
	priority = DB.Column(DB.Integer, nullable=False)

	def __repr__(self):
		return f"Type <{self.priority}>"

class UserHierarchySchema(MARSHMALLOW.ModelSchema):
	class Meta:
		model = UserHierarchy