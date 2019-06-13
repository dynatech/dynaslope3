import time
from flask import Blueprint, jsonify
from connection import DB, SOCKETIO
from src.models.users import UserMobile, UserMobileSchema
from src.models.inbox_outbox import SmsOutboxUsers, SmsOutboxUserStatus

SENDING_BLUEPRINT = Blueprint("sending_blueprint", __name__)


@SOCKETIO.on('/socket/sending_controller/send_message')
def save_message(data, methods=['GET', 'POST']):

    recipients = data['recipients']
    message = data['message']

    for mobile_id in recipients:
        current_date_time = time.strftime('%Y-%m-%d %H:%M:%S')
        insert_message = SmsOutboxUsers(
            ts_written=current_date_time, sms_msg=message)
        DB.session.add(insert_message)
        DB.session.flush()

        latest_outbox_id = insert_message.outbox_id
        returned_gsm_id = get_gsm_id(mobile_id)
        insert_message_status = SmsOutboxUserStatus(
            outbox_id=latest_outbox_id, mobile_id=mobile_id, ts_sent=current_date_time, send_status=0, event_id_reference=0, gsm_id=int(returned_gsm_id['gsm_id']))
        DB.session.add(insert_message_status)
        DB.session.commit()

    SOCKETIO.emit('dataResponse', "success",
                  callback='successfully inserted to database')


def get_gsm_id(mobile_id):
    get_gsm_id_query = UserMobile.query.filter(
        UserMobile.mobile_id == mobile_id).first()

    gsm_id_result = UserMobileSchema(
        only=("gsm_id", )).dump(get_gsm_id_query).data

    return gsm_id_result
