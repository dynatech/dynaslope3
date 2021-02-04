"""
File containing class representation of
Notifications table
"""

from datetime import datetime
from marshmallow import fields
from instance.config import SCHEMA_DICT
from connection import DB, MARSHMALLOW


class Notifications(DB.Model):
    """
    Class representation of Sites table
    """

    __tablename__ = "notifications"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    notification_id = DB.Column(DB.Integer, primary_key=True)
    ts = DB.Column(DB.DateTime, nullable=False, default=datetime.now)
    receiver_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.users.user_id"), nullable=False)
    message = DB.Column(DB.String(2000), nullable=False)
    link = DB.Column(DB.String(1000))
    ts_read = DB.Column(DB.DateTime)
    ts_seen = DB.Column(DB.DateTime)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Notification ID: {self.notification_id}"
                f" TS: {self.ts} Receiver ID: {self.receiver_id} Message: {self.message}"
                f" Read: {self.ts_read} Seen: {self.ts_seen}")


class NotificationsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Notifications class
    """

    receiver_id = fields.Integer()
    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_read = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_seen = fields.DateTime("%Y-%m-%d %H:%M:%S")

    class Meta:
        """Saves table class structure as schema model"""
        model = Notifications
