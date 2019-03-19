"""
File containing class representation of
tables of smsinbox_users, smsoutbox_users and smsoutbox_user_status
"""

import datetime
from marshmallow import fields
from connection import DB, MARSHMALLOW


class SmsInboxUsers(DB.Model):
    """
    Class representation of smsinbox_users table
    """
    __tablename__ = "smsinbox_users"
    __bind_key__ = "comms_db"
    __table_args__ = {"schema": "comms_db_2"}

    inbox_id = DB.Column(DB.Integer, primary_key=True)
    ts_sms = DB.Column(DB.DateTime, default=datetime.datetime.utcnow)
    ts_stored = DB.Column(DB.DateTime, default=datetime.datetime.utcnow)
    mobile_id = DB.Column(
        DB.Integer, DB.ForeignKey("comms_db_2.user_mobile.mobile_id"))
    sms_msg = DB.Column(DB.String(1000))
    read_status = DB.Column(DB.Integer, nullable=False)
    web_status = DB.Column(DB.Integer, nullable=False)
    # gsm_id = DB.Column(
    #     DB.Integer, DB.ForeignKey("comms_db_2.gsm_modules.gsm_id"))
    gsm_id = DB.Column(DB.Integer, nullable=False)

    mobile_number = DB.relationship(
        "UserMobile", backref=DB.backref("messages", lazy="subquery"), lazy=True)

    def __repr__(self):
        return f"Type <{self.__class__.__name__}>"


class SmsQuickInboxRelationship(SmsInboxUsers):
    """
    Class representation of smsinbox_users table
    """
    __tablename__ = "smsinbox_users"
    __bind_key__ = "comms_db"
    __table_args__ = {"schema": "comms_db_2"}

    number = DB.relationship(
        "UserMobile", backref=DB.backref("quick_inbox", lazy="joined", uselist=True), lazy="subquery", uselist=True)

    def __repr__(self):
        return f"Type relationship"


class SmsInboxUnregisterRelationship(SmsInboxUsers):
    __tablename__ = "smsinbox_users"
    __bind_key__ = "comms_db"
    __table_args__ = {"schema": "comms_db_2"}

    mobile_number = DB.relationship(
        "UserMobile", backref=DB.backref(
            "unregistered", lazy="joined", uselist=True), lazy="subquery", uselist=True)

    def __repr__(self):
        return f"Type relationship"


class SmsOutboxUsers(DB.Model):
    """
    Class representation of smsoutbox_users table
    """
    __tablename__ = "smsoutbox_users"
    __bind_key__ = "comms_db"
    __table_args__ = {"schema": "comms_db_2"}

    outbox_id = DB.Column(DB.Integer, primary_key=True)
    ts_written = DB.Column(DB.DateTime, default=datetime.datetime.utcnow)
    sms_msg = DB.Column(DB.String(1000))

    def __repr__(self):
        return f"Type <{self.sms_msg}>"


class SmsOutboxUserStatus(DB.Model):
    """
    Class representation of smsoutbox_user_status table
    """
    __tablename__ = "smsoutbox_user_status"
    __bind_key__ = "comms_db"
    __table_args__ = {"schema": "comms_db_2"}

    stat_id = DB.Column(DB.Integer, primary_key=True)
    outbox_id = DB.Column(
        DB.Integer, DB.ForeignKey("comms_db_2.smsoutbox_users.outbox_id"))
    mobile_id = DB.Column(
        DB.Integer, DB.ForeignKey("comms_db_2.user_mobile.mobile_id"))
    ts_sent = DB.Column(DB.DateTime, default=datetime.datetime.utcnow)
    send_status = DB.Column(DB.Integer, nullable=False)
    event_id_reference = DB.Column(DB.Integer, nullable=False)
    gsm_id = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return f"Type <{self.__class__.__name__}>"


class SmsOutboxUserStatusRelationship(SmsOutboxUserStatus):
    __tablename__ = "smsoutbox_user_status"
    __bind_key__ = "comms_db"
    __table_args__ = {"schema": "comms_db_2"}

    sms_outbox = DB.relationship(
        "SmsOutboxUsers", backref=DB.backref(
            "outbox", lazy="joined"), lazy="subquery")

    def __repr__(self):
        return f"Type <{self.__class__.__name__}>"


class SmsInboxUsersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """
    mobile_number = fields.Nested("UserMobileSchema")

    class Meta:
        """Saves table class structure as schema model"""
        model = SmsInboxUsers


class SmsOutboxUsersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = SmsOutboxUsers


class SmsOutboxUserStatusSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = SmsOutboxUserStatus


class SmsOutboxUserStatusRelationshipSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """
    sms_outbox = fields.Nested(SmsOutboxUsersSchema, exclude=("outbox",))

    class Meta:
        """Saves table class structure as schema model"""
        model = SmsOutboxUserStatusRelationship


class SmsInboxUnregisterRelationshipSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """
    mobile_number = fields.Nested("UserMobileSchema")

    class Meta:
        """Saves table class structure as schema model"""
        model = SmsInboxUnregisterRelationship


class SmsQuickInboxRelationshipSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """
    number = fields.Nested("UserMobileSchema")

    class Meta:
        """Saves table class structure as schema model"""
        model = SmsQuickInboxRelationship
