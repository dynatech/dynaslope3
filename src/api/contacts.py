"""
Contacts Functions Controller File
"""

from flask import Blueprint, jsonify

from src.utils.contacts import get_all_contacts


CONTACTS_BLUEPRINT = Blueprint("contacts_blueprint", __name__)


@CONTACTS_BLUEPRINT.route("/contacts/get_all_contacts", methods=["GET"])
def wrap_get_all_contacts():
    """
    """

    contacts = get_all_contacts(return_schema=True)

    return jsonify(contacts)
