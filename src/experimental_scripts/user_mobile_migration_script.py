"""
"""

from pprint import pprint
import os
import sys
sys.path.append(
    r"D:\Users\swat-dynaslope\Documents\DYNASLOPE-3.0\dynaslope3-final")
from connection import create_app, DB
from sqlalchemy.orm import joinedload, raiseload

from src.models.users import UserMobile as OldUserMobiles
from src.models.mobile_numbers import MobileNumbers, UserMobiles


def migrate_user_mobile():
    config_name = os.getenv("FLASK_CONFIG")
    create_app(config_name, skip_memcache=True,
               skip_websocket=True)

    numbers = OldUserMobiles.query.options(joinedload(
        OldUserMobiles.user), raiseload("*")).all()

    mobile_id_list = []

    for num in numbers:
        mobile_id = num.mobile_id

        if mobile_id not in mobile_id_list:
            mobile_id_list.append(mobile_id)

            new_num = MobileNumbers(
                mobile_id=mobile_id,
                sim_num=num.sim_num,
                gsm_id=num.gsm_id
            )

            DB.session.add(new_num)
            DB.session.flush()

        if "UNKNOWN" not in num.user.first_name:
            new_row_um = UserMobiles(
                user_id=num.user_id,
                mobile_id=mobile_id,
                priority=num.priority,
                status=num.mobile_status
            )

            DB.session.add(new_row_um)


def main():
    try:
        migrate_user_mobile()
        DB.session.commit()
    except Exception as e:
        print("")
        print("Error", e)
        print("")
        DB.session.rollback()


if __name__ == "__main__":
    main()
