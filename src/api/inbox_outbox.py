"""
Inbox Functions Controller File
"""

from flask import Blueprint, jsonify
from sqlalchemy import text, func
from connection import DB, SOCKETIO
from src.models.inbox_outbox import (
    SmsInboxUsers, SmsInboxUsersSchema,
    SmsOutboxUsers, SmsOutboxUsersSchema,
    SmsOutboxUserStatus, SmsOutboxUserStatusSchema)
from src.models.users import Users, UserMobile, UsersRelationship

INBOX_OUTBOX_BLUEPRINT = Blueprint("inbox_outbox_blueprint", __name__)


@INBOX_OUTBOX_BLUEPRINT.route("/inbox_outbox/quick_inbox", methods=["GET"])
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
                             "CONCAT(sites.site_code, ' ', comms_db.user_organization.org_name, ' - ', comms_db.users.lastname, ', ', comms_db.users.firstname) AS full_name "
                             "FROM "
                             "comms_db.smsinbox_users "
                             "INNER JOIN comms_db.user_mobile ON comms_db.smsinbox_users.mobile_id = comms_db.user_mobile.mobile_id "
                             "INNER JOIN comms_db.users ON comms_db.user_mobile.user_id = comms_db.users.user_id "
                             "INNER JOIN comms_db.user_organization ON comms_db.users.user_id = comms_db.user_organization.user_id "
                             "INNER JOIN sites ON comms_db.user_organization.fk_site_id = sites.site_id "
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
                             "CONCAT(sites.site_code, ' ', comms_db.user_organization.org_name, ' - ', comms_db.users.lastname, ', ', comms_db.users.firstname) AS full_name "
                             "FROM "
                             "comms_db.smsinbox_users "
                             "INNER JOIN comms_db.user_mobile ON smsinbox_users.mobile_id = comms_db.user_mobile.mobile_id "
                             "INNER JOIN comms_db.users ON comms_db.user_mobile.user_id = comms_db.users.user_id "
                             "INNER JOIN comms_db.user_organization ON comms_db.users.user_id = comms_db.user_organization.user_id "
                             "INNER JOIN sites ON comms_db.user_organization.fk_site_id = sites.site_id "
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
                             "CONCAT(comms_db.user_teams.team_code, ' - ', comms_db.users.lastname, ', ', comms_db.users.firstname) AS full_name "
                             "FROM "
                             "comms_db.smsinbox_users "
                             "INNER JOIN comms_db.user_mobile ON comms_db.smsinbox_users.mobile_id = comms_db.user_mobile.mobile_id "
                             "INNER JOIN comms_db.users ON comms_db.user_mobile.user_id = comms_db.users.user_id "
                             "INNER JOIN comms_db.user_team_members ON comms_db.users.user_id = comms_db.user_team_members.users_users_id "
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
                             "CONCAT(comms_db.user_teams.team_code, ' - ', comms_db.users.lastname, ', ', comms_db.users.firstname) AS full_name "
                             "FROM "
                             "comms_db.smsinbox_users "
                             "INNER JOIN comms_db.user_mobile ON comms_db.smsinbox_users.mobile_id = comms_db.user_mobile.mobile_id "
                             "INNER JOIN comms_db.users ON comms_db.user_mobile.user_id = comms_db.users.user_id "
                             "INNER JOIN comms_db.user_team_members ON comms_db.users.user_id = comms_db.user_team_members.users_users_id "
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
def unregistered_inbox():
    """
    Function that gets unregistered inbox.
    """
    unregistered_inbox_query = text("SELECT "
                                    "comms_db.smsinbox_users.inbox_id,"
                                    "CONCAT(comms_db.users.lastname, ', ', comms_db.users.firstname) AS full_name,"
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
                                    "comms_db.users ON comms_db.user_mobile.user_id = comms_db.users.user_id "
                                    "WHERE comms_db.smsinbox_users.ts_sms > (NOW() - INTERVAL 70 DAY) "
                                    "AND comms_db.users.firstname LIKE '%UNKNOWN_%' ORDER by ts_sms desc")

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
def get_conversation():
    """
    Function that get user conversation
    """

    return jsonify("inbox_schema")
