from src.utils.bulletin import create_monitoring_bulletin
"""
Sample Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

from flask import Blueprint, jsonify
from connection import DB
from src.models.membership import Membership, MembershipSchema
from src.models.monitoring import (MonitoringEvents, MonitoringReleases,
                                   MonitoringEventsSchema, MonitoringReleasesSchema)

TEST_BLUEPRINT = Blueprint("test_blueprint", __name__)


@TEST_BLUEPRINT.route("/test_controller/get_one_member", methods=["GET"])
def get_one_member():
    """
    Function that get one member and outputs as json string
    """

    # Example of putting parameter filter on URL
    #
    # page = request.args.get('page', default = 1, type = int)
    # filter = request.args.get('filter', default = '*', type = str)
    #
    # /my-route?page=34               -> page: 34  filter: '*'
    # /my-route                       -> page:  1  filter: '*'
    # /my-route?page=10&filter=test   -> page: 10  filter: 'test'
    # /my-route?page=10&filter=10     -> page: 10  filter: '10'

    member = Membership.query.all()
    membership_schema = MembershipSchema()
    output = membership_schema.dump(member).data
    return jsonify(output)


@TEST_BLUEPRINT.route("/test_controller/get_all_members", methods=["GET"])
def get_all_members():
    """
    Function that get all members and outputs as json string
    """
    members = Membership.query.all()
    membership_schema = MembershipSchema(many=True)
    output = membership_schema.dump(members).data
    return jsonify(output)


@TEST_BLUEPRINT.route("/test_controller/get_all_event_ids_only", methods=["GET"])
def get_all_event_ids_only():
    """
    Sample implementation of querying select columns instead of returning all (*)
    """
    events = DB.session.query(MonitoringEvents.event_id).order_by(DB.desc(
        MonitoringEvents.event_id)).filter(MonitoringEvents.status == "finished").all()

    event_data = MonitoringEventsSchema(many=True).dump(events).data
    return jsonify(event_data)


@TEST_BLUEPRINT.route("/test_controller/get_all_events", methods=["GET"])
def get_all_events():
    """
    Sample implementation of querying all columns of a table (default)
    """
    events = MonitoringEvents.query.order_by(DB.desc(
        MonitoringEvents.event_id)).filter(MonitoringEvents.status == "finished").all()

    event_data = MonitoringEventsSchema(many=True).dump(events).data
    return jsonify(event_data)


@TEST_BLUEPRINT.route("/test_controller/get_all_events_wo_relationship", methods=["GET"])
def get_all_events_wo_relationship():
    """
    Sample implementation of preventing lazy load on relationship
    """
    events = MonitoringEvents.query.options(DB.raiseload(MonitoringEvents.releases)).filter(
        MonitoringEvents.status == "finished").order_by(DB.desc(MonitoringEvents.event_id)).all()

    event_data = MonitoringEventsSchema(
        many=True, exclude=("releases", )).dump(events).data
    return jsonify(event_data)


@TEST_BLUEPRINT.route("/test_controller/get_releases_of_an_event/<event_id>", methods=["GET"])
def get_releases_of_an_event(event_id):
    """
    Sample implementation of joins with parameter
    """
    releases = MonitoringReleases.query.join(MonitoringEvents).order_by(DB.desc(
        MonitoringEvents.event_id)).filter(MonitoringEvents.event_id == event_id).all()

    releases_data = MonitoringReleasesSchema(many=True).dump(releases).data
    return jsonify(releases_data)


@TEST_BLUEPRINT.route("/test_controller/create_bulletin", methods=["GET"])
def test():
    a = create_monitoring_bulletin(21433)
    release = MonitoringReleasesSchema().dump(a).data
    release["alert_description"] = a.alert_description
    return jsonify(release)
