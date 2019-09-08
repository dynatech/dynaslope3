"""
Inbox Functions Controller File
"""

from flask import Blueprint, jsonify, request
from connection import DB, SOCKETIO
from src.models.resources_and_capacities import (
    ResourcesAndCapacities, ResourcesAndCapacitiesSchema)

RESOURCES_AND_CAPACITIES_BLUEPRINT = Blueprint(
    "resources_and_capacities_blueprint", __name__)


@RESOURCES_AND_CAPACITIES_BLUEPRINT.route("/resources_and_capacities/get_all_resources_and_capacities", methods=["GET"])
def get_all_resources_and_capacities():
    query = ResourcesAndCapacities.query.order_by(
        ResourcesAndCapacities.resources_and_capacities_id.desc()).all()

    result = ResourcesAndCapacitiesSchema(
        many=True).dump(query).data
    data = []
    for row in result:
        data.append({
            "resources_and_capacities_id": row["resources_and_capacities_id"],
            "resource_and_capacity": row["resource_and_capacity"],
            "status": row["status"],
            "owner": row["owner"]
        })
    return jsonify(data)


@RESOURCES_AND_CAPACITIES_BLUEPRINT.route("/resources_and_capacities/get_resources_and_capacities_data", methods=["GET"])
def get_resources_and_capacities_data():
    # data = request.get_json()
    data = {
        "resources_and_capacities_id": 1
    }
    resources_and_capacities_id = data["resources_and_capacities_id"]
    query = ResourcesAndCapacities.query.filter(
        ResourcesAndCapacities.resources_and_capacities_id == resources_and_capacities_id).first()

    result = ResourcesAndCapacitiesSchema().dump(query).data

    return jsonify(result)


@RESOURCES_AND_CAPACITIES_BLUEPRINT.route("/resources_and_capacities/save_resources_and_capacities", methods=["GET", "POST"])
def save_resources_and_capacities():
    data = request.get_json()
    if data is None:
        data = request.form
    # data = {
    #     "resources_and_capacities_id": 2,
    #     "resource_and_capacity": "updated",
    #     "status": "updated",
    #     "owner": "updated"
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
        print(data)
        print(data["resources_and_capacities_id"])

        resources_and_capacities_id = int(data["resources_and_capacities_id"])
        resource_and_capacity = str(data["resource_and_capacity"])
        status = str(data["status"])
        owner = str(data["owner"])

        if resources_and_capacities_id == 0:
            insert_data = ResourcesAndCapacities(resource_and_capacity=resource_and_capacity,
                                                 status=status, owner=owner)
            DB.session.add(insert_data)
            message = "Successfully added new data!"
        else:
            update_data = ResourcesAndCapacities.query.get(
                resources_and_capacities_id)
            update_data.resource_and_capacity = resource_and_capacity
            update_data.status = status
            update_data.owner = owner

            message = "Successfully updated data!"

        DB.session.commit()
        status = True
    except Exception as err:
        DB.session.rollback()
        status = False
        message = "Something went wrong, Please try again"

    feedback = {
        "status": status,
        "message": message
    }
    return jsonify(feedback)


@RESOURCES_AND_CAPACITIES_BLUEPRINT.route("/resources_and_capacities/delete_resources_and_capacities", methods=["GET", "POST"])
def delete_resources_and_capacities():
    data = request.get_json()
    if data is None:
        data = request.form
    # data = {
    #     "resources_and_capacities_id": 3
    # }
    status = None
    message = ""

    resources_and_capacities_id = int(data["resources_and_capacities_id"])

    try:
        ResourcesAndCapacities.query.filter_by(
            resources_and_capacities_id=resources_and_capacities_id).delete()
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
