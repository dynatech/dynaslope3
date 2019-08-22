"""
"""
import hashlib
from flask import Blueprint, jsonify, request, session
from src.models.users import UserAccounts, UserAccountsSchema

LOGIN_BLUEPRINT = Blueprint("login_blueprint", __name__)


@LOGIN_BLUEPRINT.route("/login/validate_credentials", methods=["POST", "GET"])
def user_login():

    data = request.get_json()
    if data is None:
        data = request.form
    print(data)
    username = str(data["username"])  # "jdguevarra"
    password = str(data["password"])  # "jdguevarra101"

    status = False
    role = "admin"  # (admin, user, publ ic)
    user_data = "None"
    result = get_account(username, password)
    if(result["status"] == True):
        status = True
        message = "Successfuly logged in!"
        user_data = result["user_data"]
        session['user'] = user_data
        role = result["user_data"]["role"]
    else:
        status = False
        message = "Invalid Account"

    feedback = {
        "status": status,
        "message": message,
        "role_id": role,
        "user_data": user_data
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

    if(len(result) != 0):
        if(password == result["password"]):
            data = {
                "status": True,
                "user_data": result
            }
        else:
            data = {
                "status": False
            }
    else:
        data = {
            "status": False
        }

    return data
