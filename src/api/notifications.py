"""
Narratives functions API File
"""

from flask import Blueprint, request

from src.utils.notifications import set_all_unseen_notifications, update_ts_read
from src.utils.extra import var_checker


NOTIFICATIONS_BLUEPRINT = Blueprint("notifications_blueprint", __name__)


@NOTIFICATIONS_BLUEPRINT.route(
    "/notifications/set_all_seen_notifications", methods=["POST"])
def wrap_set_all_unseen_notifications():
    """
    Deletes specific narrative.
    """

    json_data = request.get_json()
    status = set_all_unseen_notifications(json_data["user_id"])

    return status


@NOTIFICATIONS_BLUEPRINT.route(
    "/notifications/update_ts_read", methods=["POST"])
def wrap_update_ts_read():
    """
    Update ts_read of a certain notification
    """

    json_data = request.get_json()
    status = update_ts_read(
        json_data["user_id"], json_data["notification_id"], json_data["ts_read"])

    return status
