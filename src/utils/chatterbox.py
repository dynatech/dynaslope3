"""
"""

from flask import Blueprint, jsonify
from connection import DB, SOCKETIO
from sqlalchemy import (
    Table, Column, Integer,
    String, DateTime, bindparam,
    literal, text
)
from sqlalchemy.orm import joinedload, raiseload, lazyload, subqueryload
from src.models.inbox_outbox import (
    SmsInboxUsers, SmsInboxUsersSchema,
    SmsOutboxUsers, SmsOutboxUsersSchema,
    SmsOutboxUserStatus, SmsOutboxUserStatusSchema,
    ViewLatestMessagesMobileID, TempLatestMessagesSchema,
    SmsInboxUserTags, SmsInboxUserTagsSchema,
    SmsTags, SmsOutboxUserTags, SmsOutboxUserTagsSchema,
    SmsUserUpdates, ViewLatestUnsentMessages
)
from src.models.gsm import (SimPrefixes)
from src.models.users import (
    Users, UsersRelationship, UserOrganization,
    UserMobile, UserMobileSchema, UserTeamMembers
)
from src.models.mobile_numbers import (
    UserMobiles, UserMobilesSchema,
    MobileNumbers, MobileNumbersSchema
)

from datetime import datetime, timedelta
from src.utils.extra import var_checker


def get_quick_inbox():
    query_start = datetime.now()
    vlmmid = ViewLatestMessagesMobileID
    inbox_mobile_ids = vlmmid.query.join(UserMobile, vlmmid.mobile_id == UserMobile.mobile_id).join(
        Users).order_by(DB.desc(vlmmid.max_ts)).limit(50).all()
    unsent_messages_arr = get_unsent_messages()

    latest_inbox_messages = get_messages_for_mobile_group(inbox_mobile_ids)
    unsent_messages = format_unsent_messages(unsent_messages_arr)

    messages = {
        "inbox": latest_inbox_messages,
        "unsent": unsent_messages
    }

    query_end = datetime.now()

    print("")
    print("SCRIPT RUNTIME", (query_end - query_start).total_seconds())
    print("")

    return messages


def get_unsent_messages():
    vlum = ViewLatestUnsentMessages
    date_filter = datetime.now() - timedelta(days=12)
    unsent_messages_arr = vlum.query.filter(
        vlum.ts_written > date_filter).order_by(vlum.ts_written).all()
    return unsent_messages_arr


def get_messages_for_mobile_group(mobile_ids):
    messages = []

    for row in mobile_ids:
        mobile_id = row.mobile_id
        mobile_schema = get_user_mobile_details(mobile_id)
        msgs = get_latest_messages(mobile_id)
        msgs_schema = get_messages_schema_dict(msgs)

        # msgs_schema = TempLatestMessagesSchema(many=True).dump(msgs).data

        formatted = {
            "mobile_details": mobile_schema,
            "messages": msgs_schema
        }

        messages.append(formatted)

    return messages


def get_messages_schema_dict(msgs):
    msgs_schema = []

    query_tag_start = datetime.now()

    for msg in msgs:
        msg_schema = get_message_tags(msg)
        msgs_schema.append(msg_schema)

    query_tag_end = datetime.now()

    print("")
    print("SCRIPT RUNTIME: GET MESSAGE TAGS",
          (query_tag_end - query_tag_start).total_seconds())
    print("")

    return msgs_schema


def format_unsent_messages(message_arr):
    messages = []

    for row in message_arr:
        mobile_id = row.mobile_id
        mobile_schema = get_user_mobile_details(mobile_id)
        msg_schema = TempLatestMessagesSchema().dump(row).data

        formatted = {
            "mobile_details": mobile_schema,
            "messages": [msg_schema]
        }

        messages.append(formatted)

    return messages


def get_user_mobile_details(mobile_id):
    """
    """

    user = joinedload("user_details").joinedload(
        "user", innerjoin=True)
    mobile_details = MobileNumbers.query.options(user.subqueryload("organizations").joinedload(
        "site", innerjoin=True).raiseload("*"), user.subqueryload("teams"), raiseload("*")).filter_by(mobile_id=mobile_id).first()
    mobile_schema = MobileNumbersSchema(exclude=[
                                        "user_details.user.landline_numbers", "user_details.user.emails"]).dump(mobile_details).data

    return mobile_schema


def get_latest_messages(mobile_id):
    """
    """

    query_start = datetime.now()

    siu = SmsInboxUsers
    siut = SmsInboxUserTags

    sms_inbox = DB.session.query(
        siu.inbox_id.label("convo_id"),
        siu.inbox_id,
        bindparam("outbox_id", None),
        siu.mobile_id,
        siu.sms_msg,
        siu.ts_sms.label("ts"),
        siu.ts_sms.label("ts_received"),
        bindparam("ts_written", None),
        bindparam("ts_sent", None),
        literal("inbox").label("source"),
        bindparam("send_status", None)
    ).options(raiseload("*")).filter(siu.mobile_id == mobile_id).order_by(DB.desc(siu.ts_sms))

    sou = SmsOutboxUsers
    sous = SmsOutboxUserStatus
    sout = SmsOutboxUserTags

    outbox_sub = sout.query.join(sou).filter(
        sout.outbox_id == sou.outbox_id).subquery()

    sms_outbox = DB.session.query(
        sous.stat_id.label("convo_id"),
        bindparam("inbox_id", None),
        sous.outbox_id,
        sous.mobile_id,
        sou.sms_msg,
        sou.ts_written.label("ts"),
        bindparam("ts_received", None),
        sou.ts_written,
        sous.ts_sent,
        literal("outbox").label("source"),
        sous.send_status
    ).options(raiseload("*")).join(sou).filter(sous.mobile_id == mobile_id).order_by(DB.desc(sous.outbox_id))

    union = sms_inbox.union(sms_outbox).order_by(
        DB.desc("anon_1_ts")).limit(20)

    query_end = datetime.now()

    print("")
    print("SCRIPT RUNTIME: GET LATEST MESSAGES",
          (query_end - query_start).total_seconds())
    print("")

    return union


def get_message_tags(message):
    """
    """

    msg_schema = TempLatestMessagesSchema().dump(message).data

    tags_list = []
    if message.source == "inbox":
        sms_tags = DB.session.query(SmsInboxUserTags).options(
            joinedload(SmsInboxUserTags.tag, innerjoin=True), raiseload("*")).filter_by(inbox_id=message.inbox_id).all()
        tags_list = SmsInboxUserTagsSchema(
            many=True, exclude=["inbox_message"]).dump(sms_tags).data
    elif message.source == "outbox":
        sms_tags = DB.session.query(SmsOutboxUserTags).options(
            joinedload(SmsOutboxUserTags.tag, innerjoin=True), raiseload("*")).filter_by(outbox_id=message.outbox_id).all()
        tags_list = SmsOutboxUserTagsSchema(
            many=True, exclude=["outbox_message"]).dump(sms_tags).data

    msg_schema["tags"] = tags_list

    return msg_schema


def get_message_tag_options(source):
    """
    """

    tags = SmsTags.query.filter_by(source=source).all()
    return tags


def get_sms_user_updates():
    """
    """

    DB.session.flush()
    results = DB.session.query(SmsUserUpdates).order_by(
        SmsUserUpdates.update_id).all()
    DB.session.commit()

    return results


def delete_sms_user_update(row):
    """
    """

    DB.session.delete(row)
    DB.session.commit()


def insert_message_on_database(obj):
    """
    """

    sms_msg = obj["sms_msg"]
    recipient_list = obj["recipient_list"]

    new_msg = SmsOutboxUsers(
        ts_written=datetime.now(),
        source="central",
        sms_msg=sms_msg
    )

    DB.session.add(new_msg)
    DB.session.flush()

    outbox_id = new_msg.outbox_id

    for row in recipient_list:
        mobile_id = row["mobile_id"]
        gsm_id = row["gsm_id"]

        new_status = SmsOutboxUserStatus(
            outbox_id=outbox_id,
            mobile_id=mobile_id,
            gsm_id=gsm_id
        )

        DB.session.add(new_status)
        DB.session.flush()

    DB.session.commit()