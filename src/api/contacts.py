"""
Contacts Functions Controller File
"""

from flask import Blueprint, jsonify
from sqlalchemy import text
from connection import DB, SOCKETIO
from src.models.users import (UserMobile, UserLandlines, UserOrganization,
                              UserOrganizationSchema, Users, UserEmails, UserEmailsSchema,
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

    return jsonify({"community": get_all_community_contacts(), "employee": get_all_employee_contacts(), "unknown": get_all_unknown_users()})


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

    employee = get_dynaslope_users(include_relationships=True,
                                   include_mobile_nums=False,
                                   include_orgs=False,
                                   include_hierarchy=False,
                                   include_team=True,
                                   return_schema_format=True,
                                   return_jsonify_format=False)

    return employee


@CONTACTS_BLUEPRINT.route("/contacts/get_all_unknown_users", methods=["GET"])
def get_all_unknown_users():
    """
    Function that get all unknown contacts
    """

    query = text("SELECT DISTINCT "
                 "CONCAT(commons_db.users.last_name, ', ', commons_db.users.first_name) AS full_name,"
                 "comms_db.user_mobile.sim_num,"
                 "comms_db.user_mobile.mobile_id AS mobile_id,"
                 "comms_db.user_mobile.user_id "
                 "FROM "
                 "comms_db.smsinbox_users "
                 "INNER JOIN "
                 "comms_db.user_mobile ON comms_db.smsinbox_users.mobile_id = comms_db.user_mobile.mobile_id "
                 "INNER JOIN "
                 "commons_db.users ON comms_db.user_mobile.user_id = commons_db.users.user_id "
                 "WHERE "
                 "commons_db.users.first_name LIKE '%UNKNOWN_%' "
                 "AND comms_db.user_mobile.sim_num NOT LIKE '%SMART%' "
                 "AND comms_db.user_mobile.sim_num NOT LIKE '%GLOBE%';")

    result = DB.engine.execute(query)
    data = []

    for row in result:
        data.append({
            "full_name": row["full_name"],
            "mobile_number": row["sim_num"],
            "mobile_id": row["mobile_id"],
            "user_id": row["user_id"]
        })

    return data


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
                                    "RIGHT JOIN commons_db.user_teams ON commons_db.user_team_members.user_teams_team_id = commons_db.user_teams.team_id "
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
    data = {
        "user_id": 85,
        "account_type": "employee"
    }

    account_type = data["account_type"]

    if(account_type == "employee"):
        user_data = get_employee_data(data)
    else:
        user_data = get_community_data(data)

    return jsonify(user_data)


def get_employee_data(data):
    """
    Function that get employee data
    """
    user_id = data["user_id"]
    user_data = get_user_data(user_id)
    user_mobile = get_user_mobile_numbers(user_id)
    user_landline = get_user_landline_numbers(user_id)
    user_team = get_user_team(user_id)
    user_emails = get_user_emails(user_id)

    data = {
        "user_information": user_data,
        "user_mobile_numbers": user_mobile,
        "user_landline_numbers": user_landline,
        "user_team": user_team,
        "user_emails": user_emails
    }

    return data


def get_community_data(data):
    """
    Function that get community data
    """
    user_id = data["user_id"]
    user_data = get_user_data(user_id)
    user_mobile = get_user_mobile_numbers(user_id)
    user_landline = get_user_landline_numbers(user_id)
    user_site = "get_user_site"
    user_org = "get_user_org"

    data = {
        "user_information": user_data,
        "user_mobile_numbers": user_mobile,
        "user_landline_numbers": user_landline,
        "user_site": user_site,
        "user_org": user_org
    }

    return data


def get_user_data(user_id):
    """
    Function that get contact data
    """
    query = text("SELECT "
                 "commons_db.users.user_id,"
                 "commons_db.users.first_name,"
                 "commons_db.users.last_name,"
                 "commons_db.users.middle_name,"
                 "commons_db.users.nickname,"
                 "commons_db.users.birthday,"
                 "commons_db.users.sex,"
                 "commons_db.users.status "
                 "FROM commons_db.users "
                 "WHERE user_id =  " + str(user_id)
                 )
    result = DB.engine.execute(query)
    contact_details_data = []

    for row in result:
        contact_details_data.append({
            "user_id": row["user_id"],
            "first_name": row["first_name"],
            "last_name": row["last_name"],
            "middle_name": row["middle_name"],
            "nickname": row["nickname"],
            "birthdate": str(row["birthday"]),
            "sex": row["sex"],
            "status": row["status"]
        })

    return contact_details_data


def get_user_mobile_numbers(user_id):
    """
    Function that get user mobiles
    """
    query = text("SELECT "
                 "comms_db.user_mobile.mobile_id,"
                 "comms_db.user_mobile.sim_num,"
                 "comms_db.user_mobile.priority,"
                 "comms_db.user_mobile.mobile_status "
                 "FROM comms_db.user_mobile "
                 "WHERE user_id =  " + str(user_id)
                 )

    result = DB.engine.execute(query)
    user_mobile_data = []

    for row in result:
        user_mobile_data.append({
            "mobile_id": row["mobile_id"],
            "sim_num": row["sim_num"],
            "priority": row["priority"],
            "mobile_status": row["mobile_status"]
        })

    return user_mobile_data


def get_user_landline_numbers(user_id):
    """
    Function that get user landlines
    """
    query = text("SELECT "
                 "comms_db.user_landlines.landline_id,"
                 "comms_db.user_landlines.landline_num,"
                 "comms_db.user_landlines.remarks "
                 "FROM comms_db.user_landlines "
                 "WHERE user_id =  " + str(user_id)
                 )

    result = DB.engine.execute(query)
    user_landline_data = []

    for row in result:
        user_landline_data.append({
            "landline_id": row["landline_id"],
            "landline_number": row["landline_num"],
            "remarks": row["remarks"]
        })

    return user_landline_data


def get_user_team(user_id):
    """
    Function that get user teams
    """
    query = text("SELECT "
                 "commons_db.user_team_members.members_id,"
                 "commons_db.user_teams.team_code "
                 "FROM commons_db.user_team_members "
                 "JOIN commons_db.user_teams ON commons_db.user_teams.team_id = commons_db.user_team_members.user_teams_team_id "
                 "WHERE commons_db.user_team_members.users_users_id = " +
                 str(user_id)
                 )

    result = DB.engine.execute(query)
    user_team_data = []
    for row in result:
        user_team_data.append({
            "members_id": row["members_id"],
            "team_code": row["team_code"]
        })

    return user_team_data


def get_user_emails(user_id):
    """
    Function that get user emails
    """
    query = text("SELECT * "
                 "FROM commons_db.user_emails "
                 "WHERE commons_db.user_emails.user_id = " +
                 str(user_id)
                 )

    result = DB.engine.execute(query)
    user_email_data = []
    for row in result:
        user_email_data.append({
            "email_id": row["email_id"],
            "email": row["email"]
        })

    return user_email_data


def get_user_site_and_org():
    """
    Function that get user org and site
    """


@CONTACTS_BLUEPRINT.route("/contacts/save_contact", methods=["GET"])
def save_contact():
    """
    Function that add new contact
    """
    data = {
        "first_name": "Sample1_updated",
        "last_name": "Sample1_updated",
        "sex": "M",
        "status": 1,
        "teams": {"dynaslope", "team1"},
        "mobile_numbers": [
            {"mobile_id": 0, "mobile_number": 639056645236,
                "priority": 1, "status": 1},
            {"mobile_id": 0, "mobile_number": 639192885725,
                "priority": 2, "status": 1}
        ],
        "landline_numbers": [
            {"landline_id": 0, "landline_number": 7549311,
                "remarks": 1},
            {"landline_id": 0, "landline_number": 3675222,
                "remarks": 1}
        ],
        "emails": [
            {"email_id": 0, "email": "david@email.com"}
        ],
        "save_type": "new",
        "account_type": "employee",
        "user_id": 76
    }
    try:
        save_type = data["save_type"]
        account_type = data["account_type"]

        if account_type == "employee":
            user_id = save_user_data(data, save_type)
            save_user_team_data(data, user_id, save_type)
            save_user_email(data, user_id, save_type)
            save_user_mobile_number(data, user_id, save_type)
            save_user_landline_number(data, user_id, save_type)
        else:
            print("comm")
            # user_id = save_user_data(data, save_type)

        DB.session.commit()
    except Exception as err:
        print(err)
        DB.session.rollback()
        raise

    return "data"


def save_user_data(data, save_type):
    """
    Function that save user data
    """
    if save_type == "new":
        # add validation if user is already saved
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


def save_user_email(data, user_id, save_type):
    """
    Function that save user email
    """

    emails = data["emails"]
    email_length = len(emails)

    if save_type == "new":
        if email_length != 0:
            for row in emails:
                email_query = UserEmails.query.filter(
                    UserEmails.email == row["email"]).first()

                email_data = UserEmailsSchema(
                    exclude=("user",)).dump(email_query).data
                user_email_length = len(email_data)
                if user_email_length == 0:
                    insert_new_email = UserEmails(
                        user_id=user_id, email=row["email"])
                    DB.session.add(insert_new_email)
                    DB.session.flush()
                else:
                    print("email already exists")
                    update_email = UserEmails.query.get(row["email_id"])
                    update_email.email = row["email"]
        else:
            print("hays")


@CONTACTS_BLUEPRINT.route("/contacts/test_dup", methods=["GET"])
def test_get_no_dup():
    """
    Sample
    """
    a = ["email1", "email2", "email3"]
    b = ["email1", "email2", "email3", "email4"]
    data = [elem for elem in b if elem in a]

    for row in data:
        print(row)


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
                    users_users_id=user_id, user_teams_team_id=last_team_id)

                DB.session.add(insert_new_team_member)
                DB.session.flush()
            else:
                team_id = team_data["team_id"]
                check_user_team_query = UserTeamMembers.query.filter(
                    UserTeamMembers.users_users_id == user_id).filter(
                        UserTeamMembers.user_teams_team_id == team_id).first()

                user_team_result = UserTeamMembersSchema().dump(check_user_team_query).data

                user_team_length = len(user_team_result)
                if user_team_length == 0:
                    insert_new_team_member = UserTeamMembers(
                        users_users_id=user_id, user_teams_team_id=team_id)

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
                    user_id=user_id, landline_num=row["landline_number"], remarks=row["remarks"])
                DB.session.add(save_landline)
                DB.session.flush()
            else:
                if row["landline_id"] == 0:
                    # check number if exists code here
                    save_landline = UserLandlines(
                        user_id=user_id, landline_num=row["landline_number"], remarks=row["remarks"])
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
