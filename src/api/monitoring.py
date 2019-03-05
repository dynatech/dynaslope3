"""
Monitoring Modules Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

from flask import Blueprint, jsonify
from connection import DB
from src.models.monitoring import MonitoringEventsSchema, MonitoringReleasesSchema
from src.utils.monitoring import get_monitoring_events, get_monitoring_release


MONITORING_BLUEPRINT = Blueprint("monitoring_blueprint", __name__)


@MONITORING_BLUEPRINT.route("/monitoring/get_monitoring_events", methods=["GET"])
@MONITORING_BLUEPRINT.route("/monitoring/get_monitoring_events/<event_id>", methods=["GET"])
def wrap_get_monitoring_events(event_id=None):
    """
    NOTE: ADD ASYNC OPTION ON MANY OPTION (TOO HEAVY)
    """
    event = get_monitoring_events(event_id)
    event_schema = MonitoringEventsSchema()

    if event_id is None:
        event_schema = MonitoringEventsSchema(many=True)

    event_data = event_schema.dump(event).data

    return jsonify(event_data)


@MONITORING_BLUEPRINT.route("/monitoring/get_monitoring_release/<release_id>", methods=["GET"])
def wrap_get_monitoring_release(release_id):
    """
    Something
    """
    release = get_monitoring_release(release_id)
    releases_data = MonitoringReleasesSchema().dump(release).data

    return jsonify(releases_data)


# @MONITORING_BLUEPRINT.route("/monitoring_controller/get_all_releases_per_event/<event_id>", methods=["GET"])
# def get_all_releases_per_event(event_id):
#     """
#     Function that get one member and outputs as json string. Receives an value using flask request
#     Args: event_id - received through Flask Request.
#     Note: From pubrelease_model and pubrelease controller.
#     """
#     # Use the following implementation if one of the joined tables is from another database.
#     # Also, use aliases if needed.
#     user_mt = DB.aliased(Users)
#     user_ct = DB.aliased(Users)
#     releases = DB.session.query(MonitoringReleases, user_mt, user_ct).join(
#         user_mt, MonitoringReleases.reporter_id_mt == user_mt.user_id).join(
#             user_ct, MonitoringReleases.reporter_id_ct == user_ct.user_id).order_by(
#                 DB.desc(MonitoringReleases.release_id)).filter(
#                     MonitoringReleases.event_id == event_id).all()
#     releases_data = []
#     for release, mt, ct in releases:
#         user_schema = UsersSchema(only=("firstname", "lastname"))
#         user_mt = user_schema.dump(mt).data
#         user_ct = user_schema.dump(ct).data
#         release_data = MonitoringReleasesSchema().dump(release).data
#         release_data["reporter_mt"] = user_mt
#         release_data["reporter_ct"] = user_ct
#         releases_data.append(release_data)
#     # releases_data = MonitoringReleasesSchema(
#     #     many=True).dump(releases).data
#     return jsonify(releases_data)
# @MONITORING_BLUEPRINT.route("/monitoring_controller/get_event_with_site_details/<event_id>", methods=["GET"])
# def get_event_with_site_details(event_id):
#     """
#     Returns event details with corresponding site details. Receives an event_id from flask request.
#     Args: event_id
#     Note: From pubrelease.php getEvent
#     """
#     events = MonitoringEvents.query.order_by(DB.desc(
#         MonitoringEvents.event_id)).filter(MonitoringEvents.event_id == event_id).all()
#     event_data = MonitoringEventsSchema(many=True).dump(events).data
#     return jsonify(event_data)
