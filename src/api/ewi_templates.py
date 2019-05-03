"""
Inbox Functions Controller File
"""

from flask import Blueprint, jsonify
from connection import DB, SOCKETIO
from src.models.ewi_templates import (
    EwiTemplates, EwiTemplatesSchema)

EWI_TEMPLATE_BLUEPRINT = Blueprint("ewi_template_blueprint", __name__)


@EWI_TEMPLATE_BLUEPRINT.route("/ewi_templates/get_all_template", methods=["GET"])
def get_all_template():
    query = EwiTemplates.query.limit(500).all()

    result = EwiTemplatesSchema(
        many=True).dump(query).data

    return jsonify(result)


@EWI_TEMPLATE_BLUEPRINT.route("/ewi_templates/get_template_data", methods=["GET"])
def get_template_data():
    template_id = 1
    query = EwiTemplates.query.filter(
        EwiTemplates.template_id == template_id).first()

    result = EwiTemplatesSchema().dump(query).data

    return jsonify(result)
