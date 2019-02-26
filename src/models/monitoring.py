"""
File containing class representation of
Monitoring tables
"""

import datetime
from flask_login import UserMixin
from connection import DB, MARSHMALLOW
from marshmallow import fields


class MonitoringEvents(UserMixin, DB.Model):
    """
    Class representation of public_alert_event table
    """

    __tablename__ = "public_alert_event"

    event_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "sites.site_id"), nullable=False)
    event_start = DB.Column(DB.DateTime, nullable=False,
                            default="0000-00-00 00:00:00")
    latest_release_id = DB.Column(DB.Integer)
    latest_trigger_id = DB.Column(DB.Integer)
    validity = DB.Column(DB.DateTime)
    status = DB.Column(DB.String(20), nullable=False)
    releases = DB.relationship(
        "MonitoringReleases", backref="event", lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Event ID: {self.event_id}"
                f" Site ID: {self.site_id} Validity: {self.validity}"
                f" Status: {self.status}")


class MonitoringReleases(UserMixin, DB.Model):
    """
    Class representation of public_alert_release table
    """

    __tablename__ = "public_alert_release"

    release_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    event_id = DB.Column(DB.Integer, DB.ForeignKey(
        "public_alert_event.event_id"), nullable=False)
    data_timestamp = DB.Column(
        DB.DateTime, nullable=False, default="0000-00-00 00:00:00")
    internal_alert_level = DB.Column(DB.String(10), nullable=False)
    release_time = DB.Column(DB.DateTime, nullable=False)
    comments = DB.Column(DB.String(200))
    bulletin_number = DB.Column(DB.Integer, nullable=False)
    reporter_id_mt = DB.Column(DB.Integer, nullable=False)
    reporter_id_ct = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Release ID: {self.release_id}"
                f" Event ID: {self.event_id} Data TS: {self.data_timestamp}"
                f" Int Alert Lvl: {self.internal_alert_level} Bulletin No: {self.bulletin_number}")


class MonitoringEventsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Events class
    """
    releases = fields.Nested("MonitoringReleasesSchema",
                             many=True, exclude=("event", ))
    site = fields.Nested("SitesSchema", exclude=("events", ))
    site_id = fields.Integer()

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringEvents


class MonitoringReleasesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Releases class
    """
    event = fields.Nested(MonitoringEventsSchema, exclude=("releases", "site"))
    event_id = fields.Integer()

    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringReleases


class MonitoringTriggers(UserMixin, DB.Model):
    """
    Class representation of public_alert_trigger table
    """

    __tablename__ = "public_alert_trigger"

    trigger_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    event_id = DB.Column(DB.Integer, nullable=False)
    release_id = DB.Column(DB.Integer, nullable=False)
    trigger_type = DB.Column(DB.String(3), nullable=False)
    timestamp = DB.Column(DB.DateTime, nullable=False,
                          default=datetime.datetime.utcnow)
    info = DB.Column(DB.String(360))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Trigger ID: {self.trigger_id}"
                f" Release ID: {self.release_id} Trigger Type: {self.trigger_type}"
                f" TS: {self.timestamp}")


class MonitoringBulletinTracker(UserMixin, DB.Model):
    """
    Class representation of bulletin_tracker table
    """

    __tablename__ = "bulletin_tracker"

    site_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    bulletin_number = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Site ID: {self.site_id}"
                f" TS: {self.bulletin_number}")


class MonitoringAlertStatus(UserMixin, DB.Model):
    """
    Class representation of alert_status table
    """

    __tablename__ = "alert_status"

    stat_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts_last_retrigger = DB.Column(DB.DateTime)
    trigger_id = DB.Column(DB.Integer)
    ts_set = DB.Column(DB.DateTime)
    ts_ack = DB.Column(DB.DateTime)
    alert_status = DB.Column(DB.Integer)
    remarks = DB.Column(DB.String(450))
    user_id = DB.Column(DB.Integer)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Stat ID: {self.stat_id}"
                f" Trigger ID: {self.trigger_id} Alert Status: {self.alert_status}")


class MonitoringOperationalTriggers(UserMixin, DB.Model):
    """
    Class representation of operational_triggers table
    """

    __tablename__ = "operational_triggers"

    trigger_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime)
    site_id = DB.Column(DB.Integer, nullable=False)
    trigger_sym_id = DB.Column(DB.Integer, nullable=False)
    ts_updated = DB.Column(DB.DateTime)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> OP Trigger ID: {self.trigger_id}"
                f" Site ID: {self.trigger_id}")


class MonitoringOperationalTriggersSymbols(UserMixin, DB.Model):
    """
    Class representation of operational_triggers table
    """

    __tablename__ = "operational_trigger_symbols"

    trigger_sym_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    alert_level = DB.Column(DB.Integer, nullable=False)
    alert_symbol = DB.Column(DB.String(2), nullable=False)
    alert_description = DB.Column(DB.String(100), nullable=False)
    source_id = DB.Column(DB.Integer)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Trigger Symbol ID: {self.trigger_sym_id}"
                f" Alert Symbol: {self.alert_symbol} Alert Desc: {self.alert_description}")


class MonitoringTriggerHierarchies(UserMixin, DB.Model):
    """
    Class representation of trigger_hierarchies table
    """

    __tablename__ = "trigger_hierarchies"

    source_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    trigger_source = DB.Column(DB.String(20))
    hierarchy_id = DB.Column(DB.Integer)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Source ID: {self.source_id}"
                f" Trig Source: {self.trigger_source} Hierarchy ID: {self.hierarchy_id}")


class MonitoringInternalAlertSymbols(UserMixin, DB.Model):
    """
    Class representation of internal_alert_symbols table
    """

    __tablename__ = "internal_alert_symbols"

    internal_sym_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    alert_symbol = DB.Column(DB.String(4), nullable=False)
    trigger_sym_id = DB.Column(DB.Integer, nullable=False)
    # alert_description = DB.Column(DB.String(120))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Internal Sym ID: {self.internal_sym_id}"
                # must change database column name to alert_description instead of 'alert description'
                # f" Alert Symbol: {self.alert_symbol} Alert Desc: {self.alert_description}")
                f" Alert Symbol: {self.alert_symbol}")


class MonitoringEndOfShiftAnalysis(UserMixin, DB.Model):
    """
    Class representation of end_of_shift_analysis table
    """

    __tablename__ = "end_of_shift_analysis"

    event_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    shift_start = DB.Column(DB.DateTime, nullable=False)
    analysis = DB.Column(DB.String(1500), nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Event ID: {self.event_id}"
                f" Shift Start: {self.shift_start} Analysis: {self.analysis}")


class MonitoringIssuesAndReminders(UserMixin, DB.Model):
    """
    Class representation of issues_and_reminders table
    """

    __tablename__ = "issues_and_reminders"

    iar_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    detail = DB.Column(DB.String(360), nullable=False)
    user_id = DB.Column(DB.Integer, nullable=False)
    ts_posted = DB.Column(DB.DateTime, nullable=False)
    event_id = DB.Column(DB.Integer)
    status = DB.Column(DB.String(10), nullable=False)
    resolved_by = DB.Column(DB.Integer)
    resolution = DB.Column(DB.String(360))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> IAR ID: {self.iar_id}"
                f" Detail: {self.detail} Analysis: {self.user_id}")


class MonitoringLUTAlerts(UserMixin, DB.Model):
    """
    Class representation of lut_alerts table
    """

    __tablename__ = "lut_alerts"

    internal_alert_level = DB.Column(
        DB.String(8), primary_key=True, nullable=False)
    internal_alert_desc = DB.Column(DB.String(128), nullable=False)
    public_alert_level = DB.Column(DB.String(8), nullable=False)
    public_alert_desc = DB.Column(DB.String(125), nullable=False)
    supp_info_ground = DB.Column(DB.String(512))
    supp_info_rain = DB.Column(DB.String(256))
    supp_info_eq = DB.Column(DB.String(150))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Int Alert Lvl: {self.internal_alert_level}"
                f" Int Alert Desc: {self.internal_alert_desc}"
                f" Pub Alert Lvl: {self.public_alert_level}"
                f" Pub Alert Desc: {self.public_alert_desc}")


class MonitoringLUTResponses(UserMixin, DB.Model):
    """
    Class representation of lut_responses table
    """

    __tablename__ = "lut_responses"

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


class MonitoringLUTTriggers(UserMixin, DB.Model):
    """
    Class representation of lut_triggers table
    """

    __tablename__ = "lut_triggers"

    trigger_type = DB.Column(DB.String(1), primary_key=True, nullable=False)
    detailed_desc = DB.Column(DB.String(100), nullable=False)
    cause = DB.Column(DB.String(50))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Trigger Type: {self.trigger_type}"
                f" Detailed Desc: {self.detailed_desc}")


class MonitoringManifestationFeatures(UserMixin, DB.Model):
    """
    Class representation of manifestation_features table
    """

    __tablename__ = "manifestation_features"

    feature_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, nullable=False)
    feature_type = DB.Column(DB.String(20), nullable=False)
    feature_name = DB.Column(DB.String(20))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Feature ID: {self.feature_id}"
                f" Site ID: {self.site_id} Feature Type: {self.feature_type}")


class MonitoringNarratives(UserMixin, DB.Model):
    """
    Class representation of narratives table
    """

    __tablename__ = "narratives"

    id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer)
    event_id = DB.Column(DB.Integer)
    timestamp = DB.Column(DB.DateTime)
    narrative = DB.Column(DB.String(1000))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> ID: {self.id}"
                f" site_id: {self.site_id} Narrative: {self.narrative}")


class MonitoringEQ(UserMixin, DB.Model):
    """
    Class representation of public_alert_eq table
    """

    __tablename__ = "public_alert_eq"

    id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    trigger_id = DB.Column(DB.Integer)
    magnitude = DB.Column(DB.Float(2, 1))
    latitude = DB.Column(DB.Float(9, 6))
    longitude = DB.Column(DB.Float(9, 6))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> ID: {self.id}"
                f" Magnitude: {self.magnitude} Trigger ID: {self.trigger_id}")


class MonitoringManifestation(UserMixin, DB.Model):
    """
    Class representation of public_alert_manifestation table
    """

    __tablename__ = "public_alert_manifestation"

    manifestation_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    release_id = DB.Column(DB.Integer)
    feature_id = DB.Column(DB.Integer, nullable=False)
    ts_observance = DB.Column(DB.DateTime, nullable=False)
    reporter = DB.Column(DB.String(50), nullable=False)
    remarks = DB.Column(DB.String(500))
    narrative = DB.Column(DB.String(500))
    validator = DB.Column(DB.Integer)
    op_trigger = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Manifestation ID: {self.manifestation_id}"
                f" ts_observance: {self.ts_observance} Remarks: {self.remarks}")


class MonitoringOnDemand(UserMixin, DB.Model):
    """
    Class representation of public_alert_on_demand table
    """

    __tablename__ = "public_alert_on_demand"

    id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    trigger_id = DB.Column(DB.Integer, nullable=False)
    ts = DB.Column(DB.DateTime)
    is_lgu = DB.Column(DB.Boolean)
    is_llmc = DB.Column(DB.Boolean)
    reason = DB.Column(DB.String(200), nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> ID: {self.id}"
                f" Reason: {self.reason} TS: {self.ts}")


class MonitoringSymbols(UserMixin, DB.Model):
    """
    Class representation of public_alert_symbols table
    """

    __tablename__ = "public_alert_symbols"

    pub_sym_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    alert_symbol = DB.Column(DB.String(5), nullable=False)
    alert_level = DB.Column(DB.Integer, nullable=False)
    alert_type = DB.Column(DB.String(7))
    # DB column 'recommended response' literally has a whitespace. Should change into underscore in the future
    # recommended response = DB.Column(DB.String(200))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Public Symbol ID: {self.pub_sym_id}"
                f" Alert Symbol: {self.alert_symbol} Alert Type: {self.alert_type}")

# END OF CLASS DECLARATIONS


# START OF SCHEMAS DECLARATIONS

class MonitoringEventsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Events class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringEvents


class MonitoringReleasesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Releases class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringReleases


class MonitoringTriggersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Trigger class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringTriggers


class MonitoringBulletinTrackerSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Bulletin Tracker class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringBulletinTracker


class MonitoringAlertStatusSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Alert Status class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringBulletinTracker


class MonitoringOperationalTriggersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Operational Triggers class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringOperationalTriggers


class MonitoringOperationalTriggersSymbolsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Operational Triggers Symbols class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringOperationalTriggersSymbols


class MonitoringTriggerHierarchiesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Trigger Hierarchies class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringTriggerHierarchies


class MonitoringInternalAlertSymbolsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Internal Alert Symbols class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringInternalAlertSymbols


class MonitoringEndOfShiftAnalysisSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring End of Shift Analysis class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringEndOfShiftAnalysis


class MonitoringIssuesAndRemindersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Issues And Reminders class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringIssuesAndReminders


class MonitoringLUTAlertsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Lookup Table Alerts class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringLUTAlerts


class MonitoringLUTResponsesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Lookup Table Responses class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringLUTResponses


class MonitoringLUTTriggersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Lookup Table Triggers class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringLUTTriggers


class MonitoringManifestationFeaturesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Manifestation Features class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringManifestationFeatures


class MonitoringNarrativesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Narrative class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringManifestationFeatures


class MonitoringEQSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring EQ class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringEQ


class MonitoringManifestationSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Manifestation class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringManifestation


class MonitoringOnDemandSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring On Demand class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringOnDemand


class MonitoringSymbolsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Monitoring Alert Symbols class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MonitoringSymbols

# END OF SCHEMAS DECLARATIONS
