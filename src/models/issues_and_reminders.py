"""
File containing class representation of
Issues and Reminders tables
"""

from datetime import datetime
from marshmallow import fields
from instance.config import SCHEMA_DICT
from connection import DB, MARSHMALLOW


class IssuesAndReminders(DB.Model):
    """
    Class representation of issues_and_reminders table
    """

    __tablename__ = "issues_and_reminders"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    iar_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    detail = DB.Column(DB.String(360))
    user_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.users.user_id"), nullable=False)
    ts_posted = DB.Column(DB.DateTime, default=datetime.now, nullable=False)
    ts_expiration = DB.Column(DB.DateTime)
    resolved_by = DB.Column(DB.Integer)
    resolution = DB.Column(DB.String(500))
    ts_resolved = DB.Column(DB.DateTime)

    postings = DB.relationship(
        "IssuesRemindersSitePostings",
        backref=DB.backref("issue_and_reminder", lazy="joined"),
        lazy="subquery")

    # Louie - Relationship
    issue_reporter = DB.relationship(
        "Users", backref="issue_and_reminder", lazy="joined")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> IAR ID: {self.iar_id}"
                f" Detail: {self.detail} user_id: {self.user_id}"
                f" ts_posted: {self.ts_posted} ts_expiration: {self.ts_expiration}"
                f" resolved_by: {self.resolved_by} resolution: {self.resolution}")


class IssuesRemindersSitePostings(DB.Model):
    """
    Class representation of earthquake_events table
    """

    __tablename__ = "issues_reminders_site_postings"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    iar_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.issues_and_reminders.iar_id"), primary_key=True)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.sites.site_id"), primary_key=True)
    event_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['ewi_db']}.monitoring_events.event_id"))

    event = DB.relationship(
        "MonitoringEvents",
        backref=DB.backref("issues_reminders_site_posting", lazy="raise"),
        lazy="joined")
    site = DB.relationship(
        "Sites", backref=DB.backref("issues_reminders_site_posting", lazy="raise"),
        lazy="joined")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> iar_p_id: {self.iar_p_id}"
                f" site_id: {self.site_id} event_id: {self.event_id}"
                f" iar_id: {self.iar_id}")


class IssuesAndRemindersSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Common IssuesAndReminders class
    """

    ts_posted = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_expiration = fields.DateTime("%Y-%m-%d %H:%M:%S")
    user_id = fields.Integer()
    issue_reporter = MARSHMALLOW.Nested("UsersSchema") #NOTE EXCLUDE: exclude issue_and_reminder
    postings = MARSHMALLOW.Nested("IssuesRemindersSitePostingsSchema", many=True) #NOTE EXCLUDE: exclude issue_and_reminder

    class Meta:
        """Saves table class structure as schema model"""
        model = IssuesAndReminders


class IssuesRemindersSitePostingsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Commons IssuesAndReminders class
    """
    event_id = fields.Integer()
    site_id = fields.Integer()
    event = MARSHMALLOW.Nested(
        "MonitoringEventsSchema", exclude=("event_alerts", "site")) #NOTE EXCLUDE: exclude issues_reminders_posting, narratives
    site = MARSHMALLOW.Nested("SitesSchema") #NOTE EXCLUDE: exclude issue_and_reminder

    class Meta:
        """Saves table class structure as schema model"""
        model = IssuesRemindersSitePostings
