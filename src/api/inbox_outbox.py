"""
Inbox Functions Controller File
"""

from flask import Blueprint, jsonify
from sqlalchemy import text, func
from connection import DB, SOCKETIO
from src.models.inbox_outbox import (
    SmsInboxUsers, SmsInboxUsersSchema,
    SmsInboxUnregisterRelationship, SmsInboxUnregisterRelationshipSchema,
    SmsOutboxUserStatusRelationship, SmsOutboxUserStatusRelationshipSchema,
    SmsQuickInboxRelationship, SmsQuickInboxRelationshipSchema)
from src.models.users import Users, UserMobile, UsersRelationship

INBOX_OUTBOX_BLUEPRINT = Blueprint("inbox_outbox_blueprint", __name__)


@INBOX_OUTBOX_BLUEPRINT.route("/outbox", methods=["GET"])
def get_outbox():
    outbox_query = SmsOutboxUserStatusRelationship.query.order_by(
        "outbox_id desc").limit(1000).all()

    outbox_query_result = SmsOutboxUserStatusRelationshipSchema(
        many=True).dump(outbox_query).data

    return jsonify(outbox_query_result)


@INBOX_OUTBOX_BLUEPRINT.route("/inbox", methods=["GET"])
def get_inbox():
    """
    Function that gets inbox.
    """
    inbox_query = SmsInboxUsers.query.order_by(
        "inbox_id desc").limit(1000).all()

    inbox_query_result = SmsInboxUsersSchema(many=True).dump(inbox_query).data

    return jsonify(inbox_query_result)


@INBOX_OUTBOX_BLUEPRINT.route("/inbox_outbox/quick_inbox", methods=["GET"])
def quick_inbox():
    quick_inbox_query = SmsQuickInboxRelationship.query.join(
        UserMobile).join(Users).filter(
        SmsQuickInboxRelationship.ts_sms >= text("NOW() - INTERVAL 50 DAY")).order_by("inbox_id desc").limit(10).all()
    print(quick_inbox_query)
    quick_inbox_result = SmsQuickInboxRelationshipSchema(
        many=True).dump(quick_inbox_query).data

    return jsonify("quick_inbox_result")


@INBOX_OUTBOX_BLUEPRINT.route("/inbox_outbox/unregistered_inbox", methods=["GET"])
def unregistered_inbox():
    """
    Function that gets unregistered inbox.
    """
    # unregistered_inbox_query = DB.session.query(SmsInboxUnregisterRelationship).select_from(
    #     SmsInboxUsers).join(UserMobile, UserMobile.mobile_id == SmsInboxUnregisterRelationship.mobile_id).join(
    #         Users, Users.user_id == UserMobile.user_id).filter(
    #             SmsInboxUnregisterRelationship.ts_sms >= text("NOW() - INTERVAL 100 DAY")).filter(
    #                 Users.firstname.like("%UNKNOWN%")).order_by("inbox_id desc").all()
    # change interval to 7 day

    unregistered_inbox_query = SmsInboxUnregisterRelationship.query.join(
        UserMobile).join(Users).filter(
        SmsInboxUnregisterRelationship.ts_sms >= text("NOW() - INTERVAL 100 DAY")).filter(
        Users.firstname.like("%UNKNOWN%")).order_by("inbox_id desc").all()

    # unregistered_data = []
    unregistered_inbox_result = SmsInboxUnregisterRelationshipSchema(
        many=True).dump(unregistered_inbox_query).data
    # for inbox in unregistered_inbox_query:
    #     query = SmsInboxUnregisterRelationship.query.filter(
    #         SmsInboxUnregisterRelationship.inbox_id == inbox.inbox_id).first()

    #     query_result = SmsInboxUnregisterRelationshipSchema().dump(query).data

    #     unregistered_data.append(query_result)

    return jsonify(unregistered_inbox_result)
