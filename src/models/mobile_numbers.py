"""
File containing class representation of
tables related to mobile numbers
"""

from marshmallow import fields
from sqlalchemy.dialects.mysql import TINYINT, SMALLINT
from connection import DB, MARSHMALLOW

from src.models.users import UsersRelationship, UsersRelationshipSchema


class MobileNumbers(DB.Model):
    """
    Class representation of mobile_numbers table
    """

    __tablename__ = "mobile_numbers"
    __bind_key__ = "comms_db"
    __table_args__ = {"schema": "comms_db"}

    mobile_id = DB.Column(SMALLINT, primary_key=True)
    sim_num = DB.Column(DB.String(30))
    gsm_id = DB.Column(TINYINT, nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Mobile ID: {self.mobile_id}"
                f" SIM Number: {self.sim_num} GSM ID: {self.gsm_id}")

class UserMobiles(DB.Model):
    """
    Class representation of user_mobiles table
    """

    __tablename__ = "user_mobiles"
    __bind_key__ = "comms_db"
    __table_args__ = {"schema": "comms_db"}

    user_id = DB.Column(SMALLINT, DB.ForeignKey(
        "commons_db.users.user_id"), primary_key=True)
    mobile_id = DB.Column(SMALLINT, DB.ForeignKey(
        "comms_db.mobile_numbers.mobile_id"), primary_key=True)
    priority = DB.Column(TINYINT)
    status = DB.Column(TINYINT, nullable=False)

    user = DB.relationship(UsersRelationship, backref=DB.backref(
        "mobile_numbers", lazy="raise"),
        lazy="joined", innerjoin=True)
    mobile_number = DB.relationship(MobileNumbers, backref=DB.backref(
        "user_details", lazy="joined", uselist=False),
        lazy="joined", innerjoin=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> User ID: {self.user_id}"
                f" Mobile ID: {self.mobile_id} Priority: {self.priority}"
                f" Status: {self.status}")


class BlockedMobileNumbers(DB.Model):
    """
    Class representation of blocked_mobile_numbers table
    """

    __tablename__ = "blocked_mobile_numbers"
    __bind_key__ = "comms_db"
    __table_args__ = {"schema": "comms_db"}

    mobile_id = DB.Column(SMALLINT, DB.ForeignKey(
        "comms_db.mobile_numbers.mobile_id"), primary_key=True)
    reason = DB.Column(DB.String(500), nullable=False)
    reporter_id = DB.Column(SMALLINT, DB.ForeignKey(
        "commons_db.users.user_id"))
    ts = DB.Column(DB.DateTime, nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Mobile ID: {self.mobile_id}"
                f" Reason: {self.reason} Reporter ID: {self.user_id}"
                f" TS: {self.ts}")

class SimPrefixes(DB.Model):
    """
    Class representation of sim_prefixes table
    """

    __tablename__ = "sim_prefixes"
    __bind_key__ = "comms_db"
    __table_args__ = {"schema": "comms_db"}

    prefix_id = DB.Column(SMALLINT, primary_key=True)
    prefix = DB.Column(DB.Integer, nullable=True)
    network_id = DB.Column(DB.Integer, nullable=True)
    gsm_id = DB.Column(DB.Integer, nullable=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Prefix ID: {self.prefix_id}"
                f" Prefix: {self.prefix}")

class MobileNumbersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of MobileNumbers class
    """

    user_details = fields.Nested(
        "UserMobilesSchema", exclude=["mobile_number"])

    class Meta:
        """Saves table class structure as schema model"""
        model = MobileNumbers


class UserMobilesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of UserMobiles class
    """

    user = fields.Nested(UsersRelationshipSchema, exclude=["mobile_numbers"])
    mobile_number = fields.Nested(
        MobileNumbersSchema, exclude=["user_details"])

    class Meta:
        """Saves table class structure as schema model"""
        model = UserMobiles

class SimPrefixesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of SimPrefixes class
    """

    user_details = fields.Nested(
        "UserMobilesSchema", exclude=["mobile_number"])

    class Meta:
        """Saves table class structure as schema model"""
        model = SimPrefixes
