"""
Inbox Functions Controller File
"""

from flask import Blueprint, jsonify
from connection import DB, SOCKETIO
from src.models.general_data_tag import (
    GeneralDataTagManager, GeneralDataTagManagerSchema)

GENERAL_DATA_TAG_BLUEPRINT = Blueprint("general_data_tag_blueprint", __name__)


@GENERAL_DATA_TAG_BLUEPRINT.route("/general_data_tag/get_all_tags", methods=["GET"])
def get_general_data_tag():
    gdt_query = GeneralDataTagManager.query.limit(500).all()

    gdt_query_result = GeneralDataTagManagerSchema(
        many=True).dump(gdt_query).data

    return jsonify(gdt_query_result)
