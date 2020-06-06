"""
Surficial functions API File
"""

import itertools
import json
from datetime import datetime
from flask import Blueprint, jsonify, request
from connection import DB
from src.models.analysis import SiteMarkersSchema, MarkerHistorySchema
from src.utils.surficial import (
    get_surficial_markers, get_surficial_data, delete_surficial_data,
    create_new_marker, insert_marker_event, insert_new_marker_name
)
from analysis_scripts.analysis.surficial import markeralerts
from src.utils.extra import var_checker


SURFICIAL_BLUEPRINT = Blueprint("surficial_blueprint", __name__)


@SURFICIAL_BLUEPRINT.route("/surficial/get_surficial_markers", methods=["GET"])
@SURFICIAL_BLUEPRINT.route(
    "/surficial/get_surficial_markers/<site_code>",
    methods=["GET"])
@SURFICIAL_BLUEPRINT.route(
    "/surficial/get_surficial_markers/<site_code>/<get_complete_data>",
    methods=["GET"])
def wrap_get_surficial_markers(site_code=None, get_complete_data=None):
    """
        Returns one or all subsurface columns of a site.

        Args:
            site_code -> Can be None if you want to get all columns regardless of site
    """
    markers_schema = SiteMarkersSchema(many=True)
    markers = get_surficial_markers(
        site_code, get_complete_data)

    marker_data = markers_schema.dump(markers).data

    return jsonify(marker_data)


@SURFICIAL_BLUEPRINT.route(
    "/surficial/get_surficial_plot_data/<filter_val>/<start_ts>/<end_ts>",
    methods=["GET"])
def extract_formatted_surficial_data_string(filter_val, start_ts=None, end_ts=None):
    """
    This function prepares the surficial data for chart usage

    filter_val (int or str): site_code or marker_id
    """

    ts_order = request.args.get("order", default="asc", type=str)
    limit = request.args.get("limit", default=None, type=int)
    is_end_of_shift = request.args.get(
        "is_end_of_shift", default="false", type=str)
    start_ts = None if start_ts == "None" else start_ts

    ieos = is_end_of_shift == "true"
    anchor = "marker_data"
    if ieos:
        start_ts = None
        anchor = "marker_observations"
        limit = 10
        ts_order = "desc"

    if isinstance(filter_val, str):
        site_code = filter_val
        surficial_data = get_surficial_data(
            site_code=site_code, ts_order=ts_order,
            start_ts=start_ts, end_ts=end_ts, limit=limit,
            anchor=anchor)
    else:
        marker_id = filter_val
        surficial_data = get_surficial_data(
            marker_id=marker_id, ts_order=ts_order,
            start_ts=start_ts, end_ts=end_ts,
            limit=limit, anchor=anchor)

    markers = get_surficial_markers(site_code=filter_val)

    if ieos:
        temp = []
        for row in surficial_data:
            temp += row.marker_data
        surficial_data = temp

    formatted_list = []
    for marker_row in markers:
        marker_id = marker_row.marker_id
        marker_name = marker_row.marker_name
        in_use = marker_row.in_use

        marker_history = MarkerHistorySchema(
            many=True).dump(marker_row.history).data

        data_set = list(filter(lambda x: x.marker_id ==
                               marker_id, surficial_data))
        marker_string_dict = {
            "marker_id": marker_id,
            "marker_name": marker_name,
            "name": marker_name,
            "in_use": in_use,
            "marker_history": marker_history
        }

        new_list = []
        for item in data_set:
            ts = item.marker_observation.ts
            final_ts = int(ts.timestamp() * 1000)

            new_list.append({
                "x": final_ts, "y": item.measurement, "data_id": item.data_id, "mo_id": item.mo_id})

        new_list = sorted(new_list, key=lambda i: i["x"])
        marker_string_dict["data"] = new_list
        formatted_list.append(marker_string_dict)

    return jsonify(formatted_list)


def extract_formatted_surficial_data_obs(filter_val, ts_order, start_ts=None, end_ts=None, limit=None):
    """
    This function returns SQLAlchemy objects for back-end use.
    """
    surficial_data = get_surficial_data(
        filter_val, ts_order, start_ts, end_ts, limit)

    formatted_list = []
    sorted_data = sorted(
        surficial_data, key=lambda datum: datum.marker_observation.ts)

    for key, group in itertools.groupby(sorted_data, key=lambda datum: datum.marker_observation.ts):
        marker_obs_data_dict = {
            "ts": str(key),
            "data_set": list(group)
        }
        formatted_list.append(marker_obs_data_dict)

    return jsonify(formatted_list)


@SURFICIAL_BLUEPRINT.route("/surficial/update_surficial_data", methods=["POST"])
def wrap_update_surficial_data():
    """
    id_table (str):     value can be 'marker_obs' or 'all'
    id (int):           integer value; data_id for 'one'
                        mo_id for 'all'
    """

    return_json = request.get_json()
    flag = False

    try:
        mo_id = return_json["mo_id"]
        flag = True
    except KeyError:
        mo_id = None

    try:
        data_id = return_json["data_id"]
        flag = True
    except KeyError:
        data_id = None

    if not flag:
        return_val = {
            "message": "No 'mo_id' or 'data_id' passed",
            "status": "error"
        }
    else:
        if mo_id:
            obs = get_surficial_data(mo_id=mo_id, limit=1)
            obs.ts = datetime.strptime(return_json["ts"], "%Y-%m-%d %H:%M:%S")

        if data_id:
            marker_data = get_surficial_data(data_id=data_id, limit=1)
            marker_data.measurement = return_json["measurement"]

        return_val = {
            "message": "Update successful",
            "status": "success"
        }

        DB.session.commit()

    return jsonify(return_val)


@SURFICIAL_BLUEPRINT.route("/surficial/delete_surficial_data", methods=["POST"])
def wrap_delete_surficial_data():
    """
    """

    return_json = request.get_json()
    filter_val = return_json["quantity"]
    surf_id = return_json["id"]

    return_val = {
        "message": "Delete successful",
        "status": "success"
    }

    if filter_val == "one":
        delete_surficial_data(data_id=surf_id)
    elif filter_val == "all":
        delete_surficial_data(mo_id=surf_id)
    else:
        return_val = {
            "message": "Filter value can only be 'one' or 'all",
            "status": "error"
        }

    return jsonify(return_val)


@SURFICIAL_BLUEPRINT.route("/surficial/insert_marker_event", methods=["POST"])
def wrap_insert_marker_event():
    """
    """

    return_json = request.get_json()
    event = return_json["event"]
    ts = datetime.strptime(return_json["ts"], "%Y-%m-%d %H:%M:%S")
    marker_id = return_json["marker_id"]

    try:
        if event not in ["add", "rename", "reposition", "decommission"]:
            raise Exception(
                "Only 'add', 'rename', 'reposition', 'decommission' allowed as events")

        if event == "add":
            marker = create_new_marker(return_json["site_code"])
            marker_id = marker.marker_id

        history = insert_marker_event(marker_id, ts, event)
        history_id = history.history_id

        if event in ["add", "rename"]:
            insert_new_marker_name(history_id, return_json["marker_name"])

        DB.session.commit()

        message = "Successfully added marker event!"
        status = "success"
    except Exception as e:
        DB.session.rollback()
        message = f"Error encountered: {e}"
        status = "error"
        print(e)

    return jsonify({
        "message": message,
        "status": status
    })


@SURFICIAL_BLUEPRINT.route("/surficial/get_surficial_marker_trending_data/<site_code>/<marker_name>/<ts>", methods=["GET"])
def get_surficial_marker_trending_data(site_code, marker_name, ts):
    """
    Get trending data
    """

    # Sample Data
    # site_id = 27
    # marker_id = 89
    # ts = "2019-11-20 08:00:00"

    markers = get_surficial_markers(site_code=site_code)
    marker_row = next(
        (row for row in markers if row.marker_name == marker_name), None)

    if marker_row:
        marker_id = marker_row.marker_id
        site_id = marker_row.site_id
    else:
        return json.dumps({
            "status": "error",
            "message": f"Marker name of Site {site_code.upper()} not existing."
        })

    data = markeralerts.generate_surficial_alert(
        site_id=site_id, ts=ts, marker_id=marker_id, to_json=True)

    has_trend = bool(data["trend_alert"])

    return_obj = {
        "has_trend": has_trend
    }

    if has_trend:
        trending_data = [
            {
                "dataset_name": "velocity_acceleration",
                "dataset": process_velocity_accel_data(data)
            },
            {
                "dataset_name": "displacement_interpolation",
                "dataset": process_displacement_interpolation(data)
            },
            {
                "dataset_name": "velocity_acceleration_time",
                "dataset": process_velocity_accel_time_data(data)
            }
        ]

        return_obj.update({"trending_data": trending_data})

    return json.dumps(return_obj)


def process_velocity_accel_data(data):
    """
    """

    accel_velocity_data = []
    trend_line = []
    threshold_interval = []

    av = data["av"]
    a = av["a"]
    v = av["v"]

    j = len(a)
    i = 0
    while i < j:
        av_list = [v[i], a[i]]
        accel_velocity_data.append(av_list)
        i += 1

    v_thresh = av["v_threshold"]
    j = len(v_thresh)
    i = 0
    while i < j:
        trend_list = [v_thresh[i], av["a_threshold_line"][i]]
        trend_line.append(trend_list)
        threshold_list = [v_thresh[i], av["a_threshold_up"]
                          [i], av["a_threshold_down"][i]]
        threshold_interval.append(threshold_list)
        i += 1

    last_point = [[v[-1], a[-1]]]

    velocity_acceleration = [
        {"name": "Data", "data": accel_velocity_data},
        {"name": "Trend Line", "data": trend_line},
        {"name": "Threshold Interval", "data": threshold_interval},
        {"name": "Last Data Point", "data": last_point}
    ]

    return velocity_acceleration


def process_displacement_interpolation(data):
    """
    """

    displacement_data = []
    interpolation_data = []

    dvt = data["dvt"]
    gnd = dvt["gnd"]
    j = len(gnd["ts"])
    i = 0
    while i < j:
        disp_list = [gnd["ts"][i], gnd["surfdisp"][i]]
        displacement_data.append(disp_list)
        i += 1

    interp = dvt["interp"]
    j = len(interp["ts"])
    i = 0
    while i < j:
        try:
            surfdisp = interp["surfdisp"][i]
        except IndexError:
            surfdisp = 0

        interp_list = [interp["ts"][i], surfdisp]
        interpolation_data.append(interp_list)
        i += 1

    displacement_interpolation = [
        {"name": "Surficial Data", "data": displacement_data},
        {"name": "Interpolation", "data": interpolation_data}
    ]

    return displacement_interpolation


def process_velocity_accel_time_data(data):
    """
    """

    acceleration = []
    velocity = []
    timestamps = []

    vat = data["vat"]
    j = len(vat["ts_n"])
    i = 0
    while i < j:
        try:
            a_n = vat["a_n"][i]
        except IndexError:
            a_n = 0

        try:
            v_n = vat["v_n"][i]
        except IndexError:
            v_n = 0

        acceleration.append(a_n)
        velocity.append(v_n)
        timestamps.append(vat["ts_n"][i])
        i += 1

    velocity_acceleration_time = [
        {"name": "Acceleration", "data": acceleration},
        {"name": "Velocity", "data": velocity},
        {"name": "Timestamps", "data": timestamps}
    ]

    return velocity_acceleration_time
