"""
Inbox Functions Controller File
"""

from flask import Blueprint, jsonify
from connection import DB, SOCKETIO
from src.models.hazard_data import (
    HazardData, HazardDataSchema)

HAZARD_DATA_BLUEPRINT = Blueprint(
    "hazard_data_blueprint", __name__)


@HAZARD_DATA_BLUEPRINT.route("/hazard_data/get_all_hazard_data", methods=["GET"])
def get_all_hazard_data():
    query = HazardData.query.all()

    result = HazardDataSchema(
        many=True).dump(query).data

    return jsonify(result)


@HAZARD_DATA_BLUEPRINT.route("/hazard_data/get_hazard_data", methods=["GET"])
def get_hazard_data():
    hazard_data_id = 1
    query = HazardData.query.filter(
        HazardData.hazard_data_id == hazard_data_id).first()

    result = HazardDataSchema().dump(query).data

    return jsonify(result)


@HAZARD_DATA_BLUEPRINT.route("/hazard_data/save_hazard_data", methods=["GET"])
def save_hazard_data():
    # data = request.get_json()
    data = {
        "hazard_data_id": 0,
        "hazard": "UPDATED",
        "speed_of_onset": "UPDATED",
        "early_warning": "UPDATED",
        "impact": "UPDATED"
    }

    status = None
    message = ""

    try:
        hazard_data_id = data["hazard_data_id"]
        hazard = data["hazard"]
        speed_of_onset = data["speed_of_onset"]
        early_warning = data["early_warning"]
        impact = data["impact"]

        if hazard_data_id == 0:  # add
            insert_data = HazardData(hazard=hazard,
                                     speed_of_onset=speed_of_onset, early_warning=early_warning, impact=impact)
            DB.session.add(insert_data)
            message = "Successfully added new data!"
        else:  # update
            update_data = HazardData.query.get(hazard_data_id)
            update_data.hazard = hazard
            update_data.speed_of_onset = speed_of_onset
            update_data.early_warning = early_warning
            update_data.impact = impact

            print("update")
            message = "Successfully updated data!"

        DB.session.commit()
        status = True
    except Exception as err:
        print(err)
        DB.session.rollback()
        status = False
        message = "Something went wrong, Please try again"

    feedback = {
        "status": status,
        "message": message
    }
    return jsonify(feedback)


@HAZARD_DATA_BLUEPRINT.route("/hazard_data/delete_hazard_data", methods=["GET"])
def delete_hazard_data():
    # data = request.get_json()
    data = {
        "hazard_data_id": 3
    }
    status = None
    message = ""

    hazard_data_id = data["hazard_data_id"]

    try:
        HazardData.query.filter_by(
            hazard_data_id=hazard_data_id).delete()
        DB.session.commit()
        message = "Successfully deleted data!"
        status = True
    except Exception as err:
        DB.session.rollback()
        message = "Something went wrong, Please try again"
        status = False
        print(err)

    feedback = {
        "status": status,
        "message": message
    }
    return jsonify(feedback)
