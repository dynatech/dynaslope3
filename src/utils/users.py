"""
Utility file for Users Table
Contains functions for getting and accesing Users table
and related tables
"""

from flask import jsonify
from connection import DB
from src.models.sites import Sites
from src.models.users import (
    Users, UsersRelationship, UserMobile,
    UsersSchema, UsersRelationshipSchema
)
from src.models.organizations import UserOrganizations, Organizations, UserOrganizationsSchema
from src.utils.extra import var_checker

PROP_DICT = {
    "mob": "mobile_numbers",
    "org": "organizations",
    "hie": "user_hierarchy",
    "tea": "team"
}


def get_users_categorized_by_org(site_code=None, return_schema=False):
    """
    """
    u_org = UserOrganizations
    org = Organizations
    users = UsersRelationship

    base = u_org.query.join(org).join(UsersRelationship).order_by(
        DB.asc(org.scope), DB.desc(users.status), DB.desc(u_org.primary_contact))

    if site_code:
        base = base.join(Sites).filter(Sites.site_code == site_code)

    users_by_org = base.all()

    if return_schema:
        users_by_org = UserOrganizationsSchema(
            many=True).dump(users_by_org).data

    return users_by_org


def get_community_users_simple(site_code):
    """
    NOTE: Just a workaround to fasttrack the development of Site Info page.
    Args:
        site_code
    """
    user_r = UsersRelationship
    community_users = user_r.query.join(UserOrganizations).join(
        Sites).filter(Sites.site_code == site_code).all()

    return community_users


def get_users(
        include_relationships=False,
        include_inactive=False,
        include_mobile_nums=False,
        include_orgs=False,
        include_hierarchy=False,
        include_team=False,
        return_schema_format=False,
        return_jsonify_format=False,
        user_group="dynaslope",
        filter_by_site=None,
        filter_by_org=None,
        filter_by_mobile_id=None):
    """
    General function that gets all users and their related data

    return_schema_format (bool): When true, returns the users data
                                 as loaded schema instead of raw SQL result
    user_group (str): Can be dynaslope or community
    filter_by_site (list): contains list of site codes to
                        filter. Default value is empty list
    filter_by_org (list): contains list of organizations to
                        filter (i.e. LEWC, BLGU, etc).
                        Default value is empty list
    """
    filter_by_site = filter_by_site or []
    filter_by_org = filter_by_org or []
    filter_by_mobile_id = filter_by_mobile_id or []

    include_list = [
        ("mob", include_mobile_nums),
        ("org", include_orgs),
        ("hie", include_hierarchy),
        ("tea", include_team)
    ]

    has_includes = [item for item in include_list if True in item]

    users_model = None
    filter_list = []
    if include_relationships or has_includes:
        users_model = UsersRelationship
        users_query = users_model.query

        if has_includes:
            relationship_list = include_loading(include_list)
            users_query = users_query.options(
                *relationship_list)

        filter_var = ~users_model.organizations.any()
        if user_group != "dynaslope":
            filter_var = users_model.organizations.any()

        filter_list.append(filter_var)
    else:
        users_model = Users
        users_query = users_model.query.outerjoin(UserOrganizations)

        filter_var = UserOrganizations.org_id.is_(None)
        if user_group != "dynaslope":
            users_query = users_model.query.join(UserOrganizations)
            filter_var = UserOrganizations.org_id.isnot(None)

        filter_list.append(filter_var)

    if user_group != "dynaslope":
        if filter_by_org:
            if include_relationships or has_includes:
                users_query = users_query.join(
                    UserOrganizations)
            filter_list.append(UserOrganizations.org_name.in_(filter_by_org))

        if filter_by_mobile_id:
            if include_relationships or has_includes:
                users_query = users_query.join(
                    UserMobile)
            filter_list.append(UserMobile.mobile_id.in_(filter_by_mobile_id))

        if filter_by_site:
            users_query = users_query.join(Sites)
            filter_list.append(Sites.site_code.in_(filter_by_site))

    if not include_inactive:
        filter_list.append(Users.status == 1)

    users = users_query.filter(
        *filter_list, users_model.first_name.notlike("%UNKNOWN%")).all()

    if return_schema_format:
        if include_relationships or has_includes:
            excludes = []
            if has_includes:
                excludes = prepare_excludes(include_list)

            data = UsersRelationshipSchema(
                many=True, exclude=excludes).dump(users).data
        else:
            data = UsersSchema(many=True).dump(users).data

        if return_jsonify_format:
            return jsonify(data)
        else:
            return data

    return users


# def get_dynaslope_users(active_only=True, return_schema_format=False):
#     """
#     Function that gets all Dynaslope users and related data
#     """
#     users = get_users(
#         include_relationships=include_relationships,
#         include_inactive=include_inactive,
#         include_mobile_nums=include_mobile_nums,
#         include_orgs=include_orgs,
#         include_hierarchy=include_hierarchy,
#         include_team=include_team,
#         return_schema_format=return_schema_format,
#         return_jsonify_format=return_jsonify_format,
#         user_group="dynaslope"
#     )

#     return users


def get_dynaslope_users(active_only=True, return_schema_format=False):
    """
    Function that gets all Dynaslope users and related data
    """

    ur = UsersRelationship
    query = ur.query.options(
        DB.joinedload("account", innerjoin=True).raiseload("*"),
        DB.raiseload("*")
    ).order_by(ur.last_name)

    if active_only:
        # Note use status in users instead of is_active in UserAccounts
        query = query.filter_by(status=1)

    result = query.all()

    if return_schema_format:
        result = UsersRelationshipSchema(many=True, exclude=[
            "mobile_numbers", "organizations", "ewi_restriction",
            "teams", "landline_numbers", "emails"]).dump(result).data

    return result


def get_community_users(
        include_relationships=False,
        include_mobile_nums=False,
        include_orgs=False,
        include_hierarchy=False,
        include_team=False,
        return_schema_format=False,
        filter_by_site=None,
        filter_by_org=None,
        filter_by_mobile_id=None):
    """
    Function that gets all commmunity users and related data

    filter_by_site (list): contains list of site codes to
                        filter. Default value is empty list
    filter_by_org (list): contains list of organizations to
                        filter (i.e. LEWC, BLGU, etc).
                        Default value is empty list
    """
    var_checker("filter_by_site", filter_by_site, True)
    filter_by_site = filter_by_site or []
    filter_by_org = filter_by_org or []
    filter_by_mobile_id = filter_by_mobile_id or []

    users = get_users(
        include_relationships=include_relationships,
        include_mobile_nums=include_mobile_nums,
        include_orgs=include_orgs,
        include_hierarchy=include_hierarchy,
        include_team=include_team,
        return_schema_format=return_schema_format,
        user_group="community",
        filter_by_site=filter_by_site,
        filter_by_org=filter_by_org,
        filter_by_mobile_id=filter_by_mobile_id
    )

    return users


def include_loading(include_list):
    """
    Helper function that returns a list of SQLAlchemy
    load relationships - either raiseload or subqueryload
    depending on relationship
    """
    relationship_list = []
    for include_item in include_list:
        prop = PROP_DICT[include_item[0]]
        relationship = getattr(UsersRelationship, prop)
        rel = DB.raiseload(relationship)
        if include_item[1]:
            rel = DB.subqueryload(relationship)

        relationship_list.append(rel)

    return relationship_list


def prepare_excludes(include_list):
    """
    Helper function that returns a list of
    excluded relationships due to raised loading
    """
    exclude = []
    for include_item in include_list:
        if not include_item[1]:
            exclude.append(PROP_DICT[include_item[0]])

    return exclude


def login(data):

    return "wqewqewe"
