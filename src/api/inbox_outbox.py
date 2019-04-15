"""
Inbox Functions Controller File
"""

from flask import Blueprint, jsonify
from sqlalchemy import text
from connection import DB, SOCKETIO
from src.models.inbox_outbox import (
    SmsInboxUsers, SmsInboxUsersSchema,
    SmsOutboxUsers, SmsOutboxUsersSchema,
    SmsOutboxUserStatus, SmsOutboxUserStatusSchema)
from src.models.users import Users, UserMobile, UsersRelationship

INBOX_OUTBOX_BLUEPRINT = Blueprint("inbox_outbox_blueprint", __name__)


@INBOX_OUTBOX_BLUEPRINT.route("/inbox_outbox/quick_inbox", methods=["GET"])
@SOCKETIO.on('/socket/inbox_outbox/quick_inbox')
def quick_inbox():
    quick_inbox_query = text("SELECT * FROM"
                             "(SELECT * FROM "
                             "(SELECT "
                             "MAX(inbox_id) AS inbox_id "
                             "FROM "
                             "(SELECT "
                             "comms_db.smsinbox_users.inbox_id,"
                             "comms_db.smsinbox_users.ts_sms,"
                             "comms_db.smsinbox_users.mobile_id,"
                             "comms_db.smsinbox_users.sms_msg,"
                             "comms_db.smsinbox_users.read_status,"
                             "comms_db.smsinbox_users.web_status,"
                             "comms_db.smsinbox_users.gsm_id,"
                             "comms_db.user_mobile.sim_num,"
                             "CONCAT(sites.site_code, ' ', commons_db.user_organization.org_name, ' - ', commons_db.users.last_name, ', ', commons_db.users.first_name) AS full_name "
                             "FROM "
                             "comms_db.smsinbox_users "
                             "INNER JOIN comms_db.user_mobile ON comms_db.smsinbox_users.mobile_id = comms_db.user_mobile.mobile_id "
                             "INNER JOIN commons_db.users ON comms_db.user_mobile.user_id = commons_db.users.user_id "
                             "INNER JOIN commons_db.user_organization ON commons_db.users.user_id = commons_db.user_organization.user_id "
                             "INNER JOIN sites ON commons_db.user_organization.fk_site_id = sites.site_id "
                             "WHERE "
                             "comms_db.smsinbox_users.ts_sms > (NOW() - INTERVAL 70 DAY)) AS smsinbox "
                             "GROUP BY full_name) AS quickinbox "
                             "INNER JOIN (SELECT "
                             "comms_db.smsinbox_users.inbox_id,"
                             "comms_db.smsinbox_users.ts_sms,"
                             "comms_db.smsinbox_users.mobile_id,"
                             "comms_db.smsinbox_users.sms_msg,"
                             "comms_db.smsinbox_users.read_status,"
                             "comms_db.smsinbox_users.web_status,"
                             "comms_db.smsinbox_users.gsm_id,"
                             "comms_db.user_mobile.sim_num,"
                             "CONCAT(sites.site_code, ' ', commons_db.user_organization.org_name, ' - ', commons_db.users.last_name, ', ', commons_db.users.first_name) AS full_name "
                             "FROM "
                             "comms_db.smsinbox_users "
                             "INNER JOIN comms_db.user_mobile ON smsinbox_users.mobile_id = comms_db.user_mobile.mobile_id "
                             "INNER JOIN commons_db.users ON comms_db.user_mobile.user_id = commons_db.users.user_id "
                             "INNER JOIN commons_db.user_organization ON commons_db.users.user_id = commons_db.user_organization.user_id "
                             "INNER JOIN sites ON commons_db.user_organization.fk_site_id = sites.site_id "
                             "WHERE "
                             "comms_db.smsinbox_users.ts_sms > (NOW() - INTERVAL 70 DAY) "
                             "ORDER BY comms_db.smsinbox_users.ts_sms DESC) AS smsinbox2 USING (inbox_id) "
                             "ORDER BY ts_sms) AS community "
                             "UNION SELECT * FROM"
                             "(SELECT * FROM "
                             "(SELECT "
                             "MAX(inbox_id) AS inbox_id "
                             "FROM"
                             "(SELECT "
                             "comms_db.smsinbox_users.inbox_id,"
                             "comms_db.smsinbox_users.ts_sms,"
                             "comms_db.smsinbox_users.mobile_id,"
                             "comms_db.smsinbox_users.sms_msg,"
                             "comms_db.smsinbox_users.read_status,"
                             "comms_db.smsinbox_users.web_status,"
                             "comms_db.smsinbox_users.gsm_id,"
                             "comms_db.user_mobile.sim_num,"
                             "CONCAT(comms_db.user_teams.team_code, ' - ', commons_db.users.last_name, ', ', commons_db.users.first_name) AS full_name "
                             "FROM "
                             "comms_db.smsinbox_users "
                             "INNER JOIN comms_db.user_mobile ON comms_db.smsinbox_users.mobile_id = comms_db.user_mobile.mobile_id "
                             "INNER JOIN commons_db.users ON comms_db.user_mobile.user_id = commons_db.users.user_id "
                             "INNER JOIN comms_db.user_team_members ON commons_db.users.user_id = comms_db.user_team_members.users_users_id "
                             "INNER JOIN comms_db.user_teams ON comms_db.user_team_members.user_teams_team_id = comms_db.user_teams.team_id "
                             "WHERE comms_db.smsinbox_users.ts_sms > (NOW() - INTERVAL 70 DAY)) AS smsinbox GROUP BY full_name) AS quickinbox "
                             "INNER JOIN (SELECT "
                             "comms_db.smsinbox_users.inbox_id,"
                             "comms_db.smsinbox_users.ts_sms,"
                             "comms_db.smsinbox_users.mobile_id,"
                             "comms_db.smsinbox_users.sms_msg,"
                             "comms_db.smsinbox_users.read_status,"
                             "comms_db.smsinbox_users.web_status,"
                             "comms_db.smsinbox_users.gsm_id,"
                             "comms_db.user_mobile.sim_num,"
                             "CONCAT(comms_db.user_teams.team_code, ' - ', commons_db.users.last_name, ', ', commons_db.users.first_name) AS full_name "
                             "FROM "
                             "comms_db.smsinbox_users "
                             "INNER JOIN comms_db.user_mobile ON comms_db.smsinbox_users.mobile_id = comms_db.user_mobile.mobile_id "
                             "INNER JOIN commons_db.users ON comms_db.user_mobile.user_id = commons_db.users.user_id "
                             "INNER JOIN comms_db.user_team_members ON commons_db.users.user_id = comms_db.user_team_members.users_users_id "
                             "INNER JOIN comms_db.user_teams ON comms_db.user_team_members.user_teams_team_id = comms_db.user_teams.team_id "
                             "WHERE "
                             "comms_db.smsinbox_users.ts_sms > (NOW() - INTERVAL 70 DAY) "
                             "ORDER BY comms_db.smsinbox_users.ts_sms DESC) AS smsinbox2 USING (inbox_id) "
                             "ORDER BY ts_sms) AS employee ORDER BY ts_sms")

    result = DB.engine.execute(quick_inbox_query)
    inbox_data = []
    for row in result:
        inbox_data.append({
            "inbox_id": row["inbox_id"],
            "ts_sms": row["ts_sms"],
            "mobile_id": row["mobile_id"],
            "sms_msg": row["sms_msg"],
            "web_status": row["web_status"],
            "gsm_id": row["gsm_id"],
            "sim_num": row["sim_num"],
            "full_name": row["full_name"]
        })

    return jsonify(inbox_data)


@INBOX_OUTBOX_BLUEPRINT.route("/inbox_outbox/unregistered_inbox", methods=["GET"])
@SOCKETIO.on('/socket/inbox_outbox/unregistered_inbox')
def unregistered_inbox():
    """
    Function that gets unregistered inbox.
    """
    unregistered_inbox_query = text("SELECT "
                                    "comms_db.smsinbox_users.inbox_id,"
                                    "CONCAT(commons_db.users.last_name, ', ', commons_db.users.first_name) AS full_name,"
                                    "comms_db.user_mobile.sim_num,"
                                    "comms_db.user_mobile.mobile_id,"
                                    "comms_db.user_mobile.user_id,"
                                    "comms_db.smsinbox_users.sms_msg,"
                                    "comms_db.smsinbox_users.ts_sms "
                                    "FROM "
                                    "comms_db.smsinbox_users "
                                    "INNER JOIN "
                                    "comms_db.user_mobile ON comms_db.smsinbox_users.mobile_id = comms_db.user_mobile.mobile_id "
                                    "INNER JOIN "
                                    "commons_db.users ON comms_db.user_mobile.user_id = commons_db.users.user_id "
                                    "WHERE comms_db.smsinbox_users.ts_sms > (NOW() - INTERVAL 70 DAY) "
                                    "AND commons_db.users.first_name LIKE '%UNKNOWN_%' ORDER by ts_sms desc")

    result = DB.engine.execute(unregistered_inbox_query)
    unregister_inbox_data = []
    for row in result:
        unregister_inbox_data.append({
            "inbox_id": row["inbox_id"],
            "full_name": row["full_name"],
            "sim_num": row["sim_num"],
            "mobile_id": row["mobile_id"],
            "user_id": row["user_id"],
            "sms_msg": row["sms_msg"],
            "ts_sms": row["ts_sms"]
        })

    return jsonify(unregister_inbox_data)


@INBOX_OUTBOX_BLUEPRINT.route("/inbox_outbox/get_conversation", methods=["GET"])
@SOCKETIO.on('/socket/inbox_outbox/get_conversation')
def get_conversation():
    """
    Function that get user conversation
    """
    details = {
        "first_name": "MARYANN",
        "last_name": "BUGTONG",
        "full_name": "LAB LEWC - BUGTONG, MARYANN"
    }

    conversation_details = get_user_mobile_details(details)

    smsinbox_query = text("SELECT comms_db.smsinbox_users.inbox_id as convo_id, comms_db.smsinbox_users.mobile_id,"
                          "comms_db.smsinbox_users.ts_sms as ts_received,null as ts_written,null as ts_sent,comms_db.smsinbox_users.sms_msg,"
                          "comms_db.smsinbox_users.web_status,comms_db.smsinbox_users.gsm_id,"
                          "null as send_status , comms_db.smsinbox_users.ts_sms as timestamp,'" +
                          details["full_name"] +
                          "' as user from comms_db.smsinbox_users "
                          "WHERE " + str(conversation_details["query_builder"]["inbox_query_builder"]) + "")

    smsoutbox_query = text("SELECT comms_db.smsoutbox_users.outbox_id as convo_id, comms_db.smsoutbox_user_status.mobile_id,"
                           "null as ts_received,comms_db.smsoutbox_users.ts_written,comms_db.smsoutbox_user_status.ts_sent,comms_db.smsoutbox_users.sms_msg,"
                           "comms_db.smsoutbox_user_status.web_status,comms_db.smsoutbox_user_status.gsm_id,comms_db.smsoutbox_user_status.send_status,"
                           "comms_db.smsoutbox_users.ts_written as timestamp,"
                           "'You' as user FROM comms_db.smsoutbox_users "
                           "INNER JOIN comms_db.smsoutbox_user_status ON smsoutbox_users.outbox_id = comms_db.smsoutbox_user_status.outbox_id "
                           "WHERE " + str(conversation_details["query_builder"]["outbox_query_builder"]) + "")

    conversation_query = text("SELECT * FROM (" + str(smsinbox_query) + " UNION " + str(smsoutbox_query)
                              + ") as full_contact ORDER BY timestamp desc limit 20")

    result = DB.engine.execute(conversation_query)
    conversation_data = []
    for row in result:
        conversation_data.append({
            "conversation_id": row["convo_id"],
            "mobile_id": row["mobile_id"],
            "timestamp_receive": row["ts_received"],
            "timestamp_written": row["ts_written"],
            "timestamo_sent": row["ts_sent"],
            "message": row["sms_msg"],
            "web_status": row["web_status"],
            "gsm_id": row["gsm_id"],
            "send_status": row["send_status"],
            "timestamp": row["timestamp"],
            "user": row["user"]
        })
    return jsonify(conversation_data)


def get_user_mobile_details(details):
    first_name = details["first_name"]
    last_name = details["last_name"]

    query = text("SELECT "
                 "commons_db.users.first_name,"
                 "commons_db.users.last_name,"
                 "comms_db.user_mobile.sim_num,"
                 "comms_db.user_mobile.mobile_id "
                 "FROM "
                 "comms_db.user_mobile "
                 "JOIN "
                 "commons_db.users ON commons_db.users.user_id = comms_db.user_mobile.user_id "
                 "WHERE "
                 "commons_db.users.first_name LIKE '%" +
                 str(first_name) + "%' "
                 "AND commons_db.users.last_name LIKE '%" + str(last_name) + "%'")
    result = DB.engine.execute(query)
    recipients_mobile_id = []

    for row in result:
        recipients_mobile_id.append(row["mobile_id"])

    query_builder = mobile_query_builder(recipients_mobile_id)

    data = {
        "recipients": recipients_mobile_id,
        "query_builder": query_builder
    }

    return data


def mobile_query_builder(recipients_mobile_id):
    inbox_query = ""
    outbox_query = ""
    counter = 0
    for mobile_id in recipients_mobile_id:
        if(counter == 0):
            inbox_query = "comms_db.smsinbox_users.mobile_id = " + \
                str(mobile_id) + ""
            outbox_query = "comms_db.smsoutbox_user_status.mobile_id = " + \
                str(mobile_id) + ""
        else:
            inbox_query = inbox_query + \
                " OR comms_db.smsinbox_users.mobile_id = " + \
                str(mobile_id) + ""
            outbox_query = outbox_query + \
                " OR comms_db.smsoutbox_user_status.mobile_id = " + \
                str(mobile_id) + ""

        counter = + 1

    query_builder = {
        "inbox_query_builder": inbox_query,
        "outbox_query_builder": outbox_query
    }
    return query_builder
