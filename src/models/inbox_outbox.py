"""
File containing class representation of
tables of smsinbox_users, smsoutbox_users and smsoutbox_user_status
"""

from datetime import datetime
from marshmallow import fields
from connection import DB, MARSHMALLOW
from src.models.mobile_numbers import UserMobiles, UserMobilesSchema


class SmsInboxUsers(DB.Model):
    """
    Class representation of smsinbox_users table
    """

    __tablename__ = "smsinbox_users"
    __bind_key__ = "mia_comms_db_3"
    __table_args__ = {"schema": "mia_comms_db_3"}

    inbox_id = DB.Column(DB.Integer, primary_key=True)
    ts_sms = DB.Column(DB.DateTime, default=datetime.utcnow())
    ts_stored = DB.Column(DB.DateTime, default=datetime.utcnow())
    mobile_id = DB.Column(
        DB.Integer, DB.ForeignKey("mia_comms_db_3.user_mobiles.mobile_id"))
    sms_msg = DB.Column(DB.String(1000))
    read_status = DB.Column(DB.Integer, default=0)

    mobile_details = DB.relationship("UserMobiles",
                                     backref=DB.backref(
                                         "inbox_messages", lazy="dynamic"),
                                     lazy="select")
    sms_tags = DB.relationship(
        "SmsInboxUserTags", backref="inbox_message", lazy="subquery")

    def __repr__(self):
        return f"Type <{self.__class__.__name__}>"


class SmsInboxUsers2(DB.Model):
    """
    Class representation of smsinbox_users table
    """

    __tablename__ = "smsinbox_users"
    __bind_key__ = "mia_comms_db"  # NOTE: transition thing
    __table_args__ = {"schema": "mia_comms_db"}

    inbox_id = DB.Column(DB.Integer, primary_key=True)
    ts_sms = DB.Column(DB.DateTime, default=datetime.utcnow())
    ts_stored = DB.Column(DB.DateTime, default=datetime.utcnow())
    mobile_id = DB.Column(DB.Integer)
    sms_msg = DB.Column(DB.String(1000))
    read_status = DB.Column(DB.Integer, default=0)
    web_status = DB.Column(DB.Integer)
    gsm_id = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return f"Type <{self.__class__.__name__}>"


class SmsTags(DB.Model):
    """
    Class representation of smsinbox_users table
    """

    __tablename__ = "sms_tags"
    __bind_key__ = "mia_comms_db_3"
    __table_args__ = {"schema": "mia_comms_db_3"}

    tag_id = DB.Column(DB.Integer, primary_key=True)
    tag = DB.Column(DB.String(30), nullable=False)
    source = DB.Column(DB.String(30), nullable=False)
    description = DB.Column(DB.String(300))

    def __repr__(self):
        return f"Type <{self.__class__.__name__}>"


class SmsInboxUserTags(DB.Model):
    """
    Class representation of smsinbox_users table
    """

    __tablename__ = "smsinbox_user_tags"
    __bind_key__ = "mia_comms_db_3"
    __table_args__ = {"schema": "mia_comms_db_3"}

    siu_tag_id = DB.Column(DB.Integer, primary_key=True)
    inbox_id = DB.Column(
        DB.Integer, DB.ForeignKey("mia_comms_db_3.smsinbox_users.inbox_id"))
    tag_id = DB.Column(DB.Integer, DB.ForeignKey(
        "mia_comms_db_3.sms_tags.tag_id"))
    user_id = DB.Column(
        DB.Integer, DB.ForeignKey("mia_commons_db.users.user_id"))
    ts = DB.Column(DB.DateTime, default=datetime.utcnow())

    tag = DB.relationship("SmsTags",
                          backref=DB.backref(
                              "smsinbox_user_tags", lazy="subquery"),
                          lazy="select")

    def __repr__(self):
        return f"Type <{self.__class__.__name__}>"


class SmsOutboxUsers(DB.Model):
    """
    Class representation of smsoutbox_users table
    """

    __tablename__ = "smsoutbox_users"
    __bind_key__ = "mia_comms_db_3"
    __table_args__ = {"schema": "mia_comms_db_3"}

    outbox_id = DB.Column(DB.Integer, primary_key=True)
    ts_written = DB.Column(DB.DateTime, default=datetime.utcnow())
    source = DB.Column(DB.String(45))
    sms_msg = DB.Column(DB.String(1000))

    send_status = DB.relationship("SmsOutboxUserStatus",
                                  backref=DB.backref(
                                      "outbox_message", lazy="select"),
                                  lazy="subquery")
    sms_tags = DB.relationship(
        "SmsOutboxUserTags", backref="outbox_message", lazy="subquery")

    def __repr__(self):
        return f"Type <{self.sms_msg}>"


class SmsOutboxUsers2(DB.Model):
    """
    Class representation of smsoutbox_users table
    """

    __tablename__ = "smsoutbox_users"
    __bind_key__ = "mia_comms_db"  # TAKE NOTE
    __table_args__ = {"schema": "mia_comms_db"}

    outbox_id = DB.Column(DB.Integer, primary_key=True)
    ts_written = DB.Column(DB.DateTime, default=datetime.utcnow())
    source = DB.Column(DB.String(45))
    sms_msg = DB.Column(DB.String(1000))

    def __repr__(self):
        return f"Type <{self.sms_msg}>"


class SmsOutboxUserStatus(DB.Model):
    """
    Class representation of smsoutbox_user_status table
    """

    __tablename__ = "smsoutbox_user_status"
    __bind_key__ = "mia_comms_db_3"
    __table_args__ = {"schema": "mia_comms_db_3"}

    stat_id = DB.Column(DB.Integer, primary_key=True)
    outbox_id = DB.Column(
        DB.Integer, DB.ForeignKey("mia_comms_db_3.smsoutbox_users.outbox_id"))
    mobile_id = DB.Column(
        DB.Integer, DB.ForeignKey("mia_comms_db_3.user_mobiles.mobile_id"))
    ts_sent = DB.Column(DB.DateTime, default=None)
    send_status = DB.Column(DB.Integer, nullable=False, default=0)
    gsm_id = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return f"Type <{self.__class__.__name__}>"


class SmsOutboxUserStatus2(DB.Model):
    """
    Class representation of smsoutbox_user_status table
    """

    __tablename__ = "smsoutbox_user_status"
    __bind_key__ = "mia_comms_db"  # TAKE NOTE
    __table_args__ = {"schema": "mia_comms_db"}

    stat_id = DB.Column(DB.Integer, primary_key=True)
    outbox_id = DB.Column(DB.Integer)
    mobile_id = DB.Column(DB.Integer)
    ts_sent = DB.Column(DB.DateTime, default=None)
    send_status = DB.Column(DB.Integer, nullable=False, default=0)
    gsm_id = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return f"Type <{self.__class__.__name__}>"


class SmsOutboxUserTags(DB.Model):
    """
    Class representation of smsinbox_users table
    """

    __tablename__ = "smsoutbox_user_tags"
    __bind_key__ = "mia_comms_db_3"
    __table_args__ = {"schema": "mia_comms_db_3"}

    sou_tag_id = DB.Column(DB.Integer, primary_key=True)
    outbox_id = DB.Column(
        DB.Integer, DB.ForeignKey("mia_comms_db_3.smsoutbox_users.outbox_id"))
    tag_id = DB.Column(DB.Integer, DB.ForeignKey(
        "mia_comms_db_3.sms_tags.tag_id"))
    user_id = DB.Column(
        DB.Integer, DB.ForeignKey("mia_commons_db.users.user_id"))
    ts = DB.Column(DB.DateTime, default=datetime.utcnow())

    tag = DB.relationship("SmsTags",
                          backref=DB.backref(
                              "smsoutbox_user_tags", lazy="subquery"),
                          lazy="select")

    def __repr__(self):
        return f"Type <{self.__class__.__name__}>"


class SmsUserUpdates(DB.Model):
    """
    Class representation of smsinbox_users table
    """

    __tablename__ = "sms_user_updates"
    __bind_key__ = "mia_comms_db_3"
    __table_args__ = {"schema": "mia_comms_db_3"}

    update_id = DB.Column(DB.Integer, primary_key=True)
    mobile_id = DB.Column(DB.Integer)
    update_source = DB.Column(DB.String(20))
    pk_id = DB.Column(DB.Integer)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Update ID: {self.update_id}"
                f" Mobile ID: {self.mobile_id} Source: {self.update_source}"
                f" Primary Key ID: {self.pk_id}")


class ViewLatestMessages(DB.Model):
    """
    """

    __tablename__ = "view_latest_messages"
    __bind_key__ = "mia_comms_db_3"
    __table_args__ = {"schema": "mia_comms_db_3"}

    convo_id = DB.Column(DB.Integer, primary_key=True)
    max_time = DB.Column(DB.DateTime)
    mobile_id = DB.Column(DB.Integer)
    sms_msg = DB.Column(DB.String(3000))
    gsm_id = DB.Column(DB.Integer, default=None)
    source = DB.Column(DB.String(10))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Convo ID: {self.convo_id}"
                f" Max Time: {self.max_time} Mobile ID: {self.mobile_id}"
                f" SMS: {self.sms_msg} GSM ID: {self.gsm_id} Source: {self.source}")


class ViewLatestMessagesMobileID(DB.Model):
    """
    """

    __tablename__ = "view_latest_messages_mobile_id"
    __bind_key__ = "mia_comms_db_3"
    __table_args__ = {"schema": "mia_comms_db_3"}

    mobile_id = DB.Column(DB.Integer, primary_key=True)
    max_ts = DB.Column(DB.DateTime)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Mobile ID: {self.mobile_id}"
                f" Max TS: {self.max_ts}")


class ViewLatestUnsentMessages(DB.Model):
    """
    """

    __tablename__ = "view_latest_unsent_messages"
    __bind_key__ = "mia_comms_db_3"
    __table_args__ = {"schema": "mia_comms_db_3"}

    mobile_id = DB.Column(DB.Integer, primary_key=True)
    convo_id = DB.Column(DB.Integer)
    inbox_id = DB.Column(DB.Integer)
    outbox_id = DB.Column(DB.Integer)
    send_status = DB.Column(DB.Integer)
    gsm_id = DB.Column(DB.Integer)
    ts = DB.Column(DB.DateTime)
    ts_sent = DB.Column(DB.DateTime)
    ts_written = DB.Column(DB.DateTime)
    sms_msg = DB.Column(DB.String(3000))
    source = DB.Column(DB.String(20))
    msg_source = DB.Column(DB.String(10))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Mobile ID: {self.mobile_id}"
                f" Max TS: {self.max_ts}")


class SmsInboxUsersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """

    mobile_id = fields.Integer()
    mobile_details = fields.Nested(UserMobilesSchema)
    sms_tags = fields.Nested("SmsInboxUserTagsSchema",
                             many=True, exclude=["inbox_message"])

    class Meta:
        """Saves table class structure as schema model"""
        model = SmsInboxUsers


class SmsOutboxUsersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """
    send_status = fields.Nested("SmsOutboxUserStatusSchema", many=True)
    sms_tags = fields.Nested("SmsOutboxUserTagsSchema",
                             many=True, exclude=["outbox_message"])

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


class ViewLatestMessagesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = ViewLatestMessages


class TempLatestMessagesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """

    convo_id = fields.Integer()
    mobile_id = fields.Integer()
    inbox_id = fields.Integer()
    outbox_id = fields.Integer()
    sms_msg = fields.String()
    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_received = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_written = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_sent = fields.DateTime("%Y-%m-%d %H:%M:%S")
    source = fields.String()
    send_status = fields.Integer()
    msg_source = fields.String()


class SmsTagsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = SmsTags
        exclude = ["smsinbox_user_tags", "smsoutbox_user_tags"]


class SmsInboxUserTagsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """
    tag_id = fields.Integer()
    tag = fields.Nested("SmsTagsSchema")
    user_id = fields.Integer()

    class Meta:
        """Saves table class structure as schema model"""
        model = SmsInboxUserTags


class SmsOutboxUserTagsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """
    tag_id = fields.Integer()
    tag = fields.Nested("SmsTagsSchema")
    user_id = fields.Integer()

    class Meta:
        """Saves table class structure as schema model"""
        model = SmsOutboxUserTags


# class SmsOutboxUserStatusRelationshipSchema(MARSHMALLOW.ModelSchema):
#     """
#     Schema representation of Users class
#     """
#     sms_outbox = fields.Nested(SmsOutboxUsersSchema, exclude=("outbox",))

#     class Meta:
#         """Saves table class structure as schema model"""
#         model = SmsOutboxUserStatusRelationship


# class SmsInboxUnregisterRelationshipSchema(MARSHMALLOW.ModelSchema):
#     """
#     Schema representation of Users class
#     """
#     mobile_number = fields.Nested("UserMobileSchema")

#     class Meta:
#         """Saves table class structure as schema model"""
#         model = SmsInboxUnregisterRelationship


# class SmsQuickInboxRelationshipSchema(MARSHMALLOW.ModelSchema):
#     """
#     Schema representation of Users class
#     """
#     mobile_number = fields.Nested("UserMobileSchema")

#     class Meta:
#         """Saves table class structure as schema model"""
#         model = SmsQuickInboxRelationship
