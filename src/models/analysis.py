"""
File containing class representation of
Analysis tables
"""

import datetime
from flask_login import UserMixin
from sqlalchemy.dialects.mysql import TINYINT, SMALLINT, DECIMAL
from connection import DB, MARSHMALLOW


class AnalysisEarthquakeAlerts(UserMixin, DB.Model):
    """
    Class representation of earthquake_alerts table
    """

    __tablename__ = "earthquake_alerts"

    ea_id = DB.Column(SMALLINT, primary_key=True, nullable=False)
    eq_id = DB.Column(DB.Integer, nullable=False)
    site_id = DB.Column(TINYINT, nullable=False)
    distance = DB.Column(DECIMAL(5, 3), nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> EQ Alert ID: {self.ea_id}"
                f" Site ID: {self.site_id} Distance: {self.distance}")


class AnalysisEarthquakeAlertsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Analysis Earthquake Alerts class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = AnalysisEarthquakeAlerts


class AnalysisEarthquakeEvents(UserMixin, DB.Model):
    """
    Class representation of earthquake_events table
    """

    __tablename__ = "earthquake_events"

    eq_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime)
    magnitude = DB.Column(DECIMAL(4, 2))
    depth = DB.Column(DECIMAL(5, 2))
    latitude = DB.Column(DECIMAL(9, 6))
    longitude = DB.Column(DECIMAL(9, 6))
    critical_distance = DB.Column(DECIMAL(6, 3))
    issuer = DB.Column(DB.String(20))
    processed = DB.Column(TINYINT, nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> EQ_ID: {self.eq_id}"
                f" Magnitude: {self.magnitude} Depth: {self.depth}"
                f" Critical Distance: {self.critical_distance} issuer: {self.issuer}")


class AnalysisEarthquakeEventsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Analysis Earthquake Events class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = AnalysisEarthquakeEvents


class AnalysisMarkerObservations(UserMixin, DB.Model):
    """
    Class representation of marker_observations table
    """

    __tablename__ = "marker_observations"

    mo_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(TINYINT, nullable=False)
    ts = DB.Column(DB.DateTime)
    meas_type = DB.Column(DB.String(10))
    observer_name = DB.Column(DB.String(100))
    data_source = DB.Column(DB.String(3))
    reliability = DB.Column(TINYINT)
    weather = DB.Column(DB.String(20))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> MO ID: {self.mo_id}"
                f" Site ID: {self.site_id} Meas Type: {self.meas_type}"
                f" Observer Name: {self.observer_name} Data Source: {self.data_source}")


class AnalysisMarkerObservationsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Analysis Marker Observations class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = AnalysisMarkerObservations


class AnalysisMarkerAlerts(UserMixin, DB.Model):
    """
    Class representation of marker_alerts table
    """

    __tablename__ = "marker_alerts"

    ma_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime, nullable=False, default=datetime.datetime.utcnow)
    marker_id = DB.Column(SMALLINT)
    displacement = DB.Column(DB.Float)
    time_delta = DB.Column(DB.Float)
    alert_level = DB.Column(TINYINT)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> MA ID: {self.ma_id}"
                f" Marker ID: {self.marker_id} Displacement: {self.displacement}"
                f" Alert Level: {self.alert_level} Time Delta: {self.time_delta}")


class AnalysisMarkerAlertsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of AnalysisMarkerAlerts class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = AnalysisMarkerAlerts


class AnalysisMarkers(UserMixin, DB.Model):
    """
    Class representation of markers table
    """

    __tablename__ = "markers"

    marker_id = DB.Column(SMALLINT, primary_key=True, nullable=False)
    site_id = DB.Column(TINYINT, nullable=False)
    description = DB.Column(DB.String(50))
    latitude = DB.Column(DECIMAL(9, 6))
    longitude = DB.Column(DECIMAL(9, 6))
    in_use = DB.Column(DB.Boolean)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Marker ID: {self.marker_id}"
                f" Site ID: {self.site_id} Description: {self.description}"
                f" In Use: {self.in_use}")


class AnalysisMarkersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of AnalysisMarkers class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = AnalysisMarkers


class AnalysisMarkerData(UserMixin, DB.Model):
    """
    Class representation of marker_data table
    """

    __tablename__ = "marker_data"

    data_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    mo_id = DB.Column(DB.Integer, nullable=False)
    marker_id = DB.Column(SMALLINT, nullable=False)
    measurement = DB.Column(DB.Float)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Data ID: {self.data_id}"
                f" Marker ID: {self.marker_id} Measurement: {self.measurement}"
                f" Marker Obs ID: {self.mo_id}")


class AnalysisMarkerDataSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of AnalysisMarkerData class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = AnalysisMarkerData


class AnalysisMarkerNames(UserMixin, DB.Model):
    """
    Class representation of marker_names table
    """

    __tablename__ = "marker_names"

    name_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    history_id = DB.Column(SMALLINT, nullable=False)
    marker_name = DB.Column(DB.String(20))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Name ID: {self.name_id}"
                f" History ID: {self.history_id} Marker Name: {self.marker_name}")


class AnalysisMarkerNamesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of AnalysisMarkerNames class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = AnalysisMarkerNames


class AnalysisMarkerHistory(UserMixin, DB.Model):
    """
    Class representation of marker_history table
    """

    __tablename__ = "marker_history"

    history_id = DB.Column(SMALLINT, primary_key=True, nullable=False)
    marker_id = DB.Column(SMALLINT, nullable=False)
    ts = DB.Column(DB.DateTime)
    event = DB.Column(DB.String(20))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> History ID: {self.history_id}"
                f" Marker ID: {self.marker_id} TS: {self.ts}"
                f" Event: {self.event}")


class AnalysisMarkerHistorySchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of AnalysisMarkerHistory class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = AnalysisMarkerHistory


class AnalysisRainfallAlerts(UserMixin, DB.Model):
    """
    Class representation of rainfall_alerts table
    """

    __tablename__ = "rainfall_alerts"

    ra_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime, nullable=False)
    site_id = DB.Column(TINYINT)
    rain_id = DB.Column(SMALLINT, nullable=False)
    rain_alert = DB.Column(DB.String(2))
    cumulative = DB.Column(DECIMAL(5, 2))
    threshold = DB.Column(DECIMAL(5, 2))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Rain Alert ID: {self.ra_id}"
                f" TS: {self.ts} Site ID: {self.site_id}"
                f" Rain Alert: {self.rain_alert} Cumulative: {self.cumulative}")


class AnalysisRainfallAlertsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of AnalysisRainfallAlerts class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = AnalysisRainfallAlerts


class AnalysisRainfallThresholds(UserMixin, DB.Model):
    """
    Class representation of rainfall_thresholds table
    """

    __tablename__ = "rainfall_thresholds"

    rt_id = DB.Column(SMALLINT, primary_key=True, nullable=False)
    site_id = DB.Column(TINYINT, nullable=False)
    threshold_name = DB.Column(DB.String(12), nullable=False)
    threshold_value = DB.Column(DECIMAL(8, 5), nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Rain Threshold ID: {self.rt_id}"
                f" Site ID: {self.site_id} Thres Name: {self.threshold_name}"
                f" Threshold Value: {self.threshold_value}")


class AnalysisRainfallThresholdsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of AnalysisRainfallThresholds class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = AnalysisRainfallThresholds


class AnalysisRainfallGauges(UserMixin, DB.Model):
    """
    Class representation of rainfall_gauges table
    """

    __tablename__ = "rainfall_gauges"

    rain_id = DB.Column(SMALLINT, primary_key=True, nullable=False)
    gauge_name = DB.Column(DB.String(5), nullable=False)
    data_source = DB.Column(DB.String(8), nullable=False)
    latitude = DB.Column(DECIMAL(9, 6), nullable=False)
    longitude = DB.Column(DECIMAL(9, 6), nullable=False)
    date_activated = DB.Column(DB.DateTime, nullable=False)
    date_deactivated = DB.Column(DB.DateTime)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Rain Gauge ID: {self.rain_id}"
                f" Gauge Name: {self.gauge_name} Date Activated: {self.date_activated}")


class AnalysisRainfallGaugesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of AnalysisRainfallGauges class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = AnalysisRainfallGauges


class AnalysisRainfallPriorities(UserMixin, DB.Model):
    """
    Class representation of rainfall_priorities table
    """

    __tablename__ = "rainfall_priorities"

    priority_id = DB.Column(SMALLINT, primary_key=True, nullable=False)
    rain_id = DB.Column(DB.String(5), nullable=False)
    site_id = DB.Column(DB.String(3), nullable=False)
    distance = DB.Column(DECIMAL(5, 2), nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Priority ID: {self.priority_id}"
                f" Rain ID: {self.rain_id} Distance: {self.distance}")


class AnalysisRainfallPrioritiesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of AnalysisRainfallPriorities class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = AnalysisRainfallPriorities


class AnalysisTSMSensors(UserMixin, DB.Model):
    """
    Class representation of tsm_sensors table
    """

    __tablename__ = "tsm_sensors"

    tsm_id = DB.Column(SMALLINT, primary_key=True, nullable=False)
    site_id = DB.Column(TINYINT)
    logger_id = DB.Column(SMALLINT)
    tsm_name = DB.Column(DB.String(7))
    date_activated = DB.Column(DB.DateTime)
    date_deactivated = DB.Column(DB.DateTime)
    segment_length = DB.Column(DB.Float)
    number_of_segments = DB.Column(TINYINT)
    version = DB.Column(TINYINT)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> TSM ID: {self.tsm_id}"
                f" TSM Name: {self.tsm_name} Number of Segments: {self.number_of_segments}")


class AnalysisTSMSensorsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of AnalysisTSMSensors class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = AnalysisTSMSensors


class AnalysisTSMAlerts(UserMixin, DB.Model):
    """
    Class representation of tsm_alerts table
    """

    __tablename__ = "tsm_alerts"

    ta_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime)
    tsm_id = DB.Column(SMALLINT)
    alert_level = DB.Column(TINYINT)
    ts_updated = DB.Column(DB.DateTime)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> TSM Alerts ID: {self.ta_id}"
                f" Alert Level: {self.alert_level} TS Updated: {self.ts_updated}")


class AnalysisTSMAlertsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of AnalysisTSMAlerts class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = AnalysisTSMAlerts
