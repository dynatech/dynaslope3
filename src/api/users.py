"""
Users Functions Controller File
"""

from flask import Blueprint, jsonify, request
from connection import DB
from src.models.users import UsersSchema
from src.models.organizations import Organizations, OrganizationsSchema
from src.utils.users import (
    get_dynaslope_users, get_community_users,
    get_community_users_simple, get_users_categorized_by_org, update_account,
    create_account
)
from src.utils.extra import var_checker
from src.utils.contacts import (
    save_user_contact_numbers, save_user_email,
    save_user_information
)
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

        user_data = UsersSchema().dump(user_org.user)
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
        community_users = get_community_users_simple(site_code=site_code)

        community_users_data = UsersSchema(
            many=True).dump(community_users)

    return jsonify(community_users_data)


@USERS_BLUEPRINT.route("/users/get_dynaslope_users/", methods=["GET"])
@USERS_BLUEPRINT.route("/users/get_dynaslope_users/<string:active_only>", methods=["GET"])
@USERS_BLUEPRINT.route("/users/get_dynaslope_users/<string:active_only>/<string:include_contacts>", methods=["GET"])
def wrap_get_dynaslope_users(active_only="true", include_contacts=False):
    """
    Route function that get all Dynaslope users
    """
    active_only = active_only == "true"
    include_contacts = include_contacts == "true"

    output = get_dynaslope_users(
        return_schema_format=True, active_only=active_only, include_contacts=include_contacts)

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
        .dump(orgs)

    return jsonify(result)


@USERS_BLUEPRINT.route("/users/update_account", methods=["POST"])
def update_user_account():
    """
    """
    json_data = request.get_json()
    result = update_account(json_data)

    return result


@USERS_BLUEPRINT.route("/users/create_dynaslope_user", methods=["POST"])
def create_user():
    """
    """
    json_data = request.get_json()
    try:
        user_id = save_user_information(json_data)
        save_user_contact_numbers(json_data, user_id)
        create_account(json_data, user_id)
        message = "User successfully added"
        status = True
        DB.session.commit()

    except Exception as ex:
        print(ex)
        DB.session.rollback()
        message = "Something went wrong, Please try again"
        status = False

    feedback = {
        "status": status,
        "message": message
    }
    return jsonify(feedback)


@USERS_BLUEPRINT.route("/users/update_user_info", methods=["POST"])
def update_user_info():
    """
    """
    json_data = request.get_json()

    try:
        user_id = json_data["user_id"]
        save_user_information(json_data)
        save_user_contact_numbers(json_data, user_id)
        # save_user_email(emails, user_id, emails_to_delete)

        message = "User successfully updated!"
        status = "success"
        DB.session.commit()

    except Exception as err:
        print(err)
        DB.session.rollback()

        message = "Something went wrong. Kindly report."
        status = "error"

    feedback = {
        "status": status,
        "message": message
    }

    return jsonify(feedback)
