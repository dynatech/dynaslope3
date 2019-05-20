"""
File containing class representation of
Analysis tables
"""

import datetime
from flask_login import UserMixin
from marshmallow import fields
from connection import DB, MARSHMALLOW
from src.models.monitoring import (MonitoringEvents, MonitoringEventsSchema)
from src.models.sites import (Sites, SitesSchema)


###############################
# Start of Class Declarations #
###############################


class EarthquakeAlerts(UserMixin, DB.Model):
    """
    Class representation of earthquake_alerts table
    """

    __tablename__ = "earthquake_alerts"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    ea_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    eq_id = DB.Column(DB.Integer, nullable=False)
    site_id = DB.Column(DB.Integer, nullable=False)
    distance = DB.Column(DB.Float(5, 3), nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> EQ Alert ID: {self.ea_id}"
                f" Site ID: {self.site_id} Distance: {self.distance}")


class EarthquakeEvents(UserMixin, DB.Model):
    """
    Class representation of earthquake_events table
    """

    __tablename__ = "earthquake_events"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    eq_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime)
    magnitude = DB.Column(DB.Float(4, 2))
    depth = DB.Column(DB.Float(5, 2))
    latitude = DB.Column(DB.Float(9, 6))
    longitude = DB.Column(DB.Float(9, 6))
    critical_distance = DB.Column(DB.Float(6, 3))
    issuer = DB.Column(DB.String(20))
    processed = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> EQ_ID: {self.eq_id}"
                f" Magnitude: {self.magnitude} Depth: {self.depth}"
                f" Critical Distance: {self.critical_distance} issuer: {self.issuer}")


class Markers(UserMixin, DB.Model):
    """
    Class representation of markers table
    """

    __tablename__ = "markers"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    marker_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.sites.site_id"), nullable=False)
    description = DB.Column(DB.String(50))
    latitude = DB.Column(DB.Float(9, 6))
    longitude = DB.Column(DB.Float(9, 6))
    in_use = DB.Column(DB.Boolean)

    site = DB.relationship(
        "Sites", backref=DB.backref("markers", lazy="dynamic"), lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Marker ID: {self.marker_id}"
                f" Site ID: {self.site_id} Description: {self.description}"
                f" In Use: {self.in_use}")


class MarkerHistory(UserMixin, DB.Model):
    """
    Class representation of marker_history table
    """

    __tablename__ = "marker_history"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    history_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    marker_id = DB.Column(DB.Integer, DB.ForeignKey(
        "analysis_db.markers.marker_id"), nullable=False)
    ts = DB.Column(DB.DateTime)
    event = DB.Column(DB.String(20))

    marker = DB.relationship(
        "Markers", backref=DB.backref("marker_histories", lazy="dynamic"), lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> History ID: {self.history_id}"
                f" Marker ID: {self.marker_id} TS: {self.ts}"
                f" Event: {self.event}")


class MarkerNames(UserMixin, DB.Model):
    """
    Class representation of marker_names table
    """

    __tablename__ = "marker_names"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    name_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    history_id = DB.Column(DB.Integer, DB.ForeignKey(
        "analysis_db.marker_history.history_id"), nullable=False)
    marker_name = DB.Column(DB.String(20))

    history = DB.relationship(
        "MarkerHistory", backref="marker_names", lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Name ID: {self.name_id}"
                f" History ID: {self.history_id} Marker Name: {self.marker_name}")


class MarkerObservations(UserMixin, DB.Model):
    """
    Class representation of marker_observations table
    """

    __tablename__ = "marker_observations"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    mo_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.sites.site_id"), nullable=False)
    ts = DB.Column(DB.DateTime)
    meas_type = DB.Column(DB.String(10))
    observer_name = DB.Column(DB.String(100))
    data_source = DB.Column(DB.String(3))
    reliability = DB.Column(DB.Integer)
    weather = DB.Column(DB.String(20))

    site = DB.relationship(
        "Sites", backref="marker_observations", lazy="subquery")
    # marker_data = DB.relationship(
    #     "MarkerData", backref="marker_observation_report", lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> MO ID: {self.mo_id}"
                f" Site ID: {self.site_id} Meas Type: {self.meas_type}"
                f" Observer Name: {self.observer_name} Data Source: {self.data_source}")


class MarkerData(UserMixin, DB.Model):
    """
    Class representation of marker_data table
    """

    __tablename__ = "marker_data"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    data_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    mo_id = DB.Column(DB.Integer, DB.ForeignKey(
        "analysis_db.marker_observations.mo_id"), nullable=False)
    marker_id = DB.Column(DB.Integer, DB.ForeignKey(
        "analysis_db.markers.marker_id"), nullable=False)
    measurement = DB.Column(DB.Float)

    marker = DB.relationship("Markers", backref=DB.backref(
        "marker_data", lazy="dynamic"), lazy="subquery")
    marker_observation = DB.relationship(
        "MarkerObservations", backref=DB.backref("marker_data", lazy="dynamic"), lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Data ID: {self.data_id}"
                f" Marker ID: {self.marker_id} Measurement: {self.measurement}"
                f" Marker Obs ID: {self.mo_id}")


# NOTES: According to Meryll, MarkerAlerts will only relate to MarkerData
class MarkerAlerts(UserMixin, DB.Model):
    """
    Class representation of marker_alerts table
    """

    __tablename__ = "marker_alerts"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    ma_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime, nullable=False,
                   default=datetime.datetime.utcnow)
    marker_id = DB.Column(DB.Integer, DB.ForeignKey(
        "analysis_db.markers.marker_id"), nullable=False)
    displacement = DB.Column(DB.Float)
    time_delta = DB.Column(DB.Float)
    alert_level = DB.Column(DB.Integer)

    marker = DB.relationship(
        "Markers", backref="marker_alerts", lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> MA ID: {self.ma_id}"
                f" Marker ID: {self.marker_id} Displacement: {self.displacement}"
                f" Alert Level: {self.alert_level} Time Delta: {self.time_delta}")


class RainfallAlerts(UserMixin, DB.Model):
    """
    Class representation of rainfall_alerts table
    """

    __tablename__ = "rainfall_alerts"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    ra_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.sites.site_id"), nullable=False)
    rain_id = DB.Column(DB.Integer, DB.ForeignKey(
        "analysis_db.rainfall_gauges.rain_id"), nullable=False)
    rain_alert = DB.Column(DB.String(2))
    cumulative = DB.Column(DB.Float(5, 2))
    threshold = DB.Column(DB.Float(5, 2))

    site = DB.relationship(
        "Sites", backref=DB.backref("rainfall_alerts", lazy="dynamic"), lazy="subquery")

    rainfall_gauge = DB.relationship("RainfallGauges", backref=DB.backref(
        "rainfall_alerts", lazy="dynamic"), lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Rain Alert ID: {self.ra_id}"
                f" TS: {self.ts} Site ID: {self.site_id}"
                f" Rain Alert: {self.rain_alert} Cumulative: {self.cumulative}")


class RainfallThresholds(UserMixin, DB.Model):
    """
    Class representation of rainfall_thresholds table
    """

    __tablename__ = "rainfall_thresholds"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    rt_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.sites.site_id"), nullable=False)
    threshold_name = DB.Column(DB.String(12), nullable=False)
    threshold_value = DB.Column(DB.Float(8, 5), nullable=False)

    site = DB.relationship(
        "Sites", backref=DB.backref("rainfall_thresholds", lazy="dynamic"), lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Rain Threshold ID: {self.rt_id}"
                f" Site ID: {self.site_id} Thres Name: {self.threshold_name}"
                f" Threshold Value: {self.threshold_value}")


class RainfallGauges(UserMixin, DB.Model):
    """
    Class representation of rainfall_gauges table
    """

    __tablename__ = "rainfall_gauges"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    rain_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    gauge_name = DB.Column(DB.String(5), nullable=False)
    data_source = DB.Column(DB.String(8), nullable=False)
    latitude = DB.Column(DB.Float(9, 6), nullable=False)
    longitude = DB.Column(DB.Float(9, 6), nullable=False)
    date_activated = DB.Column(DB.DateTime, nullable=False)
    date_deactivated = DB.Column(DB.DateTime)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Rain Gauge ID: {self.rain_id}"
                f" Gauge Name: {self.gauge_name} Date Activated: {self.date_activated}")


class RainfallPriorities(UserMixin, DB.Model):
    """
    Class representation of rainfall_priorities table
    """

    __tablename__ = "rainfall_priorities"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    priority_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    rain_id = DB.Column(DB.Integer, DB.ForeignKey(
        "analysis_db.rainfall_gauges.rain_id"), nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.sites.site_id"), nullable=False)
    distance = DB.Column(DB.Float(5, 2), nullable=False)

    site = DB.relationship(
        "Sites", backref=DB.backref("rainfall_priorities", lazy="dynamic"), lazy="subquery")

    rainfall_gauge = DB.relationship("RainfallGauges", backref=DB.backref(
        "rainfall_priorities", lazy="dynamic"), lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Priority ID: {self.priority_id}"
                f" Rain ID: {self.rain_id} Distance: {self.distance}")


class TSMAlerts(UserMixin, DB.Model):
    """
    Class representation of tsm_alerts table
    """

    __tablename__ = "tsm_alerts"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    ta_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime)
    tsm_id = DB.Column(DB.Integer, DB.ForeignKey(
        "analysis_db.tsm_sensors.tsm_id"), nullable=False)
    alert_level = DB.Column(DB.Integer)
    ts_updated = DB.Column(DB.DateTime)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> TSM Alerts ID: {self.ta_id}"
                f" TS: {self.ts} tsm_id: {self.tsm_id}"
                f" Alert Level: {self.alert_level} TS Updated: {self.ts_updated}"
                f" TSM_SENSOR_CLASS: {self.tsm_sensor}")


class TSMSensors(UserMixin, DB.Model):
    """
    Class representation of tsm_sensors table
    """

    __tablename__ = "tsm_sensors"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    tsm_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.sites.site_id"), nullable=False)
    logger_id = DB.Column(DB.Integer, DB.ForeignKey(
        "analysis_db.loggers.logger_id"), nullable=False)
    tsm_name = DB.Column(DB.String(7))
    date_activated = DB.Column(DB.Date)
    date_deactivated = DB.Column(DB.Date)
    segment_length = DB.Column(DB.Float)
    number_of_segments = DB.Column(DB.Integer)
    version = DB.Column(DB.Integer)

    site = DB.relationship("Sites", backref=DB.backref(
        "tsm_sensors", lazy="dynamic"))

    tsm_alert = DB.relationship(
        "TSMAlerts", backref="tsm_sensor", lazy="dynamic")

    logger = DB.relationship(
        "Loggers", backref="tsm_sensor", lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> TSM ID: {self.tsm_id}"
                f" TSM Name: {self.tsm_name} Number of Segments: {self.number_of_segments}"
                f"Date Activated: {self.date_activated}")


class NodeAlerts(UserMixin, DB.Model):
    """
    Class representation of node_alerts table
    """

    __tablename__ = "node_alerts"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    na_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime, nullable=False)
    tsm_id = DB.Column(DB.Integer, DB.ForeignKey(
        "analysis_db.tsm_sensors.tsm_id"), nullable=False)
    # Node ID, no need  for relationships for the moment
    node_id = DB.Column(DB.Integer, nullable=False)
    disp_alert = DB.Column(DB.Integer, nullable=False)
    vel_alert = DB.Column(DB.String(10), nullable=False)
    na_status = DB.Column(DB.Integer)

    tsm_sensor = DB.relationship("TSMSensors", backref=DB.backref(
        "node_alerts", lazy="dynamic"), lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> NodeAlert ID: {self.na_id}"
                f" ts: {self.ts} tsm_id: {self.tsm_id} node_id: {self.node_id}"
                f" disp_alert: {self.disp_alert}"
                f" vel_alert: {self.vel_alert} na_status: {self.na_status}"
                f" || tsm_sensor: {self.tsm_sensor}")


class Loggers(UserMixin, DB.Model):
    """
    Class representation of loggers table
    """

    __tablename__ = "loggers"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    logger_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.sites.site_id"), nullable=False)
    logger_name = DB.Column(DB.String(7))
    date_activated = DB.Column(DB.Date)
    date_deactivated = DB.Column(DB.Date)
    latitude = DB.Column(DB.Float)
    longitude = DB.Column(DB.Float)
    model_id = DB.Column(DB.Integer, DB.ForeignKey(
        "analysis_db.logger_models.model_id"), nullable=False)

    site = DB.relationship("Sites", backref=DB.backref(
        "loggers", lazy="dynamic"))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Logger ID: {self.logger_id}"
                f" Site_ID: {self.site_id} Logger NAme: {self.logger_name}"
                f" Date Activated: {self.date_activated} Latitude: {self.latitude}")


class LoggerModels(UserMixin, DB.Model):
    """
    Class representation of logger_models table
    """

    __tablename__ = "logger_models"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    model_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    has_tilt = DB.Column(DB.Integer)
    has_rain = DB.Column(DB.Integer)
    has_piezo = DB.Column(DB.Integer)
    has_soms = DB.Column(DB.Integer)
    logger_type = DB.Column(DB.String(10))

    logger = DB.relationship(
        "Loggers", backref="logger_model", lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> TSM ID: {self.tsm_id}"
                f" TSM Name: {self.tsm_name} Number of Segments: {self.number_of_segments}"
                f"Date Activated: {self.date_activated}")


class AlertStatus(UserMixin, DB.Model):
    """
    Class representation of alert_status table
    """

    __tablename__ = "alert_status"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": "analysis_db"}

    stat_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts_last_retrigger = DB.Column(DB.DateTime)
    trigger_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.operational_triggers.trigger_id"))
    ts_set = DB.Column(DB.DateTime)
    ts_ack = DB.Column(DB.DateTime)
    alert_status = DB.Column(DB.Integer)
    remarks = DB.Column(DB.String(450))
    user_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.users.user_id"), nullable=False)

    trigger = DB.relationship("OperationalTriggers",
                              backref="alert_status", lazy="subquery")

    user = DB.relationship(
        "Users", backref=DB.backref("alert_status_ack", lazy="dynamic"), lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> stat ID: {self.stat_id}"
                f" ts_last_retrigger: {self.ts_last_retrigger} ts_set: {self.ts_set}"
                f" ts_ack: {self.ts_ack} alert_status: {self.alert_status}"
                f" remarks: {self.remarks} user_id: {self.user_id}"
                f" || TRIGGER: {self.trigger} || USER_ACK: {self.user}")


#############################
# End of Class Declarations #
#############################


################################
# Start of Schema Declarations #
################################

class EarthquakeAlertsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Analysis Earthquake Alerts class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = EarthquakeAlerts


class EarthquakeEventsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Analysis Earthquake Events class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = EarthquakeEvents


class MarkersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Markers class
    """

    site = fields.Nested("SitesSchema")
    marker_data = fields.Nested(
        "MarkerDataSchema", many=True, exclude=("marker",))
    marker_history = fields.Nested(
        "MarkerHistorySchema", many=True, exclude=("marker",))
    marker_alerts = fields.Nested(
        "MarkerAlertsSchema", many=True, exclude=("marker",))

    class Meta:
        """Saves table class structure as schema model"""
        model = Markers


class MarkerHistorySchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of MarkerHistory class
    """
    marker_name = fields.Nested(
        "MarkerNamesSchema", many=True, exclude=("history",))

    class Meta:
        """Saves table class structure as schema model"""
        model = MarkerHistory


class MarkerNamesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of MarkerNames class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MarkerNames


class MarkerObservationsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Analysis Marker Observations class
    """
    site = fields.Nested("SitesSchema")
    marker_data = fields.Nested(
        "MarkerDataSchema", many=True, exclude=("marker_observation_report",))

    class Meta:
        """Saves table class structure as schema model"""
        model = MarkerObservations


class MarkerDataSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of MarkerData class
    """

    # marker = fields.Nested("Markers", exclude=("marker_data",))
    marker_observation_report = fields.Nested(
        "MarkerObservationsSchema", exclude=("marker_data",))

    class Meta:
        """Saves table class structure as schema model"""
        model = MarkerData


class MarkerAlertsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of MarkerAlerts class
    """

    marker = fields.Nested("Markers")

    class Meta:
        """Saves table class structure as schema model"""
        model = MarkerAlerts


class RainfallAlertsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of RainfallAlerts class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = RainfallAlerts


class RainfallThresholdsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of RainfallThresholds class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = RainfallThresholds


class RainfallGaugesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of RainfallGauges class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = RainfallGauges


class RainfallPrioritiesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of RainfallPriorities class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = RainfallPriorities


class TSMSensorsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of TSMSensors class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = TSMSensors


class TSMAlertsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of TSMAlerts class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = TSMAlerts
