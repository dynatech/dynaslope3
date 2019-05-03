"""
"""
import hashlib
from flask import Blueprint, jsonify, request
from src.models.users import UserAccounts, UserAccountsSchema

LOGIN_BLUEPRINT = Blueprint("login_blueprint", __name__)


@LOGIN_BLUEPRINT.route("/login/validate_credentials", methods=["POST", "GET"])
def user_login():

    data = request.get_json()

    username = data["username"]  # "jdguevarra"
    password = data["password"]  # "jdguevarra101"

    status = False
    role = "admin"  # (admin, user, publ ic)
    result = get_account(username, password)
    if(result == True):
        status = True
        message = "Successfuly logged in!"
    else:
        status = False
        message = "Invalid Account"

    feedback = {                                                                                                                                                                                                                                                                    
        "status": status,
        "message": message,
        "role": role
    }

    return jsonify(feedback)


# @LOGIN_BLUEPRINT.route("/login/accounts", methods=["POST", "GET"])
def get_account(username, password):
    encode_password = str.encode(password)
    hash_object = hashlib.sha512(encode_password)
    hex_digest_password = hash_object.hexdigest()
    password = str(hex_digest_password)

    query = UserAccounts.query.filter(
        UserAccounts.username == username).first()

    result = UserAccountsSchema().dump(query).data

    if(password == result["password"]):
        return True
    else:
        return False


