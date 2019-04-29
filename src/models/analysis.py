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

    marker_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.sites.site_id"), nullable=False)
    description = DB.Column(DB.String(50))
    latitude = DB.Column(DB.Float(9, 6))
    longitude = DB.Column(DB.Float(9, 6))
    in_use = DB.Column(DB.Boolean)

    site = DB.relationship("Sites", backref="marker", lazy=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Marker ID: {self.marker_id}"
                f" Site ID: {self.site_id} Description: {self.description}"
                f" In Use: {self.in_use}")


class MarkerHistory(UserMixin, DB.Model):
    """
    Class representation of marker_history table
    """

    __tablename__ = "marker_history"

    history_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    marker_id = DB.Column(DB.Integer, DB.ForeignKey(
        "markers.marker_id"), nullable=False)
    ts = DB.Column(DB.DateTime)
    event = DB.Column(DB.String(20))

    marker = DB.relationship(
        "Markers", backref="marker_history", lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> History ID: {self.history_id}"
                f" Marker ID: {self.marker_id} TS: {self.ts}"
                f" Event: {self.event}")


class MarkerNames(UserMixin, DB.Model):
    """
    Class representation of marker_names table
    """

    __tablename__ = "marker_names"

    name_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    history_id = DB.Column(DB.Integer, DB.ForeignKey(
        "marker_history.history_id"), nullable=False)
    marker_name = DB.Column(DB.String(20))

    history = DB.relationship(
        "MarkerHistory", backref="marker_name", lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Name ID: {self.name_id}"
                f" History ID: {self.history_id} Marker Name: {self.marker_name}")


class MarkerObservations(UserMixin, DB.Model):
    """
    Class representation of marker_observations table
    """

    __tablename__ = "marker_observations"

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
        "Sites", backref="marker_observation_report", lazy="joined")
    marker_data = DB.relationship(
        "MarkerData", backref="marker_observation_report", lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> MO ID: {self.mo_id}"
                f" Site ID: {self.site_id} Meas Type: {self.meas_type}"
                f" Observer Name: {self.observer_name} Data Source: {self.data_source}")


class MarkerData(UserMixin, DB.Model):
    """
    Class representation of marker_data table
    """

    __tablename__ = "marker_data"

    data_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    mo_id = DB.Column(DB.Integer, DB.ForeignKey(
        "marker_observations.mo_id"), nullable=False)
    marker_id = DB.Column(DB.Integer, DB.ForeignKey(
        "markers.marker_id"), nullable=False)
    measurement = DB.Column(DB.Float)

    marker = DB.relationship("Markers", backref=DB.backref(
        "marker_data", lazy="dynamic"), lazy="subquery")
    # marker = DB.relationship("Markers", backref="marker_data", lazy="dynamic")

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

    ma_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime, nullable=False,
                   default=datetime.datetime.utcnow)
    marker_id = DB.Column(DB.Integer, DB.ForeignKey(
        "markers.marker_id"), nullable=False)
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

    ra_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime, nullable=False)
    site_id = DB.Column(DB.Integer)
    rain_id = DB.Column(DB.Integer, nullable=False)
    rain_alert = DB.Column(DB.String(2))
    cumulative = DB.Column(DB.Float(5, 2))
    threshold = DB.Column(DB.Float(5, 2))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Rain Alert ID: {self.ra_id}"
                f" TS: {self.ts} Site ID: {self.site_id}"
                f" Rain Alert: {self.rain_alert} Cumulative: {self.cumulative}")


class RainfallThresholds(UserMixin, DB.Model):
    """
    Class representation of rainfall_thresholds table
    """

    __tablename__ = "rainfall_thresholds"

    rt_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, nullable=False)
    threshold_name = DB.Column(DB.String(12), nullable=False)
    threshold_value = DB.Column(DB.Float(8, 5), nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Rain Threshold ID: {self.rt_id}"
                f" Site ID: {self.site_id} Thres Name: {self.threshold_name}"
                f" Threshold Value: {self.threshold_value}")


class RainfallGauges(UserMixin, DB.Model):
    """
    Class representation of rainfall_gauges table
    """

    __tablename__ = "rainfall_gauges"

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

    priority_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    rain_id = DB.Column(DB.String(5), nullable=False)
    site_id = DB.Column(DB.String(3), nullable=False)
    distance = DB.Column(DB.Float(5, 2), nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Priority ID: {self.priority_id}"
                f" Rain ID: {self.rain_id} Distance: {self.distance}")


class TSMSensors(UserMixin, DB.Model):
    """
    Class representation of tsm_sensors table
    """

    __tablename__ = "tsm_sensors"

    tsm_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer)
    logger_id = DB.Column(DB.Integer)
    tsm_name = DB.Column(DB.String(7))
    date_activated = DB.Column(DB.Date)
    date_deactivated = DB.Column(DB.Date)
    segment_length = DB.Column(DB.Float)
    number_of_segments = DB.Column(DB.Integer)
    version = DB.Column(DB.Integer)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> TSM ID: {self.tsm_id}"
                f" TSM Name: {self.tsm_name} Number of Segments: {self.number_of_segments}"
                f"Date Activated: {self.date_activated}")


class TSMAlerts(UserMixin, DB.Model):
    """
    Class representation of tsm_alerts table
    """

    __tablename__ = "tsm_alerts"

    ta_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime)
    tsm_id = DB.Column(DB.Integer)
    alert_level = DB.Column(DB.Integer)
    ts_updated = DB.Column(DB.DateTime)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> TSM Alerts ID: {self.ta_id}"
                f" Alert Level: {self.alert_level} TS Updated: {self.ts_updated}")

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
