from datetime import date
import calendar
import datetime
from flask import Blueprint, jsonify
from connection import DB, SOCKETIO
from src.utils.sites import get_sites_data, get_site_events
from src.models.sites import SitesSchema

ROUTINE_BLUEPRINT = Blueprint("routine_blueprint", __name__)
CURRENT_DATE_TIME = datetime.datetime.now()
CURRENT_DATE = date.today()
CURRENT_MONTH = CURRENT_DATE_TIME.month


@SOCKETIO.on('/socket/routine_controller/get_routine_sites')
@ROUTINE_BLUEPRINT.route("/sites", methods=["GET"])
def get_routine_sites():
    get_sites = get_sites_data()
    schema = SitesSchema(many=True).dump(get_sites).data
    month = CURRENT_MONTH
    day = calendar.day_name[CURRENT_DATE.weekday()]
    wet_season = [[1, 2, 6, 7, 8, 9, 10, 11, 12], [5, 6, 7, 8, 9, 10]]
    dry_season = [[3, 4, 5], [1, 2, 3, 4, 11, 12]]
    current_weekday = "NAN"
    print(schema)
    if day == "Friday":
        current_weekday = day
    elif day == "Tuesday":
        current_weekday = day
    elif day == "Wednesday":
        current_weekday = day
    else:
        current_weekday = "No routine sites"

    SOCKETIO.emit('routineSitesResponse', current_weekday,
                  callback='successfully fetched data')
