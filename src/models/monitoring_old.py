"""
File containing class representation of
Monitoring tables
"""

import datetime
from flask_login import UserMixin
from marshmallow import fields
from connection import DB, MARSHMALLOW
# from src.models.users import OldUsersSchema
from src.models.sites import Sites  # Loader lang


class OldUsers(DB.Model):
    """
    Class representation of users table
    """
    __tablename__ = "users"
    __bind_key__ = "comms_db"
    __table_args__ = {"schema": "comms_db"}

    user_id = DB.Column(DB.Integer, primary_key=True)
    salutation = DB.Column(DB.String(15))
    firstname = DB.Column(DB.String(45))
    middlename = DB.Column(DB.String(45))
    lastname = DB.Column(DB.String(45))
    nickname = DB.Column(DB.String(45))
    sex = DB.Column(DB.String(1))
    status = DB.Column(DB.Integer, nullable=True)
    birthday = DB.Column(DB.Integer, nullable=True)

    def __repr__(self):
        return f"Type <{self.first_name}>"


class OldMonitoringEvents(UserMixin, DB.Model):
    """
    Class representation of public_alert_event table
    """

    __tablename__ = "public_alert_event"

    event_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.sites.site_id"), nullable=False)
    event_start = DB.Column(DB.DateTime, nullable=False,
                            default="0000-00-00 00:00:00")
    validity = DB.Column(DB.DateTime)
    status = DB.Column(DB.String(20), nullable=False)
    releases = DB.relationship(
        "OldMonitoringReleases", backref="event", lazy="dynamic")
    site = DB.relationship(
        "Sites", backref=DB.backref("events", lazy="dynamic"))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Event ID: {self.event_id}"
                f" Site ID: {self.site_id} Validity: {self.validity}"
                f" Status: {self.status}")


class OldMonitoringReleases(UserMixin, DB.Model):
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
    reporter_id_mt = DB.Column(DB.Integer, DB.ForeignKey(
        "comms_db.users.user_id"), nullable=False)
    reporter_id_ct = DB.Column(DB.Integer, DB.ForeignKey(
        "comms_db.users.user_id"), nullable=False)

    triggers = DB.relationship(
        "OldMonitoringTriggers", backref="release", lazy="subquery")

    reporter_mt = DB.relationship(
        "OldUsers", backref="reporter_mts", primaryjoin="OldMonitoringReleases.reporter_id_mt==OldUsers.user_id", lazy="joined")
    reporter_ct = DB.relationship(
        "OldUsers", backref="reporter_cts", primaryjoin="OldMonitoringReleases.reporter_id_ct==OldUsers.user_id", lazy="joined")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Release ID: {self.release_id}"
                f" Event ID: {self.event_id} Data TS: {self.data_timestamp}"
                f" Int Alert Lvl: {self.internal_alert_level} Bulletin No: {self.bulletin_number}"
                f" Release: {self.internal_alert_level} ")


class OldMonitoringTriggers(UserMixin, DB.Model):
    """
    Class representation of public_alert_trigger table
    """

    __tablename__ = "public_alert_trigger"

    trigger_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    event_id = DB.Column(DB.Integer, DB.ForeignKey(
        "public_alert_event.event_id"), nullable=False)
    release_id = DB.Column(DB.Integer, DB.ForeignKey("public_alert_release.release_id"),
                           nullable=False)
    trigger_type = DB.Column(DB.String(3), nullable=False)
    timestamp = DB.Column(DB.DateTime, nullable=False,
                          default=datetime.datetime.now)
    info = DB.Column(DB.String(360))

    # event = DB.relationship(
    #     "OldMonitoringEvents", backref=DB.backref("triggers", lazy="dynamic"))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Trigger ID: {self.trigger_id}"
                f" Release ID: {self.release_id} Trigger Type: {self.trigger_type}"
                f" TS: {self.timestamp}")


class OldMonitoringManifestation(UserMixin, DB.Model):
    """
    Class representation of public_alert_manifestation table
    """

    __tablename__ = "public_alert_manifestation"

    manifestation_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    release_id = DB.Column(DB.Integer, DB.ForeignKey(
        "public_alert_release.release_id"))
    feature_id = DB.Column(DB.Integer, DB.ForeignKey(
        "manifestation_features.feature_id"), nullable=False)
    ts_observance = DB.Column(DB.DateTime, nullable=False)
    reporter = DB.Column(DB.String(50), nullable=False)
    remarks = DB.Column(DB.String(500))
    narrative = DB.Column(DB.String(500))
    validator = DB.Column(
        DB.Integer, DB.ForeignKey("comms_db.users.user_id"))
    op_trigger = DB.Column(DB.Integer, nullable=False)

    release = DB.relationship(
        "OldMonitoringReleases", backref=DB.backref("manifestation_details", lazy=True))

    # manifestation_feature = DB.relationship("OldMonitoringManifestationFeatures", backref="manifestation", lazy=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Manifestation ID: {self.manifestation_id}"
                f" ts_observance: {self.ts_observance} Remarks: {self.remarks}"
                f" release: {self.release}")


class OldMonitoringManifestationFeatures(UserMixin, DB.Model):
    """
    Class representation of manifestation_features table
    """

    __tablename__ = "manifestation_features"

    feature_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "comms_db.sites.site_id"), nullable=False)
    feature_type = DB.Column(DB.String(20), nullable=False)
    feature_name = DB.Column(DB.String(20))

    # site = DB.relationship("Sites", backref=DB.backref("manifestation_features", lazy="dynamic"))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Feature ID: {self.feature_id}"
                f" Site ID: {self.site_id} Feature Type: {self.feature_type}")


class OldMonitoringOnDemand(UserMixin, DB.Model):
    """
    Class representation of public_alert_on_demand table
    """

    __tablename__ = "public_alert_on_demand"

    id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    trigger_id = DB.Column(DB.Integer, DB.ForeignKey(
        "public_alert_trigger.trigger_id"), nullable=False)
    ts = DB.Column(DB.DateTime, nullable=False)
    is_lgu = DB.Column(DB.Boolean)
    is_llmc = DB.Column(DB.Boolean)
    reason = DB.Column(DB.String(200), nullable=False)

    trigger = DB.relationship(OldMonitoringTriggers, backref=DB.backref(
        "on_demand_details", lazy="subquery", uselist=False))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> ID: {self.id}"
                f" Reason: {self.reason} TS: {self.ts}")


class OldMonitoringEQ(UserMixin, DB.Model):
    """
    Class representation of public_alert_eq table
    """

    __tablename__ = "public_alert_eq"

    id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    trigger_id = DB.Column(DB.Integer, DB.ForeignKey(
        "public_alert_trigger.trigger_id"))
    magnitude = DB.Column(DB.Float(2, 1))
    latitude = DB.Column(DB.Float(9, 6))
    longitude = DB.Column(DB.Float(9, 6))

    trigger = DB.relationship(OldMonitoringTriggers, backref=DB.backref(
        "eq_details", lazy="subquery", uselist=False))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> ID: {self.id}"
                f" Magnitude: {self.magnitude} Trigger ID: {self.trigger_id}")


class OldNarratives(DB.Model):
    """
    Class representation of narratives table
    """
    __tablename__ = "narratives"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": "senslopedb"}

    id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, nullable=False)
    event_id = DB.Column(DB.Integer)
    timestamp = DB.Column(
        DB.DateTime, default=datetime.datetime.now, nullable=False)
    narrative = DB.Column(DB.String(500), nullable=False)

    def __repr__(self):
        return f"{self.site_id, self.event_id, self.timestamp, self.narrative}\n"


# Moved
# class MonitoringBulletinTracker(UserMixin, DB.Model):
#     """
#     Class representation of bulletin_tracker table
#     """

#     __tablename__ = "bulletin_tracker"

#     site_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
#     bulletin_number = DB.Column(DB.Integer, nullable=False)

#     def __repr__(self):
#         return (f"Type <{self.__class__.__name__}> Site ID: {self.site_id}"
#                 f" TS: {self.bulletin_number}")


# Do we use this? - Louie


# Moved
# class MonitoringTriggerHierarchies(UserMixin, DB.Model):
#     """
#     Class representation of trigger_hierarchies table
#     """

#     __tablename__ = "trigger_hierarchies"

#     source_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
#     trigger_source = DB.Column(DB.String(20))
#     hierarchy_id = DB.Column(DB.Integer)

#     def __repr__(self):
#         return (f"Type <{self.__class__.__name__}> Source ID: {self.source_id}"
#                 f" Trig Source: {self.trigger_source} Hierarchy ID: {self.hierarchy_id}")


# Moved
# class MonitoringInternalAlertSymbols(UserMixin, DB.Model):
#     """
#     Class representation of internal_alert_symbols table
#     """

#     __tablename__ = "internal_alert_symbols"

#     internal_sym_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
#     alert_symbol = DB.Column(DB.String(4), nullable=False)
#     trigger_sym_id = DB.Column(DB.Integer, nullable=False)
#     # alert_description = DB.Column(DB.String(120))

#     def __repr__(self):
#         return (f"Type <{self.__class__.__name__}> Internal Sym ID: {self.internal_sym_id}"
#                 # must change db column name to alert_description instead of 'alert description'
#                 # f" Alert Symbol: {self.alert_symbol} Alert Desc: {self.alert_description}")
#                 f" Alert Symbol: {self.alert_symbol}")


# Moved
# class MonitoringIssuesAndReminders(UserMixin, DB.Model):
#     """
#     Class representation of issues_and_reminders table
#     """

#     __tablename__ = "issues_and_reminders"

#     iar_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
#     detail = DB.Column(DB.String(360), nullable=False)
#     user_id = DB.Column(DB.Integer, nullable=False)
#     ts_posted = DB.Column(DB.DateTime, nullable=False)
#     event_id = DB.Column(DB.Integer)
#     status = DB.Column(DB.String(10), nullable=False)
#     resolved_by = DB.Column(DB.Integer)
#     resolution = DB.Column(DB.String(360))

#     def __repr__(self):
#         return (f"Type <{self.__class__.__name__}> IAR ID: {self.iar_id}"
#                 f" Detail: {self.detail} Analysis: {self.user_id}")


# Moved
# class LUTResponses(UserMixin, DB.Model):
#     """
#     Class representation of lut_responses table
#     """

#     __tablename__ = "lut_responses"

#     public_alert_level = DB.Column(
#         DB.String(8), primary_key=True, nullable=False)
#     recommended_response = DB.Column(DB.String(200))
#     response_llmc_lgu = DB.Column(DB.String(200), nullable=False)
#     response_community = DB.Column(DB.String(200), nullable=False)

#     def __repr__(self):
#         return (f"Type <{self.__class__.__name__}> Pub Alert Lvl: {self.public_alert_level}"
#                 f" Recommended Response: {self.recommended_response}"
#                 f" Response LLMC: {self.response_llmc_lgu}"
#                 f" Response Comm: {self.response_community}")


# Moved
# class LUTTriggers(UserMixin, DB.Model):
#     """
#     Class representation of lut_triggers table
#     """

#     __tablename__ = "lut_triggers"

#     trigger_type = DB.Column(DB.String(1), primary_key=True, nullable=False)
#     detailed_desc = DB.Column(DB.String(100), nullable=False)
#     cause = DB.Column(DB.String(50))

#     def __repr__(self):
#         return (f"Type <{self.__class__.__name__}> Trigger Type: {self.trigger_type}"
#                 f" Detailed Desc: {self.detailed_desc}")


# Renamed in new file as PublicAlertSymbols
# class MonitoringAlertSymbols(UserMixin, DB.Model):
#     """
#     Class representation of public_alert_symbols table
#     """

#     __tablename__ = "public_alert_symbols"

#     pub_sym_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
#     alert_symbol = DB.Column(DB.String(5), nullable=False)
#     alert_level = DB.Column(DB.Integer, nullable=False)
#     alert_type = DB.Column(DB.String(7))
#     # DB column 'recommended response' literally has a whitespace.
#     # Should change into underscore in the future
#     # recommended response = DB.Column(DB.String(200))

#     def __repr__(self):
#         return (f"Type <{self.__class__.__name__}> Public Symbol ID: {self.pub_sym_id}"
#                 f" Alert Symbol: {self.alert_symbol} Alert Type: {self.alert_type}")

# END OF CLASS DECLARATIONS


# START OF SCHEMAS DECLARATIONS

# class OldMonitoringEventsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
#     """
#     Schema representation of Monitoring Events class
#     """
#     releases = MARSHMALLOW.Nested("OldMonitoringReleasesSchema",
#                              many=True, exclude=("event", ))
#     site = MARSHMALLOW.Nested("SitesSchema", exclude=[
#         "events", "active", "psgc"])
#     site_id = fields.Integer()

#     class Meta:
#         """Saves table class structure as schema model"""
#         model = OldMonitoringEvents


# class OldMonitoringReleasesSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
#     """
#     Schema representation of Monitoring Releases class
#     """
#     event = MARSHMALLOW.Nested(OldMonitoringEventsSchema,
#                           exclude=("releases", "triggers"))

#     manifestation_details = MARSHMALLOW.Nested(
#         "OldMonitoringManifestationSchema", many=True)

#     triggers = MARSHMALLOW.Nested("OldMonitoringTriggersSchema",
#                              many=True, exclude=("release", "event"))

#     reporter_mt = MARSHMALLOW.Nested(
#         OldUsersSchema, only=["user_id", "first_name", "last_name"])
#     reporter_ct = MARSHMALLOW.Nested(
#         OldUsersSchema, only=["user_id", "first_name", "last_name"])

#     class Meta:
#         """Saves table class structure as schema model"""
#         model = OldMonitoringReleases


# class OldMonitoringTriggersSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
#     """
#     Schema representation of Monitoring Trigger class
#     """
#     release_id = fields.Integer()
#     release = MARSHMALLOW.Nested(OldMonitoringReleasesSchema,
#                             exclude=("triggers", ))
#     on_demand_details = MARSHMALLOW.Nested("OldMonitoringOnDemandSchema")
#     eq_details = MARSHMALLOW.Nested("OldMonitoringEQSchema")

#     class Meta:
#         """Saves table class structure as schema model"""
#         model = OldMonitoringTriggers


# Moved
# class MonitoringBulletinTrackerSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
#     """
#     Schema representation of Monitoring Bulletin Tracker class
#     """
#     class Meta:
#         """Saves table class structure as schema model"""
#         model = MonitoringBulletinTracker


# Moved and removed MOnitoring word
# class MonitoringOperationalTriggersSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
#     """
#     Schema representation of Monitoring Operational Triggers class
#     """
#     class Meta:
#         """Saves table class structure as schema model"""
#         model = MonitoringOperationalTriggers


# # Moved and removed MOnitoring word
# class MonitoringOperationalTriggersSymbolsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
#     """
#     Schema representation of Monitoring Operational Triggers Symbols class
#     """
#     class Meta:
#         """Saves table class structure as schema model"""
#         model = MonitoringOperationalTriggersSymbols


# Moved
# class MonitoringTriggerHierarchiesSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
#     """
#     Schema representation of Monitoring Trigger Hierarchies class
#     """
#     class Meta:
#         """Saves table class structure as schema model"""
#         model = MonitoringTriggerHierarchies


# moved
# class MonitoringInternalAlertSymbolsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
#     """
#     Schema representation of Monitoring Internal Alert Symbols class
#     """
#     class Meta:
#         """Saves table class structure as schema model"""
#         model = MonitoringInternalAlertSymbols


# class MonitoringEndOfShiftAnalysisSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
#     """
#     Schema representation of Monitoring End of Shift Analysis class
#     """
#     class Meta:
#         """Saves table class structure as schema model"""
#         model = MonitoringEndOfShiftAnalysis


# Moved
# class MonitoringIssuesAndRemindersSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
#     """
#     Schema representation of Monitoring Issues And Reminders class
#     """
#     class Meta:
#         """Saves table class structure as schema model"""
#         model = MonitoringIssuesAndReminders


# Moved
# class LUTResponsesSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
#     """
#     Schema representation of Monitoring Lookup Table Responses class
#     """
#     class Meta:
#         """Saves table class structure as schema model"""
#         model = LUTResponses


# Moved
# class LUTTriggersSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
#     """
#     Schema representation of Monitoring Lookup Table Triggers class
#     """
#     class Meta:
#         """Saves table class structure as schema model"""
#         model = LUTTriggers


class OldMonitoringManifestationFeaturesSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Monitoring Manifestation Features class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = OldMonitoringManifestationFeatures


class OldMonitoringEQSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Monitoring EQ class
    """
    magnitude = fields.Float(as_string=True)
    latitude = fields.Float(as_string=True)
    longitude = fields.Float(as_string=True)

    class Meta:
        """Saves table class structure as schema model"""
        model = OldMonitoringEQ


class OldMonitoringManifestationSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Monitoring Manifestation class
    """
    manifestation_feature = MARSHMALLOW.Nested(
        "OldMonitoringManifestationFeaturesSchema", many=True)

    class Meta:
        """Saves table class structure as schema model"""
        model = OldMonitoringManifestation


class OldMonitoringOnDemandSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Monitoring On Demand class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = OldMonitoringOnDemand


# Renamed as PublicAlertSymbolsSchema
# class MonitoringAlertSymbolsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
#     """
#     Schema representation of Monitoring Alert Symbols class
#     """
#     class Meta:
#         """Saves table class structure as schema model"""
#         model = MonitoringAlertSymbols

# END OF SCHEMAS DECLARATIONS
