"""
Inbox Functions Controller File
"""

from flask import Blueprint, jsonify
from connection import DB, SOCKETIO
from src.models.inbox_outbox import SmsOutboxRelationship, SmsOutboxRelationshipSchema, SmsOutboxUserStatus

INBOX_OUTBOX_BLUEPRINT = Blueprint("inbox_outbox_blueprint", __name__)


@INBOX_OUTBOX_BLUEPRINT.route("/inbox_outbox", methods=["GET"])
def get_outbox():
    outbox_query = SmsOutboxRelationship.query.order_by(
        "status desc").limit(1000).all()
    outbox_query_result = SmsOutboxRelationshipSchema(
        many=True).dump(outbox_query).data

    return jsonify(outbox_query_result)
