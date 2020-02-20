"""
Sample docstring
"""

import os
from flask import Blueprint, jsonify, request
from connection import DB
from config import APP_CONFIG
from src.models.analysis import (
    DataPresenceRainGauges, DataPresenceRainGaugesSchema,
    RainfallGauges, TSMSensors, Loggers,
    DataPresenceTSM, DataPresenceTSMSchema,
    DataPresenceLoggers, DataPresenceLoggersSchema,
    EarthquakeEvents, EarthquakeEventsSchema)
from src.utils.surficial import get_surficial_data_presence
from src.utils.chart_rendering import render_charts
from src.utils.rainfall import get_all_site_rainfall_data
from src.utils.earthquake import insert_earthquake_event_to_db

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


@ANALYSIS_BLUEPRINT.route("/analysis/insert_earthquake_event", methods=["POST"])
def insert_earthquake_event():
    """
    """

    data = request.get_json()
    magnitude = data["magnitude"]
    depth = data["depth"]
    lat = data["lat"]
    long = data["long"]
    ts = data["timestamp"]
    issuer = data["issued_by"]

    insert_earthquake_event_to_db(magnitude, depth, lat, long, ts, issuer)

    return jsonify(data)


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



@ANALYSIS_BLUEPRINT.route("/analysis/save_chart_svg", methods=["POST"])
def save_svg():
    data = request.get_json()
    user_id = data["user_id"]
    site_code = data["site_code"]
    chart_type = data["chart_type"]
    svg = data["svg"]

    path = APP_CONFIG["charts_render_path"]
    if not os.path.exists(path):
        os.makedirs(path)

    connection_path = f"{path}/{user_id}/{site_code}"
    if not os.path.exists(connection_path):
        os.makedirs(connection_path)

    file_name = f"{connection_path}/{chart_type}"
    if chart_type == "subsurface":
        file_name += f"_{data['tsm_sensor']}"
    file_name += ".svg"
    f = open(file_name, "w")
    f.write(svg)
    f.close()

    return jsonify("Success")

@ANALYSIS_BLUEPRINT.route("/analysis/rainfall", methods=["GET"])
def wrap_rainfall():
    a = get_all_site_rainfall_data()
    return jsonify(a)


# @ANALYSIS_BLUEPRINT.route("/analysis/test_render", methods=["GET"])
# def test_render():
#     """
#     Just a tester of chart renderer
#     """
#     response = render_charts(77, "umi", ["rainfall"])

#     return jsonify(response)
