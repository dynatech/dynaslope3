"""
Contacts Functions Controller File
"""

from flask import Blueprint, jsonify
from connection import DB, SOCKETIO
from src.models.users import UsersRelationship, UsersRelationshipSchema, UserOrganization, UserOrganizationSchema
from src.models.sites import Sites, SitesSchema


CONTACTS_BLUEPRINT = Blueprint("contacts_blueprint", __name__)


@CONTACTS_BLUEPRINT.route("/contacts/get_all_contacts", methods=["GET"])
def get_all_contacts():
    """
    Function that get contacts as json string
    """

    employee_query = UsersRelationship.query.filter(
        UsersRelationship.organizations == None, UsersRelationship.firstname.notlike("%UNKNOWN%")).all()
    employee_result = UsersRelationshipSchema(exclude=("organizations", "user_hierarchy", "user_team",),
                                              many=True).dump(employee_query).data

    unknown_query = UsersRelationship.query.filter(
        UsersRelationship.mobile_numbers != None, UsersRelationship.firstname.like("%UNKNOWN%")).all()
    unknown_result = UsersRelationshipSchema(exclude=("organizations", "user_hierarchy", "user_team",),
                                             many=True).dump(unknown_query).data

    community_query = UsersRelationship.query.filter(
        UsersRelationship.mobile_numbers != None, UsersRelationship.organizations != None).all()
    community_result = UsersRelationshipSchema(exclude=("user_hierarchy", "user_team",),
                                               many=True).dump(community_query).data

    return jsonify({"community": community_result, "employee": employee_result, "unknown": unknown_result})


@CONTACTS_BLUEPRINT.route("/contacts/contact_suggestion", methods=["GET"])
def get_contact_suggestions():
    """
    Function that get all contact for search
    """
    contact_suggestion_query = UsersRelationship.query.filter(
        UsersRelationship.firstname.notlike("%UNKNOWN%"), UsersRelationship.mobile_numbers != None, UsersRelationship.firstname != None, UsersRelationship.lastname != None).all()

    contact_suggestion_result = UsersRelationshipSchema(
        many=True).dump(contact_suggestion_query).data

    return jsonify({"contacts": contact_suggestion_result})


@CONTACTS_BLUEPRINT.route("/contacts/contact_details", methods=["GET"])
def get_contact_details():
    """
    Function that get contacts contact as json string
    """
    user_id = 526  # for testing
    contact_details_query = UsersRelationship.query.filter(
        UsersRelationship.firstname.notlike("%UNKNOWN%"),
        UsersRelationship.mobile_numbers != None,
        UsersRelationship.firstname != None,
        UsersRelationship.lastname != None,
        UsersRelationship.user_id == user_id).first()

    contact_details_result = UsersRelationshipSchema().dump(
        contact_details_query).data

    return jsonify({"contact_details": contact_details_result})


@CONTACTS_BLUEPRINT.route("/contacts/insert_new_contact", methods=["GET"])
def insert_new_contact():
    """
    Function that add new contact
    """


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
