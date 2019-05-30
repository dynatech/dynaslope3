"""
"""

from flask import Blueprint, jsonify, request
import os
from connection import DB, SOCKETIO
from src.models.sensor_maintenance import (
    SensorMaintenance, SensorMaintenanceSchema)

SENSOR_MAINTENANCE_BLUEPRINT = Blueprint(
    "sensor_maintenance_blueprint", __name__)
