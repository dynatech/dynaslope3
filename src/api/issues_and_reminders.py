"""
Narratives functions API File
"""

from datetime import datetime
from flask import Blueprint, jsonify, request
from connection import DB
# from src.models.monitoring import (IssuesAndRemindersSchema)
from src.models.issues_and_reminders import (IssuesAndRemindersSchema)
from src.utils.issues_and_reminders import (get_issues_and_reminders, write_issue_reminder_to_db)
from src.utils.extra import var_checker


ISSUES_AND_REMINDERS_BLUEPRINT = Blueprint("issues_and_reminders_blueprint", __name__)


@ISSUES_AND_REMINDERS_BLUEPRINT.route("/issues_and_reminders/get_issues_reminders", methods=["GET"])
def wrap_get_issue_reminder():
    issues = get_issues_and_reminders(include_count=False, include_expired=False)
    data = IssuesAndRemindersSchema(many=True).dump(issues).data

    return data
    # return jsonify(data)


@ISSUES_AND_REMINDERS_BLUEPRINT.route("/issues_and_reminders/write_issue_reminder_to_db", methods=["POST"])
def wrap_write_issue_reminder_to_db():
    """
    """
    try:
        json_data = request.get_json()

        var_checker("json_data", json_data, True)
        detail = json_data["detail"]
        user_id = int(json_data["user_id"])
        ts_posted = json_data["ts_posted"]
        ts_expiration = json_data["ts_expiration"]
        resolved_by = int(json_data["resolved_by"])
        resolution = json_data["resolution"]
        ts_resolved = json_data["ts_resolved"]
        site_id_list = json_data["site_id_list"]
        is_event_entry = json_data["is_event_entry"]

        try:
            postings = json_data["postings"]
        except KeyError:
            postings = None

        status = write_issue_reminder_to_db(json_data["iar_id"], detail, user_id, ts_posted, ts_expiration, resolved_by, resolution, ts_resolved, site_id_list, is_event_entry)

        # DB.session.rollback()
        DB.session.commit()
    except Exception as err:
        DB.session.rollback()
        raise

    return status



@ISSUES_AND_REMINDERS_BLUEPRINT.route("/issues_and_reminders/get_issues_and_reminders", methods=["GET"])
@ISSUES_AND_REMINDERS_BLUEPRINT.route(
    "/issues_and_reminders/get_issues_and_reminders/<start>/<end>", methods=["GET"])
def wrap_get_issues_and_reminders(start=None, end=None):
    """
        Returns one or more row/s of issues_and_reminders.
        Don't specify any argument if you want to get all issues_and_reminders.

        Args:
            filter_type (String) - You can either use narrative_id or event_id.
            filter_id (Alphanumeric) - id or "null" for narratives with no event
    """
    offset = request.args.get("offset", default=0, type=int)
    limit = request.args.get("limit", default=10, type=int)
    include_count = request.args.get(
        "include_count", default="false", type=str)
    search = request.args.get("search", default="", type=str)
    include_expired = request.args.get("include_expired", type=str)

    include_count = True if include_count.lower() == "true" else False
    include_expired = True if include_expired.lower() == "true" else False

    issues_and_reminders_schema = IssuesAndRemindersSchema(many=True)

    if start:
        start = datetime.strptime(start, "%Y-%m-%d %H:%M:%S")
        end = datetime.strptime(end, "%Y-%m-%d %H:%M:%S")

    return_val = get_issues_and_reminders(
        offset, limit, start, end,
        None, include_count, search,
        include_expired=include_expired)

    if include_count:
        issues_and_reminders = return_val[0]
        count = return_val[1]
    else:
        issues_and_reminders = return_val

    issues_and_reminders_data = issues_and_reminders_schema.dump(issues_and_reminders).data

    if include_count:
        issues_and_reminders_data = {
            "issues_and_reminders": issues_and_reminders_data,
            "count": count
        }

    return jsonify(issues_and_reminders_data)
