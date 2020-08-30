"""
Deployment Form functions controller file
"""

from flask import Blueprint, jsonify, request
from connection import DB
from src.utils.deployment_logs import (
    create_table_for_sensors_data,
    save_all_deployment_data,
    loggers_data, update_logger_details,
    update_logger_mobile, update_tsm,
    update_accelerometer, update_rain_gauge
)

DEPLOYMENT_LOGS_BLUEPRINT = Blueprint("deployment_logs_blueprint", __name__)

@DEPLOYMENT_LOGS_BLUEPRINT.route("/deployment_logs/save_deployment_logs", methods=["GET", "POST"])
def save_deployment_logs():
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


@DEPLOYMENT_LOGS_BLUEPRINT.route("/deployment_logs/get_loggers_data", methods=["GET", "POST"])
def get_loggers_data():
    """
    Function that get loggers data
    """
    data = loggers_data()

    return jsonify(data)

@DEPLOYMENT_LOGS_BLUEPRINT.route("/deployment_logs/save_data_update", methods=["GET", "POST"])
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
        data_to_update = data["data_to_update"]
        if data_to_update == "loggers":
            update_logger_details(data)
        elif data_to_update == "mobile":
            update_logger_mobile(data)
        elif data_to_update == "tsm":
            update_tsm(data)
        elif data_to_update == "accel":
            update_accelerometer(data)
        elif data_to_update == "rain_gauge":
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