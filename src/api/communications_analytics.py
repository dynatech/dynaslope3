"""
Communications Analytics Util
"""

from flask import Blueprint, jsonify, request
from connection import DB

from src.utils.communications_analytics import (
    get_ewi_sms, get_ewi_ack, get_gnd_meas
)


COMMUNICATIONS_ANALYTICS_BLUEPRINT = Blueprint(
    "communications_analytics_blueprint", __name__)


@COMMUNICATIONS_ANALYTICS_BLUEPRINT.route("/comms_analytics/get_comms_analytics_data", methods=["GET", "POST"])
def get_comms_analytics_data():
    """
    Functions that gets communications analytics data
    """
    status = None
    message = ""

    data = request.get_json()
    if data is None:
        data = request.form

    chart_type = data["chart_type"]
    start_ts = data["start_ts"]
    end_ts = data["end_ts"]
    charts_data = []
    try:
        if chart_type == "sms":
            charts_data = get_ewi_sms(start_ts, end_ts)
        elif chart_type == "ack":
            site = data["site"]
            site_filter = None
            if site:
                site_filter = site["data"]["site_code"]
            charts_data = get_ewi_ack(start_ts, end_ts, site_filter=site_filter)
        elif chart_type == "ground_meas":
            charts_data = get_gnd_meas(start_ts, end_ts)

        status = True
    except Exception as err:
        print(err)
        status = False
        message = f"Error: {err}"

    feedback = {
        "status": status,
        "message": message,
        "data": charts_data
    }

    return jsonify(feedback)
