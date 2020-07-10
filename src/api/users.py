"""
Users Functions Controller File
"""

from flask import Blueprint, jsonify
from connection import DB
from src.models.users import UsersSchema
from src.models.organizations import Organizations, OrganizationsSchema
from src.utils.users import (
    get_dynaslope_users, get_community_users,
    get_community_users_simple, get_users_categorized_by_org
)
from src.utils.extra import var_checker

USERS_BLUEPRINT = Blueprint("users_blueprint", __name__)


@USERS_BLUEPRINT.route("/users/get_community_orgs_by_site/<site_code>", methods=["GET"])
def wrap_get_community_orgs_by_site(site_code):
    """
    Route function that get all Dynaslope users by group
    """
    community_users = get_users_categorized_by_org(site_code)

    temp = {}
    scopes = ["Community", "Barangay", "Municipal",
              "Provincial", "Regional", "National"]
    for user_org in community_users:
        u_o = user_org.organization
        scope = u_o.scope
        name = u_o.name

        key = name
        if name != "lewc":
            key = f"{scopes[scope]} {name}"

        user_data = UsersSchema().dump(user_org.user).data
        user_data["primary_contact"] = user_org.primary_contact

        if key not in temp:
            temp[key] = [user_data]
        else:
            temp[key].append(user_data)

    return jsonify(temp)


@USERS_BLUEPRINT.route("/users/get_community_users_by_site/<site_code>", methods=["GET"])
def wrap_get_community_users_by_site(site_code):
    """
    Route function that get all Dynaslope users by group
    """
    community_users_data = []
    if site_code:
        temp = [site_code]
        var_checker("temp", temp, True)
        community_users = get_community_users_simple(site_code=site_code)

        community_users_data = UsersSchema(
            many=True).dump(community_users).data

    return jsonify(community_users_data)


@USERS_BLUEPRINT.route("/users/get_dynaslope_users/", defaults={"active_only": "true"}, methods=["GET"])
@USERS_BLUEPRINT.route("/users/get_dynaslope_users/<string:active_only>", methods=["GET"])
def wrap_get_dynaslope_users(active_only):
    """
    Route function that get all Dynaslope users
    """
    active_only = active_only == "true"

    output = get_dynaslope_users(
        return_schema_format=True, active_only=active_only)

    return jsonify(output)


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


@USERS_BLUEPRINT.route("/users/get_organizations", methods=["GET"])
def get_organizations():
    """
    """

    orgs = Organizations.query.options(
        DB.raiseload("*")
    ).all()

    result = OrganizationsSchema(many=True, exclude=["users"]) \
        .dump(orgs).data

    return jsonify(result)
