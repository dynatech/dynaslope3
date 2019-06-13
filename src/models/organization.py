from connection import DB, MARSHMALLOW


class Organization(DB.Model):
    __tablename__ = "organization"

    __bind_key__ = "comms_db"

    org_id = DB.Column(DB.Integer, primary_key=True)
    org_scope = DB.Column(DB.Integer, nullable=True)
    org_name = DB.Column(DB.String(45))

    def __repr__(self):
        return f"{self.org_name}\n"


class OrganizationSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = Organization
