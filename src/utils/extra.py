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
from connection import MEMORY_CLIENT
from flask import jsonify
from datetime import date, time, datetime, timedelta
from src.utils.sites import get_sites_data
from src.models.sites import (Sites, SitesSchema)
from src.models.monitoring import (
    PublicAlertSymbols as pas, OperationalTriggerSymbols as ots,
    InternalAlertSymbols as ias, TriggerHierarchies as th)


def retrieve_data_from_memcache(table_name, filters_dict=None, retrieve_one=True):
    """

    """

    return_data = []

    if filters_dict is None:
        filters_dict = []

    data = MEMORY_CLIENT.get(f"D3_{table_name.upper()}")

    if data:
        if filters_dict:
            for row in data:
                try:
                    if all(filters_dict[key] == row[key] for key in filters_dict):
                        if retrieve_one:
                            return_data = row
                            break
                        else:
                            return_data.append(row)
                except KeyError as err:
                    print(err)
                    raise
        else:
            return_data = data
    else:
        raise Exception("Table name provided is not found in memcached")

    return return_data


def create_symbols_map(qualifier):
    """
    qualifier (str): can be 'public_alert_symbols' or
                        'operational_trigger_symbols'
    """
    query_table = None
    query_tables_list = {
        "public_alert_symbols": pas,
        "operational_trigger_symbols": ots,
        "internal_alert_symbols": ias,
        "trigger_hierarchies": th
    }

    try:
        query_table = query_tables_list[qualifier]
    except Exception as err:
        print("=== Error in getting symbols table")
        raise(err)

    custom_map = {}
    symbols_list = query_table.query.all()
    for item in symbols_list:
        kv_pair = []

        if qualifier == "operational_trigger_symbols":
            trigger_source = item.trigger_hierarchy.trigger_source
            kv_pair.append([("alert_symbol", trigger_source,
                             item.alert_level), item.alert_symbol])
            kv_pair.append([("trigger_sym_id", trigger_source,
                             item.alert_level), item.trigger_sym_id])
            kv_pair.append(
                [("alert_level", trigger_source, item.trigger_sym_id), item.alert_level])
        elif qualifier == "public_alert_symbols":
            kv_pair.append([("alert_symbol", (item.alert_level)),
                            item.alert_symbol])
            kv_pair.append(
                [("pub_sym_id", (item.alert_level)), item.pub_sym_id])
            kv_pair.append(
                [("alert_level", (item.pub_sym_id)), item.alert_level])
        elif qualifier == "internal_alert_symbols":
            kv_pair.append([("alert_symbol", item.trigger_symbol.alert_level,
                             item.trigger_symbol.source_id), item.alert_symbol])
            kv_pair.append([("internal_sym_id", item.trigger_symbol.alert_level,
                             item.trigger_symbol.source_id), item.internal_sym_id])
        elif qualifier == "trigger_hierarchies":
            kv_pair.append([item.trigger_source, item.source_id])
            kv_pair.append([item.source_id, item.trigger_source])

        for pair in kv_pair:
            custom_map[pair[0]] = pair[1]

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


def round_to_nearest_release_time(data_ts, interval=4):
    """
    Round time to nearest 4/8/12 AM/PM (default)
    Or any other interval

    Args:
        data_ts (datetime)
        interval (Integer)

    Returns datetime
    """
    hour = data_ts.hour

    quotient = int(hour / interval)
    hour_of_release = (quotient + 1) * interval

    if hour_of_release < 24:
        date_time = datetime.combine(
            data_ts.date(), time((quotient + 1) * interval, 0))
    else:
        date_time = datetime.combine(data_ts.date() + timedelta(1), time(0, 0))

    return date_time
