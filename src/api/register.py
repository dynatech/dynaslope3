"""
"""

import string
import random
import time
import hashlib
from sqlalchemy import text
from flask import Blueprint, jsonify, request
from connection import DB, SOCKETIO
from src.models.users import (
    PendingAccounts, PendingAccountsSchema, UserAccounts, UserAccountsSchema, UserMobile, UserMobileSchema)

from src.api.sending import get_gsm_id
from src.models.inbox_outbox import SmsOutboxUsers, SmsOutboxUserStatus

REGISTER_BLUEPRINT = Blueprint("register_blueprint", __name__)


@REGISTER_BLUEPRINT.route("/register/account", methods=["POST", "GET"])
def register_account():
    data = request.get_json()

    insert_data = insert_pending_account(data)
    if insert_data == True:
        message = "Registration Complete, Please wait for account approval"
    else:
        message = "Registration failed, Please try again!"

    feedback = {
        "status": insert_data,
        "message": message
    }

    return jsonify(feedback)


def insert_pending_account(data):
    try:
        username = data["username"]
        password = data["password"]
        first_name = data["first_name"]
        last_name = data["last_name"]
        sex = data["sex"]
        birthday = data["birthday"]
        mobile_number = data["mobile_number"]
        validation_code = generate_validation_code()

        insert_account = PendingAccounts(username=username, password=password,
                                         first_name=first_name, last_name=last_name, sex=sex, birthday=birthday, mobile_number=mobile_number, validation_code=validation_code, role=0)
        DB.session.add(insert_account)
        DB.session.commit()

        name = first_name+" "+last_name
        message = str("CBEWS-L Account Approval\n\n"
                      "Name: "+name+"\n"
                      "Mobile #: "+mobile_number+"\n"
                      "Validation Code: "+validation_code+"\n"
                      "Role: 1 for Public Account, 2 for Staff Account, 3 for Admin Account.\n\n"
                      "Reply: validate <validation_code> <role>\nExample: validate CBWS 2")
        write_message(
            message=message, mobile_id=30)

    except Exception as err:
        print(err)
        DB.session.rollback()
        return False

    return True


@REGISTER_BLUEPRINT.route("/forgot_password", methods=["POST", "GET"])
def forgot_password():
    data = request.get_json()
    print(data)
    key = str(data["reset_key"])
    data = []
    user_id = 0
    mobile_id = 0
    account_id = 0
    is_digit = key.isdigit()

    if is_digit == False:
        print("username")
        query = text("SELECT * FROM commons_db.user_accounts "
                     "WHERE username = '" + str(key) + "'")

        result = DB.engine.execute(query)

        for row in result:
            user_id = row["user_fk_id"]
            account_id = row["account_id"]

        mobile_query = text("SELECT * FROM comms_db.user_mobile "
                            "WHERE user_id = " + str(user_id))

        mobile_query_result = DB.engine.execute(mobile_query)

        for row in mobile_query_result:
            mobile_id = row["mobile_id"]
    else:
        print("mobile")
        query = text("SELECT * FROM comms_db.user_mobile "
                     "WHERE sim_num = '" + str(key) + "'")

        result = DB.engine.execute(query)

        for row in result:
            user_id = row["user_id"]
            mobile_id = row["mobile_id"]

        user_account_query = text("SELECT * FROM commons_db.user_accounts "
                                  "WHERE user_fk_id = '" + str(user_id) + "'")

        user_account_result = DB.engine.execute(user_account_query)

        for row in user_account_result:
            account_id = row["account_id"]

    new_password = generate_validation_code()
    password = hash_password(new_password)

    update_account = UserAccounts.query.get(account_id)
    update_account.password = password
    DB.session.commit()

    message = str("CBEWS-L Account New Password\n\n"
                  "You new password is : "+new_password)

    write_message(
        message=message, mobile_id=30)

    return jsonify({"status": True, "message": "Message successfully send to you mobile number!"})


def hash_password(password):

    encode_password = str.encode(password)
    hash_object = hashlib.sha512(encode_password)
    hex_digest_password = hash_object.hexdigest()
    password = str(hex_digest_password)

    return password


def write_message(message, mobile_id):
    try:

        current_date_time = time.strftime('%Y-%m-%d %H:%M:%S')
        insert_message = SmsOutboxUsers(
            ts_written=current_date_time, sms_msg=message)
        DB.session.add(insert_message)
        DB.session.flush()

        latest_outbox_id = insert_message.outbox_id
        returned_gsm_id = get_gsm_id(int(mobile_id))
        insert_message_status = SmsOutboxUserStatus(
            outbox_id=latest_outbox_id, mobile_id=mobile_id, ts_sent=current_date_time, send_status=0, event_id_reference=0, gsm_id=int(returned_gsm_id['gsm_id']))
        DB.session.add(insert_message_status)
        DB.session.commit()
    except Exception as err:
        print(err)
        DB.session.rollback()
        return False

    return True


def generate_validation_code(size=4, chars=string.ascii_uppercase + string.digits):
    validation_code = ''.join(random.choice(chars) for _ in range(size))

    return validation_code
