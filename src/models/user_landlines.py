from connection import DB, MARSHMALLOW

class UserLandlines(DB.Model):
    __tablename__ = "user_landlines"

    __bind_key__ = "comms_db"

    landline_id = DB.Column(DB.Integer, primary_key=True)
    user_id = DB.Column(DB.Integer, nullable=False)
    landline_num = DB.Column(DB.String(30))
    remarks = DB.Column(DB.String(45))

    def __repr__(self):
        return (f"Type <{self.landline_num}")


class UserLandlinesSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = UserLandlines
