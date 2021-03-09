"""
File containing class representation of
tables related to mobile numbers
"""

from marshmallow import fields, EXCLUDE
from sqlalchemy.dialects.mysql import TINYINT, SMALLINT
from instance.config import SCHEMA_DICT
from connection import DB, MARSHMALLOW

from src.models.users import UsersRelationship, UsersRelationshipSchema, Users


class MobileNumbers(DB.Model):
    """
    Class representation of mobile_numbers table
    """

    __tablename__ = "mobile_numbers"
    __bind_key__ = "comms_db_3"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

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
    __bind_key__ = "comms_db_3"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    user_id = DB.Column(SMALLINT, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.users.user_id"), primary_key=True)
    mobile_id = DB.Column(SMALLINT, DB.ForeignKey(
        f"{SCHEMA_DICT['comms_db_3']}.mobile_numbers.mobile_id"), primary_key=True)
    priority = DB.Column(TINYINT)
    status = DB.Column(TINYINT, nullable=False)

    user = DB.relationship(
        UsersRelationship, backref=DB.backref(
            "mobile_numbers", lazy="raise"
        ), lazy="joined", innerjoin=True)

    mobile_number = DB.relationship(
        MobileNumbers, backref=DB.backref(
            "users", lazy="subquery",
        ), lazy="joined", innerjoin=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> User ID: {self.user_id}"
                f" Mobile ID: {self.mobile_id} Priority: {self.priority}"
                f" Status: {self.status}")


class BlockedMobileNumbers(DB.Model):
    """
    Class representation of blocked_mobile_numbers table
    """

    __tablename__ = "blocked_mobile_numbers"
    __bind_key__ = "comms_db_3"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    mobile_id = DB.Column(SMALLINT, DB.ForeignKey(
        f"{SCHEMA_DICT['comms_db_3']}.mobile_numbers.mobile_id"), primary_key=True)
    reason = DB.Column(DB.String(500), nullable=False)
    reporter_id = DB.Column(SMALLINT, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.users.user_id"))
    ts = DB.Column(DB.DateTime, nullable=False)

    reporter = DB.relationship(Users, backref=DB.backref(
        "blocked_mobile_numbers", lazy="raise"),
        lazy="joined", innerjoin=True)
    mobile_number = DB.relationship(MobileNumbers, backref=DB.backref(
        "blocked_mobile"),
        lazy="joined", innerjoin=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Mobile ID: {self.mobile_id}"
                f" Reason: {self.reason} Reporter ID: {self.user_id}"
                f" TS: {self.ts}")


class MobileNumbersSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of MobileNumbers class
    """

    users = MARSHMALLOW.Nested(
        "UserMobilesSchema", exclude=["mobile_number"], many=True)

    class Meta:
        """Saves table class structure as schema model"""
        model = MobileNumbers
        # unknown = EXCLUDE


class UserMobilesSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of UserMobiles class
    """

    user = MARSHMALLOW.Nested(UsersRelationshipSchema,
                              exclude=["mobile_numbers"])
    mobile_number = MARSHMALLOW.Nested(
        MobileNumbersSchema, exclude=["users"])

    class Meta:
        """Saves table class structure as schema model"""
        model = UserMobiles
        unknown = EXCLUDE


class BlockedMobileNumbersSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of BlockedNumbers class
    """

    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
    reporter = MARSHMALLOW.Nested("UsersSchema")
    mobile_number = MARSHMALLOW.Nested(
        "MobileNumbersSchema")  # NOTE EXCLUDE: exclude=["blocked_mobile"]

    class Meta:
        """Saves table class structure as schema model"""
        model = BlockedMobileNumbers
        # unknown = EXCLUDE
