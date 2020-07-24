"""
File containing class representation of
Analysis tables
"""

import datetime
from marshmallow import fields
from instance.config import SCHEMA_DICT
from connection import DB, MARSHMALLOW
from src.models.users import UsersSchema
from src.models.monitoring import OperationalTriggers


###############################
# Start of Class Declarations #
###############################

class TemporaryInsertHolder(DB.Model):
    """
    Class representation of site_markers table
    """
    __tablename__ = "temp_insert_holder"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    tih_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime)
    class_name = DB.Column(DB.String(40))
    row_id = DB.Column(DB.Integer)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> tih_id: {self.tih_id}"
                f" ts: {self.ts} class_name: {self.class_name}"
                f" row_id: {self.row_id}")


class SiteMarkers(DB.Model):
    """
    Class representation of site_markers table
    """

    __tablename__ = "site_markers"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.sites.site_id"))
    site_code = DB.Column(DB.String(3))
    marker_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.markers.marker_id"), primary_key=True)
    marker_name = DB.Column(DB.String(20))
    in_use = DB.Column(DB.Integer)

    history = DB.relationship(
        "MarkerHistory", backref=DB.backref("marker_copy", lazy="raise"),
        lazy="subquery", primaryjoin="SiteMarkers.marker_id==foreign(MarkerHistory.marker_id)",
        order_by="desc(MarkerHistory.ts)"
    )

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Site ID: {self.site_id}"
                f" Site Code: {self.site_code} MarkerID: {self.marker_id}"
                f" Marker Name: {self.marker_name} InUse: {self.in_use}")


class EarthquakeEvents(DB.Model):
    """
    Class representation of earthquake_events table
    """

    __tablename__ = "earthquake_events"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

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


class EarthquakeAlerts(DB.Model):
    """
    Class representation of earthquake_alerts table
    """

    __tablename__ = "earthquake_alerts"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    ea_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    eq_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.earthquake_events.eq_id"), nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.sites.site_id"), nullable=False)
    distance = DB.Column(DB.Float(5, 3), nullable=False)

    eq_event = DB.relationship(
        "EarthquakeEvents", backref=DB.backref("eq_alerts", lazy="subquery"), lazy="select")
    site = DB.relationship(
        "Sites", backref=DB.backref("eq_alerts", lazy="dynamic"), lazy="select")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> EQ Alert ID: {self.ea_id}"
                f" Site ID: {self.site_id} Distance: {self.distance}")


class Markers(DB.Model):
    """
    Class representation of markers table
    """

    __tablename__ = "markers"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    marker_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.sites.site_id"), nullable=False)
    description = DB.Column(DB.String(50), default=None)
    latitude = DB.Column(DB.Float(9, 6), default=None)
    longitude = DB.Column(DB.Float(9, 6), default=None)
    in_use = DB.Column(DB.Boolean, default=1)

    site = DB.relationship(
        "Sites", backref=DB.backref("markers", lazy="dynamic"), lazy="select")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Marker ID: {self.marker_id}"
                f" Site ID: {self.site_id} Description: {self.description}"
                f" In Use: {self.in_use}")


class MarkerHistory(DB.Model):
    """
    Class representation of marker_history table
    """

    __tablename__ = "marker_history"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    history_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    marker_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.markers.marker_id"), nullable=False)
    ts = DB.Column(DB.DateTime)
    event = DB.Column(DB.String(20), nullable=False)
    remarks = DB.Column(DB.String(1500), default=None)

    marker = DB.relationship(
        "Markers", backref=DB.backref("marker_histories", lazy="dynamic"), lazy="subquery")
    marker_name = DB.relationship(
        "MarkerNames",
        backref=DB.backref("history", lazy="raise", uselist=False),
        lazy="joined", uselist=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> History ID: {self.history_id}"
                f" Marker ID: {self.marker_id} TS: {self.ts}"
                f" Event: {self.event}")


class MarkerNames(DB.Model):
    """
    Class representation of marker_names table
    """

    __tablename__ = "marker_names"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    name_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    history_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.marker_history.history_id"), nullable=False)
    marker_name = DB.Column(DB.String(20))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Name ID: {self.name_id}"
                f" History ID: {self.history_id} Marker Name: {self.marker_name}")


class MarkerObservations(DB.Model):
    """
    Class representation of marker_observations table
    """

    __tablename__ = "marker_observations"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    mo_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.sites.site_id"), nullable=False)
    ts = DB.Column(DB.DateTime)
    meas_type = DB.Column(DB.String(10))
    observer_name = DB.Column(DB.String(100))
    data_source = DB.Column(DB.String(3))
    reliability = DB.Column(DB.Integer)
    weather = DB.Column(DB.String(20))

    site = DB.relationship(
        "Sites", backref=DB.backref("marker_observations", lazy="dynamic"), lazy="select")
    # marker_data = DB.relationship(
    #     "MarkerData", backref="marker_observation_report", lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> MO ID: {self.mo_id}"
                f" Site ID: {self.site_id} Meas Type: {self.meas_type}"
                f" TS: {self.ts} Reliability: {self.reliability}"
                f" Observer Name: {self.observer_name} Data Source: {self.data_source}")


class MarkerData(DB.Model):
    """
    Class representation of marker_data table
    """

    __tablename__ = "marker_data"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    data_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    mo_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.marker_observations.mo_id"), nullable=False)
    marker_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.markers.marker_id"), nullable=False)
    measurement = DB.Column(DB.Float)

    marker = DB.relationship("Markers", backref=DB.backref(
        "marker_data", lazy="dynamic"), lazy="select")
    marker_observation = DB.relationship(
        "MarkerObservations", backref=DB.backref("marker_data", lazy="subquery"), lazy="select")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Data ID: {self.data_id}"
                f" Marker ID: {self.marker_id} Measurement: {self.measurement}"
                f" Marker Obs ID: {self.mo_id}")


# NOTES: According to Meryll, MarkerAlerts will only relate to MarkerData
class MarkerAlerts(DB.Model):
    """
    Class representation of marker_alerts table
    """

    __tablename__ = "marker_alerts"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    ma_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime, nullable=False,
                   default=datetime.datetime.now)
    marker_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.markers.marker_id"), nullable=False)
    displacement = DB.Column(DB.Float)
    time_delta = DB.Column(DB.Float)
    alert_level = DB.Column(DB.Integer)

    marker = DB.relationship(
        "Markers", backref="marker_alerts", lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> MA ID: {self.ma_id}"
                f" Marker ID: {self.marker_id} Displacement: {self.displacement}"
                f" Alert Level: {self.alert_level} Time Delta: {self.time_delta}")


class RainfallAlerts(DB.Model):
    """
    Class representation of rainfall_alerts table
    """

    __tablename__ = "rainfall_alerts"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    ra_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.sites.site_id"), nullable=False)
    rain_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.rainfall_gauges.rain_id"), nullable=False)
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


class RainfallThresholds(DB.Model):
    """
    Class representation of rainfall_thresholds table
    """

    __tablename__ = "rainfall_thresholds"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    rt_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.sites.site_id"), nullable=False)
    threshold_name = DB.Column(DB.String(12), nullable=False)
    threshold_value = DB.Column(DB.Float(8, 5), nullable=False)

    site = DB.relationship(
        "Sites", backref=DB.backref("rainfall_thresholds", lazy="dynamic"), lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Rain Threshold ID: {self.rt_id}"
                f" Site ID: {self.site_id} Thres Name: {self.threshold_name}"
                f" Threshold Value: {self.threshold_value}")


class RainfallGauges(DB.Model):
    """
    Class representation of rainfall_gauges table
    """

    __tablename__ = "rainfall_gauges"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

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


class RainfallPriorities(DB.Model):
    """
    Class representation of rainfall_priorities table
    """

    __tablename__ = "rainfall_priorities"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    priority_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    rain_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.rainfall_gauges.rain_id"), nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.sites.site_id"), nullable=False)
    distance = DB.Column(DB.Float(5, 2), nullable=False)

    site = DB.relationship(
        "Sites", backref=DB.backref("rainfall_priorities", lazy="dynamic"), lazy="subquery")

    rainfall_gauge = DB.relationship("RainfallGauges", backref=DB.backref(
        "rainfall_priorities", lazy="dynamic"), lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Priority ID: {self.priority_id}"
                f" Rain ID: {self.rain_id} Distance: {self.distance}")


class TSMAlerts(DB.Model):
    """
    Class representation of tsm_alerts table
    """

    __tablename__ = "tsm_alerts"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    ta_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime)
    tsm_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.tsm_sensors.tsm_id"), nullable=False)
    alert_level = DB.Column(DB.Integer)
    ts_updated = DB.Column(DB.DateTime)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> TSM Alerts ID: {self.ta_id}"
                f" TS: {self.ts} tsm_id: {self.tsm_id}"
                f" Alert Level: {self.alert_level} TS Updated: {self.ts_updated}"
                f" TSM_SENSOR_CLASS: {self.tsm_sensor}")


class TSMSensors(DB.Model):
    """
    Class representation of tsm_sensors table
    """

    __tablename__ = "tsm_sensors"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    tsm_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.sites.site_id"), nullable=False)
    logger_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.loggers.logger_id"), nullable=False)
    date_activated = DB.Column(DB.Date)
    date_deactivated = DB.Column(DB.Date)
    segment_length = DB.Column(DB.Float)
    number_of_segments = DB.Column(DB.Integer)
    version = DB.Column(DB.Integer)

    site = DB.relationship("Sites", backref=DB.backref(
        "tsm_sensors", lazy="dynamic"))

    tsm_alert = DB.relationship(
        "TSMAlerts", backref=DB.backref("tsm_sensor", lazy="joined", innerjoin=True),
        lazy="dynamic")

    logger = DB.relationship(
        "Loggers", backref="tsm_sensor", lazy="joined", innerjoin=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> TSM ID: {self.tsm_id}"
                f" Site ID: {self.site_id} Number of Segments: {self.number_of_segments}"
                f" Logger ID: {self.site_id} Number of Segments: {self.number_of_segments}"
                f"Date Activated: {self.date_activated} | LOGGER: {self.logger}")


class NodeAlerts(DB.Model):
    """
    Class representation of node_alerts table
    """

    __tablename__ = "node_alerts"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    na_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts = DB.Column(DB.DateTime, nullable=False)
    tsm_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.tsm_sensors.tsm_id"), nullable=False)
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


class Loggers(DB.Model):
    """
    Class representation of loggers table
    """

    __tablename__ = "loggers"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    logger_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.sites.site_id"), nullable=False)
    logger_name = DB.Column(DB.String(7))
    date_activated = DB.Column(DB.Date)
    date_deactivated = DB.Column(DB.Date)
    latitude = DB.Column(DB.Float)
    longitude = DB.Column(DB.Float)
    model_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.logger_models.model_id"), nullable=False)

    site = DB.relationship("Sites", backref=DB.backref(
        "loggers", lazy="dynamic"))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Logger ID: {self.logger_id}"
                f" Site_ID: {self.site_id} Logger NAme: {self.logger_name}"
                f" Date Activated: {self.date_activated} Latitude: {self.latitude}")


class LoggerModels(DB.Model):
    """
    Class representation of logger_models table
    """

    __tablename__ = "logger_models"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    model_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    has_tilt = DB.Column(DB.Integer)
    has_rain = DB.Column(DB.Integer)
    has_piezo = DB.Column(DB.Integer)
    has_soms = DB.Column(DB.Integer)
    logger_type = DB.Column(DB.String(10))

    loggers = DB.relationship(
        "Loggers", backref="logger_model", lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> TSM ID: {self.tsm_id}"
                f" TSM Name: {self.tsm_name} Number of Segments: {self.number_of_segments}"
                f"Date Activated: {self.date_activated}")


class AlertStatus(DB.Model):
    """
    Class representation of alert_status table
    """

    __tablename__ = "alert_status"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    stat_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    ts_last_retrigger = DB.Column(DB.DateTime)
    trigger_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.operational_triggers.trigger_id"))
    ts_set = DB.Column(DB.DateTime)
    ts_ack = DB.Column(DB.DateTime)
    alert_status = DB.Column(DB.Integer)
    remarks = DB.Column(DB.String(450))
    user_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.users.user_id"), nullable=False)

    trigger = DB.relationship(OperationalTriggers,
                              backref=DB.backref(
                                  "alert_status", lazy="select", uselist=False),
                              primaryjoin="AlertStatus.trigger_id==OperationalTriggers.trigger_id",
                              lazy="joined", innerjoin=True)

    user = DB.relationship(
        "Users", backref=DB.backref("alert_status_ack", lazy="dynamic"), lazy="select")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> stat ID: {self.stat_id}"
                f" ts_last_retrigger: {self.ts_last_retrigger} ts_set: {self.ts_set}"
                f" ts_ack: {self.ts_ack} alert_status: {self.alert_status}"
                f" remarks: {self.remarks} user_id: {self.user_id}"
                f" || TRIGGER: {self.trigger} || user: {self.user}")


class AlertStatusSync(DB.Model):
    """
    Class representation of alert_status_sync table
    """

    __tablename__ = "alert_status_sync"
    __bind_key__ = "analysis_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    as_update_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    stat_id = DB.Column(DB.Integer, nullable=False)
    ts_last_retrigger = DB.Column(DB.DateTime)
    trigger_id = DB.Column(DB.Integer)
    ts_set = DB.Column(DB.DateTime)
    ts_ack = DB.Column(DB.DateTime)
    alert_status = DB.Column(DB.Integer)
    remarks = DB.Column(DB.String(450))
    user_id = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> as_update_id: {self.as_update_id} stat ID: {self.stat_id}"
                f" ts_last_retrigger: {self.ts_last_retrigger} ts_set: {self.ts_set}"
                f" ts_ack: {self.ts_ack} alert_status: {self.alert_status}"
                f" remarks: {self.remarks} user_id: {self.user_id}"
                f" || TRIGGER: {self.trigger} || user: {self.user}")


class DataPresenceRainGauges(DB.Model):
    """
    Class representation of data_presence_rain_gauges
    """

    __tablename__ = "data_presence_rain_gauges"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    rain_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.rainfall_gauges.rain_id"), primary_key=True)
    presence = DB.Column(DB.Integer)
    last_data = DB.Column(DB.DateTime)
    ts_updated = DB.Column(DB.DateTime)
    diff_days = DB.Column(DB.Integer)

    rain_gauge = DB.relationship(
        "RainfallGauges", backref="data_presence", lazy="joined", innerjoin=True,
        primaryjoin="DataPresenceRainGauges.rain_id==RainfallGauges.rain_id")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> rain_id: {self.rain_id}"
                f" presence: {self.presence} last_data: {self.last_data}"
                f" ts_updated: {self.ts_updated} diff_days: {self.diff_days}")


class DataPresenceTSM(DB.Model):
    """
    Class representation of data_presence_tsm
    """

    __tablename__ = "data_presence_tsm"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    tsm_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.tsm_sensors.tsm_id"), primary_key=True)
    presence = DB.Column(DB.Integer)
    last_data = DB.Column(DB.DateTime)
    ts_updated = DB.Column(DB.DateTime)
    diff_days = DB.Column(DB.Integer)

    tsm_sensor = DB.relationship(
        "TSMSensors", backref="data_presence", lazy="joined", innerjoin=True,
        primaryjoin="DataPresenceTSM.tsm_id==TSMSensors.tsm_id")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> tsm_id: {self.tsm_id}"
                f" presence: {self.presence} last_data: {self.last_data}"
                f" ts_updated: {self.ts_updated} diff_days: {self.diff_days}")


class DataPresenceLoggers(DB.Model):
    """
    Class representation of data_presence_loggers
    """

    __tablename__ = "data_presence_loggers"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    logger_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.loggers.logger_id"), primary_key=True)
    presence = DB.Column(DB.Integer)
    last_data = DB.Column(DB.DateTime)
    ts_updated = DB.Column(DB.DateTime)
    diff_days = DB.Column(DB.Integer)

    logger = DB.relationship(
        "Loggers", backref="data_presence", lazy="joined", innerjoin=True,
        primaryjoin="DataPresenceLoggers.logger_id==Loggers.logger_id")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> logger_id: {self.logger_id}"
                f" presence: {self.presence} last_data: {self.last_data}"
                f" ts_updated: {self.ts_updated} diff_days: {self.diff_days}")


def get_tilt_table(table_name):
    """
    """

    class GenericTiltTable(DB.Model):
        """
        """

        __tablename__ = table_name
        __bind_key__ = "senslopedb"
        __table_args__ = {
            "schema": SCHEMA_DICT[__bind_key__], "extend_existing": True}

        data_id = DB.Column(DB.Integer, primary_key=True)
        ts = DB.Column(DB.DateTime, nullable=False)

        def __repr__(self):
            return (f"Type <{self.__class__.__name__}> data_id: {self.data_id}"
                    f" ts: {self.ts}")

    model = GenericTiltTable

    return model

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
    distance = fields.Decimal(as_string=True)
    eq_event = fields.Nested("EarthquakeEventsSchema", exclude=("eq_alerts", ))
    site_id = fields.Integer()
    site = fields.Nested("SitesSchema", only=(
        "site_code", "purok", "sitio", "barangay", "municipality", "province"))

    class Meta:
        """Saves table class structure as schema model"""
        model = EarthquakeAlerts


class EarthquakeEventsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Analysis Earthquake Events class
    """
    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
    magnitude = fields.Decimal(as_string=True)
    depth = fields.Decimal(as_string=True)
    latitude = fields.Decimal(as_string=True)
    longitude = fields.Decimal(as_string=True)
    critical_distance = fields.Decimal(as_string=True)
    eq_alerts = fields.Nested(EarthquakeAlertsSchema,
                              many=True, exclude=("eq_event", ))

    class Meta:
        """Saves table class structure as schema model"""
        model = EarthquakeEvents


class SiteMarkersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Site Markers class
    """

    def __init__(self, *args, **kwargs):
        self.include = kwargs.pop("include", None)
        super().__init__(*args, **kwargs)

    def _update_fields(self, *args, **kwargs):
        super()._update_fields(*args, **kwargs)
        if self.include:
            for field_name in self.include:
                self.fields[field_name] = self._declared_fields[field_name]

    site_id = fields.Integer()
    marker_id = fields.Integer()

    class Meta:
        """Saves table class structure as schema model"""
        model = SiteMarkers
        exclude = ["history"]


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
    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
    marker_name = fields.Nested(
        "MarkerNamesSchema", exclude=("history",))

    class Meta:
        """Saves table class structure as schema model"""
        model = MarkerHistory
        exclude = ["marker_copy"]


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
    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
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
    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
    marker = fields.Nested("Markers")

    class Meta:
        """Saves table class structure as schema model"""
        model = MarkerAlerts


class RainfallAlertsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of RainfallAlerts class
    """
    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")

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
    date_activated = fields.DateTime("%Y-%m-%d %H:%M:%S")
    date_deactivated = fields.DateTime("%Y-%m-%d %H:%M:%S")
    latitude = fields.Decimal(as_string=True)
    longitude = fields.Decimal(as_string=True)

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


class LoggersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Loggers class
    """

    model_id = fields.Integer()
    logger_model = fields.Nested("LoggerModelsSchema", exclude=("loggers", ))

    class Meta:
        """Saves table class structure as schema model"""
        model = Loggers
        exclude = ["data_presence"]


class LoggerModelsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of LoggerModels class
    """
    loggers = fields.Nested(LoggersSchema, exclude=("logger_model", ))

    class Meta:
        """Saves table class structure as schema model"""
        model = LoggerModels


class TSMSensorsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of TSMSensors class
    """
    logger = fields.Nested(LoggersSchema, exclude=("site", "tsm_sensor"))

    class Meta:
        """Saves table class structure as schema model"""
        model = TSMSensors
        exclude = ["tsm_alert", "node_alerts", "data_presence"]


class TSMAlertsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of TSMAlerts class
    """
    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_updated = fields.DateTime("%Y-%m-%d %H:%M:%S")

    class Meta:
        """Saves table class structure as schema model"""
        model = TSMAlerts


class AlertStatusSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of AlertStatus class
    """

    user = fields.Nested(UsersSchema, exclude=("alert_status", ))
    ts_ack = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_last_retrigger = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_set = fields.DateTime("%Y-%m-%d %H:%M:%S")

    class Meta:
        """Saves table class structure as schema model"""
        model = AlertStatus


class DataPresenceRainGaugesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of DataPresenceRainGauges class
    """
    last_data = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_updated = fields.DateTime("%Y-%m-%d %H:%M:%S")
    rain_gauge = fields.Nested(
        RainfallGaugesSchema, exclude=("data_presence",))

    class Meta:
        """Saves table class structure as schema model"""
        model = DataPresenceRainGauges


class DataPresenceTSMSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of DataPresenceTSM class
    """
    last_data = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_updated = fields.DateTime("%Y-%m-%d %H:%M:%S")
    tsm_sensor = fields.Nested(
        TSMSensorsSchema, exclude=("data_presence", "tsm_alert", "site",
                                   "node_alerts", "logger.data_presence"))

    class Meta:
        """Saves table class structure as schema model"""
        model = DataPresenceTSM


class DataPresenceLoggersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of DataPresenceLoggers class
    """
    last_data = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_updated = fields.DateTime("%Y-%m-%d %H:%M:%S")
    logger_id = fields.Integer()
    logger = fields.Nested(
        LoggersSchema, exclude=("data_presence", "tsm_sensor", "logger_model"))

    class Meta:
        """Saves table class structure as schema model"""
        model = DataPresenceLoggers
