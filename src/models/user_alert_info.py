import datetime
from connection import DB, MARSHMALLOW


class UserAlertInfo(DB.Model):
    __tablename__ = "user_alert_info"

    __bind_key__ = "mia_comms_db_3"

    uai_id = DB.Column(DB.Integer, primary_key=True)
    send_alert = DB.Column(DB.Integer, nullable=False)
    user_id = DB.Column(
        DB.Integer, DB.ForeignKey("users.user_id"))

    def __repr__(self):
        return f"Type <{self.send_alert}>"


class UserAlertInfoSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = UserAlertInfo
