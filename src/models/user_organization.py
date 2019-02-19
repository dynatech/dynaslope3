from connection import DB, MARSHMALLOW

class UserOrganization(DB.Model):
    __tablename__ = "user_organization"

    __bind_key__ = "comms_db"

    org_id = DB.Column(DB.Integer, primary_key=True)
    user_id = DB.Column(DB.Integer, nullable=False)
    fk_site_id = DB.Column(DB.Integer, nullable=False)
    org_name = DB.Column(DB.String(45))
    scope = DB.Column(DB.Integer, nullable=True)

    def __repr__(self):
        return (f"{self.org_name}")


class UserOrganizationSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = UserOrganization
