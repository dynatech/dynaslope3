"""
File containing class representation of
tables of user ewi status
"""

from flask_login import UserMixin
from marshmallow import fields
from connection import DB, MARSHMALLOW


class UserEwiStatus(DB.Model, UserMixin):
    """
    Class representation of users table
    """
    __tablename__ = "user_ewi_status"
    __bind_key__ = "mia_comms_db"
    __table_args__ = {"schema": "mia_comms_db"}

    mobile_id = DB.Column(DB.Integer, primary_key=True)
    status = DB.Column(DB.Integer, nullable=True)
    remarks = DB.Column(DB.String(45))
    users_id = DB.Column(DB.Integer, nullable=True)

    def get_id(self):
        return self.mobile_id

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Mobile ID: {self.mobile_id}")


class UserEwiStatusSchema(MARSHMALLOW.ModelSchema):
    """
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = UserEwiStatus
