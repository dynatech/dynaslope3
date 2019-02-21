"""
Sample Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

import json
from flask_socketio import SocketIO, emit
from flask import Blueprint, jsonify
from connection import DB, SOCKETIO
from src.models.smsinbox_users import SmsInboxUsers, SmsInboxUsersSchema
from src.models.user_mobile import UserMobile, UserMobileSchema
from src.models.users import Users, UsersSchema

INBOX_BLUEPRINT = Blueprint("inbox_blueprint", __name__)
# SOCKET_BLUEPRINT = Blueprint("sockets", __name__)
# SOCKETIO = SocketIO()

@INBOX_BLUEPRINT.route("/inbox_controller/get_unregistered_inbox", methods=["GET"])
def get_unregistered_inbox(is_api = 1):
    """
    Function that get one member and outputs as json string
    """
    # Example of putting parameter filter on URL
    #
    # page = request.args.get('page', default = 1, type = int)
    # filter = request.args.get('filter', default = '*', type = str)
    #
    # /my-route?page=34               -> page: 34  filter: '*'
    # /my-route                       -> page:  1  filter: '*'
    # /my-route?page=10&filter=test   -> page: 10  filter: 'test'
    # /my-route?page=10&filter=10     -> page: 10  filter: '10'

    # member = Membership.query.first()
    # membership_schema = MembershipSchema()
    # output = membership_schema.dump(member).data

    # unregisted_inbox = SmsInboxUsers.query.limit(10).all()
    unregisted_inbox = DB.session.query(SmsInboxUsers, UserMobile, Users).select_from(SmsInboxUsers).join(UserMobile,SmsInboxUsers.mobile_id == UserMobile.mobile_id).join(Users,UserMobile.user_id == Users.user_id).limit(10).all()
    final_data = []
    for inbox, mobile, user in unregisted_inbox:
        final_data.append({"mobile_id:" : inbox.mobile_id, "mobile_number" : mobile.sim_num, "firstname":user.firstname, "message": inbox.sms_msg})
    
    # print(final_data)
    # schema = SmsInboxUsersSchema(many=True)
    # output = schema.dump(unregisted_inbox).data
    return_data = final_data
    if is_api == 1:
        return_data = jsonify(final_data)

    return return_data

@SOCKETIO.on('/socket/inbox_controller/get_some_data')
def new_function(methods=['GET', 'POST']):
    data = get_unregistered_inbox(1)
    emit('dataResponse', data, callback='Successfully loaded inbox')