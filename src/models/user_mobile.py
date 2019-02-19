from connection import DB, MARSHMALLOW

class UserMobile(DB.Model):
    __tablename__ = "user_mobile"

    __bind_key__ = "comms_db"

    mobile_id = DB.Column(DB.Integer, primary_key=True)
    user_id = DB.Column(DB.Integer, nullable=False)
    sim_num = DB.Column(DB.String(30))
    priority = DB.Column(DB.Integer, nullable=False)
    mobile_status = DB.Column(DB.Integer, nullable=False)
    gsm_id = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return (f"{self.sim_num}")


class UserMobileSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = UserMobile
