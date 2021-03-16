"""
File containing class representation of
Analysis tables
"""

import datetime
from marshmallow import fields, EXCLUDE
from sqlalchemy.dialects.mysql import DECIMAL, TEXT
from instance.config import SCHEMA_DICT
from connection import DB, MARSHMALLOW
from src.models.users import UsersSchema
from src.models.monitoring import OperationalTriggers
from src.models.loggers import LoggersSchema


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
    data_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.marker_data.data_id"), nullable=False)
    displacement = DB.Column(DB.Float)
    time_delta = DB.Column(DB.Float)
    alert_level = DB.Column(DB.Integer)

    marker_data = DB.relationship(
        "MarkerData", backref=DB.backref("marker_alert", lazy="select"),
        lazy="select", viewonly=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> MA ID: {self.ma_id}"
                f" Data ID: {self.data_id} Displacement: {self.displacement}"
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


class RainfallDataTags(DB.Model):
    """
    Class representation of rainfall_data_tags table

    observed_data (int):    -1/actual is lower than recorded,
                            0/actual is zero,
                            1/actual is higher than recorded
    """

    __tablename__ = "rainfall_data_tags"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    rain_tag_id = DB.Column(DB.Integer, primary_key=True)
    rain_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.rainfall_gauges.rain_id"), nullable=False)
    ts = DB.Column(DB.DateTime, nullable=False, default=datetime.datetime.now)
    ts_start = DB.Column(DB.DateTime, nullable=False)
    ts_end = DB.Column(DB.DateTime)
    tagger_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.users.user_id"), nullable=False)
    observed_data = DB.Column(DB.Integer, nullable=False)
    remarks = DB.Column(DB.String(1000), default=None)

    tagger = DB.relationship(
        "Users", backref=DB.backref("rainfall_tags", lazy="dynamic"),
        lazy="joined", innerjoin=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Rain Tag ID: {self.rain_tag_id}"
                f" TS: {self.ts} TS Start: {self.ts_start}"
                f"TS End: {self.ts_end} Observed Data: {self.observed_data}")


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
        f"{SCHEMA_DICT['commons_db']}.loggers.logger_id"), nullable=False)
    tsm_name = DB.Column(DB.String(7))
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
        "Loggers", backref=DB.backref(
            "tsm_sensor", lazy="joined",
            innerjoin=False, uselist=False
        ),
        lazy="joined", innerjoin=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> TSM ID: {self.tsm_id}"
                f" Site ID: {self.site_id} Number of Segments: {self.number_of_segments}"
                f" Logger ID: {self.site_id} Number of Segments: {self.number_of_segments}"
                f" Date Activated: {self.date_activated}"
                f" | LOGGER: {self.logger} Version: {self.version}")


class AccelerometerStatus(DB.Model):
    """
    Class representation of accelerometer_status table
    """

    __tablename__ = "accelerometer_status"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    stat_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    accel_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.accelerometers.accel_id"), nullable=False)
    ts_flag = DB.Column(DB.DateTime)
    date_identified = DB.Column(DB.DateTime)
    flagger = DB.Column(DB.String(20))
    status = DB.Column(DB.Integer)
    remarks = DB.Column(DB.String)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> ACCELEROMETER STATUS: {self.stat_id}"
                f" Accel ID: {self.accel_id} ts flagged: {self.ts_flagged}"
                f" Date Identified: {self.date_identified} flagger: {self.flagger}"
                f"Status: {self.status} Remarks: {self.remarks}")


class Accelerometers(DB.Model):
    """
    Class representation of accelerometers table
    """

    __tablename__ = "accelerometers"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    accel_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    tsm_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.tsm_sensors.tsm_id"), nullable=False)
    node_id = DB.Column(DB.Integer)
    accel_number = DB.Column(DB.Integer)
    ts_updated = DB.Column(DB.String(45))
    voltage_max = DB.Column(DB.Float)
    voltage_min = DB.Column(DB.Float)
    in_use = DB.Column(DB.Integer)

    status = DB.relationship(
        "AccelerometerStatus", backref="accelerometers", lazy="joined")

    tsm_sensor = DB.relationship("TSMSensors", backref=DB.backref(
        "accelerometers", lazy="subquery",
        order_by="[Accelerometers.node_id, Accelerometers.accel_number]"
    ), lazy="joined")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> ACCELEROMETER: {self.accel_id}"
                f" TSM ID: {self.tsm_id} Node ID: {self.node_id}"
                f" accel_number: {self.accel_number} ts_updated: {self.ts_updated}"
                f" voltage_max: {self.voltage_max} voltage_min: {self.voltage_min}"
                f" inUse: {self.in_use}")


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

    trigger = DB.relationship(
        OperationalTriggers,
        backref=DB.backref(
            "alert_status", lazy="subquery",
            order_by="desc(AlertStatus.stat_id)"
        ),
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
        f"{SCHEMA_DICT['commons_db']}.loggers.logger_id"), primary_key=True)
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


def get_tilt_table(table_name, schema="senslopedb"):
    """
    """

    class GenericTiltTable(DB.Model):

        """
        """

        __tablename__ = table_name
        __bind_key__ = schema
        __table_args__ = {
            "schema": SCHEMA_DICT[__bind_key__], "extend_existing": True}

        data_id = DB.Column(DB.Integer, primary_key=True)
        ts = DB.Column(DB.DateTime, nullable=False)
        node_id = DB.Column(DB.Integer, nullable=False)
        type_num = DB.Column(DB.Integer, nullable=False)
        xval = DB.Column(DB.Integer)
        yval = DB.Column(DB.Integer)
        zval = DB.Column(DB.Integer)
        batt = DB.Column(DB.Float)
        # is_live = DB.Column(DB.Boolean)

        def __repr__(self):
            return (f"Type <{self.__class__.__name__}> data_id: {self.data_id}"
                    f" ts: {self.ts} node_id: {self.node_id} type_num: {self.type_num}")

    model = GenericTiltTable
    return model


def tilt_table_schema(table):
    """
    """

    class GenericTiltTableSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
        """
        """

        class Meta:
            """
            """
            model = table

    schema = GenericTiltTableSchema
    return schema


def get_rain_table(table_name, schema="senslopedb"):
    """
    """

    class GenericRainTable(DB.Model):

        """
        """

        __tablename__ = table_name
        __bind_key__ = schema
        __table_args__ = {
            "schema": SCHEMA_DICT[__bind_key__], "extend_existing": True}

        data_id = DB.Column(DB.Integer, primary_key=True)
        ts = DB.Column(DB.DateTime, nullable=False)
        rain = DB.Column(DB.Float)
        temperature = DB.Column(DB.Float)
        humidity = DB.Column(DB.Float)
        battery1 = DB.Column(DB.Float)
        battery2 = DB.Column(DB.Float)
        csq = DB.Column(DB.Integer)

        def __repr__(self):
            return (f"Type <{self.__class__.__name__}> data_id: {self.data_id}"
                    f" ts: {self.ts}")

    model = GenericRainTable
    return model


class MarkerDataTags(DB.Model):
    """
    Class representation of marker_data_tags
    """

    __tablename__ = "marker_data_tags"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    marker_tag_id = DB.Column(DB.Integer, primary_key=True)
    data_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['senslopedb']}.marker_data.data_id"))
    ts = DB.Column(DB.DateTime)
    tagger_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.users.user_id"))
    remarks = DB.Column(DB.String(250))

    marker_data = DB.relationship(
        "MarkerData", backref=DB.backref(
            "marker_data_tags", lazy="subquery",
            innerjoin=False, uselist=False
        ),
        lazy="subquery", innerjoin=False, uselist=False)
    tagger = DB.relationship(
        "Users", backref=DB.backref("marker_tags", lazy="dynamic"),
        lazy="joined", innerjoin=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> marker_tag_id: {self.marker_tag_id}"
                f" data_id: {self.data_id} ts: {self.ts}"
                f" tagger_id: {self.tagger_id} remarks: {self.remarks}")


#############################
# End of Class Declarations #
#############################


################################
# Start of Schema Declarations #
################################

class EarthquakeAlertsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Analysis Earthquake Alerts class
    """
    distance = fields.Decimal(as_string=True)
    eq_event = MARSHMALLOW.Nested(
        "EarthquakeEventsSchema", exclude=("eq_alerts", ))
    site_id = fields.Integer()
    site = MARSHMALLOW.Nested("SitesSchema", only=(
        "site_code", "purok", "sitio", "barangay", "municipality", "province"))

    class Meta:
        """Saves table class structure as schema model"""
        model = EarthquakeAlerts


class AccelerometerStatusSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Analysis Accelerometer Status class
    """

    ts_flag = fields.DateTime("%Y-%m-%d %H:%M:%S")

    class Meta:
        """Saves table class structure as schema model"""
        model = AccelerometerStatus


class AccelerometersSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Analysis Accelerometer Status class
    """
    tsm_id = fields.Integer()
    # NOTE EXCLUDE: accelerometers
    status = MARSHMALLOW.Nested("AccelerometerStatusSchema", many=True)

    class Meta:
        """Saves table class structure as schema model"""
        model = Accelerometers


class EarthquakeEventsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Analysis Earthquake Events class
    """
    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
    magnitude = fields.Decimal(as_string=True)
    depth = fields.Decimal(as_string=True)
    latitude = fields.Decimal(as_string=True)
    longitude = fields.Decimal(as_string=True)
    critical_distance = fields.Decimal(as_string=True)
    eq_alerts = MARSHMALLOW.Nested(EarthquakeAlertsSchema,
                                   many=True, exclude=("eq_event", ))

    class Meta:
        """Saves table class structure as schema model"""
        model = EarthquakeEvents


class SiteMarkersSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
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
        unknown = EXCLUDE
        exclude = ["history"]


class MarkersSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Markers class
    """

    site = MARSHMALLOW.Nested("SitesSchema")
    marker_data = MARSHMALLOW.Nested(
        "MarkerDataSchema", many=True, exclude=("marker",))
    marker_history = MARSHMALLOW.Nested(
        "MarkerHistorySchema", many=True, exclude=("marker",))
    marker_alerts = MARSHMALLOW.Nested(
        "MarkerAlertsSchema", many=True, exclude=("marker",))

    class Meta:
        """Saves table class structure as schema model"""
        model = Markers


class MarkerHistorySchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of MarkerHistory class
    """
    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
    marker_name = MARSHMALLOW.Nested(
        "MarkerNamesSchema")  # NOTE EXCLUDE: exclude=("history",)

    class Meta:
        """Saves table class structure as schema model"""
        model = MarkerHistory
        exclude = ["marker_copy"]
        unknown = EXCLUDE


class MarkerNamesSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of MarkerNames class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = MarkerNames


class MarkerObservationsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Analysis Marker Observations class
    """
    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
    site = MARSHMALLOW.Nested("SitesSchema")
    marker_data = MARSHMALLOW.Nested(
        "MarkerDataSchema", many=True, exclude=("marker_observation_report",))

    class Meta:
        """Saves table class structure as schema model"""
        model = MarkerObservations


class MarkerDataSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of MarkerData class
    """

    # marker = MARSHMALLOW.Nested("Markers", exclude=("marker_data",))
    marker_data_tags = MARSHMALLOW.Nested(
        "Marker_data_tags", exclude=("marker_data",))
    marker_observation_report = MARSHMALLOW.Nested(
        "MarkerObservationsSchema", exclude=("marker_data",))

    class Meta:
        """Saves table class structure as schema model"""
        model = MarkerData


class MarkerAlertsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of MarkerAlerts class
    """
    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
    marker = MARSHMALLOW.Nested("Markers")

    class Meta:
        """Saves table class structure as schema model"""
        model = MarkerAlerts


class RainfallAlertsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of RainfallAlerts class
    """
    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")

    class Meta:
        """Saves table class structure as schema model"""
        model = RainfallAlerts
        unknown = EXCLUDE


class RainfallThresholdsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of RainfallThresholds class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = RainfallThresholds
        unknown = EXCLUDE


class RainfallGaugesSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
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
        unknown = EXCLUDE


class RainfallDataTagsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of RainfallDataTags class
    """

    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_start = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_end = fields.DateTime("%Y-%m-%d %H:%M:%S")
    tagger = MARSHMALLOW.Nested(UsersSchema)  # exclude: rainfall_data_tags

    class Meta:
        """Saves table class structure as schema model"""
        model = RainfallDataTags
        unknown = EXCLUDE


class RainfallPrioritiesSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of RainfallPriorities class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = RainfallPriorities
        unknown = EXCLUDE


class TSMSensorsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of TSMSensors class
    """
    logger = MARSHMALLOW.Nested(LoggersSchema, exclude=(
        "tsm_sensor",))  # NOTE EXCLUDE: "site",
    accelerometers = MARSHMALLOW.Nested("AccelerometersSchema", many=True)

    class Meta:
        """Saves table class structure as schema model"""
        model = TSMSensors
        unknown = EXCLUDE
        exclude = ["tsm_alert", "node_alerts", "data_presence"]


class TSMAlertsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of TSMAlerts class
    """
    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_updated = fields.DateTime("%Y-%m-%d %H:%M:%S")

    class Meta:
        """Saves table class structure as schema model"""
        model = TSMAlerts


class AlertStatusSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of AlertStatus class
    """

    user = MARSHMALLOW.Nested(UsersSchema)
    ts_ack = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_last_retrigger = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_set = fields.DateTime("%Y-%m-%d %H:%M:%S")

    class Meta:
        """Saves table class structure as schema model"""
        model = AlertStatus
        unknown = EXCLUDE


class DataPresenceRainGaugesSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of DataPresenceRainGauges class
    """
    last_data = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_updated = fields.DateTime("%Y-%m-%d %H:%M:%S")
    rain_gauge = MARSHMALLOW.Nested(
        RainfallGaugesSchema)  # NOTE EXCLUDE: data_presence

    class Meta:
        """Saves table class structure as schema model"""
        model = DataPresenceRainGauges
        unknown = EXCLUDE


class DataPresenceTSMSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of DataPresenceTSM class
    """
    last_data = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_updated = fields.DateTime("%Y-%m-%d %H:%M:%S")
    tsm_sensor = MARSHMALLOW.Nested(TSMSensorsSchema)
    # NOTE EXCLUDE: data_presence, logger.data_presence, "tsm_alert", "site", "node_alerts"

    class Meta:
        """Saves table class structure as schema model"""
        model = DataPresenceTSM
        unknown = EXCLUDE


class DataPresenceLoggersSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of DataPresenceLoggers class
    """
    last_data = fields.DateTime("%Y-%m-%d %H:%M:%S")
    ts_updated = fields.DateTime("%Y-%m-%d %H:%M:%S")
    logger_id = fields.Integer()
    logger = MARSHMALLOW.Nested(
        LoggersSchema, exclude=("tsm_sensor", "logger_model"))  # NOTE EXCLUDE: "data_presence",

    class Meta:
        """Saves table class structure as schema model"""
        model = DataPresenceLoggers
        unknown = EXCLUDE


class MarkerDataTagsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of MarkerDataTags class
    """

    ts = fields.DateTime("%Y-%m-%d %H:%M:%S")
    data_id = fields.Integer()
    tagger = MARSHMALLOW.Nested(UsersSchema)  # exclude=("marker_tags", )

    class Meta:
        """Saves table class structure as schema model"""
        model = MarkerDataTags
