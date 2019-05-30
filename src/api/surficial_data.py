from flask import Blueprint, jsonify, request
from connection import DB, SOCKETIO


SURFICIAL_DATA_BLUEPRINT = Blueprint(
    "surficial_data_blueprint", __name__)


@SURFICIAL_DATA_BLUEPRINT.route("/situation_report/get_surficial_data", methods=["GET"])
def get_surficial_data():

    return jsonify("eweqwewe")


@SURFICIAL_DATA_BLUEPRINT.route("/situation_report/get_current_measurement", methods=["GET"])
def get_current_measurement():

    return jsonify("eweqwewe")
