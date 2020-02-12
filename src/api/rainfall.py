"""
"""
import json
from datetime import time
from flask import Blueprint, jsonify, request
from src.utils.rainfall import (
    get_rainfall_plot_data, get_all_site_rainfall_data,
    process_rainfall_information_message
)

RAINFALL_BLUEPRINT = Blueprint(
    "rainfall_blueprint", __name__)


@RAINFALL_BLUEPRINT.route("/rainfall/get_rainfall_data", methods=["GET", "POST"])
@RAINFALL_BLUEPRINT.route("/rainfall/get_rainfall_data/<site_code>", methods=["GET", "POST"])
@RAINFALL_BLUEPRINT.route("/rainfall/get_rainfall_data/<site_code>/<end_ts>", methods=["GET", "POST"])
def get_rainfall_data(site_code=None, end_ts=None):
    """
    """

    sc = site_code
    ts = end_ts

    if site_code is None:
        data = request.get_json()
        sc = data["site_code"]
        ts = data["date"]

    rainfall_data = get_rainfall_plot_data(sc, ts, days=3)
    return rainfall_data


@RAINFALL_BLUEPRINT.route("/rainfall/get_rainfall_plot_data/<site_code>", methods=["GET", "POST"])
@RAINFALL_BLUEPRINT.route("/rainfall/get_rainfall_plot_data/<site_code>/<end_ts>", methods=["GET", "POST"])
def wrap_get_rainfall_plot_data(site_code, end_ts=None):
    """
    """

    ts = end_ts
    if end_ts is None:
        ts = time.strftime("%Y-%m-%d %H:%M:%S")

    plot_data = get_rainfall_plot_data(site_code, ts, days=3)
    return jsonify(plot_data)


@RAINFALL_BLUEPRINT.route("/rainfall/get_all_site_rainfall_data", methods=["GET", "POST"])
def get_all_site_rainfall_datas():
    data = request.get_json()
    try:
        site_details = data["site_details"]
        is_express = data["is_express"]
        date_time = data["date_time"]
        as_of = data["as_of"]
        site_codes_list = []

        for row in site_details:
            site_codes_list.append(row["site_code"])
        site_codes_list.sort()
        site_codes_string = ','.join(site_codes_list)

        rainfall_summary = get_all_site_rainfall_data(
            site_codes_string=site_codes_string, end_ts=date_time)
        rain_data = process_rainfall_information_message(
            rainfall_summary, site_details, as_of, is_express)
        status = True
        message = "Rain information successfully loaded!"
    except Exception as err:
        status = False
        message = "Something went wrong, Please try again."
        rain_data = ""
        print(err)

    feedback = {
        "status": status,
        "message": message,
        "ewi": rain_data
    }

    return jsonify(feedback)
