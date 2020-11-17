"""
Utility file for Notifications table.
"""

import traceback
from datetime import datetime
from connection import DB
from src.models.notifications import Notifications, NotificationsSchema
from src.utils.extra import var_checker


def get_user_notifications(user_id, return_schema=True):
    """
    Get notifications for specific user
    """

    all_notifs = Notifications.query.filter_by(
        receiver_id=user_id).order_by(Notifications.ts.desc()).all()
    unseen_notifs = Notifications.query.filter_by(
        receiver_id=user_id, ts_seen=None).count()

    if return_schema:
        all_notifs = NotificationsSchema(many=True).dump(all_notifs).data

    return_obj = {
        "notifications": all_notifs,
        "count": unseen_notifs
    }

    return return_obj


def set_all_unseen_notifications(user_id):
    """
    Set all null ts_seen with timestamp
    """

    try:
        ts_now = datetime.now()
        all_unseen = Notifications.query.filter_by(
            receiver_id=user_id, ts_seen=None).all()

        for row in all_unseen:
            row.ts_seen = ts_now

        DB.session.commit()
        status = "success"
    except Exception:
        print(traceback.format_exc())
        DB.session.rollback()
        status = "failed"

    return status


def update_ts_read(notification_id, ts_read):
    """
    Updates ts_read of given notification_id
    """

    try:
        row = Notifications.query.filter_by(
            notification_id=notification_id).first()
        row.ts_read = ts_read

        DB.session.commit()
        status = "success"
    except Exception:
        print(traceback.format_exc())
        DB.session.rollback()
        status = "failed"

    return status


def prepare_notification(notif_type, data):
    """
    Prepares notification row (in particular, message and link column)
    """

    notif_receivers = [37]
    message = ""
    link = None
    if notif_type == "incoming_message":
        latest_message = data["message"][0]
        sms_msg = latest_message["sms_msg"]
        mobile_user = data["mobile_user"]
        mobile_id = mobile_user["mobile_id"]
        users = mobile_user["users"]

        sender = "+" + mobile_user["sim_num"]
        if users:
            user = users[0]["user"]
            sender = f'{user["first_name"]} {user["last_name"]}'

        final_sms_str = sms_msg
        if len(sms_msg) > 100:
            final_sms_str = sms_msg[0:100] + "..."

        message = f"{sender} sent a message \"{final_sms_str}\""
        link = f"/communication/chatterbox/{mobile_id}"

    notif_object = {
        "message": message,
        "link": link
    }

    return notif_object, notif_receivers


def insert_notification(receiver_id, message, link=None):
    """
    Inserts notification to notifications table
    """

    try:
        row = Notifications(
            receiver_id=receiver_id,
            message=message,
            link=link
        )

        DB.session.add(row)
        status = "success"
    except Exception:
        print(traceback.format_exc())
        DB.session.rollback()
        status = "failed"

    return status
