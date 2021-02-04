"""
Sample Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

from flask import Blueprint, jsonify, request
from connection import DB
from src.models.membership import Membership, MembershipSchema
from src.models.monitoring import (MonitoringEvents, MonitoringReleases,
                                   MonitoringEventsSchema, MonitoringReleasesSchema,
                                   MonitoringTriggers, MonitoringTriggersSchema)
from src.models.sites import Sites
from src.utils.users import get_community_users

TEST_BLUEPRINT = Blueprint("test_blueprint", __name__)


@TEST_BLUEPRINT.route("/test_controller/get_one_member", methods=["GET"])
def get_one_member():
    """
    Function that get one member and outputs as json string
    """

    member = Membership.query.all()
    membership_schema = MembershipSchema()
    output = membership_schema.dump(member)
    return jsonify(output)


@TEST_BLUEPRINT.route("/test_controller/get_all_members", methods=["GET"])
def get_all_members():
    """
    Function that get all members and outputs as json string
    """
    members = Membership.query.all()
    membership_schema = MembershipSchema(many=True)
    output = membership_schema.dump(members)
    return jsonify(output)


@TEST_BLUEPRINT.route("/test_controller/get_all_event_ids_only", methods=["GET"])
def get_all_event_ids_only():
    """
    Sample implementation of querying select columns instead of returning all (*)
    """
    events = DB.session.query(MonitoringEvents.event_id).order_by(DB.desc(
        MonitoringEvents.event_id)).filter(MonitoringEvents.status == 2).all()

    event_data = MonitoringEventsSchema(many=True).dump(events)
    return jsonify(event_data)


@TEST_BLUEPRINT.route("/test_controller/get_all_events", methods=["GET"])
def get_all_events():
    """
    Sample implementation of querying all columns of a table (default)
    """
    events = MonitoringEvents.query.order_by(DB.desc(
        MonitoringEvents.event_id)).filter(MonitoringEvents.status == 2).all()

    event_data = MonitoringEventsSchema(many=True).dump(events)
    return jsonify(event_data)


@TEST_BLUEPRINT.route("/test_controller/get_all_events_wo_relationship", methods=["GET"])
def get_all_events_wo_relationship():
    """
    Sample implementation of preventing lazy load on relationship
    """
    events = MonitoringEvents.query.options(DB.raiseload(MonitoringEvents.releases)).filter(
        MonitoringEvents.status == "finished").order_by(DB.desc(MonitoringEvents.event_id)).all()

    event_data = MonitoringEventsSchema(
        many=True, exclude=("releases", )).dump(events)
    return jsonify(event_data)


@TEST_BLUEPRINT.route("/test_controller/get_releases_of_an_event/<event_id>", methods=["GET"])
def get_releases_of_an_event(event_id):
    """
    Sample implementation of joins with parameter
    """
    releases = MonitoringReleases.query.join(MonitoringEvents).order_by(DB.desc(
        MonitoringEvents.event_id)).filter(MonitoringEvents.event_id == event_id).all()

    releases_data = MonitoringReleasesSchema(many=True).dump(releases)
    return jsonify(releases_data)


@TEST_BLUEPRINT.route("/test_controller/get_releases_of_an_event_args")
def get_releases_of_an_event_args():
    """
    ARGS TYPE of Parameter filter.

    This is the args type implementation of the previous function that gets releases
    of an event. Make sure you import "request" from "flask"
        from flask import request
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

    event_id = request.args.get("event_id", default=1, type=int)

    releases = MonitoringReleases.query.join(MonitoringEvents).order_by(DB.desc(
        MonitoringEvents.event_id)).filter(MonitoringEvents.event_id == event_id).all()

    releases_data = MonitoringReleasesSchema(many=True).dump(releases)
    return jsonify(releases_data)


@TEST_BLUEPRINT.route("/test_controller/get_releases_of_shift/<start>/<end>", methods=["GET"])
def get_releases_of_shift(start, end):
    """
    ARGS TYPE of Parameter filter.

    This is the args type implementation of the previous function that gets releases
    of an event. Make sure you import "request" from "flask"
        from flask import request
    """

    # filter_var = mr.data_ts > start and mr.data_ts <= end

    # releases = MonitoringReleases.query.join(MonitoringEvents).order_by(DB.desc(
    #     MonitoringEvents.event_id)).filter(MonitoringEvents.event_id == event_id).all()

    releases = MonitoringReleases.query.filter(
        MonitoringReleases.data_ts > start, MonitoringReleases.data_ts <= end).all()[0:5]

    releases_data = MonitoringReleasesSchema(many=True).dump(releases)
    return jsonify(releases_data)


@TEST_BLUEPRINT.route("/test_controller/test/<bol>", methods=["GET"])
def test(bol):
    """
        just a test
    """
    # a = get_dynaslope_users(return_schema_format=True,
    #                         include_team=True)
    print(bol)
    a_var = get_community_users(
        include_orgs=True, return_schema_format=True,
        filter_by_site=["bak"], filter_by_org=["blgu"])
    return a_var


@TEST_BLUEPRINT.route("/test_controller/get_trigger_by_id/<trigger_id>", methods=["GET"])
def get_trigger_by_id(trigger_id):
    """
    Returns triggers by id
    """
    trigger_details = MonitoringTriggers.query.filter(
        MonitoringTriggers.trigger_id == trigger_id).first()
    trigger = MonitoringTriggersSchema().dump(trigger_details)
    # release["alert_description"] = a.alert_description
    return jsonify(trigger)


def insert_new_event(event_details):
    """
    Just a sample code as reference for inserting data.
    """

    new_insert = MonitoringEvents(
        site_id=event_details.site_id,
        event_start=event_details.event_start,
        validity=event_details.validity,
        status=event_details.status
    )
    DB.session.add(new_insert)
    DB.session.flush()

    new_insert_id = new_insert.event_id

    return new_insert_id


def update_event_status(id, event_details):
    """
    Just a sample code as reference for updating data.
    """
    updated_row = MonitoringEvents.query.filter(event_id == id).first()

    updated_row.status = event_details.validity

    DB.session.commit()

    return new_insert_id
