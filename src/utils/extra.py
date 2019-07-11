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
from datetime import date, time, datetime
from src.utils.sites import get_sites_data
from src.models.sites import (Sites, SitesSchema)


def create_symbols_map(qualifier):
    """
    qualifier (str): can be 'public_alert_symbols' or
                        'operational_trigger_symbols'
    """
    # query_table = None
    # query_tables_list = {
    #     "public_alert_symbols": pas,
    #     "operational_trigger_symbols": ots,
    #     "internal_alert_symbols": ias,
    # }

    # try:
    #     query_table = query_tables_list[qualifier]
    # except Exception as err:
    #     print("=== Error in getting symbols table")
    #     raise(err)

    # custom_map = {}
    # symbols_list = query_table.query.all()
    # for item in symbols_list:
    #     kv_pair = []

    #     if qualifier == "operational_trigger_symbols":
    #         kv_pair.append([("alert_symbol", item.trigger_hierarchy.trigger_source,
    #                          item.alert_level), item.alert_symbol])
    #         kv_pair.append([("trigger_sym_id", item.trigger_hierarchy.trigger_source,
    #                          item.alert_level), item.trigger_sym_id])
    #     elif qualifier == "public_alert_symbols":
    #         kv_pair.append([("alert_symbol", (item.alert_level)),
    #                         item.alert_symbol])
    #         kv_pair.append(
    #             [("pub_sym_id", (item.alert_level)), item.pub_sym_id])
    #     elif qualifier == "internal_alert_symbols":
    #         kv_pair.append([(item.trigger_symbol.alert_level, item.trigger_symbol.source_id), item.alert_symbol])

    #     for pair in kv_pair:
    #         custom_map[pair[0]] = pair[1]

    if qualifier == "operational_trigger_symbols":
        custom_map = {('alert_symbol', 'subsurface', -1): 'nd', ('trigger_sym_id', 'subsurface', -1): 1, ('alert_symbol', 'subsurface', 0): 's0', ('trigger_sym_id', 'subsurface', 0): 2, ('alert_symbol', 'subsurface', 2): 's2', ('trigger_sym_id', 'subsurface', 2): 3, ('alert_symbol', 'subsurface', 3): 's3', ('trigger_sym_id', 'subsurface', 3): 4, ('alert_symbol', 'surficial', -1): 'nd', ('trigger_sym_id', 'surficial', -1): 5, ('alert_symbol', 'surficial', 0): 'g0', ('trigger_sym_id', 'surficial', 0): 6, ('alert_symbol', 'surficial', 1): 'gt', ('trigger_sym_id', 'surficial', 1): 7, ('alert_symbol', 'surficial', 2): 'g2', ('trigger_sym_id', 'surficial', 2): 8, ('alert_symbol', 'surficial', 3): 'g3', ('trigger_sym_id', 'surficial', 3): 9, ('alert_symbol', 'moms', 2): 'm2', ('trigger_sym_id', 'moms', 2): 10, ('alert_symbol',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                'rainfall', -2): 'rx', ('trigger_sym_id', 'rainfall', -2): 11, ('alert_symbol', 'rainfall', -1): 'nd', ('trigger_sym_id', 'rainfall', -1): 12, ('alert_symbol', 'rainfall', 0): 'r0', ('trigger_sym_id', 'rainfall', 0): 13, ('alert_symbol', 'rainfall', 1): 'r1', ('trigger_sym_id', 'rainfall', 1): 14, ('alert_symbol', 'earthquake', 1): 'e1', ('trigger_sym_id', 'earthquake', 1): 15, ('alert_symbol', 'on demand', 1): 'd1', ('trigger_sym_id', 'on demand', 1): 16, ('alert_symbol', 'moms', 3): 'm3', ('trigger_sym_id', 'moms', 3): 17, ('alert_symbol', 'moms', 0): 'm0', ('trigger_sym_id', 'moms', 0): 18, ('alert_symbol', 'moms', -1): 'nd', ('trigger_sym_id', 'moms', -1): 19, ('alert_symbol', 'internal', -1): 'nd', ('trigger_sym_id', 'internal', -1): 20, ('alert_symbol', 'internal', 0): 'A0', ('trigger_sym_id', 'internal', 0): 21}
    elif qualifier == "public_alert_symbols":
        custom_map = {('alert_symbol', 0): 'A0', ('pub_sym_id', 0): 1, ('alert_symbol', 1): 'A1', ('pub_sym_id', 1)                      : 2, ('alert_symbol', 2): 'A2', ('pub_sym_id', 2): 3, ('alert_symbol', 3): 'A3', ('pub_sym_id', 3): 4}
    elif qualifier == "internal_alert_symbols":
        custom_map = {(3, 1): 'S', (-1, 1): 'S0', (2, 1): 's', (3, 2): 'G', (-1, 2): 'G0', (2, 2): 'g', (3, 6): 'M', (1, 3): 'R',
                      (-1, 3): 'R0', (-2, 3): 'Rx', (1, 4): 'E', (1, 5): 'D', (2, 6): 'm', (-1, 6): 'M0', (-1, 7): 'ND', (0, 7): 'A0'}

    return custom_map


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


def round_to_nearest_release_time(data_ts):
    """
    Round time to nearest 4/8/12 AM/PM

    Args:
        data_ts (datetime)

    Returns datetime
    """
    hour = data_ts.hour

    quotient = int(hour / 4)

    if quotient == 5:
        date_time = datetime.combine(data_ts.date() + timedelta(1), time(0, 0))
    else:
        date_time = datetime.combine(
            data_ts.date(), time((quotient + 1) * 4, 0))

    return date_time


def compute_event_validity(data_ts, alert_level):
    """
    Computes for event validity given set of trigger timestamps

    Args:
        data_ts (datetime)
        alert_level (int)

    Returns datetime
    """

    rounded_data_ts = round_to_nearest_release_time(data_ts)
    if alert_level in [1, 2]:
        add_day = 1
    elif alert_level == 3:
        add_day = 2
    else:
        raise ValueError("Alert level accepted is 1/2/3 only")

    validity = rounded_data_ts + timedelta(add_day)

    return validity
