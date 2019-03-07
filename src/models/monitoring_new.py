"""
File containing class representation of
Monitoring tables
"""

import datetime
from flask_login import UserMixin
from marshmallow import fields
from connection import DB, MARSHMALLOW
from src.models.users import Users, UsersSchema
from src.models.narratives import Narratives, NarrativesSchema


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
    pub_sym_id = DB.Column(DB.Integer, DB.ForeignKey(
        "public_alert_symbols.pub_sym_id"))
    ts_start = DB.Column(
        DB.DateTime, default=datetime.datetime.utcnow, nullable=False)
    ts_end = DB.Column(DB.DateTime, default=datetime.datetime.utcnow)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Event Alert ID: {self.release_id}"
                f" Event ID: {self.event_id} Public Symbol ID: {self.data_timestamp}"
                f" ts_start: {self.internal_alert_level} ts_end: {self.bulletin_number}")


class MonitoringReleases(UserMixin, DB.Model):
    """
    Class representation of monitoring_releases table
    """

    __tablename__ = "monitoring_releases"

    release_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    event_alert_id = DB.Column(DB.Integer, DB.ForeignKey(
        "monitoring_event_alerts.event_alert_id"), nullable=False)
    data_ts = DB.Column(
        DB.DateTime, default="0000-00-00 00:00:00", nullable=False)
    release_time = DB.Column(DB.DateTime, nullable=False)
    bulletin_number = DB.Column(DB.Integer, nullable=False)

    triggers = DB.relationship(
        "MonitoringTriggers", backref="release", lazy="dynamic")

    release_publisher = DB.relationship(
        "MonitoringReleasePublishers", backref=DB.backref("release", lazy="dynamic"))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Release ID: {self.release_id}"
                f" Event Alert ID: {self.event_alert_id} Data TS: {self.data_ts}"
                f" Release Time: {self.release_time} Bulletin No: {self.bulletin_number}")


class MonitoringTriggers(UserMixin, DB.Model):
    """
    Class representation of monitoring_triggers table
    """

    __tablename__ = "monitoring_triggers"

    trigger_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    release_id = DB.Column(DB.Integer, DB.ForeignKey("monitoring_releases.release_id"),
                           nullable=False)
    internal_sym_id = DB.Column(DB.Integer, DB.ForeignKey("internal_alert_symbols.internal_sym_id"),
                                nullable=False)
    ts = DB.Column(DB.DateTime, nullable=False)
    info = DB.Column(DB.String(360))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Trigger ID: {self.trigger_id}"
                f" Release ID: {self.release_id} Internal Symbol ID: {self.internal_sym_id}"
                f" TS: {self.ts} Info: {self.info}")


class MonitoringReleasePublishers(UserMixin, DB.Model):
    """
    Class representation of monitoring_release_publishers table
    """

    __tablename__ = "monitoring_release_publishers"

    publisher_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    release_id = DB.Column(DB.Integer, DB.ForeignKey(
        "monitoring_releases.release_id"), nullable=False)
    user_id = DB.Column(DB.Integer, DB.ForeignKey(
        "users.user_id"), nullable=False)

    user_details = DB.relationship(
        "Users", backref="publisher",
        primaryjoin="MonitoringReleasePublishers.user_id==Users.user_id",
        lazy="joined", innerjoin=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Publisher ID: {self.publisher_id}"
                f" Release ID: {self.release_id} User ID: {self.user_id}"
                f" User Details: {self.user_details}")


class MonitoringTriggersMisc(UserMixin, DB.Model):
    """
    Class representation of monitoring_release_publishers table
    """

    __tablename__ = "monitoring_triggers_misc"

    trig_misc_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    trigger_id = DB.Column(DB.Integer, DB.ForeignKey(
        "monitoring_triggers.trigger_id"), nullable=False)
    od_id = DB.Column(DB.Integer, DB.ForeignKey(
        "monitoring_on_demand.od_id"))
    eq_id = DB.Column(DB.Integer, DB.ForeignKey(
        "monitoring_earthquake.eq_id"))
    moms_id = DB.Column(DB.Integer, DB.ForeignKey(
        "monitoring_moms.moms_id"))

    trigger_parent = DB.relationship(
        "MonitoringTriggers", backref="trigger_misc", lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Trigger Misc ID: {self.trig_misc_id}"
                f" Trigger ID: {self.trigger_id} OD ID: {self.od_id}"
                f" EQ ID: {self.eq_id} MOMS ID: {self.moms_id}")


class MonitoringOnDemand(UserMixin, DB.Model):
    """
    Class representation of monitoring_on_demand table
    """

    __tablename__ = "monitoring_on_demand"

    od_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    request_ts = DB.Column(DB.DateTime, nullable=False)
    narrative_id = DB.Column(DB.Integer, DB.ForeignKey(
        "narratives.narrative_id"))

    trigger_misc = DB.relationship(
        "monitoring_triggers_misc", backref="on_demand", lazy=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Trigger Misc ID: {self.trig_misc_id}"
                f" Trigger ID: {self.trigger_id} OD ID: {self.od_id}"
                f" EQ ID: {self.eq_id} MOMS ID: {self.moms_id}")


class MonitoringEarthquake(UserMixin, DB.Model):
    """
    Class representation of monitoring_earthquake table
    """

    __tablename__ = "monitoring_earthquake"

    eq_id = DB.Column(DB.Integer, DB.ForeignKey(
        "monitoring_triggers.trigger_id"), nullable=False)
    magnitude = DB.Column(DB.Float(2, 1), nullable=False)
    latitude = DB.Column(DB.Float(9, 6), nullable=False)
    longitude = DB.Column(DB.Float(9, 6), nullable=False)

    trigger_misc = DB.relationship(
        "monitoring_triggers_misc", backref="eq", lazy=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> EQ ID: {self.eq_id}"
                f" Magnitude: {self.magnitude}")


class MonitoringMoms(UserMixin, DB.Model):
    """
    Class representation of monitoring_moms table
    """

    __tablename__ = "monitoring_moms"

    moms_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    feature_id = DB.Column(DB.Integer, DB.ForeignKey(
        "moms_features.feature_id"), nullable=False)
    observance_ts = DB.Column(DB.DateTime, nullable=False)
    reporter_id = DB.Column(DB.Integer, DB.ForeignKey(
        "comms_db.users.user_id"), nullable=False)
    remarks = DB.Column(DB.String(500), nullable=False)
    narrative_id = DB.Column(DB.Integer, DB.ForeignKey(
        "narratives.narrative_id"), nullable=False)
    validator_id = DB.Column(DB.Integer, DB.ForeignKey(
        "comms_db.users.user_id"), nullable=False)
    op_trigger = DB.Column(DB.Integer, nullable=False)

    trigger_misc = DB.relationship(
        "MonitoringTriggersMisc", backref="moms", lazy=True)
    narrative = DB.relationship(
        "Users", backref="narrative",
        primaryjoin="MonitoringMoms.narrative_id==Narratives.user_id",
        lazy="joined", innerjoin=True)
    reporter = DB.relationship(
        "Users", backref="reporter",
        primaryjoin="MonitoringMoms.reporter_id==Users.user_id",
        lazy="joined", innerjoin=True)
    validator = DB.relationship(
        "Users", backref="validator",
        primaryjoin="MonitoringMoms.validator_id==Users.user_id",
        lazy="joined", innerjoin=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> MOMS ID: {self.moms_id}"
                f" observance ts: {self.observance_ts} Remarks: {self.remarks}")


class MomsInstance(UserMixin, DB.Model):
    """
    Class representation of moms_instance table
    """

    __tablename__ = "moms_instance"

    instance_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "sites.site_id"), nullable=False)
    feature_id = DB.Column(DB.Integer, DB.ForeignKey(
        "moms_features.feature_id"), nullable=False)
    feature_name = DB.Column(DB.String(45))

    site = DB.relationship("Sites", backref=DB.backref(
        "moms_instance", lazy="dynamic"))
    feature = DB.relationship(
        "MomsFeatures", backref=DB.backref("moms_instance", lazy="dynamic"))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Instance ID: {self.instance_id}"
                f" Site ID: {self.site_id} Feature Name: {self.feature_name}")


class MomsFeatures(UserMixin, DB.Model):
    """
    Class representation of moms_features table
    """

    __tablename__ = "moms_features"

    feature_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    feature_type = DB.Column(DB.String(45), nullable=False)
    description = DB.Column(DB.String(200))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Feature ID: {self.feature_id}"
                f" Site ID: {self.site_id} Feature Type: {self.feature_type}")

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


class MonitoringReleasesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Releases class
    """
    event_alert = fields.Nested(MonitoringEventAlertsSchema,
                                exclude=("releases", ))

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringReleases


class MonitoringTriggersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Triggers class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringTriggers


class MonitoringReleasePublishersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Release Publishers class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringReleasePublishers


class MonitoringTriggersMiscSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of MonitoringTriggersMisc class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringTriggersMisc


class MonitoringOnDemandSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring On Demand class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringOnDemand


class MonitoringEarthquakeSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Earthquake class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringEarthquake


class MonitoringMomsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Moms class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringMoms


class MomsInstanceSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Moms Instance class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = MomsInstance


class MomsFeaturesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of MomsFeatures class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = MomsFeatures
