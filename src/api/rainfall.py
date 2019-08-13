"""
"""

from flask import Blueprint, jsonify, request
from datetime import time
from connection import DB, SOCKETIO
import analysis.rainfall.rainfall as rainfall

RAINFALL_BLUEPRINT = Blueprint(
    "rainfall_blueprint", __name__)


@RAINFALL_BLUEPRINT.route("/rainfall/get_rainfall_data", methods=["GET", "POST"])
@RAINFALL_BLUEPRINT.route("/rainfall/get_rainfall_data/<site_code>", methods=["GET", "POST"])
@RAINFALL_BLUEPRINT.route("/rainfall/get_rainfall_data/<site_code>/<end_ts>", methods=["GET", "POST"])
def get_rainfall_data(site_code=None, end_ts=None):
    sc = site_code
    ts = end_ts

    if site_code is None:
        data = request.get_json()
        sc = data["site_code"]
        ts = data["date"]

    rainfall_data = rainfall.main(
        sc, end=ts, print_plot=True, save_plot=False, days=3)
    return rainfall_data


@RAINFALL_BLUEPRINT.route("/rainfall/get_rainfall_plot_data/<site_code>", methods=["GET", "POST"])
@RAINFALL_BLUEPRINT.route("/rainfall/get_rainfall_plot_data/<site_code>/<end_ts>", methods=["GET", "POST"])
def get_rainfall_plot_data(site_code, end_ts=None):
    ts = end_ts
    if end_ts is None:
        ts = time.strftime("%Y-%m-%d %H:%M:%S")

    rainfall_data = rainfall.main(
        site_code=site_code, end=ts, print_plot=True, save_plot=False, days=7)
    final_data = []

    return rainfall_data
