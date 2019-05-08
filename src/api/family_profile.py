"""
Inbox Functions Controller File
"""

from flask import Blueprint, jsonify
from connection import DB, SOCKETIO
from src.models.family_profile import (
    FamilyProfile, FamilyProfileSchema)

FAMILY_PROFILE_BLUEPRINT = Blueprint("family_profile_blueprint", __name__)


@FAMILY_PROFILE_BLUEPRINT.route("/family_profile/get_all_family_profile", methods=["GET"])
def get_all_family_profile():
    query = FamilyProfile.query.all()

    result = FamilyProfileSchema(
        many=True).dump(query).data

    return jsonify(result)


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


@FAMILY_PROFILE_BLUEPRINT.route("/family_profile/save_family_profile", methods=["GET"])
def save_family_profile():
    # data = request.get_json()
    data = {
        "family_profile_id": 0,
        "members_count": 5,
        "vulnerable_members_count": 2,
        "vulnerability_nature": "testUpdate"
    }

    status = None
    message = ""

    try:
        family_profile_id = data["family_profile_id"]
        members_count = data["members_count"]
        vulnerable_members_count = data["vulnerable_members_count"]
        vulnerability_nature = data["vulnerability_nature"]

        if family_profile_id == 0:  # add
            insert_data = FamilyProfile(members_count=members_count,
                                        vulnerable_members_count=vulnerable_members_count, vulnerability_nature=vulnerability_nature)
            DB.session.add(insert_data)
            message = "Successfully added new data!"
        else:  # update
            update_data = FamilyProfile.query.get(family_profile_id)
            update_data.members_count = members_count
            update_data.vulnerable_members_count = vulnerable_members_count
            update_data.vulnerability_nature = vulnerability_nature

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


@FAMILY_PROFILE_BLUEPRINT.route("/family_profile/delete_family_profile", methods=["GET"])
def delete_family_profile():
    # data = request.get_json()
    data = {
        "family_profile_id": 3
    }
    status = None
    message = ""

    family_profile_id = data["family_profile_id"]

    try:
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
