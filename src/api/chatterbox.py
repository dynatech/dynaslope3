"""
"""

from flask import Blueprint, jsonify
from src.models.inbox_outbox import SmsTagsSchema
from src.utils.chatterbox import get_quick_inbox, get_message_tag_options
from src.utils.ewi import create_ewi_message
from src.utils.surficial import check_if_site_has_active_surficial_markers

CHATTERBOX_BLUEPRINT = Blueprint("chatterbox_blueprint", __name__)


@CHATTERBOX_BLUEPRINT.route("/chatterbox/quick_inbox", methods=["GET"])
def wrap_get_quick_inbox():
    """
    """

    messages = get_quick_inbox()
    return jsonify(messages)


@CHATTERBOX_BLUEPRINT.route("/chatterbox/get_message_tag_options/<source>", methods=["GET"])
def wrap_get_message_tag_options(source):
    """
    """

    tags = get_message_tag_options(source)
    sms_tags = SmsTagsSchema(many=True).dump(tags).data

    return jsonify(sms_tags)


@CHATTERBOX_BLUEPRINT.route("/chatterbox/get_ewi_message/<release_id>", methods=["GET"])
def wrap_get_ewi_message(release_id):
    """
    """

    ewi_msg = create_ewi_message(release_id)
    return ewi_msg
