"""
"""

from datetime import datetime, timedelta
from sqlalchemy import bindparam, literal, text
from sqlalchemy.orm import joinedload, raiseload
from connection import DB
from src.models.inbox_outbox import (
    SmsInboxUsers, SmsOutboxUsers, SmsOutboxUserStatus,
    ViewLatestMessagesMobileID, TempLatestMessagesSchema,
    SmsInboxUserTags, SmsInboxUserTagsSchema,
    SmsTags, SmsOutboxUserTags, SmsOutboxUserTagsSchema,
    SmsUserUpdates, ViewLatestUnsentMsgsPerMobileID
)
from src.models.users import Users, UserOrganizations
from src.models.mobile_numbers import (
    UserMobiles, MobileNumbers, MobileNumbersSchema)

from src.utils.contacts import get_mobile_numbers
from src.utils.extra import var_checker


def get_quick_inbox(inbox_limit=50, limit_inbox_outbox=True, ts_start=None, ts_end=None):
    query_start = datetime.now()
    vlmmid = ViewLatestMessagesMobileID
    inbox_mobile_ids = vlmmid.query.outerjoin(
        UserMobiles, vlmmid.mobile_id == UserMobiles.mobile_id) \
        .outerjoin(Users).order_by(DB.desc(vlmmid.max_ts)).limit(inbox_limit).all()

    latest_inbox_messages = []
    for row in inbox_mobile_ids:
        mobile_id = row.mobile_id
        mobile_schema = get_user_mobile_details(mobile_id)

        msgs_schema = get_formatted_latest_mobile_id_message(
            mobile_id, limit_inbox_outbox)

        formatted = {
            "mobile_details": mobile_schema,
            "messages": msgs_schema
        }
        latest_inbox_messages.append(formatted)

    unsent_messages = get_formatted_unsent_messages()

    messages = {
        "inbox": latest_inbox_messages,
        "unsent": unsent_messages
    }

    query_end = datetime.now()

    print("")
    print("SCRIPT RUNTIME", (query_end - query_start).total_seconds())
    print("")

    return messages


def get_formatted_latest_mobile_id_message(mobile_id, limit_inbox_outbox=True, ts_start=None, ts_end=None):
    msgs = get_latest_messages(
        mobile_id, limit_inbox_outbox=limit_inbox_outbox,
        ts_start=ts_start, ts_end=ts_end)
    msgs_schema = TempLatestMessagesSchema(many=True).dump(msgs).data

    return msgs_schema


def get_formatted_unsent_messages():
    query_start = datetime.now()

    unsent_messages_arr = get_unsent_messages(duration=1)
    unsent_messages = format_unsent_messages(unsent_messages_arr)

    query_end = datetime.now()

    print("")
    print("SCRIPT RUNTIME: GET UNSENT MESSAGES ",
          (query_end - query_start).total_seconds())
    print("")

    return unsent_messages


def get_unsent_messages(duration=1):
    """
    Args: duration (int) - in days
    """

    vlum = ViewLatestUnsentMsgsPerMobileID
    date_filter = datetime.now() - timedelta(days=duration)
    unsent_messages_arr = vlum.query.filter(
        vlum.ts_written > date_filter).order_by(vlum.ts_written).all()
    return unsent_messages_arr


def get_messages_schema_dict(msgs):
    msgs_schema = []

    query_tag_start = datetime.now()

    for msg in msgs:
        msg_schema = TempLatestMessagesSchema().dump(msg).data
        msg_schema["tags"] = get_message_tags(msg)
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
    org = user.subqueryload("organizations")

    mobile_details = MobileNumbers.query.options(
        org.joinedload("site", innerjoin=True).raiseload("*"),
        org.joinedload("organization", innerjoin=True),
        user.subqueryload("teams").joinedload(
            "team", innerjoin=True), raiseload("*")
    ).filter_by(mobile_id=mobile_id).first()

    mobile_schema = MobileNumbersSchema(exclude=[
        "user_details.user.landline_numbers",
        "user_details.user.emails",
        "user_details.user.ewi_restriction",
        "blocked_mobile"
    ]).dump(mobile_details).data

    return mobile_schema


def get_latest_messages(
        mobile_id, messages_per_convo=20,
        batch=0, limit_inbox_outbox=False,
        ts_start=None, ts_end=None
):
    """
    """

    query_start = datetime.now()

    offset = messages_per_convo * batch

    siu = SmsInboxUsers
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
    ).options(raiseload("*")).filter(siu.mobile_id == mobile_id)

    if ts_start:
        sms_inbox = sms_inbox.filter(siu.ts_sms >= ts_start)

    if ts_end:
        sms_inbox = sms_inbox.filter(siu.ts_sms <= ts_end)

    sms_inbox = sms_inbox.order_by(DB.desc(siu.ts_sms))

    if limit_inbox_outbox:
        sms_inbox = sms_inbox.limit(1)

    sou = SmsOutboxUsers
    sous = SmsOutboxUserStatus
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
    ).options(raiseload("*")).join(sou).filter(sous.mobile_id == mobile_id)

    if ts_start:
        sms_outbox = sms_outbox.filter(sou.ts_written >= ts_start)

    if ts_end:
        sms_outbox = sms_outbox.filter(sou.ts_written <= ts_end)

    sms_outbox = sms_outbox.order_by(DB.desc(sous.outbox_id))

    if limit_inbox_outbox:
        sms_outbox = sms_outbox.limit(1)

    union = sms_inbox.union(sms_outbox).order_by(
        DB.desc(text("anon_1_ts"))).limit(messages_per_convo).offset(offset)

    query_end = datetime.now()

    print("")
    print("SCRIPT RUNTIME: GET LATEST MESSAGES",
          (query_end - query_start).total_seconds())
    print("")

    return union


def get_message_users_within_ts_range(ts_start=None, ts_end=None):
    """
    """

    siu = SmsInboxUsers
    sms_inbox = DB.session.query(siu.mobile_id.label(
        "mobile_id")).options(raiseload("*"))

    if ts_start:
        sms_inbox = sms_inbox.filter(siu.ts_sms >= ts_start)

    if ts_end:
        sms_inbox = sms_inbox.filter(siu.ts_sms <= ts_end)

    sms_inbox = sms_inbox.order_by(DB.desc(siu.ts_sms))

    sou = SmsOutboxUsers
    sous = SmsOutboxUserStatus
    sms_outbox = DB.session.query(
        sous.mobile_id.label("mobile_id")).options(raiseload("*")).join(sou)

    if ts_start:
        sms_outbox = sms_outbox.filter(sou.ts_written >= ts_start)

    if ts_end:
        sms_outbox = sms_outbox.filter(sou.ts_written <= ts_end)

    sms_outbox = sms_outbox.order_by(DB.desc(sous.outbox_id))

    union = sms_inbox.union(sms_outbox).group_by(DB.text("mobile_id"))

    return union


def get_message_tags(message):
    """
    """

    tags_list = []
    if message.source == "inbox":
        sms_tags = DB.session.query(SmsInboxUserTags).options(
            joinedload(SmsInboxUserTags.tag, innerjoin=True),
            raiseload("*")
        ).filter_by(inbox_id=message.inbox_id).all()
        tags_list = SmsInboxUserTagsSchema(
            many=True, exclude=["inbox_message"]).dump(sms_tags).data
    elif message.source == "outbox":
        sms_tags = DB.session.query(SmsOutboxUserTags).options(
            joinedload(SmsOutboxUserTags.tag, innerjoin=True),
            raiseload("*")
        ).filter_by(outbox_id=message.outbox_id).all()
        tags_list = SmsOutboxUserTagsSchema(
            many=True, exclude=["outbox_message"]).dump(sms_tags).data

    return tags_list


def get_message_tag_options(source):
    """
    """

    tags = SmsTags.query.filter_by(source=source).all()
    return tags


def get_sms_user_updates():
    """
    """
    # TODO: Group updates by mobile_id and source
    DB.session.flush()
    results = DB.session.query(SmsUserUpdates).order_by(
        SmsUserUpdates.update_id).limit(10).all()
    DB.session.commit()

    return results


def insert_sms_user_update(mobile_id, update_source, pk_id=0):
    """
    """

    row = SmsUserUpdates(
        mobile_id=mobile_id,
        update_source=update_source,
        pk_id=pk_id
    )

    DB.session.add(row)
    DB.session.commit()


def delete_sms_user_update(updates=None):
    """
    """

    if updates:
        for row in updates:
            DB.session.delete(row)
    else:
        SmsUserUpdates.query.delete()

    DB.session.commit()


def insert_message_on_database(obj):
    """
    """

    sms_msg = obj["sms_msg"]
    recipient_list = obj["recipient_list"]

    # NOTE: pointed to comms_db orig until GSM 3
    new_msg = SmsOutboxUsers(
        ts_written=datetime.now(),
        source="central",
        sms_msg=sms_msg
    )

    DB.session.add(new_msg)
    DB.session.flush()

    outbox_id = new_msg.outbox_id

    # NOTE: pointed to comms_db orig until GSM 3
    for row in recipient_list:
        mobile_id = row["mobile_id"]
        gsm_id = row["gsm_id"]

        # NOTE: pointed to comms_db orig until GSM 3
        new_status = SmsOutboxUserStatus(
            outbox_id=outbox_id,
            mobile_id=mobile_id,
            gsm_id=gsm_id
        )

        DB.session.add(new_status)
        DB.session.flush()

    DB.session.commit()

    return outbox_id


def get_search_results(obj):
    """
    """

    site_ids = obj["site_ids"]
    org_ids = obj["org_ids"]
    only_ewi_recipients = obj["only_ewi_recipients"]
    ts_start = obj["ts_start"]
    ts_end = obj["ts_end"]

    # search for mobile_ids using ts range given
    # if site_ids OR org_ids not given
    # (yes OR, because lower code would just apply date filter)
    mobile_ids = None
    if ts_start and ts_end and (not site_ids or not org_ids):
        result = get_message_users_within_ts_range(
            ts_start=ts_start, ts_end=ts_end)
        mobile_ids = list(map(lambda x: x[0], result))

    contacts = get_mobile_numbers(
        return_schema=True, mobile_ids=mobile_ids,
        site_ids=site_ids, org_ids=org_ids,
        only_ewi_recipients=only_ewi_recipients)

    search_results = []
    for contact in contacts:
        mobile_number = contact["mobile_number"]
        mobile_id = mobile_number["mobile_id"]
        msgs_schema = get_formatted_latest_mobile_id_message(
            mobile_id, limit_inbox_outbox=True, ts_start=ts_start, ts_end=ts_end)

        temp = {
            "messages": msgs_schema,
            "mobile_details": {
                **mobile_number,
                "user_details": {
                    "user": contact["user"],
                    "priority": contact["priority"],
                    "status": contact["status"]
                }
            }
        }

        search_results.append(temp)

    return search_results


def resend_message(outbox_status_id):
    """
    """

    # NOTE: pointed to comms_db orig until GSM 3
    row = SmsOutboxUserStatus.query \
        .filter_by(stat_id=outbox_status_id).first()

    row.send_status = 0

    DB.session.commit()


def get_ewi_acknowledgements_from_tags(site_id, ts_start, ts_end):
    """
    """

    query = SmsInboxUserTags.query.options(DB.raiseload("*")) \
        .join(SmsTags).join(SmsInboxUsers) \
        .join(UserMobiles) \
        .join(Users) \
        .join(UserOrganizations) \
        .filter(
            DB.and_(
                SmsTags.tag_id == 9,  # EwiResponse
                UserOrganizations.site_id == site_id,
                SmsInboxUsers.ts_sms >= ts_start,
                SmsInboxUsers.ts_sms < ts_end,
            )
    )

    result = query.all()

    return result
