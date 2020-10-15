"""
Deployment Form functions controller file
"""

from flask import Blueprint, jsonify, request
from connection import DB
from src.utils.sensor_deployment import (
    create_table_for_sensors_data,
    save_all_deployment_data,
    get_loggers_data, update_logger_details,
    update_logger_mobile, update_tsm,
    update_accelerometer, update_rain_gauge
)

SENSOR_DEPLOYMENT = Blueprint("sensor_deployment_blueprint", __name__)


@SENSOR_DEPLOYMENT.route("/sensor_deployment/save_logger_deployment", methods=["GET", "POST"])
def save_sensor_deployment():
    """
    Function that save deployment form data
    """
    status = None
    message = ""

    data = request.get_json()
    if data is None:
        data = request.form

    try:
        status, message = save_all_deployment_data(data)

    except Exception as err:
        print(err)
        status = False
        message = err

    feedback = {
        "status": status,
        "message": message
    }

    return jsonify(feedback)


@SENSOR_DEPLOYMENT.route("/sensor_deployment/get_loggers_data", methods=["GET", "POST"])
def wrap_get_loggers_data():
    """
    Function that get loggers data
    """

    data = get_loggers_data()

    return jsonify(data)


@SENSOR_DEPLOYMENT.route("/sensor_deployment/save_data_update", methods=["GET", "POST"])
def save_data_update():
    """
    Function that save updated data
    """
    data = request.get_json()
    if data is None:
        data = request.form

    status = None
    message = ""
    try:
        print(data)
        section = data["section"]
        if section == "loggers":
            update_logger_details(data)
        elif section == "tilt":
            update_tsm(data)
        elif section == "accelerometers":
            update_accelerometer(data)
        elif section == "rain":
            update_rain_gauge(data)

        DB.session.commit()
        status = True
        message = "Successfully updated."
    except Exception as err:
        DB.session.rollback()
        print(err)
        message = err
        status = False

    feedback = {
        "status": status,
        "message": message
    }

    return jsonify(feedback)
