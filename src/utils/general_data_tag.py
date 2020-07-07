"""
Utility Codes for General Data Tag
"""

from connection import DB
from src.utils.extra import var_checker
from src.models.general_data_tag import GeneralDataTagManager
from src.models.inbox_outbox import SmsInboxUserTags, SmsOutboxUserTags, SmsTags


def get_all_tag(tag_id=None):
    """
    """

    if tag_id is None:
        general_data_tag = GeneralDataTagManager.query.all()
    else:
        general_data_tag = GeneralDataTagManager.query.filter_by(
            id=tag_id).first()

    return general_data_tag


# def get_tag_description(tag_id, tag_type):
#     """
#     """
#     key_1 = ""
#     if tag_type == "smsinbox_user_tags":
#         key_1 = "smsinbox_users"
#     elif tag_type == "smsoutbox_user_tags":
#         key_1 = "smsoutbox_users"

#     s_t = SmsTags
#     var_checker("key", key_1, True)
#     var_checker("tag_id", tag_id, True)
#     var_checker("query", s_t.query.filter(DB.and_(s_t.tag_id == tag_id, s_t.source == key_1)), True)
#     sms_tag_row = s_t.query.filter(DB.and_(s_t.tag_id == tag_id, s_t.source == key_1)).first()

#     if sms_tag_row:
#         tag = sms_tag_row.tag
#     else:
#         tag = "System Data Issue: No tag found on DB"

#     var_checker("sms_tag_row", sms_tag_row, True)

#     return tag


def get_tag_description(tag_id):
    """
    TODO: Revive the code above for it is the right code. 
    Please check the function getting the tag_options in the front end
    """

    s_t = SmsTags
    sms_tag_row = s_t.query.filter(s_t.tag_id == tag_id).first()

    if sms_tag_row:
        tag = sms_tag_row.tag
    else:
        tag = "System Data Issue: No tag found on DB"

    return tag


def get_tag_by_type(tag_type, tag_details, tag_id):
    """
    Returns tag row your are looking for based on provided parameters

    NOTE: Please REFACTOR so we can accomodate tag types other than
    smsinbox and smsoutbox _users.

    Args:
        tag_type (String)
        key (String)
        value ()
    """
    row = None
    query_class = None
    row_key_1 = None

    if tag_type == "smsinbox_user_tags":
        query_class = SmsInboxUserTags
        row_key_1 = "inbox_id"
    elif tag_type == "smsoutbox_user_tags":
        query_class = SmsOutboxUserTags
        row_key_1 = "outbox_id"

    row = query_class.query.filter(DB.and_(
        getattr(query_class, row_key_1) == tag_details[row_key_1],
        query_class.tag_id == tag_id
    )).first()

    return row


def insert_data_tag(tag_type, tag_details, tag_id):
    """
    Writes tags to respective tables.

    Args:
        tag_type (String) - Please do note that you should provide the table
                            name as the tag_type
        tag_details (Dictionary) - Dictionary container details exclusive for
                            each tag table.
    """
    data_insertion_container = None
    general_tag_id_container = None

    try:
        if tag_type == "smsinbox_user_tags":
            data_insertion_container = SmsInboxUserTags(
                inbox_id=tag_details["inbox_id"],
                tag_id=tag_id,
                user_id=tag_details["user_id"],
                ts=tag_details["ts"]
            )
            DB.session.add(data_insertion_container)
            DB.session.flush()
            general_tag_id_container = data_insertion_container.siu_tag_id

        elif tag_type == "smsoutbox_user_tags":
            data_insertion_container = SmsOutboxUserTags(
                outbox_id=tag_details["outbox_id"],
                tag_id=tag_id,
                user_id=tag_details["user_id"],
                ts=tag_details["ts"]
            )
            DB.session.add(data_insertion_container)
            DB.session.flush()
            general_tag_id_container = data_insertion_container.sou_tag_id

        # var_checker(f"New {tag_type} tag saved to DB with ID", general_tag_id_container, True)
        DB.session.commit()

    except Exception as err:
        DB.session.rollback()
        var_checker(
            f"Error in saving tags for {tag_type} tag table", err, True)
        raise

    return {"message": "success", "status": True, "data": general_tag_id_container}


def update_data_tag(row_to_update, tag_details, tag_id):
    """
    Updates tags to respective tables.

    Args:
        row_to_update (String) - Please do note that you should provide row
                            returned by your query.
        tag_details (Dictionary) - Dictionary container details exclusive for
                            each tag table.
    """

    row_type = type(row_to_update).__name__
    id_to_return = None

    try:
        row_to_update.tag_id = tag_id
        row_to_update.user_id = tag_details["user_id"]
        row_to_update.ts = tag_details["ts"]

        if row_type == "SmsInboxUserTags":
            row_to_update.inbox_id = tag_details["inbox_id"]
            id_to_return = row_to_update.siu_tag_id
        elif row_type == "SmsOutboxUserTags":
            row_to_update.outbox_id = tag_details["outbox_id"]
            id_to_return = row_to_update.sou_tag_id

    except Exception as err:
        DB.session.rollback()
        var_checker(
            f"Error in updating tags for {row_type} tag table", err, True)
        raise

    # var_checker(f"New {row_type} tag saved to DB with ID", id_to_return, True)
    DB.session.commit()

    return {"message": "success", "status": True, "data": id_to_return}
