"""
Inbox Functions Controller File
"""

import time
from flask import Blueprint, jsonify, request
from connection import DB, SOCKETIO
from src.models.family_profile import (
    FamilyProfile, FamilyProfileSchema, RiskProfile, RiskProfileSchema)

FAMILY_PROFILE_BLUEPRINT = Blueprint("family_profile_blueprint", __name__)


@FAMILY_PROFILE_BLUEPRINT.route("/family_profile/get_all_family_profile", methods=["GET"])
def get_all_family_profile():
    query = FamilyProfile.query.order_by(
        FamilyProfile.family_profile_id.desc()).all()

    result = FamilyProfileSchema(
        many=True).dump(query).data
    data = []
    for row in result:
        data.append({
            "family_profile_id": row["family_profile_id"],
            "members_count": row["members_count"],
            "vulnerable_members_count": row["vulnerable_members_count"],
            "vulnerability_nature": row["vulnerability_nature"]
        })
    return jsonify(data)


@FAMILY_PROFILE_BLUEPRINT.route("/family_profile/get_all_risk_profile", methods=["GET"])
def get_all_risk_profile():
    query = RiskProfile.query.order_by(
        RiskProfile.risk_profile_id.desc()).all()

    result = RiskProfileSchema(
        many=True).dump(query).data
    data = []
    for row in result:
        data.append({
            "risk_profile_id": row["risk_profile_id"],
            "entry": row["entry"],
            "timestamp": str(row["timestamp"])
        })
    return jsonify(data)


@FAMILY_PROFILE_BLUEPRINT.route("/family_profile/get_family_profile_data", methods=["GET"])
def get_family_profile_data():
    # data = request.get_json()
    data = {
        "family_profile_id": 1
    }

    family_profile_id = data["family_profile_id"]
    query = FamilyProfile.query.filter(
        FamilyProfile.family_profile_id == family_profile_id).first()

    result = FamilyProfileSchema().dump(query).data

    return jsonify(result)


@FAMILY_PROFILE_BLUEPRINT.route("/family_profile/save_family_profile", methods=["GET", "POST"])
def save_family_profile():
    data = request.get_json()
    if data is None:
        data = request.form
    # data = {
    #     "family_profile_id": 0,
    #     "members_count": 5,
    #     "vulnerable_members_count": 2,
    #     "vulnerability_nature": "testUpdate"
    # }

    status = None
    message = ""


    try:
        if data["value"] is not None:
            data = data["value"]
    except KeyError:
        print("Value is defined.")
        pass 


    try:

        family_profile_id = int(data["family_profile_id"])
        members_count = str(data["members_count"])
        vulnerable_members_count = str(data["vulnerable_members_count"])
        vulnerability_nature = str(data["vulnerability_nature"])

        if family_profile_id == 0:
            insert_data = FamilyProfile(members_count=members_count,
                                        vulnerable_members_count=vulnerable_members_count, vulnerability_nature=vulnerability_nature)
            DB.session.add(insert_data)
            message = "Successfully added new data!"
        else:
            update_data = FamilyProfile.query.get(family_profile_id)
            update_data.members_count = members_count
            update_data.vulnerable_members_count = vulnerable_members_count
            update_data.vulnerability_nature = vulnerability_nature

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


@FAMILY_PROFILE_BLUEPRINT.route("/family_profile/save_risk_profile", methods=["GET", "POST"])
def save_risk_profile():
    data = request.get_json()
    if data is None:
        data = request.form
    current_date_time = time.strftime('%Y-%m-%d %H:%M:%S')
    # data = {
    #     "family_profile_id": 0,
    #     "members_count": 5,
    #     "vulnerable_members_count": 2,
    #     "vulnerability_nature": "testUpdate"
    # }

    status = None
    message = ""

    try:
        if data["value"] is not None:
            data = data["value"]
    except KeyError:
        print("Value is defined.")
        pass 


    try:

        risk_profile_id = int(data["risk_profile_id"])
        entry = str(data["entry"])

        if risk_profile_id == 0:
            insert_data = RiskProfile(entry=entry, timestamp=current_date_time)
            DB.session.add(insert_data)
            message = "Successfully added new data!"
        else:
            update_data = RiskProfile.query.get(risk_profile_id)
            update_data.entry = entry
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


@FAMILY_PROFILE_BLUEPRINT.route("/family_profile/delete_family_profile", methods=["GET", "POST"])
def delete_family_profile():
    data = request.get_json()
    if data is None:
        data = request.form
    # data = {
    #     "family_profile_id": 3
    # }
    status = None
    message = ""

    try:
        family_profile_id = int(data["family_profile_id"])
        FamilyProfile.query.filter_by(
            family_profile_id=family_profile_id).delete()
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


@FAMILY_PROFILE_BLUEPRINT.route("/family_profile/delete_risk_profile", methods=["GET", "POST"])
def delete_risk_profile():
    data = request.get_json()
    if data is None:
        data = request.form
    # data = {
    #     "risk_profile_id": 3
    # }
    status = None
    message = ""

    try:
        risk_profile_id = int(data["risk_profile_id"])

        RiskProfile.query.filter_by(
            risk_profile_id=risk_profile_id).delete()
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
