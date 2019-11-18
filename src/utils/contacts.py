"""
Contacts Functions Utility File
"""

from sqlalchemy.orm import joinedload, subqueryload, raiseload, Load
from connection import DB

from src.models.mobile_numbers import (
    UserMobiles, UserMobilesSchema
)
from src.models.users import Users


def get_all_contacts(return_schema=False):
    """
    """
    mobile_numbers = UserMobiles.query.join(Users).options(
        joinedload("user", innerjoin=True).subqueryload("organizations").joinedload("site", innerjoin=True).raiseload("*")).order_by(Users.last_name, UserMobiles.priority).all()

    if return_schema:
        numbers_schema = UserMobilesSchema(many=True).dump(mobile_numbers).data

        users_id = {}
        mobile_numbers = []
        for num in numbers_schema:
            user_dict = num["user"]
            user_id = user_dict["user_id"]
            mobile_number_dict = {
                **num["mobile_number"],
                "priority": num["priority"],
                "status": num["status"]
            }

            if user_id in users_id.keys():
                key = users_id[user_id]
                mobile_numbers[key]["mobile_numbers"].append(
                    mobile_number_dict)
            else:
                mobile_numbers.append({
                    "user": user_dict,
                    "mobile_numbers": [mobile_number_dict]
                })
                users_id[user_id] = len(mobile_numbers) - 1

    return mobile_numbers
