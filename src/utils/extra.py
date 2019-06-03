"""
Extra Utils

This file contains all utility functions that can be used on almost
any module in this project.

Software Infrastructure SubTeam
CBEWS-L Team
Dynaslope Project 2019

27 May 2019
"""
import pprint
import calendar
from flask import jsonify
from datetime import date
from src.utils.sites import get_sites_data
from src.models.sites import (Sites, SitesSchema)


def var_checker(var_name, var, have_spaces=False):
    """
    A function used to check variable value including 
    title and indentation and spacing for faster checking 
    and debugging.

    Args:
    var_name (String): the variable name or title you want display
    var (variable): variable (any type) to display
    have_spaces (Boolean): keep False is you dont need spacing for each display.
    """
    if have_spaces:
        print()
        print(f"===== {var_name} =====")
        printer = pprint.PrettyPrinter(indent=4)
        printer.pprint(var)
        print()
    else:
        print(f"===== {var_name} =====")
        printer = pprint.PrettyPrinter(indent=4)
        printer.pprint(var)


def get_routine_sites(timestamp=None):
    """
    Utils counterpart of identifing the routine site per day.
    Returns "routine_sites" in a list as value.

    E.g.:
    {
        "routine_sites": [
            'bak', 'blc', 'cud', 'imu', 'ina'
        ]
    }
    """
    current_data = date.today()
    if timestamp:
        current_data = timestamp.date()
    get_sites = get_sites_data()
    day = calendar.day_name[current_data.weekday()]
    wet_season = [[1, 2, 6, 7, 8, 9, 10, 11, 12], [5, 6, 7, 8, 9, 10]]
    dry_season = [[3, 4, 5], [1, 2, 3, 4, 11, 12]]
    routine_sites = []

    if (day == "Friday" or day == "Tuesday"):
        print(day)
        for sites in get_sites:
            season = int(sites.season) - 1
            if sites.season in wet_season[season]:
                routine_sites.append(sites.site_code)
    elif day == "Wednesday":
        print(day)
        for sites in get_sites:
            season = int(sites.season) - 1
            if sites.season in dry_season[season]:
                routine_sites.append(sites.site_code)
    else:
        routine_sites = []

    # print(routine_sites)
    return routine_sites
