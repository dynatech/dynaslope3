"""
Contacts Functions Controller File
"""

from datetime import datetime
from flask import Blueprint, jsonify, request
from connection import DB
from src.utils.contacts import (
    get_all_contacts, save_user_information,
    save_user_contact_numbers, save_user_affiliation,
    ewi_recipient_migration, get_contacts_per_site,
    get_ground_measurement_reminder_recipients,
    get_recipients_option
)

from src.utils.monitoring import get_routine_sites, get_ongoing_extended_overdue_events


CONTACTS_BLUEPRINT = Blueprint("contacts_blueprint", __name__)


@CONTACTS_BLUEPRINT.route("/contacts/get_all_contacts", methods=["GET"])
def wrap_get_all_contacts():
    """
    Function that get all contacts
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
        contact_numbers = data["contact_numbers"]
        affiliation = data["affiliation"]

        updated_user_id = save_user_information(user)
        save_user_contact_numbers(contact_numbers, updated_user_id)
        save_user_affiliation(affiliation, updated_user_id)

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


@CONTACTS_BLUEPRINT.route("/contacts/migrate_ewi_recipient", methods=["GET", "POST"])
def migrate_ewi_recipient():
    """
    Function that migrate ewi recipient from old implem to new
    """
    ewi_recipient_migration()

    return jsonify(True)


@CONTACTS_BLUEPRINT.route("/contacts/get_contacts_per_site", methods=["GET", "POST"])
@CONTACTS_BLUEPRINT.route("/contacts/get_contacts_per_site/<site_code>", methods=["GET", "POST"])
def wrap_get_contacts_per_site(site_code=None):
    temp = {
        "site_ids": [],
        "site_codes": [],
        # "alert_level": 0,
        "only_ewi_recipients": True
    }

    if site_code:
        temp["site_codes"].append(site_code)
    else:
        data = request.get_json()

        for key in ["site_ids", "site_codes", "only_ewi_recipients"]:
            if key in data:
                temp[key] = data[key]

    data = get_contacts_per_site(site_ids=temp["site_ids"],
                                 site_codes=temp["site_codes"],
                                 only_ewi_recipients=temp["only_ewi_recipients"],
                                 include_ewi_restrictions=True)
    return jsonify(data)


@CONTACTS_BLUEPRINT.route("/contacts/get_recipients_option", methods=["GET", "POST"])
@CONTACTS_BLUEPRINT.route("/contacts/get_recipients_option/<site_code>", methods=["GET", "POST"])
def wrap_get_recipients_option(site_code=None):
    temp = {
        "site_ids": [],
        "org_ids": [],
        "site_codes": [],
        "alert_level": 0,
        "only_ewi_recipients": True
    }

    if site_code:
        temp["site_codes"].append(site_code)
    else:
        data = request.get_json()

        for key in [
            "site_ids", "site_codes", "alert_level",
            "only_ewi_recipients", "org_ids"
        ]:
            if key in data:
                temp[key] = data[key]

    data = get_recipients_option(site_ids=temp["site_ids"],
                                 site_codes=temp["site_codes"],
                                 only_ewi_recipients=temp["only_ewi_recipients"],
                                 alert_level=temp["alert_level"],
                                 org_ids=temp["org_ids"])
    return jsonify(data)


@CONTACTS_BLUEPRINT.route("/contacts/get_ground_meas_reminder_recipients", methods=["GET", "POST"])
def get_ground_meas_reminder_recipients():
    """
    Function that get ground meas reminder recipients
    """
    data = get_ground_measurement_reminder_recipients()

    return jsonify(data)
