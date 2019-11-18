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
