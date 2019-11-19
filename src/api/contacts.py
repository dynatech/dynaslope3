"""
Contacts Functions Controller File
"""

from flask import Blueprint, jsonify

from src.utils.contacts import get_all_contacts
from src.models.users import (
    Users, UsersSchema,
    UserEmails, UserEmailsSchema,
    UserLandlines, UserLandlinesSchema,
    UserEwiStatus, UserEwiStatusSchema)
from src.models.mobile_numbers import (
    UserMobiles, UserMobilesSchema,
    MobileNumbers, MobileNumbersSchema)
from src.models.gsm import (SimPrefixes, SimPrefixesSchema)
from src.models.organizations import (
    Organizations, OrganizationsSchema,
    UserOrganizations, UserOrganizationsSchema)
from src.models.sites import (Sites, SitesSchema)


CONTACTS_BLUEPRINT = Blueprint("contacts_blueprint", __name__)


@CONTACTS_BLUEPRINT.route("/contacts/get_all_contacts", methods=["GET"])
def wrap_get_all_contacts():
    """
    """

    contacts = get_all_contacts(return_schema=True)

    return jsonify(contacts)

@CONTACTS_BLUEPRINT.route("/contacts/save_contact", methods=["GET", "POST"])
def save_contact():
    """
    Function that save and update contact
    """
    data = request.get_json()
    if data is None:
        data = request.form

    status = None
    message = "test"

    try:
        if data["value"] is not None:
            data = data["value"]
    except KeyError:
        print("Value is defined.")
        pass
    
    try:
        print(data)
        user = data["user"]
        user_id = user["user_id"]
        updated_user_id = insert_user_personal_data(user)

        contact_numbers = data["contact_numbers"]
        insert_user_contact_numbers(contact_numbers, updated_user_id)

        affiliation = data["affiliation"]
        insert_user_affliation(affiliation, updated_user_id)

        message = "Successfully added new user"
        status = True
        DB.session.commit()
    except Exception as err:
        DB.session.rollback()
        message = "Something went wrong, Please try again"
        status = False
        print(err)

    feedback = {
        "status": status,
        "message": message
    }

    return jsonify(feedback)

def insert_user_personal_data(data):
    user_id = data["user_id"]
    first_name = data["first_name"]
    last_name = data["last_name"]
    middle_name = data["middle_name"]
    nickname = data["nickname"]
    emails = data["emails"]
    ewi_recipient = data["ewi_recipient"]
    print(data)
    if user_id == 0:
        insert_user = Users(
            first_name=first_name, last_name=last_name,
            middle_name=middle_name, nickname=nickname, ewi_recipient=ewi_recipient, status=1)

        DB.session.add(insert_user)
        DB.session.flush()
        user_id = insert_user.user_id

        email_len = len(emails)
        if email_len > 0:
            for row in emails:
                insert_user_email = UserEmails(user_id=user_id, email=row)
                DB.session.add(insert_user_email)
    else:
        update = Users.query.get(user_id)
        update.first_name = first_name
        update.last_name = last_name
        update.middle_name = middle_name
        update.nickname = nickname
        update.ewi_recipient = ewi_recipient

        email_len = len(emails)
        if email_len > 0:
            for row in emails:
                row_type = type(row)
                if row_type == str:
                    insert_email = UserEmails(user_id=user_id, email=row)
                    DB.session.add(insert_email)
                else:
                    update_email = UserEmails.query.get(row["email_id"])
                    update_email.email = row["email"]

    return user_id

def insert_user_contact_numbers(data, user_id):
    mobile_numbers = data["mobile_numbers"]
    landline_numbers = data["landline_numbers"]
    mobile_numbers_len = len(mobile_numbers)
    landline_number_len = len(landline_numbers)

    if mobile_numbers_len > 0:
        for row in mobile_numbers:
            mobile_id = row["mobile_id"]
            sim_num = row["sim_num"]
            status = row["status"]
            if mobile_id == 0:
                gsm_id = get_gsm_id_by_prefix(sim_num)
                insert_mobile_number = MobileNumbers(sim_num=sim_num, gsm_id=gsm_id)
                DB.session.add(insert_mobile_number)
                DB.session.flush()
                last_inserted_mobile_id = insert_mobile_number.mobile_id
                insert_user_mobile = UserMobiles(
                    user_id=user_id, mobile_id=last_inserted_mobile_id, status=status)
                DB.session.add(insert_user_mobile)
            else:
                update_mobile = MobileNumbers.query.get(mobile_id)
                update_mobile.sim_num = sim_num
                update_mobile.gsm_id = get_gsm_id_by_prefix(sim_num)

    if landline_number_len > 0:
        for row in landline_numbers:
            landline_id = row["landline_id"]
            landline_num = row["landline_num"]

            if landline_id == 0:
                insert_landline_number = UserLandlines(user_id=user_id, landline_num=landline_num)
                DB.session.add(insert_landline_number)
            else:
                update_landline = UserLandlines.query.get(landline_id)
                update_landline.landline_num = landline_num

    return True

def insert_user_affliation(data, user_id):
    location = data["location"]
    site = data["site"]
    scope = data["scope"]
    office = data["office"]
    org_query = Organizations.query.filter(Organizations.scope == scope, Organizations.name == office).first()
    result = OrganizationsSchema(exclude=("users",)).dump(org_query).data
    org_id = result["org_id"]

    user_organizations = []
    site_ids = []
    org_name = office
    modifier = ""

    select_user_org_query = UserOrganizations.query.filter(UserOrganizations.user_id == user_id).all()
    user_org_result = UserOrganizationsSchema(many=True).dump(select_user_org_query).data
    for row in user_org_result:
        user_org_id = int(row["user_org_id"])
        UserOrganizations.query.filter(UserOrganizations.user_org_id == user_org_id).delete()

    if scope in (0, 1):
        site_ids.append(site["value"])
        modifier = "b" if org_name == "lgu" else ""
    elif scope == 2:
        modifier = "m"
        filter_var = Sites.municipality == location
    elif scope == 3:
        modifier = "p"
        filter_var = Sites.province == location
    elif scope == 4:
        filter_var = Sites.region == location

    if office == "lgu":
        org_name = str(modifier + office)

    if scope not in (0, 1):
        result = Sites.query.filter(filter_var).all()
        for site in result:
            site_ids.append(site.site_id)

    for site_id in site_ids:
        user_organizations.append({"site_id": site_id, "org_id": org_id, "org_name": org_name})

    if scope == 5:
        insert_org = UserOrganizations(user_id=user_id, site_id=site["value"], org_name=org_name, org_id=org_id)
    else:
        for row in user_organizations:
            site_id = row["site_id"]
            org_id = row["org_id"]
            org_name = row["org_name"]
            insert_org = UserOrganizations(user_id=user_id, site_id=site_id, org_name=org_name, org_id=org_id)

    DB.session.add(insert_org)
    return True



def get_gsm_id_by_prefix(mobile_number):
    """
    Function that get prefix gsm id
    """
    prefix = mobile_number[2:5]

    sim_prefix_query = SimPrefixes.query.filter(
        SimPrefixes.prefix == prefix).first()

    result = SimPrefixesSchema().dump(sim_prefix_query).data
    gsm_id = 0

    result_length = len(result)
    if result_length == 0:
        gsm_id = 0
    else:
        gsm_id = result["gsm_id"]

    return gsm_id

@CONTACTS_BLUEPRINT.route("/contacts/migrate_ewi_recipient", methods=["GET", "POST"])
def ewi_recipient_migration():
    query = UserEwiStatus.query.filter(UserEwiStatus.status == 1).with_entities(UserEwiStatus.users_id).distinct().all()
    result = UserEwiStatusSchema(many=True).dump(query).data
    for row in result:
        user_id = row["users_id"]
        check_user = Users.query.filter(Users.user_id == user_id).first()
        check_result = UsersSchema().dump(check_user).data
        data_len = len(check_result)
        if data_len > 0:
            update = Users.query.get(user_id)
            update.ewi_recipient = 1
            print("User ID: " + str(user_id) + " UPDATED")
    DB.session.commit()

    return jsonify(result)

