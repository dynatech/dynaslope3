"""
"""

from datetime import time
from flask import Blueprint, jsonify, request
from src.utils.rainfall import get_rainfall_plot_data, get_all_site_rainfall_data

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

    plot_data = get_rainfall_plot_data(site_code, ts, days=7)
    return jsonify(plot_data)

@RAINFALL_BLUEPRINT.route("/rainfall/get_all_site_rainfall_data", methods=["GET"])
def get_all_site_rainfall_datas():

    data = get_all_site_rainfall_data()
    print(data)
    return jsonify(data)
