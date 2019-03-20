"""
Inbox Functions Controller File
"""

from flask import Blueprint, jsonify
from connection import DB, SOCKETIO
from src.models.general_data_tag import (
    GeneralDataTagManager, GeneralDataTagManagerSchema)

EWI_TEMPLATE_BLUEPRINT = Blueprint("ewi_template_blueprint", __name__)


@EWI_TEMPLATE_BLUEPRINT.route("/ewi_template/get_all_template", methods=["GET"])
def get_general_data_tag():
    gdt_query = GeneralDataTagManager.query.limit(500).all()

    gdt_query_result = GeneralDataTagManagerSchema(
        many=True).dump(gdt_query).data

    return jsonify(gdt_query_result)
