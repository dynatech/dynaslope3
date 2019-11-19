"""
Contacts Functions Controller File
"""

from flask import Blueprint, jsonify, request
from connection import DB
from src.utils.contacts import (
    get_all_contacts, save_user_information,
    save_user_contact_numbers, save_user_affiliation,
    ewi_recipient_migration, get_ewi_recipients
)


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
def ewi_recipient_migration():
    ewi_recipient_migration()

    return jsonify(True)

@CONTACTS_BLUEPRINT.route("/contacts/test", methods=["GET", "POST"])
def test_lang():
    data = get_ewi_recipients(True)

    return jsonify(data)
