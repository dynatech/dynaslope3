"""
File containing class representation of
Monitoring tables
"""

import datetime
from flask_login import UserMixin
from marshmallow import fields
from connection import DB, MARSHMALLOW


class MonitoringEvents(UserMixin, DB.Model):
    """
    Class representation of monitoring_events table
    """

    __tablename__ = "monitoring_events"

    event_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "sites.site_id"), nullable=False)
    event_start = DB.Column(DB.DateTime, nullable=False,
                            default="0000-00-00 00:00:00")
    validity = DB.Column(DB.DateTime)
    status = DB.Column(DB.String(20), nullable=False)

    event_alerts = DB.relationship(
        "MonitoringEventAlerts", backref="event", lazy="dynamic")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Event ID: {self.event_id}"
                f" Site ID: {self.site_id} Validity: {self.validity}"
                f" Status: {self.status}")


class MonitoringEventAlerts(UserMixin, DB.Model):
    """
    Class representation of monitoring_event_alerts table
    """

    __tablename__ = "monitoring_event_alerts"

    event_alert_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    event_id = DB.Column(DB.Integer, DB.ForeignKey(
        "monitoring_events.event_id"), nullable=False)
    pub_sym_id = DB.Column(DB.Integer, nullable=False)
    ts_start = DB.Column(
        DB.DateTime, default=datetime.datetime.utcnow, nullable=False)
    ts_end = DB.Column(DB.DateTime, default=datetime.datetime.utcnow)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Event Alert ID: {self.release_id}"
                f" Event ID: {self.event_id} Public Symbol ID: {self.data_timestamp}"
                f" ts_start: {self.internal_alert_level} ts_end: {self.bulletin_number}")

# END OF CLASS DECLARATIONS


# START OF SCHEMAS DECLARATIONS

class MonitoringEventsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Events class
    """
    event_alerts = fields.Nested("MonitoringEventAlertsSchema",
                                 many=True, exclude=("event", ))
    site = fields.Nested("SitesSchema", exclude=[
        "events", "active", "psgc"])
    site_id = fields.Integer()

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringEvents


class MonitoringEventAlertsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Event Alerts class
    """
    event = fields.Nested(MonitoringEventsSchema,
                          exclude=("event_alerts", ))

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringEventAlerts
