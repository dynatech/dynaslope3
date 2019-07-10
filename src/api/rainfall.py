"""
"""

from flask import Blueprint, jsonify, request
import os
import time
import analysis.rainfall.rainfall as rain
from connection import DB, SOCKETIO
from src.models.sensor_maintenance import (
    SensorMaintenance, SensorMaintenanceSchema)

RAINFALL_BLUEPRINT = Blueprint(
    "rainfall_blueprint", __name__)


@RAINFALL_BLUEPRINT.route("/rainfall/get_rainfall_data", methods=["GET", "POST"])
def get_rainfall_data():
    data = request.get_json()
    print(data)
    rainfall_data = rain.main(
        data['site_code'], end=data['date'], print_plot=True, save_plot=False, days=3)
    return rainfall_data


@RAINFALL_BLUEPRINT.route("/rainfall/get_rainfall_plot_data", methods=["GET", "POST"])
def get_rainfall_plot_data():
    current_date_time = time.strftime('%Y-%m-%d %H:%M:%S')
    #current_date_time = "2018-07-10 15:30:00"
    rainfall_data = rain.main(
        site_code="umi", end=current_date_time, print_plot=True, save_plot=False, days=7)
    final_data = []

    return rainfall_data
