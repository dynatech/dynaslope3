import sys
sys.path.append(
    r"D:\Users\swat-dynaslope\Documents\DYNASLOPE-3.0\dynaslope3-final")
from run import APP
from pprint import pprint
from connection import DB

from src.models.gintags_old import (
    Gintags, GintagsReference
)

from src.models.inbox_outbox import (
    SmsTags, SmsInboxUserTags, SmsInboxUsers,
    SmsOutboxUserTags, SmsOutboxUsers, SmsOutboxUserStatus
)


def check_if_sms_tag_exists(tag_names, tag_name):
    # tag = SmsTags.query.filter_by(tag=tag_name).first()

    tag = next((row for row in tag_names if row["tag_name"] == tag_name), None)

    return tag


def migrate_sms_user_tags(user_type):
    is_inbox = False
    is_outbox = False

    if user_type == "inbox":
        is_inbox = True
    elif user_type == "outbox":
        is_outbox = True

    if is_inbox:
        res = Gintags.query.join(SmsInboxUsers, Gintags.table_element_id
                                 == SmsInboxUsers.inbox_id).filter(Gintags.table_used == "smsinbox_users").all()
    elif is_outbox:
        res = Gintags.query.join(SmsOutboxUsers, Gintags.table_element_id == SmsOutboxUsers.outbox_id).join(SmsOutboxUserStatus, SmsOutboxUsers.outbox_id == SmsOutboxUserStatus.outbox_id).filter(
            DB.and_(Gintags.table_used == "smsoutbox_users", ~Gintags.tag_id_fk.in_([0, 121]), Gintags.tagger_eid_fk != "", SmsOutboxUserStatus.send_status > 0)).all()  # empty tag_id_fks, varchar tagger_eid_fk?!

    tag_names = []

    for row in res:
        tag = row.tag

        does_tag_exists = check_if_sms_tag_exists(tag_names, tag.tag_name)

        if not does_tag_exists:
            if is_inbox:
                source = "smsinbox_users"
            elif is_outbox:
                source = "smsoutbox_users"

            new_tag = SmsTags(
                tag=tag.tag_name,
                source=source,
                description=tag.tag_description
            )

            DB.session.add(new_tag)
            DB.session.flush()

            tag_id = new_tag.tag_id

            tag_names.append({
                "tag_name": new_tag.tag,
                "tag_id": new_tag.tag_id
            })
        else:
            tag_id = does_tag_exists["tag_id"]

        if is_inbox:
            new_sms_tag = SmsInboxUserTags(
                inbox_id=row.table_element_id,
                tag_id=tag_id,
                user_id=row.tagger_eid_fk,
                ts=row.timestamp
            )
        elif is_outbox:
            new_sms_tag = SmsOutboxUserTags(
                outbox_id=row.table_element_id,
                tag_id=tag_id,
                user_id=row.tagger_eid_fk,
                ts=row.timestamp
            )

        DB.session.add(new_sms_tag)
        DB.session.flush()


def main():
    try:
        # migrate_sms_user_tags("inbox")
        migrate_sms_user_tags("outbox")
        DB.session.commit()
    except Exception as e:
        print("")
        print("Error", e)
        print("")
        DB.session.rollback()


if __name__ == "__main__":
    main()
