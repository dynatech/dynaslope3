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


@INBOX_OUTBOX_BLUEPRINT.route("/outbox", methods=["GET"])
def get_outbox():
    # outbox_query = SmsOutboxUserStatusRelationship.query.order_by(
    #     "outbox_id desc").limit(1000).all()

    # outbox_query_result = SmsOutboxUserStatusRelationshipSchema(
    #     many=True).dump(outbox_query).data

    return jsonify("outbox_query_result")


@INBOX_OUTBOX_BLUEPRINT.route("/inbox", methods=["GET"])
def get_inbox():
    """
    Function that gets inbox.
    """
    return "hey"


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
    for inbox in result:
        inbox_data.append({
            "inbox_id": inbox["inbox_id"],
            "ts_sms": inbox["ts_sms"],
            "mobile_id": inbox["mobile_id"],
            "sms_msg": inbox["sms_msg"],
            "web_status": inbox["web_status"],
            "gsm_id": inbox["gsm_id"],
            "sim_num": inbox["sim_num"],
            "full_name": inbox["full_name"]
        })
        # inbox_query = SmsInboxUsers.query.order_by(
        #     "inbox_id desc").limit(1000).all()

        # inbox_query_result = SmsInboxUsersSchema(many=True).dump(inbox_query).data

    return jsonify(inbox_data)


@INBOX_OUTBOX_BLUEPRINT.route("/inbox_outbox/unregistered_inbox", methods=["GET"])
def unregistered_inbox():
    """
    Function that gets unregistered inbox.
    """
    # unregistered_inbox_query = DB.session.query(SmsInboxUnregisterRelationship).select_from(
    #     SmsInboxUsers).join(UserMobile, UserMobile.mobile_id == SmsInboxUnregisterRelationship.mobile_id).join(
    #         Users, Users.user_id == UserMobile.user_id).filter(
    #             SmsInboxUnregisterRelationship.ts_sms >= text("NOW() - INTERVAL 100 DAY")).filter(
    #                 Users.firstname.like("%UNKNOWN%")).order_by("inbox_id desc").all()
    # change interval to 7 day

    # unregistered_inbox_query = SmsInboxUnregisterRelationship.query.join(
    #     UserMobile).join(Users).filter(
    #     SmsInboxUnregisterRelationship.ts_sms >= text("NOW() - INTERVAL 100 DAY")).filter(
    #     Users.firstname.like("%UNKNOWN%")).order_by("inbox_id desc").all()

    # unregistered_data = []
    # unregistered_inbox_result = SmsInboxUnregisterRelationshipSchema(
    #     many=True).dump(unregistered_inbox_query).data
    # for inbox in unregistered_inbox_query:
    #     query = SmsInboxUnregisterRelationship.query.filter(
    #         SmsInboxUnregisterRelationship.inbox_id == inbox.inbox_id).first()

    #     query_result = SmsInboxUnregisterRelationshipSchema().dump(query).data

    #     unregistered_data.append(query_result)

    return jsonify("unregistered_inbox_result")


@INBOX_OUTBOX_BLUEPRINT.route("/inbox_outbox/get_conversation", methods=["GET"])
def get_conversation():
    """
    Function that get user conversation
    """
    inbox_query = SmsInboxUsers.query.filter(
        SmsInboxUsers.mobile_id.like(108)).all()
    inbox_schema = SmsInboxUsersSchema(many=True).dump(inbox_query).data

    # outbox_query = SmsOutboxUserStatus.query.join(SmsOutboxUsers).filter(
    #     SmsOutboxUserStatus.mobile_id.like(108)).all()

    # outbox_schema = SmsOutboxUserStatusSchema(
    #     many=True).dump(outbox_query).data
    return jsonify(inbox_schema)
