"""
"""

from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from connection import DB
from src.utils.rainfall import (
    get_rainfall_plot_data, get_all_site_rainfall_data,
    process_rainfall_information_message,
    save_invalid_rainfall_tag, get_invalid_rainfall_data
)
from src.models.analysis import RainfallDataTagsSchema

RAINFALL_BLUEPRINT = Blueprint(
    "rainfall_blueprint", __name__)


@RAINFALL_BLUEPRINT.route("/rainfall/get_rainfall_plot_data/<site_code>", methods=["GET", "POST"])
@RAINFALL_BLUEPRINT.route("/rainfall/get_rainfall_plot_data/<site_code>/<end_ts>", methods=["GET", "POST"])
@RAINFALL_BLUEPRINT.route("/rainfall/get_rainfall_plot_data/<site_code>/<end_ts>/<days_diff>", methods=["GET", "POST"])
def wrap_get_rainfall_plot_data(site_code, end_ts=None, days_diff=3):
    """
    """

    ts = end_ts
    days_diff = int(days_diff)
    ts_format = "%Y-%m-%d %H:%M:%S"

    if end_ts is None:
        ts = datetime.now().strftime(ts_format)

    start_ts = datetime.strptime(ts, ts_format) - timedelta(days=days_diff)
    start_ts = start_ts.strftime(ts_format)

    plot_data = get_rainfall_plot_data(site_code, ts, days=days_diff)

    for row in plot_data:
        tags = get_invalid_rainfall_data(
            rain_id=row["rain_id"],
            ts_start=start_ts,
            ts_end=ts
        )
        invalid_list = RainfallDataTagsSchema(many=True).dump(tags)
        row["invalid_data"] = invalid_list

    return jsonify(plot_data)


@RAINFALL_BLUEPRINT.route("/rainfall/get_all_site_rainfall_data", methods=["GET", "POST"])
def wrap_get_all_site_rainfall_data():
    """
    API for getting all rainfall data
    """

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


@RAINFALL_BLUEPRINT.route("/rainfall/tag_invalid_data", methods=["POST"])
def tag_invalid_rainfall_data():
    """
    API for saving invalid rainfal data info
    """

    data = request.get_json()

    try:
        save_invalid_rainfall_tag(
            rain_id=data["rain_id"],
            ts_start=data["ts_start"],
            ts_end=data["ts_end"],
            tagger_id=data["tagger_id"],
            observed_data=data["observed_data"],
            remarks=data["remarks"]
        )

        obj = {
            "status": "success",
            "message": "Invalid rainfall tag saved!"
        }

        DB.session.commit()
    except Exception as err:
        print(err)
        obj = {
            "status": "error",
            "message": "Error: saving invalid tag failed!"
        }
        DB.session.rollback()

    return jsonify(obj)
