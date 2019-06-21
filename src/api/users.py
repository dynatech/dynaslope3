"""
Users Functions Controller File
"""

from flask import Blueprint
from src.utils.users import get_dynaslope_users, get_community_users

USERS_BLUEPRINT = Blueprint("users_blueprint", __name__)


@USERS_BLUEPRINT.route("/users/get_dynaslope_users", methods=["GET"])
def wrap_get_dynaslope_users():
    """
    Route function that get all Dynaslope users
    """
    output = get_dynaslope_users(return_schema_format=True)
    return output


@USERS_BLUEPRINT.route("/users/get_community_users", methods=["GET"])
@USERS_BLUEPRINT.route("/users/get_community_users/<filter_1>/<qualifier_1>", methods=["GET"])
@USERS_BLUEPRINT.route("/users/get_community_users/<filter_1>/<qualifier_1>/<filter_2>/<qualifier_2>", methods=["GET"])
def wrap_get_community_users(
        filter_1=None,
        qualifier_1=None,
        filter_2=None,
        qualifier_2=None):
    """
    Route function that get community users

    filter_<x> (string): Can be "site" or "organization"
    qualifier [for site] (string): Use any site code
    qualifier [for organization] (string): Use "lewc", "blgu", "mlgu", or "plgu"
    """

    filter_by_site = None
    filter_by_org = None

    if filter_1 is not None:
        if filter_1 == "site":
            filter_by_site = [qualifier_1]
        elif filter_1 == "organization":
            filter_by_org = [qualifier_1]
        else:
            return "Error: Only 'organization' and 'site' accepted as filter type"

        if filter_2 is not None:
            if filter_2 == "site":
                filter_by_site.append(qualifier_2)
            elif filter_2 == "organization":
                filter_by_org.append(qualifier_2)
            else:
                return "Error: Only 'organization' and 'site' accepted as filter type"

    output = get_community_users(
        return_schema_format=True,
        # filter_by_site=filter_by_site,
        # filter_by_org=filter_by_org,
        # filter_by_site=["bar"],
        # filter_by_org=["plgu"],
        filter_by_mobile_id=[535],
        include_relationships=True,
        include_mobile_nums=True,
        include_orgs=True)

    return output
