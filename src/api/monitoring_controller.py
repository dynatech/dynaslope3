"""
Monitoring Modules Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

import json
from flask_socketio import SocketIO, emit
from flask import Blueprint, jsonify, request
from connection import DB, SOCKETIO
from src.models.monitoring import (MonitoringEvents, MonitoringReleases,
                                   MonitoringEventsSchema, MonitoringReleasesSchema,
                                   MonitoringTriggers, MonitoringTriggersSchema,
                                   MonitoringManifestation, MonitoringManifestationSchema,
                                   MonitoringManifestationFeatures, MonitoringManifestationFeaturesSchema,
                                   MonitoringOnDemand, MonitoringOnDemandSchema)
from src.models.users import (Users, UsersSchema)


MONITORING_BLUEPRINT = Blueprint("monitoring_blueprint", __name__)
# SOCKET_BLUEPRINT = Blueprint("sockets", __name__)
# SOCKETIO = SocketIO()


@MONITORING_BLUEPRINT.route("/monitoring_controller/get_all_releases_per_event/<event_id>", methods=["GET"])
def get_all_releases_per_event(event_id):
    """
    Function that get one member and outputs as json string. Receives an value using flask request

    Args: event_id - received through Flask Request.

    Note: From pubrelease_model and pubrelease controller.
    """

    # Use the following implementation if one of the joined tables is from another database.
    # Also, use aliases if needed.
    user_mt = DB.aliased(Users)
    user_ct = DB.aliased(Users)
    releases = DB.session.query(MonitoringReleases, user_mt, user_ct).join(
        user_mt, MonitoringReleases.reporter_id_mt == user_mt.user_id).join(
            user_ct, MonitoringReleases.reporter_id_ct == user_ct.user_id).order_by(
                DB.desc(MonitoringReleases.release_id)).filter(
                    MonitoringReleases.event_id == event_id).all()

    releases_data = []
    for release, mt, ct in releases:
        user_schema = UsersSchema(only=("firstname", "lastname"))
        user_mt = user_schema.dump(mt).data
        user_ct = user_schema.dump(ct).data
        release_data = MonitoringReleasesSchema().dump(release).data
        release_data["reporter_mt"] = user_mt
        release_data["reporter_ct"] = user_ct
        releases_data.append(release_data)

    # releases_data = MonitoringReleasesSchema(
    #     many=True).dump(releases).data
    return jsonify(releases_data)


@MONITORING_BLUEPRINT.route("/monitoring_controller/get_event_with_site_details/<event_id>", methods=["GET"])
def get_event_with_site_details(event_id):
    """
    Returns event details with corresponding site details. Receives an event_id from flask request.

    Args: event_id

    Note: From pubrelease.php getEvent
    """

    events = MonitoringEvents.query.order_by(DB.desc(
        MonitoringEvents.event_id)).filter(MonitoringEvents.event_id == event_id).all()

    event_data = MonitoringEventsSchema(many=True).dump(events).data

    return jsonify(event_data)
