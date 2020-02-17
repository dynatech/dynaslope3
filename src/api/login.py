"""
"""

import hashlib
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required,
    jwt_refresh_token_required, get_jwt_identity
)
from flask import (
    Blueprint, jsonify, request
)
from src.models.users import UserAccounts
from connection import DB, JWT

from src.utils.extra import var_checker

LOGIN_BLUEPRINT = Blueprint("login_blueprint", __name__)

failed_obj = {
    "ok": False,
    "is_logged_in": False
}


@JWT.unauthorized_loader
def unauthorized_response(callback):
    return jsonify({
        **failed_obj,
        "message": "Missing authorization header",
        "type": "unauthorized"
    })


@JWT.expired_token_loader
def expired_token(callback):
    return jsonify({
        **failed_obj,
        "message": "Token expired. Login again",
        "type": "expired"
    })


@JWT.invalid_token_loader
def invalid_token(callback):
    return jsonify({
        **failed_obj,
        "message": "Signature verification failed",
        "type": "invalid"
    })


@LOGIN_BLUEPRINT.route("/check_session", methods=["GET"])
@jwt_required
def check_session():
    return jsonify({
        "ok": True,
        "is_logged_in": True,
        "message": "Authenticated"
    })


@LOGIN_BLUEPRINT.route("/refresh_session", methods=["GET"])
@jwt_refresh_token_required
def refresh_access_token():
    current_user = get_jwt_identity()
    return jsonify({
        "access_token": create_access_token(identity=current_user)
    })


@LOGIN_BLUEPRINT.route("/login", methods=["POST", "GET"])
def __login_user():
    """
    """
    data = request.get_json()
    var_checker("User Logged-in:", data["username"], True)
    try:
        username = str(data["username"])  # "jdguevarra"
        password = str(data["password"])  # "jdguevarra101"
    except:
        return_obj = {
            "ok": False,
            "message": "Check form data sent to the server"
        }
        return jsonify(return_obj)

    account = get_account(username, password)
    if not account:
        return_obj = {
            "ok": False,
            "message": "No username-password combination found"
        }
        return jsonify(return_obj)

    user = account.user
    access_token = create_access_token(identity=data['username'])
    refresh_token = create_refresh_token(identity=data['username'])

    return_obj = {
        "ok": True,
        "data": {
            "user": {
                "first_name": user.first_name,
                "last_name": user.last_name,
                "user_id": user.user_id
            },
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token
            }
        },
        "message": "Successfully logged in"
    }

    return jsonify(return_obj)


@LOGIN_BLUEPRINT.route("/logout", methods=["GET"])
def __logout_user():
    return "Successfully logged out"


# @LOGIN_BLUEPRINT.route("/login/accounts", methods=["POST", "GET"])
def get_account(username, password):
    """
    """

    encode_password = str.encode(password)
    hash_object = hashlib.sha512(encode_password)
    hex_digest_password = hash_object.hexdigest()
    password = str(hex_digest_password)

    account = UserAccounts.query.filter(DB.and_(
        UserAccounts.username == username, UserAccounts.password == password)).first()

    return account
