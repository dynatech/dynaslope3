from datetime import date
import calendar
import datetime
from flask import Blueprint, jsonify
from connection import DB, SOCKETIO
from src.utils.sites import get_sites_data, get_site_events
from src.models.sites import SitesSchema

ROUTINE_BLUEPRINT = Blueprint("routine_blueprint", __name__)
CURRENT_DATE = date.today()


@SOCKETIO.on('/socket/routine_controller/get_routine_sites')
@ROUTINE_BLUEPRINT.route("/sites", methods=["GET"])
def get_routine_sites():
    get_sites = get_sites_data()
    schema = SitesSchema(many=True).dump(get_sites)
    day = calendar.day_name[CURRENT_DATE.weekday()]
    wet_season = [[1, 2, 6, 7, 8, 9, 10, 11, 12], [5, 6, 7, 8, 9, 10]]
    dry_season = [[3, 4, 5], [1, 2, 3, 4, 11, 12]]
    routine_sites = []

    if (day == "Friday" or day == "Tuesday"):
        print(day)
        for sites in schema:
            season = int(sites['season']) - 1
            if sites['season'] in wet_season[season]:
                routine_sites.append(sites['site_code'])
    elif day == "Wednesday":
        print(day)
        for sites in schema:
            season = int(sites['season']) - 1
            if sites['season'] in dry_season[season]:
                routine_sites.append(sites['site_code'])
    else:
        routine_sites = []
    # note the you need to pass the routine and reminder template
    SOCKETIO.emit('routineSitesResponse', {"routine_sites": routine_sites},
                  callback='successfully fetched data')

    return jsonify({"routine_sites": routine_sites})


def get_routine_and_reminder_message():

    return ""
