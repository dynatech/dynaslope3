
from flask import Blueprint, jsonify
from connection import DB, SOCKETIO
from src.models.analysis import (
    DataPresenceRainGauges, DataPresenceRainGaugesSchema,
    RainfallGauges, TSMSensors, Loggers,
    DataPresenceTSM, DataPresenceTSMSchema,
    DataPresenceLoggers, DataPresenceLoggersSchema,
    EarthquakeEvents, EarthquakeEventsSchema,
    EarthquakeAlerts, EarthquakeAlertsSchema)

ANALYSIS_BLUEPRINT = Blueprint("analysis_blueprint", __name__)


@ANALYSIS_BLUEPRINT.route("/analysis/get_latest_data_presence/<group>/<item_name>", methods=["GET"])
@ANALYSIS_BLUEPRINT.route("/analysis/get_latest_data_presence/<group>", methods=["GET"])
def get_latest_data_presence(group, item_name="all"):
    """
    group (str):        type of data group to get, 
                        can be "rain_gauges", "tsm" or "loggers"
    item_name (str):    defaults to "all", specific entry to query
                        (e.g. logger name like "agbta" for group "loggers")
    """

    is_many = True
    if item_name != "all":
        is_many = False

    options = False
    if group == "rain_gauges":
        table = DataPresenceRainGauges
        options = DB.joinedload("rain_gauge").raiseload("*")
        schema = DataPresenceRainGaugesSchema(
            many=is_many, exclude=("rain_gauge.rainfall_alerts", "rain_gauge.rainfall_priorities"))
        join_table = [RainfallGauges]
        filter_attr = RainfallGauges.gauge_name
    elif group == "tsm":
        table = DataPresenceTSM
        options = DB.joinedload("tsm_sensor")
        schema = DataPresenceTSMSchema(many=is_many)
        join_table = [TSMSensors, Loggers]
        filter_attr = Loggers.logger_name
    elif group == "loggers":
        table = DataPresenceLoggers
        schema = DataPresenceLoggersSchema(many=is_many)
        join_table = [Loggers]
        filter_attr = Loggers.logger_name
    else:
        return "Data group inputs for querying data presence can only be 'rain_gauges', 'tsm' or 'loggers'"

    query = DB.session.query(table)

    if options:
        query = query.options(options)

    if item_name != "all":
        for jt in join_table:
            query = query.join(jt)

        query = query.filter(filter_attr == item_name).first()
    else:
        query = query.all()

    result = schema.dump(query).data

    return jsonify(result)


@ANALYSIS_BLUEPRINT.route("/analysis/get_earthquake_events", methods=["GET"])
def get_earthquake_events():
    query = EarthquakeEvents.query.order_by(
        EarthquakeEvents.eq_id.desc()).filter(EarthquakeEvents.eq_id == 12935).limit(20).all()
    result = EarthquakeEventsSchema(many=True).dump(query).data

    return jsonify(result)


@ANALYSIS_BLUEPRINT.route("/analysis/get_earthquake_alerts", methods=["GET"])
def get_earthquake_alerts():
    query = EarthquakeAlerts.query.order_by(
        EarthquakeAlerts.ea_id.desc()).all()
    result = EarthquakeAlertsSchema(many=True).dump(query).data

    return jsonify(result)
