"""
Utility file for Notifications table.
"""

import traceback
from datetime import datetime, timedelta
from connection import DB

from src.models.users import Users
from src.models.sites import Sites
from src.models.monitoring import MonitoringShiftSchedule
from src.models.notifications import Notifications, NotificationsSchema

from src.utils.users import get_dynaslope_users
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

    notif_receivers = []
    message = ""
    link = None
    if notif_type == "incoming_message":
        notif_receivers = get_monitoring_personnel()

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

        message = f"CHATTERBOX: {sender} sent a message \"{final_sms_str}\""
        link = f"/communication/chatterbox/{mobile_id}"
    elif notif_type == "generated_heightened_alert":
        notif_receivers = get_active_dynaslope_user_ids()

        message = (
            f'ALERT GENERATION SCRIPT: Alert Level '
            f'{data["alert_level"]} ({data["internal_alert"]}) '
            f'is raised on {data["site_code"].upper()}. To the IOMPs, validate the alert '
            f'and its triggers. If valid, release the web alert and EWI ASAP.')
        link = "/"
    elif notif_type == "released_ewi":
        notif_receivers = get_active_dynaslope_user_ids()

        site_row = Sites.query.options(DB.raiseload(
            "*")).filter_by(site_id=data["site_id"]).first()
        site_code = site_row.site_code.upper()
        release_status = data["release_status"]

        if release_status == "raising":
            message = (f"EVENT MONITORING: {site_code} is now under "
                       f'Alert Level {data["public_alert_level"]}. Visit the '
                       f"monitoring event timeline for more details.")
        else:
            message = (f"EVENT MONITORING: The heightened alert on "
                       f"{site_code} has already been lowered to Alert Level 0. "
                       f"Extended monitoring on the site will begin tomorrow.")

        link = f'/monitoring/events/{data["event_id"]}'

    notif_object = {
        "message": message,
        "link": link
    }

    return notif_object, notif_receivers


def get_active_dynaslope_user_ids():
    """
    Misc function for this module only
    """

    notif_receivers = []
    active_dyna_users = get_dynaslope_users()
    for row in active_dyna_users:
        notif_receivers.append(row.user_id)

    return notif_receivers


def get_monitoring_personnel(ts=None):
    """
    """
    if not ts:
        ts = datetime.now()

    user_id_list = []
    hour = ts.hour
    minute = ts.minute

    if hour < 8 or (hour == 8 and minute < 30):
        filter_ts = ts - timedelta(days=1)
        filter_ts = filter_ts.replace(hour=20)
    elif (hour >= 8 and hour < 20) or (hour == 20 and minute < 30):
        filter_ts = ts.replace(hour=8)
    else:
        filter_ts = ts.replace(hour=20)

    row = MonitoringShiftSchedule.query.filter_by(
        ts=filter_ts.strftime("%Y-%m-%d %H:00:00")).first()

    if row:
        users_filter = []
        if row.iompmt:
            users_filter.append(row.iompmt)
        if row.iompct:
            users_filter.append(row.iompct)

        users = None
        if users_filter:
            users = Users.query.options(DB.raiseload(
                "*")).filter(Users.nickname.in_(users_filter)).all()
        for user in users:
            user_id_list.append(user.user_id)

    return user_id_list


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
        DB.session.commit()
        status = "success"
    except Exception:
        print(traceback.format_exc())
        DB.session.rollback()
        status = "failed"

    return status
