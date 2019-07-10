
from flask import Blueprint, jsonify
from connection import DB, SOCKETIO
from src.models.analysis import (
    DataPresenceRainGauges, DataPresenceRainGaugesSchema,
    DataPresenceTSM, DataPresenceTSMSchema)

ANALYSIS_BLUEPRINT = Blueprint("analysis_blueprint", __name__)


@ANALYSIS_BLUEPRINT.route("/analysis/get_rain_gauges_data_presence", methods=["GET"])
def get_rain_gauges_data_presence():
    query = DB.session.query(DataPresenceRainGauges).options(
        DB.joinedload("rain_gauge").raiseload("*")).all()

    result = DataPresenceRainGaugesSchema(
        many=True, exclude=("rain_gauge.rainfall_alerts", "rain_gauge.rainfall_priorities")).dump(query).data

    return jsonify(result)


@ANALYSIS_BLUEPRINT.route("/analysis/get_tsm_sensors_data_presence", methods=["GET"])
def get_tsm_sensors_data_presence():
    query = DB.session.query(DataPresenceTSM).options(
        DB.joinedload("tsm_sensor")).all()

    result = DataPresenceTSMSchema(
        many=True).dump(query).data

    return jsonify(result)
