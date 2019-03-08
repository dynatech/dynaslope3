"""
Monitoring Modules Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

from flask import Blueprint, jsonify
from connection import DB
from src.models.monitoring import (
    MonitoringEventsSchema, MonitoringReleasesSchema)
from src.utils.monitoring import (
    get_monitoring_events, get_monitoring_release, get_active_monitoring_events)


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


@MONITORING_BLUEPRINT.route("/monitoring/get_active_monitoring_events", methods=["GET"])
def wrap_get_active_monitoring_events():
    """
    Translated to Python by: Louie

    Get active monitoring events. Does not need any parameters, just get everything. 
    """
    active_events = get_active_monitoring_events()

    # FOLLOWING CODE NEEDS TO BE MODIFIED TO HANDLE RELATIONSHIPS (IF NEEDED)
    active_events_data = MonitoringEventsSchema(
        many=True).dump(active_events).data

    # return jsonify(active_events_data)
