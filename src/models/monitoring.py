"""
File containing class representation of
Monitoring tables
"""

import datetime
from flask_login import UserMixin
from marshmallow import fields
from connection import DB, MARSHMALLOW
from src.models.users import UsersSchema
from src.models.narratives import Narratives
from src.models.sites import Sites


class MonitoringEvents(UserMixin, DB.Model):
    """
    Class representation of monitoring_events table
    """

    __tablename__ = "monitoring_events"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    event_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.sites.site_id"), nullable=False)
    event_start = DB.Column(DB.DateTime, nullable=False,
                            default="0000-00-00 00:00:00")
    validity = DB.Column(DB.DateTime, default="0000-00-00 00:00:00")
    status = DB.Column(DB.String(20), nullable=False)

    event_alerts = DB.relationship(
        "MonitoringEventAlerts", backref=DB.backref("event", lazy="select"), lazy="dynamic")
    site = DB.relationship(
        "Sites", backref=DB.backref("monitoring_events", lazy="dynamic"), lazy="select")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Event ID: {self.event_id}"
                f" Site ID: {self.site_id} Validity: {self.validity}"
                f" Status: {self.status}")


class MonitoringEventAlerts(UserMixin, DB.Model):
    """
    Class representation of monitoring_event_alerts table
    """

    __tablename__ = "monitoring_event_alerts"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    event_alert_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    event_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.monitoring_events.event_id"), nullable=False)
    pub_sym_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.public_alert_symbols.pub_sym_id"))
    ts_start = DB.Column(
        DB.DateTime, default=datetime.datetime.utcnow, nullable=False)
    ts_end = DB.Column(DB.DateTime)

    public_alert_symbol = DB.relationship(
        "PublicAlertSymbols", backref=DB.backref("event_alerts", lazy="dynamic"), lazy="select")
    releases = DB.relationship(
        "MonitoringReleases", order_by="desc(MonitoringReleases.data_ts)", backref=DB.backref("event_alert", lazy="select"), lazy="dynamic")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Event Alert ID: {self.event_alert_id}"
                f" Event ID: {self.event_id} Public Symbol ID: {self.pub_sym_id}"
                f" ts_start: {self.ts_start} ts_end: {self.ts_end}")


class MonitoringReleases(UserMixin, DB.Model):
    """
    Class representation of monitoring_releases table
    """

    __tablename__ = "monitoring_releases"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    release_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    event_alert_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.monitoring_event_alerts.event_alert_id"), nullable=False)
    data_ts = DB.Column(
        DB.DateTime, default="0000-00-00 00:00:00", nullable=False)
    trigger_list = DB.Column(DB.String(45))
    release_time = DB.Column(DB.Time, nullable=False)
    bulletin_number = DB.Column(DB.Integer, nullable=False)

    triggers = DB.relationship(
        "MonitoringTriggers", backref="release", lazy="dynamic")

    # release_publishers = DB.relationship(
    #     "MonitoringReleasePublishers", backref=DB.backref("releases",
    #                                                       lazy="joined", innerjoin=True))
    release_publishers = DB.relationship(
        "MonitoringReleasePublishers", backref=DB.backref("release",
                                                          lazy="select"), lazy="dynamic")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Release ID: {self.release_id}"
                f" Event Alert ID: {self.event_alert_id} Data TS: {self.data_ts}"
                f" Release Time: {self.release_time} Bulletin No: {self.bulletin_number}")


class MonitoringReleasePublishers(UserMixin, DB.Model):
    """
    Class representation of monitoring_release_publishers table
    """

    __tablename__ = "monitoring_release_publishers"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    publisher_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    release_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.monitoring_releases.release_id"), nullable=False)
    user_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.users.user_id"), nullable=False)
    role = DB.Column(DB.String(45))

    user_details = DB.relationship(
        "Users", backref=DB.backref("publisher", lazy="select"), lazy="select")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Publisher ID: {self.publisher_id}"
                f" Release ID: {self.release_id} User ID: {self.user_id}"
                f" User Details: {self.user_details}")


class MonitoringTriggers(UserMixin, DB.Model):
    """
    Class representation of monitoring_triggers table
    """

    __tablename__ = "monitoring_triggers"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    trigger_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    release_id = DB.Column(DB.Integer, DB.ForeignKey("ewi_db.monitoring_releases.release_id"),
                           nullable=False)
    internal_sym_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.internal_alert_symbols.internal_sym_id"), nullable=False)
    ts = DB.Column(DB.DateTime, nullable=False)
    info = DB.Column(DB.String(360))

    internal_sym = DB.relationship(
        "InternalAlertSymbols", backref="trigger", lazy="select")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Trigger ID: {self.trigger_id}"
                f" Release ID: {self.release_id} Internal Symbol ID: {self.internal_sym_id}"
                f" TS: {self.ts} Info: {self.info}")


class MonitoringTriggersMisc(UserMixin, DB.Model):
    """
    Class representation of monitoring_release_publishers table
    """

    __tablename__ = "monitoring_triggers_misc"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    trig_misc_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    trigger_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.monitoring_triggers.trigger_id"), nullable=False)
    od_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.monitoring_on_demand.od_id"))
    eq_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.monitoring_earthquake.eq_id"))
    # Changed to has_moms to accommodate multiple moms
    has_moms = DB.Column(DB.Boolean)

    trigger_parent = DB.relationship(
        "MonitoringTriggers",
        backref=DB.backref(
            "trigger_misc", lazy="joined", uselist=False),
        lazy="subquery", uselist=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Trigger Misc ID: {self.trig_misc_id}"
                f" Trigger ID: {self.trigger_id} OD ID: {self.od_id}"
                f" EQ ID: {self.eq_id} Has Moms: {self.has_moms}")


class MonitoringOnDemand(UserMixin, DB.Model):
    """
    Class representation of monitoring_on_demand table
    """

    __tablename__ = "monitoring_on_demand"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    od_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    request_ts = DB.Column(DB.DateTime, nullable=False)
    narrative_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.narratives.id"))
    reporter_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.users.user_id"), nullable=False)

    reporter = DB.relationship(
        "Users", backref="od_reporter",
        primaryjoin="MonitoringOnDemand.reporter_id==Users.user_id",
        lazy="joined", innerjoin=True)
    trigger_misc = DB.relationship(
        "MonitoringTriggersMisc", backref="on_demand", lazy=True)
    narrative = DB.relationship(
        "Narratives", backref="on_demand_narrative",
        primaryjoin="MonitoringOnDemand.narrative_id==Narratives.id",
        lazy="joined", innerjoin=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> OD ID: {self.od_id}"
                f" Request TS: {self.request_ts} Reporter: {self.reporter}")


class MonitoringEarthquake(UserMixin, DB.Model):
    """
    Class representation of monitoring_earthquake table
    """

    __tablename__ = "monitoring_earthquake"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    eq_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    magnitude = DB.Column(DB.Float(2, 1), nullable=False)
    latitude = DB.Column(DB.Float(9, 6), nullable=False)
    longitude = DB.Column(DB.Float(9, 6), nullable=False)

    trigger_misc = DB.relationship(
        "MonitoringTriggersMisc", backref="eq",
        primaryjoin="MonitoringTriggersMisc.eq_id==MonitoringEarthquake.eq_id")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> EQ ID: {self.eq_id}"
                f" Magnitude: {self.magnitude}")


class MonitoringMomsReleases(UserMixin, DB.Model):
    """
    Class representation of monitoring_moms_releases
    """

    __tablename__ = "monitoring_moms_releases"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    moms_rel_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    trig_misc_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.monitoring_triggers_misc.trig_misc_id"), nullable=False)
    moms_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.monitoring_moms.moms_id"), nullable=False)

    trigger_misc = DB.relationship(
        "MonitoringTriggersMisc", backref=DB.backref("moms_releases", lazy="dynamic"), lazy="select")

    moms_details = DB.relationship(
        "MonitoringMoms", backref=DB.backref("moms_releases", lazy="select"), lazy="select")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Moms Release ID: {self.moms_rel_id}"
                f"Trigger Misc ID: {self.trig_misc_id} MOMS ID: {self.moms_id}")


class MonitoringMoms(UserMixin, DB.Model):
    """
    Class representation of monitoring_moms table
    """

    __tablename__ = "monitoring_moms"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    moms_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    instance_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.moms_instances.instance_id"), nullable=False)
    observance_ts = DB.Column(DB.DateTime, nullable=False)
    reporter_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.users.user_id"), nullable=False)
    remarks = DB.Column(DB.String(500), nullable=False)
    narrative_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.narratives.id"), nullable=False)
    validator_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.users.user_id"), nullable=False)
    op_trigger = DB.Column(DB.Integer, nullable=False)

    narrative = DB.relationship(
        "Narratives", backref="moms_narrative",
        primaryjoin="MonitoringMoms.narrative_id==Narratives.id",
        lazy="joined", innerjoin=True)
    reporter = DB.relationship(
        "Users", backref="moms_reporter",
        primaryjoin="MonitoringMoms.reporter_id==Users.user_id",
        lazy="joined", innerjoin=True)
    validator = DB.relationship(
        "Users", backref="moms_validator",
        primaryjoin="MonitoringMoms.validator_id==Users.user_id",
        lazy="joined", innerjoin=True)

    # Louie - New Relationship
    moms_instance = DB.relationship(
        "MomsInstances", backref=DB.backref("moms", lazy="dynamic", order_by="desc(MonitoringMoms.observance_ts)"), lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> MOMS ID: {self.moms_id}"
                f" observance ts: {self.observance_ts} Remarks: {self.remarks}")


class MomsInstances(UserMixin, DB.Model):
    """
    Class representation of moms_instances table
    """

    __tablename__ = "moms_instances"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    instance_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.sites.site_id"), nullable=False)
    feature_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.moms_features.feature_id"), nullable=False)
    feature_name = DB.Column(DB.String(45))

    site = DB.relationship("Sites", backref=DB.backref(
        "moms_instance", lazy="subquery"))
    feature = DB.relationship(
        "MomsFeatures", backref=DB.backref("instances", lazy="dynamic"), lazy="select")

    # site = DB.relationship("Sites", backref="moms_instance", lazy=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Instance ID: {self.instance_id}"
                f" Site ID: {self.site_id} Feature Name: {self.feature_name}")


class MomsFeatures(UserMixin, DB.Model):
    """
    Class representation of moms_features table
    """

    __tablename__ = "moms_features"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    feature_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    feature_type = DB.Column(DB.String(45), nullable=False)
    description = DB.Column(DB.String(200))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Feature ID: {self.feature_id}"
                f" Description: {self.description} Feature Type: {self.feature_type}")


class BulletinTracker(UserMixin, DB.Model):
    """
    Class representation of bulletin_tracker table
    """

    __tablename__ = "bulletin_tracker"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    site_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    bulletin_number = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Site ID: {self.site_id}"
                f" TS: {self.bulletin_number}")


class PublicAlertSymbols(UserMixin, DB.Model):
    """
    Class representation of public_alert_symbols table
    """

    __tablename__ = "public_alert_symbols"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    pub_sym_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    alert_symbol = DB.Column(DB.String(5), nullable=False)
    alert_level = DB.Column(DB.Integer, nullable=False)
    alert_type = DB.Column(DB.String(7))
    recommended_response = DB.Column(DB.String(200))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Public Symbol ID: {self.pub_sym_id}"
                f" Alert Symbol: {self.alert_symbol} Alert Type: {self.alert_type}"
                f"Recommended Response: {self.recommended_response}")


class OperationalTriggers(UserMixin, DB.Model):
    """
    Class representation of operational_triggers
    """

    __tablename__ = "operational_triggers"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    trigger_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.sites.site_id"), nullable=False)
    trigger_sym_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.operational_trigger_symbols.trigger_sym_id"), nullable=False)
    ts_updated = DB.Column(DB.DateTime, nullable=False)

    site = DB.relationship(
        "Sites", backref=DB.backref("operational_triggers", lazy="dynamic"), lazy="select")

    trigger_symbol = DB.relationship(
        "OperationalTriggerSymbols", backref="operational_trigger", lazy="joined", innerjoin=True)#lazy="select")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Trigger_ID: {self.trigger_id}"
                f" Site_ID: {self.site_id} trigger_sym_id: {self.trigger_sym_id}"
                f" ts: {self.ts} ts_updated: {self.ts_updated}"
                f" | TRIGGER SYMBOL alert_level: {self.trigger_symbol.alert_level} source_id: {self.trigger_symbol.source_id}")


class OperationalTriggerSymbols(UserMixin, DB.Model):
    """
    Class representation of operational_triggers table
    """

    __tablename__ = "operational_trigger_symbols"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    trigger_sym_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    alert_level = DB.Column(DB.Integer, nullable=False)
    alert_symbol = DB.Column(DB.String(2), nullable=False)
    alert_description = DB.Column(DB.String(100), nullable=False)
    source_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.trigger_hierarchies.source_id"), nullable=False)

    trigger_hierarchy = DB.relationship(
        "TriggerHierarchies", backref="trigger_symbol", lazy="joined", innerjoin=True) # lazy="select")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Trigger Symbol ID: {self.trigger_sym_id}"
                f" Alert Level: {self.alert_level} Alert Symbol: {self.alert_symbol}"
                f" Alert Desc: {self.alert_description} Source ID: {self.source_id}"
                f" | Trigger_Hierarchy {self.trigger_hierarchy}")


class TriggerHierarchies(UserMixin, DB.Model):
    """
    Class representation of trigger_hierarchies table
    """

    __tablename__ = "trigger_hierarchies"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    source_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    trigger_source = DB.Column(DB.String(20))
    hierarchy_id = DB.Column(DB.Integer)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Source ID: {self.source_id}"
                f" Trig Source: {self.trigger_source} Hierarchy ID: {self.hierarchy_id}")


class InternalAlertSymbols(UserMixin, DB.Model):
    """
    Class representation of internal_alert_symbols table
    """

    __tablename__ = "internal_alert_symbols"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    internal_sym_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    alert_symbol = DB.Column(DB.String(4), nullable=False)
    trigger_sym_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.operational_trigger_symbols.trigger_sym_id"), nullable=False)
    alert_description = DB.Column(DB.String(120))

    trigger_symbol = DB.relationship(
        "OperationalTriggerSymbols", lazy="select", uselist=False,
        backref=DB.backref("internal_alert_symbol", lazy="joined", innerjoin=True, uselist=False))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Internal Sym ID: {self.internal_sym_id}"
                f" Alert Symbol: {self.alert_symbol} Trigger Sym ID: {self.trigger_sym_id}"
                f" Alert Description: {self.alert_description} "
                f" OP Trigger Symbols: {self.trigger_symbol}")


class IssuesAndReminders(UserMixin, DB.Model):
    """
    Class representation of issues_and_reminders table
    """

    __tablename__ = "issues_and_reminders"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    iar_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    detail = DB.Column(DB.String(360), nullable=False)
    user_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.users.user_id"), nullable=False)
    ts_posted = DB.Column(DB.DateTime, nullable=False)
    event_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.monitoring_events.event_id"), nullable=False)
    status = DB.Column(DB.String(10), nullable=False)
    resolved_by = DB.Column(DB.Integer)
    resolution = DB.Column(DB.String(360))

    # Louie - Relationship
    issue_reporter = DB.relationship(
        "Users", backref="issue_and_reminder_reporter",
        primaryjoin="IssuesAndReminders.user_id==Users.user_id",
        lazy="joined", innerjoin=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> IAR ID: {self.iar_id}"
                f" Detail: {self.detail} Analysis: {self.user_id}")


class LUTResponses(UserMixin, DB.Model):
    """
    Class representation of lut_responses table
    """

    __tablename__ = "lut_responses"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    public_alert_level = DB.Column(
        DB.String(8), primary_key=True, nullable=False)
    recommended_response = DB.Column(DB.String(200))
    response_llmc_lgu = DB.Column(DB.String(200), nullable=False)
    response_community = DB.Column(DB.String(200), nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Pub Alert Lvl: {self.public_alert_level}"
                f" Recommended Response: {self.recommended_response}"
                f" Response LLMC: {self.response_llmc_lgu}"
                f" Response Comm: {self.response_community}")


class LUTTriggers(UserMixin, DB.Model):
    """
    Class representation of lut_triggers table
    """

    __tablename__ = "lut_triggers"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    trigger_type = DB.Column(DB.String(1), primary_key=True, nullable=False)
    detailed_desc = DB.Column(DB.String(100), nullable=False)
    cause = DB.Column(DB.String(50))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Trigger Type: {self.trigger_type}"
                f" Detailed Desc: {self.detailed_desc}")


class EndOfShiftAnalysis(UserMixin, DB.Model):
    """
    Class representation of end_of_shift_analysis table
    """

    __tablename__ = "end_of_shift_analysis"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    event_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.monitoring_events.event_id"), nullable=False)
    shift_start = DB.Column(DB.DateTime, primary_key=True, nullable=False)
    analysis = DB.Column(DB.String(1500))

    event = DB.relationship(
        "MonitoringEvents", backref="eos_analysis", lazy="joined")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Event ID: {self.event_id}"
                f"Shift Start: {self.shift_start} Analysis: {self.analysis}")


class PublicAlerts(UserMixin, DB.Model):
    """
    Class representation of public_alerts
    """

    __tablename__ = "public_alerts"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    public_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.sites.site_id"), nullable=False)
    pub_sym_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.public_alert_symbols.pub_sym_id"), nullable=False)
    ts_updated = DB.Column(DB.DateTime, nullable=False)

    site = DB.relationship(
        "Sites", backref=DB.backref("public_alerts", lazy="dynamic"),
        lazy="select")
        # primaryjoin="PublicAlerts.site_id==Sites.site_id", lazy="joined", innerjoin=True)

    alert_symbol = DB.relationship(
        "PublicAlertSymbols", backref="public_alerts", lazy="select")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Public_ID: {self.public_id}"
                f" Site_ID: {self.site_id} pub_sym_id: {self.pub_sym_id}"
                f" TS: {self.ts} TS_UPDATED: {self.ts_updated}")

# END OF CLASS DECLARATIONS


#################################
# START OF SCHEMAS DECLARATIONS #
#################################
class MonitoringEventsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Events class
    """
    event_alerts = fields.Nested("MonitoringEventAlertsSchema",
                                 many=True, exclude=("event", ))
    validity = fields.DateTime("%Y-%m-%d %H:%M:%S")
    event_start = fields.DateTime("%Y-%m-%d %H:%M:%S")
    site = fields.Nested("SitesSchema", exclude=(
        "events", "active", "psgc"))
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
    ts_start = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_end = fields.DateTime("%Y-%m-%d %H:%M:%S")
    public_alert_symbol = fields.Nested(
        "PublicAlertSymbolsSchema", exclude=("event_alerts", "public_alerts"))
    releases = fields.Nested("MonitoringReleasesSchema",
                             many=True, exclude=("event_alert", ))

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringEventAlerts


class MonitoringReleasesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Releases class
    """
    event = fields.Nested(MonitoringEventsSchema,
                          exclude=("releases", "triggers"))
    data_ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
    triggers = fields.Nested("MonitoringTriggersSchema",
                             many=True, exclude=("release", "event"))
    release_publishers = fields.Nested(
        "MonitoringReleasePublishersSchema", many=True, exclude=("releases",))

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringReleases


class MonitoringTriggersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Triggers class
    """
    release_id = fields.Integer()
    release = fields.Nested(MonitoringReleasesSchema,
                            exclude=("triggers", ))
    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
    internal_sym = fields.Nested(
        "InternalAlertSymbolsSchema", only=("alert_symbol",))
    trigger_misc = fields.Nested(
        "MonitoringTriggersMiscSchema", exclude=("trigger_parent",))

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringTriggers


class MonitoringReleasePublishersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Release Publishers class
    """

    user_details = fields.Nested(UsersSchema, exclude=("pu"))

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringReleasePublishers


class MonitoringTriggersMiscSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of MonitoringTriggersMisc class
    """

    on_demand = fields.Nested(
        "MonitoringOnDemandSchema", exclude=("trigger_misc", "od_id"))
    od_id = fields.Integer()
    eq = fields.Nested("MonitoringEarthquakeSchema", exclude=("trigger_misc",))
    eq_id = fields.Integer()
    moms_releases = fields.Nested("MonitoringMomsReleasesSchema", many=True)

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringTriggersMisc


class MonitoringOnDemandSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring On Demand class
    """

    reporter = fields.Nested("UsersSchema",)
    narrative = fields.Nested("NarrativesSchema")

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringOnDemand


class MonitoringEarthquakeSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Earthquake class
    """
    magnitude = fields.Float(as_string=True)
    latitude = fields.Float(as_string=True)
    longitude = fields.Float(as_string=True)

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringEarthquake


class MonitoringMomsReleasesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of MonitoringMomsReleases class
    """
    moms_id = fields.Integer()
    moms_details = fields.Nested(
        "MonitoringMomsSchema", exclude=("moms_release", ))
    

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringMomsReleases


class MonitoringMomsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Moms class
    """
    narrative = fields.Nested(
        "NarrativesSchema", exclude=("site_id", "event_id"))
    reporter = fields.Nested("UsersSchema", only=(
        "salutation", "first_name", "last_name"))
    validator = fields.Nested("UsersSchema", only=("first_name", "last_name"))
    moms_instance = fields.Nested("MomsInstancesSchema", exclude=("moms", ))

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringMoms


class MomsInstancesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Moms Instance class
    """
    moms = fields.Nested("MonitoringMomsSchema", many=True, exclude=("moms_instance", ))
    feature = fields.Nested("MomsFeaturesSchema", exclude=("instances", ))

    class Meta:
        """Saves table class structure as schema model"""
        model = MomsInstances


class MomsFeaturesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of MomsFeatures class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = MomsFeatures


class BulletinTrackerSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of BulletinTracker class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = BulletinTracker


class PublicAlertSymbolsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Alert Symbols class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = PublicAlertSymbols


class OperationalTriggerSymbolsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of OperationalTriggerSymbols class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = OperationalTriggerSymbols


class TriggerHierarchiesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Trigger Hierarchies class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = TriggerHierarchies


class InternalAlertSymbolsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Internal Alert Symbols class
    """
    
    class Meta:
        """Saves table class structure as schema model"""
        model = InternalAlertSymbols


class IssuesAndRemindersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Issues And Reminders class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = IssuesAndReminders


class LUTResponsesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Lookup Table Responses class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = LUTResponses


class LUTTriggersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Lookup Table Triggers class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = LUTTriggers


class EndOfShiftAnalysisSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of EndOfShiftAnalysis class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = EndOfShiftAnalysis
