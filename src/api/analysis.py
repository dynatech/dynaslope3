"""
"""

import os
import json
import requests
from flask import Blueprint, jsonify, request
from connection import DB
from src.models.analysis import (
    DataPresenceRainGauges, DataPresenceRainGaugesSchema,
    RainfallGauges, TSMSensors, Loggers,
    DataPresenceTSM, DataPresenceTSMSchema,
    DataPresenceLoggers, DataPresenceLoggersSchema,
    EarthquakeEvents, EarthquakeEventsSchema)
from src.utils.surficial import get_surficial_data_presence

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
        order = RainfallGauges.gauge_name
        filter_attr = RainfallGauges.gauge_name
    elif group == "tsm":
        table = DataPresenceTSM
        options = DB.joinedload("tsm_sensor")
        schema = DataPresenceTSMSchema(many=is_many)
        join_table = [TSMSensors, Loggers]
        order = Loggers.logger_name
        filter_attr = Loggers.logger_name
    elif group == "loggers":
        table = DataPresenceLoggers
        schema = DataPresenceLoggersSchema(many=is_many)
        join_table = [Loggers]
        order = Loggers.logger_name
        filter_attr = Loggers.logger_name
    elif group == "surficial":
        pass
    else:
        return "Data group inputs for querying data presence can only be 'rain_gauges', 'surficial', 'tsm' or 'loggers'"

    if group != "surficial":
        query = DB.session.query(table)

        if options:
            query = query.options(options)

        for jt in join_table:
            query = query.join(jt)

        if item_name != "all":
            query = query.filter(filter_attr == item_name).first()
        else:
            query = query.order_by(order).all()

        result = schema.dump(query).data
    else:
        result = get_surficial_data_presence()

    return jsonify(result)


@ANALYSIS_BLUEPRINT.route("/analysis/get_earthquake_events", methods=["GET"])
def get_earthquake_events():
    _filter = request.args.get("filter", default=10, type=int)
    # .filter(EarthquakeEvents.eq_id == 13385)
    query = EarthquakeEvents.query.order_by(
        EarthquakeEvents.eq_id.desc()).limit(_filter).all()
    result = EarthquakeEventsSchema(many=True).dump(query).data

    return jsonify(result)


@ANALYSIS_BLUEPRINT.route("/analysis/get_earthquake_alerts", methods=["GET"])
def get_earthquake_alerts():
    limit = request.args.get("limit", default=10, type=int)
    offset = request.args.get("offset", default=0, type=int)

    query = EarthquakeEvents.query.order_by(
        EarthquakeEvents.eq_id.desc()
    ).filter(EarthquakeEvents.eq_alerts.any()
             ).limit(limit).offset(offset).all()
    data = EarthquakeEventsSchema(many=True).dump(query).data

    count = EarthquakeEvents.query.filter(EarthquakeEvents.eq_alerts.any()
                                          ).count()

    result = {
        "count": count,
        "data": data
    }

    # query = EarthquakeAlerts.query.order_by(
    #     EarthquakeAlerts.ea_id.desc()).all()
    # result = EarthquakeAlertsSchema(many=True).dump(query).data

    return jsonify(result)


@ANALYSIS_BLUEPRINT.route("/try_chart_rendering", methods=["GET"])
def try_chart_rendering():
    dir_name = os.path.dirname
    path = dir_name(dir_name(__file__))
    save_path = f"{path}\\temp\\charts\\"
    svg = open(f"{save_path}rain.svg", "r")

    options = {
        "svg": svg.read(),
        "outfile": f"{save_path}rain.pdf",
        "type": "pdf",
        "logLevel": 4,
        "fromFile": f"{save_path}rain.svg"
    }
    json_object = json.dumps(options)
    headers = {"Content-type": "application/json"}
    r = requests.post("http://127.0.0.1:7801",
                      data=json_object, headers=headers)
    print(r)
    with open(f"{save_path}rain.pdf", 'wb') as f:
        f.write(r.content)
        f.close()
    return jsonify("Success")
