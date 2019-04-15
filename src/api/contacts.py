"""
Contacts Functions Controller File
"""

from flask import Blueprint, jsonify
from sqlalchemy import text
from connection import DB, SOCKETIO
from src.models.users import (UserMobile, UserLandlines, UserOrganization, UserOrganizationSchema, Users,
                              UserTeams, UserTeamsSchema, UserTeamMembers, UserTeamMembersSchema)
from src.models.sites import Sites, SitesSchema
from src.models.sim_prefix import SimPrefix, SimPrefixSchema
from src.utils.users import get_dynaslope_users


CONTACTS_BLUEPRINT = Blueprint("contacts_blueprint", __name__)


@CONTACTS_BLUEPRINT.route("/contacts/get_all_contacts", methods=["GET"])
def get_all_contacts():
    """
    Function that get contacts as json string
    """

    return jsonify({"community": get_all_community_contacts(), "employee": get_all_employee_contacts(), "unknown": "unknown_result"})


@CONTACTS_BLUEPRINT.route("/contacts/get_all_community_contacts", methods=["GET"])
def get_all_community_contacts():
    """
    Function that get all employee contacts
    """

    query = text("SELECT DISTINCT "
                 "commons_db.users.user_id,"
                 "commons_db.users.first_name,"
                 "commons_db.users.last_name,"
                 "commons_db.users.status,"
                 "UPPER(commons_db.user_organization.org_name) as org_name,"
                 "UPPER(senslopedb.sites.site_code) as site_code,"
                 "comms_db.user_mobile.sim_num as mobile_number "
                 "FROM "
                 "commons_db.users "
                 "INNER JOIN "
                 "commons_db.user_organization ON commons_db.users.user_id = commons_db.user_organization.user_id "
                 "INNER JOIN "
                 "comms_db.user_mobile ON commons_db.users.user_id = comms_db.user_mobile.user_id "
                 "INNER JOIN "
                 "senslopedb.sites ON senslopedb.sites.site_id = commons_db.user_organization.fk_site_id;")

    result = DB.engine.execute(query)
    community_contact_data = []

    for row in result:
        community_contact_data.append({
            "user_id": row["user_id"],
            "first_name": row["first_name"],
            "last_name": row["last_name"],
            "status": row["status"],
            "org_name": row["org_name"],
            "site_code": row["site_code"],
            "mobile_number": row["mobile_number"]
        })

    return community_contact_data


@CONTACTS_BLUEPRINT.route("/contacts/get_all_employee_contacts", methods=["GET"])
def get_all_employee_contacts():
    """
    Function that get all employee contacts
    """

    # query = text("SELECT * FROM commons_db.users "
    #              "INNER JOIN commons_db.user_team_members ON commons_db.users.user_id = commons_db.user_team_members.users_users_id "
    #              "INNER JOIN commons_db.user_teams ON commons_db.user_team_members.dewsl_teams_team_id = commons_db.user_teams.team_id")

    # result = DB.engine.execute(query)
    # employee_contact_data = []

    # for row in result:
    #     print(row)
    #     employee_contact_data.append({
    #         "user_id": row["user_id"],
    #         "user_id": row["user_id"],
    #         "user_id": row["user_id"],
    #         "user_id": row["user_id"],
    #     })

    employee = get_dynaslope_users(include_relationships=True,
                                   include_mobile_nums=False,
                                   include_orgs=False,
                                   include_hierarchy=False,
                                   include_team=True,
                                   return_schema_format=False)

    return employee


@CONTACTS_BLUEPRINT.route("/contacts/contact_suggestion", methods=["GET"])
def get_contact_suggestions():
    """
    Function that get all contact for search
    """
    data = {
        "search_input": "agb"
    }
    contact_suggestion_query = text("SELECT * FROM "
                                    "(SELECT "
                                    "UPPER(CONCAT(commons_db.sites.site_code, ' ', commons_db.user_organization.org_name, ' - ', commons_db.users.last_name, ', ', commons_db.users.first_name)) AS full_name,"
                                    "comms_db.user_mobile.sim_num AS number,"
                                    "commons_db.users.user_id AS id,"
                                    "comms_db.user_hierarchy.priority,"
                                    "comms_db.user_mobile.mobile_status AS status, commons_db.users.status as user_status "
                                    "FROM "
                                    "commons_db.users "
                                    "INNER JOIN commons_db.user_organization ON commons_db.users.user_id = commons_db.user_organization.user_id "
                                    "LEFT JOIN comms_db.user_hierarchy ON comms_db.user_hierarchy.fk_user_id = commons_db.users.user_id "
                                    "RIGHT JOIN commons_db.sites ON commons_db.sites.site_id = commons_db.user_organization.fk_site_id "
                                    "RIGHT JOIN comms_db.user_mobile ON comms_db.user_mobile.user_id = commons_db.users.user_id UNION SELECT "
                                    "UPPER(CONCAT(commons_db.user_teams.team_name, ' - ', commons_db.users.salutation, ' ', commons_db.users.last_name, ', ', commons_db.users.first_name)) AS full_name,"
                                    "comms_db.user_mobile.sim_num AS number,"
                                    "commons_db.users.user_id AS id,"
                                    "comms_db.user_hierarchy.priority,"
                                    "comms_db.user_mobile.mobile_status AS status, commons_db.users.status as user_status "
                                    "FROM "
                                    "commons_db.users "
                                    "INNER JOIN commons_db.user_team_members ON commons_db.users.user_id = commons_db.user_team_members.users_users_id "
                                    "LEFT JOIN comms_db.user_hierarchy ON comms_db.user_hierarchy.fk_user_id = commons_db.users.user_id "
                                    "RIGHT JOIN commons_db.user_teams ON commons_db.user_team_members.dewsl_teams_team_id = commons_db.user_teams.team_id "
                                    "RIGHT JOIN comms_db.user_mobile ON comms_db.user_mobile.user_id = commons_db.users.user_id) AS fullcontact "
                                    "WHERE "
                                    "status = 1 and user_status = 1 and (full_name LIKE '%" + str(data["search_input"]) + "%' or id LIKE '%" + str(data["search_input"]) + "%')")

    result = DB.engine.execute(contact_suggestion_query)
    contact_suggestion_data = []

    for row in result:
        contact_suggestion_data.append({
            "full_name": row["full_name"],
            "number": row["number"],
            "user_id": row["id"],
            "priority": row["priority"]
        })

    return jsonify({"contacts": contact_suggestion_data})


@CONTACTS_BLUEPRINT.route("/contacts/contact_details", methods=["GET"])
def get_contact_details():
    """
    Function that get contacts contact as json string
    """
    # user_id = 526  # for testing
    # contact_details_query = UsersRelationship.query.filter(
    #     UsersRelationship.first_name.notlike("%UNKNOWN%"),
    #     UsersRelationship.first_name != None,
    #     UsersRelationship.last_name != None,
    #     UsersRelationship.user_id == user_id).first()

    # contact_details_result = UsersRelationshipSchema().dump(
    #     contact_details_query).data

    return jsonify("asd")


@CONTACTS_BLUEPRINT.route("/contacts/save_contact", methods=["GET"])
def save_contact():
    """
    Function that add new contact
    """
    data = {
        "first_name": "Sample",
        "last_name": "Sample",
        "sex": "M",
        "status": 1,
        "teams": {"dynaslope", "team1"},
        "mobile_numbers": [
            {"mobile_id": 0, "mobile_number": 639058845236,
                "priority": 1, "status": 1},
            {"mobile_id": 0, "mobile_number": 639192455725,
                "priority": 2, "status": 1}
        ],
        "landline_numbers": [
            {"landline_id": 0, "landline_number": 7549340,
                "remarks": 1},
            {"landline_id": 0, "landline_number": 3675274,
                "remarks": 1}
        ],
        "save_type": "new",
        "account_type": "employee",
        "user_id": 76
    }

    save_type = data["save_type"]
    account_type = data["account_type"]

    if account_type == "employee":
        user_id = save_user_data(data, save_type)
        # save user email function here
        save_user_team_data(data, user_id, save_type)
        save_user_mobile_number(data, user_id, save_type)
        save_user_landline_number(data, user_id, save_type)
    else:
        print("comm")
        user_id = save_user_data(data, save_type)

    DB.session.commit()

    return "data"


def save_user_data(data, save_type):
    """
    Function that save user data
    """
    if save_type == "new":
        insert_new_user = Users(
            first_name=data["first_name"], last_name=data["last_name"], sex=data["sex"], status=data["status"])

        DB.session.add(insert_new_user)
        DB.session.flush()

        user_id = insert_new_user.user_id
    else:
        user_id = data["user_id"]
        update = Users.query.get(user_id)
        update.first_name = data["first_name"]
        update.last_name = data["last_name"]
        update.sex = data["sex"]
        update.status = data["status"]

    return user_id


def save_user_email():
    """
    Function that save user email
    """


def save_user_team_data(data, user_id, save_type):
    """
    Function that save user team data
    """
    teams = data["teams"]
    team_length = len(teams)

    if team_length != 0:
        for team in teams:
            team_query = UserTeams.query.filter(
                UserTeams.team_code == team).first()

            team_data = UserTeamsSchema(
                exclude=("user",)).dump(team_query).data

            team_length = len(team_data)
            if team_length == 0:
                insert_new_team = UserTeams(
                    team_code=team, team_name=team, remarks="dynaslope")

                DB.session.add(insert_new_team)
                DB.session.flush()

                last_team_id = insert_new_team.team_id

                insert_new_team_member = UserTeamMembers(
                    users_users_id=user_id, dewsl_teams_team_id=last_team_id)

                DB.session.add(insert_new_team_member)
                DB.session.flush()
            else:
                team_id = team_data["team_id"]
                check_user_team_query = UserTeamMembers.query.filter(
                    UserTeamMembers.users_users_id == user_id).filter(
                        UserTeamMembers.dewsl_teams_team_id == team_id).first()

                user_team_result = UserTeamMembersSchema().dump(check_user_team_query).data

                user_team_length = len(user_team_result)
                if user_team_length == 0:
                    insert_new_team_member = UserTeamMembers(
                        users_users_id=user_id, dewsl_teams_team_id=team_id)

                    DB.session.add(insert_new_team_member)
                    DB.session.flush()


def save_user_mobile_number(data, user_id, save_type):
    """
    Function that save mobile numbers
    """

    mobile_numbers = data["mobile_numbers"]
    mobile_numbers_length = len(mobile_numbers)

    if mobile_numbers_length != 0:
        for row in mobile_numbers:
            mobile_gsm_id = get_gsm_id_by_prefix(str(row["mobile_number"]))
            if save_type == "new":
                save_mobile = UserMobile(
                    user_id=user_id, sim_num=row["mobile_number"], priority=row["priority"], mobile_status=row["status"], gsm_id=mobile_gsm_id)
                DB.session.add(save_mobile)
                DB.session.flush()
            else:
                if row["mobile_id"] == 0:
                    # check number if exists code here
                    save_mobile = UserMobile(
                        user_id=user_id, sim_num=row["mobile_number"], priority=row["priority"], mobile_status=row["status"], gsm_id=mobile_gsm_id)
                    DB.session.add(save_mobile)
                    DB.session.flush()
                else:
                    update_mobile = UserMobile.query.get(row["mobile_id"])
                    update_mobile.sim_num = row["mobile_number"]
                    update_mobile.priority = row["priority"]
                    update_mobile.mobile_status = row["mobile_status"]
                    update_mobile.gsm_id = mobile_gsm_id


def save_user_landline_number(data, user_id, save_type):
    """
    Function that save landline numbers
    """
    landline_numbers = data["landline_numbers"]
    landline_numbers_length = len(landline_numbers)

    if landline_numbers_length != 0:
        for row in landline_numbers:
            if save_type == "new":
                save_landline = UserLandlines(
                    user_id=user_id, landline_num=row["landline_number"], remarks=row["priority"])
                DB.session.add(save_landline)
                DB.session.flush()
            else:
                if row["landline_id"] == 0:
                    # check number if exists code here
                    save_landline = UserLandlines(
                        user_id=user_id, landline_num=row["landline_number"], remarks=row["priority"])
                    DB.session.add(save_landline)
                    DB.session.flush()
                else:
                    update_mobile = UserLandlines.query.get(row["landline_id"])
                    update_mobile.landline_num = row["landline_number"]
                    update_mobile.remarks = row["remarks"]


def get_gsm_id_by_prefix(mobile_number):
    """
    Function that get prefix gsm id
    """
    prefix = mobile_number[2:5]

    sim_prefix_query = SimPrefix.query.filter(
        SimPrefix.prefix == prefix).first()

    result = SimPrefixSchema().dump(sim_prefix_query).data
    gsm_id = 0

    result_length = len(result)
    if result_length == 0:
        gsm_id = 0
    else:
        gsm_id = result["gsm_server_id_fk"]

    return gsm_id


@CONTACTS_BLUEPRINT.route("/contacts/update_contact", methods=["GET"])
def update_contact():
    """
    Function that update contact
    """


@CONTACTS_BLUEPRINT.route("/contacts/delete_contact", methods=["GET"])
def delete_contact():
    """
    Function that delete contact
    """


def insert_mobile_number():
    """
    Function that insert user mobile number
    """


def insert_landline_number():
    """
    Function that insert user landlie number
    """


def add_employee_team():
    """
    Function that add employee teams
    """
