"""
"""

from flask import Blueprint, jsonify, request
import os
import analysis.rainfall.rainfall as rain
from connection import DB, SOCKETIO
from src.models.sensor_maintenance import (
    SensorMaintenance, SensorMaintenanceSchema)

RAINFALL_BLUEPRINT = Blueprint(
    "rainfall_blueprint", __name__)


@RAINFALL_BLUEPRINT.route("/rainfall/get_rainfall_data", methods=["GET", "POST"])
def get_rainfall_data():
    data = request.get_json()
    rainfall_data = rain.main(data['site_code'], end=data['date'], print_plot=True, save_plot=False, days=3)
    return rainfall_data
