"""
Sample Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

from flask import Blueprint, jsonify
from src.models.membership import Membership, MembershipSchema

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
