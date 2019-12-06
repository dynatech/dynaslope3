"""
Contacts Functions Utility File
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload
from connection import DB
from src.models.users import (
    Users, UsersSchema,
    UserEmails, UserLandlines,
    UsersRelationship, UsersRelationshipSchema,
    UserEwiRestrictions
)
from src.models.mobile_numbers import (
    UserMobiles, UserMobilesSchema,
    MobileNumbers
)
from src.models.organizations import (
    Organizations, OrganizationsSchema,
    UserOrganizations
)
from src.models.gsm import SimPrefixes, SimPrefixesSchema
from src.models.sites import Sites, SitesSchema
from src.models.user_ewi_status import UserEwiStatus, UserEwiStatusSchema
from src.models.analysis import MarkerObservations, MarkerObservationsSchema
from src.utils.monitoring import get_routine_sites, get_ongoing_extended_overdue_events


def get_all_contacts(return_schema=False):
    """
    Function that get all contacts
    """

    mobile_numbers = UserMobiles.query.join(Users).options(
        joinedload("user").subqueryload("organizations")
        .joinedload("site").raiseload("*")
    ).order_by(Users.last_name, UserMobiles.priority).all()

    if return_schema:
        numbers_schema = UserMobilesSchema(many=True).dump(mobile_numbers).data

        users_id = {}
        mobile_numbers = []
        for num in numbers_schema:
            user_dict = num["user"]
            user_id = user_dict["user_id"]
            mobile_number_dict = {
                **num["mobile_number"],
                "priority": num["priority"],
                "status": num["status"]
            }

            if user_id in users_id.keys():
                key = users_id[user_id]
                mobile_numbers[key]["mobile_numbers"].append(
                    mobile_number_dict)
            else:
                mobile_numbers.append({
                    "user": user_dict,
                    "mobile_numbers": [mobile_number_dict]
                })
                users_id[user_id] = len(mobile_numbers) - 1

    return mobile_numbers


def get_contacts_per_site(site_ids=None, site_codes=None, only_ewi_recipients=True, alert_level=0):
    """
    Function that get contacts per site
    """

    query = UsersRelationship.query.join(
        UserOrganizations).join(Sites).options(
            DB.subqueryload("mobile_numbers").joinedload(
                "mobile_number", innerjoin=True),
            DB.subqueryload("organizations").joinedload(
                "site", innerjoin=True),
            DB.subqueryload("organizations").joinedload(
                "organization", innerjoin=True),
            DB.raiseload("*"))

    if site_ids:
        query = query.filter(Sites.site_id.in_(site_ids))

    if site_codes:
        query = query.filter(Sites.site_code.in_(site_codes))

    if only_ewi_recipients:
        query = query.filter(Users.ewi_recipient == 1)

    if alert_level != 0:
        uer = UserEwiRestrictions
        query = query.join(uer).filter(DB.or_(
            uer.user_id.is_(None), uer.alert_level < alert_level
        ))

    user_per_site_query = query.all()
    user_per_site_result = UsersRelationshipSchema(
        many=True, exclude=["emails", "teams", "landline_numbers", "ewi_restriction"]) \
        .dump(user_per_site_query).data

    return user_per_site_result


def get_ewi_recipients(site_ids=None, site_codes=None, alert_level=0):
    """
    Function that get ewi recipients per site
    """

    query = UsersRelationship.query.join(
        UserOrganizations).join(Sites).options(
            DB.subqueryload("mobile_numbers").joinedload(
                "mobile_number", innerjoin=True),
            DB.subqueryload("organizations").joinedload(
                "site", innerjoin=True),
            DB.subqueryload("organizations").joinedload(
                "organization", innerjoin=True),
            DB.raiseload("*")
    ).filter(Users.ewi_recipient == 1)

    if site_ids:
        query = query.filter(Sites.site_id.in_(site_ids))

    if site_codes:
        query = query.filter(Sites.site_code.in_(site_codes))

    if alert_level != 0:
        uer = UserEwiRestrictions
        query = query.join(uer).filter(DB.or_(
            uer.user_id.is_(None), uer.alert_level < alert_level
        ))

    user_per_site_query = query.all()
    user_per_site_result = UsersRelationshipSchema(
        many=True, exclude=["emails", "teams", "landline_numbers", "ewi_restriction"]).dump(user_per_site_query).data

    return user_per_site_result


def save_user_information(data):
    """
    Function that save user information
    """
    user_id = data["user_id"]
    first_name = data["first_name"]
    last_name = data["last_name"]
    middle_name = data["middle_name"]
    nickname = data["nickname"]
    emails = data["emails"]
    ewi_recipient = data["ewi_recipient"]
    ewi_restriction = data["restriction"]

    if user_id == 0:
        insert_user = Users(
            first_name=first_name, last_name=last_name,
            middle_name=middle_name, nickname=nickname, ewi_recipient=ewi_recipient, status=1)

        DB.session.add(insert_user)
        DB.session.flush()
        user_id = insert_user.user_id

        save_user_email(emails, user_id)
    else:
        update = Users.query.get(user_id)
        update.first_name = first_name
        update.last_name = last_name
        update.middle_name = middle_name
        update.nickname = nickname
        update.ewi_recipient = ewi_recipient

        save_user_email(emails, user_id)

    save_user_ewi_restriction(ewi_restriction, user_id)

    return user_id


def save_user_email(emails, user_id):
    """
    Function that save user email
    """
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

    return True


def save_user_contact_numbers(data, user_id):
    """
    Function that save user contact numbers
    """
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
                insert_mobile_number = MobileNumbers(
                    sim_num=sim_num, gsm_id=gsm_id)
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
              
                check_user_mobile = UserMobiles.query.filter(UserMobiles.mobile_id == mobile_id).first()
                result = UserMobilesSchema(exclude=("user", "mobile_number")).dump(check_user_mobile).data
                if not result:
                    insert_user_mobile = UserMobiles(
                    user_id=user_id, mobile_id=mobile_id, status=status)
                    DB.session.add(insert_user_mobile)


    if landline_number_len > 0:
        for row in landline_numbers:
            landline_id = row["landline_id"]
            landline_num = row["landline_num"]

            if landline_id == 0:
                insert_landline_number = UserLandlines(
                    user_id=user_id, landline_num=landline_num)
                DB.session.add(insert_landline_number)
            else:
                update_landline = UserLandlines.query.get(landline_id)
                update_landline.landline_num = landline_num

    return True


def save_user_affiliation(data, user_id):
    """
    Function that save user affiliation
    """
    if data:
        print(data)
        location = data["location"]
        site = data["site"]
        scope = data["scope"]
        office = data["office"]
        org_query = Organizations.query.filter(
            Organizations.scope == scope, Organizations.name == office).first()
        result = OrganizationsSchema(exclude=("users",)).dump(org_query).data
        org_id = result["org_id"]

        user_organizations = []
        site_ids = []
        org_name = office
        modifier = ""

        UserOrganizations.query.filter(
            UserOrganizations.user_id == user_id).delete()

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

        if scope not in (0, 1, 5):
            result = Sites.query.filter(filter_var).all()
            for site in result:
                site_ids.append(site.site_id)

        for site_id in site_ids:
            user_organizations.append(
                {"site_id": site_id, "org_id": org_id, "org_name": org_name})

            if scope == 5:
                insert_org = UserOrganizations(
                    user_id=user_id,
                    site_id=0,
                    org_name=org_name,
                    org_id=org_id
                )
                DB.session.add(insert_org)
            else:
                for row in user_organizations:
                    site_id = row["site_id"]
                    org_id = row["org_id"]
                    org_name = row["org_name"]
                    insert_org = UserOrganizations(
                        user_id=user_id, site_id=site_id, org_name=org_name, org_id=org_id)
                    DB.session.add(insert_org)

    return True


def save_user_ewi_restriction(restriction, user_id):
    """
    Function that save user ewi restriction
    """

    UserEwiRestrictions.query.filter(
        UserEwiRestrictions.user_id == user_id).delete()

    save_restriction_query = UserEwiRestrictions(
        user_id=user_id, alert_level=restriction)
    DB.session.add(save_restriction_query)

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


def ewi_recipient_migration():
    """
    Function that migrate ewi recipient
    """
    query = UserEwiStatus.query.filter(UserEwiStatus.status == 1).with_entities(
        UserEwiStatus.users_id).distinct().all()
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

    return True


def get_ground_measurement_reminder_recipients():

    current_datetime = datetime.now()
    leo = get_ongoing_extended_overdue_events(current_datetime)
    routine_site_codes = get_routine_sites(current_datetime)
    latest = leo["latest"]
    extended = leo["extended"]
    overdue = leo["overdue"]
    latest = latest + overdue
    event_site_ids = []
    extended_site_ids = []
    is_routine = False
    year = current_datetime.year
    month = current_datetime.month
    day = current_datetime.day

   
    if routine_site_codes:
        is_routine = True
    

    for row in latest:
        site_id = row["event"]["site"]["site_id"]
        site_code = row["event"]["site"]["site_code"]
        if site_id not in event_site_ids:
            event_site_ids.append(site_id)

        if site_code in routine_site_codes:
            routine_site_codes.remove(site_code)

    
    for row in extended:
        site_id = row["event"]["site"]["site_id"]
        site_code = row["event"]["site"]["site_code"]
        if site_id not in extended_site_ids:
            extended_site_ids.append(site_id)

        if site_code in routine_site_codes:
            routine_site_codes.remove(site_code)

    
    routine_site_ids = get_site_ids(routine_site_codes)

    routine_reminder_time = datetime(year, month, day, 9, 30)
    end_time = datetime(year, month, day, 9, 35)

    if routine_reminder_time < current_datetime < end_time:
        if routine_site_ids or extended_site_ids:
            run_down_ts = routine_reminder_time - timedelta(hours=4, minutes=30)
        
            mo_result = MarkerObservations.query.filter(
                MarkerObservations.ts.between(run_down_ts, routine_reminder_time)).all()

            for row in mo_result:
                site_id = row.site_id
                routine_site_ids.remove(site_id)
                extended_site_ids.remove(site_id)

        if event_site_ids:
            run_down_ts = routine_reminder_time - timedelta(hours=1, minutes=30)
            mo_result = MarkerObservations.query.filter(
                MarkerObservations.ts.between(run_down_ts, routine_reminder_time)).all()

            for row in mo_result:
                site_id = row.site_id
                event_site_ids.remove(site_id)

    else:
        five_thirty_reminder_time = datetime(year, month, day, 5, 30)
        five_thirty_end_time = datetime(year, month, day, 5, 35)

        if five_thirty_reminder_time < current_datetime < five_thirty_end_time:
            routine_site_ids = []
            extended_site_ids = []

        one_thirty_reminder_time = datetime(year, month, day, 13, 30)
        one_thirty_end_time = datetime(year, month, day, 13, 35)

        if one_thirty_reminder_time < current_datetime < one_thirty_end_time:
            run_down_ts = one_thirty_reminder_time - timedelta(hours=1, minutes=30)
            mo_result = MarkerObservations.query.filter(
                MarkerObservations.ts.between(run_down_ts, one_thirty_reminder_time)).all()

            for row in mo_result:
                site_id = row.site_id
                routine_site_ids = []
                extended_site_ids = []
                event_site_ids.remove(site_id)


    site_recipients = [
        {"site_ids": routine_site_ids, "type": "routine"},
        {"site_ids": event_site_ids, "type": "event"},
        {"site_ids": extended_site_ids, "type": "extended"}
    ]
    feedback = []
    for row in site_recipients:
        site_ids = row["site_ids"]
        user_per_site_query = UsersRelationship.query.join(
            UserOrganizations).join(Sites).options(
                DB.subqueryload("mobile_numbers").joinedload(
                    "mobile_number", innerjoin=True),
                DB.subqueryload("organizations").joinedload(
                    "site", innerjoin=True),
                DB.subqueryload("organizations").joinedload(
                    "organization", innerjoin=True),
                DB.raiseload("*")
        ).filter(
                Users.ewi_recipient == 1, Sites.site_id.in_(site_ids),
                UserOrganizations.org_id == 1
        ).all()
        user_per_site_result = UsersRelationshipSchema(
            many=True, exclude=["emails", "teams", "landline_numbers", "ewi_restriction"]).dump(user_per_site_query).data
        feedback.append(
            {"type": row["type"], "recipients": user_per_site_result})

    return feedback


def get_site_ids(site_codes):
    site_query = Sites.query.filter(Sites.site_code.in_(site_codes)).all()
    site_query_result = SitesSchema(many=True).dump(site_query).data
    site_ids = []
    for row in site_query_result:
        site_id = row["site_id"]
        if site_id not in site_ids:
            site_ids.append(site_id)
    return site_ids