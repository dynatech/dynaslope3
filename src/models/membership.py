"""
File containing class representation of
Membership table (and related tables)
"""

from flask_login import UserMixin
from connection import DB, MARSHMALLOW


class Membership(UserMixin, DB.Model):
    """
    Class representation of Membership table
    """

    __tablename__ = "membership"
    ###
    # __bind_key__ contains database name to access
    # Not necessary if "senslopedb" because it is the default one
    ###
    __bind_key__ = "comms_db_3"

    membership_id = DB.Column(DB.Integer, primary_key=True)
    user_fk_id = DB.Column(
        DB.Integer, DB.ForeignKey("users.user_id"))
    username = DB.Column(DB.String(45))
    password = DB.Column(DB.String(200))
    is_active = DB.Column(DB.Boolean, nullable=False, default=True)
    salt = DB.Column(DB.String(200))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Membership ID: {self.membership_id}"
                f" User ID: {self.user_fk_id}")


class MembershipSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Membership class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = Membership
