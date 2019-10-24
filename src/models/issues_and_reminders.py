"""
File containing class representation of
Issues and Reminders tables
"""

import datetime
from flask_login import UserMixin
from marshmallow import fields
from connection import DB, MARSHMALLOW
from src.models.monitoring import (MonitoringEvents, MonitoringEventsSchema)
from src.models.sites import (Sites, SitesSchema)
from src.models.users import (Users, UsersSchema)


class IssuesAndReminders(UserMixin, DB.Model):
    """
    Class representation of issues_and_reminders table
    """

    __tablename__ = "issues_and_reminders"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    iar_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    detail = DB.Column(DB.String(360))
    user_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.users.user_id"), nullable=False)
    ts_posted = DB.Column(DB.DateTime, nullable=False)
    ts_posted_until = DB.Column(DB.DateTime, nullable=False)
    resolved_by = DB.Column(DB.Integer)
    resolution = DB.Column(DB.String(360))

    postings = DB.relationship(
        "IssuesRemindersPostings", backref=DB.backref("issue_and_reminder", lazy="joined"), lazy="subquery")

    # Louie - Relationship
    issue_reporter = DB.relationship(
        "Users", backref="issue_and_reminder", lazy="joined")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> IAR ID: {self.iar_id}"
                f" Detail: {self.detail} user_id: {self.user_id}"
                f" ts_posted: {self.ts_posted} ts_posted_until: {self.ts_posted_until}"
                f" resolved_by: {self.resolved_by} resolution: {self.resolution}")


class IssuesRemindersPostings(UserMixin, DB.Model):
    """
    Class representation of earthquake_events table
    """

    __tablename__ = "issues_reminders_postings"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    iar_p_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.sites.site_id"))
    event_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.monitoring_events.event_id"))
    iar_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.issues_and_reminders.iar_id"), nullable=False)

    event = DB.relationship("MonitoringEvents", backref="issues_reminders_posting", lazy="joined")
    site = DB.relationship("Sites", backref="issues_reminders_posting", lazy="joined")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> iar_p_id: {self.iar_p_id}"
                f" site_id: {self.site_id} event_id: {self.event_id}"
                f" iar_id: {self.iar_id}")


class IssuesAndRemindersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Common IssuesAndReminders class
    """

    ts_posted = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_posted_until = fields.DateTime("%Y-%m-%d %H:%M:%S")
    user_id = fields.Integer()
    issue_reporter = fields.Nested("UsersSchema", exclude=("issue_and_reminder", ))
    postings = fields.Nested(
        "IssuesRemindersPostingsSchema", many=True, exclude=("issue_and_reminder", ))

    class Meta:
        """Saves table class structure as schema model"""
        model = IssuesAndReminders


class IssuesRemindersPostingsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Commons IssuesAndReminders class
    """
    event_id = fields.Integer()
    site_id = fields.Integer()
    event = fields.Nested(
        "MonitoringEventsSchema", exclude=("issues_reminders_posting", "event_alerts", "site", "narratives"))
    site = fields.Nested(
        "SitesSchema", exclude=("issues_reminders_posting", ))
    class Meta:
        """Saves table class structure as schema model"""
        model = IssuesRemindersPostings
