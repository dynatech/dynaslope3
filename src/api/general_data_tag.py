"""
Inbox Functions Controller File
"""

from flask import Blueprint, jsonify
from connection import DB, SOCKETIO
from src.utils.general_data_tag import get_all_tag
from src.models.general_data_tag import GeneralDataTagManagerSchema

GENERAL_DATA_TAG_BLUEPRINT = Blueprint("general_data_tag_blueprint", __name__)


@GENERAL_DATA_TAG_BLUEPRINT.route("/general_data_tag/get_all_tags", methods=["GET"])
def get_general_data_tag():
    general_data_tag = get_all_tag(tag_id=None)
    schema = GeneralDataTagManagerSchema(
        many=True).dump(general_data_tag).data

    return jsonify(schema)


def insert_tag():
    """
    Function that insert tag
    """


def update_tag():
    """
    Function that insert tag
    """
