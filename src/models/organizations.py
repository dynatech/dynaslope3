from connection import DB, MARSHMALLOW


class Organizations(DB.Model):
    __tablename__ = "organizations"

    __bind_key__ = "comms_db"

    org_id = DB.Column(DB.Integer, primary_key=True)
    scope = DB.Column(DB.Integer, nullable=True)
    name = DB.Column(DB.String(45))

    def __repr__(self):
        return f"{self.org_name}\n"


class OrganizationsSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = Organizations
