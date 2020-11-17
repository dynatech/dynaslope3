"""
Communications Analytics Util
"""

# from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from connection import DB

from src.utils.communications_analytics import (
    get_ewi_sms, get_ewi_ack, get_gnd_meas
)

from src.models.sites import Sites

COMMUNICATIONS_ANALYTICS_BLUEPRINT = Blueprint(
    "communications_analytics_blueprint", __name__)


@COMMUNICATIONS_ANALYTICS_BLUEPRINT.route("/comms_analytics/test_ewi_sms", methods=["GET", "POST"])
def test_ewi_sms():
    data = get_ewi_ack()
    # sites = Sites.query.filter(Sites.active == 1).all()
    # site_codes = []

    # for row in sites:
    #     site_codes.append(row.site_code)
    # print(site_codes)
    return jsonify(data)


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

    # data = get_ewi_ack()

    return jsonify("data")