"""
Extra Utils

This file contains all utility functions that can be used on almost
any module in this project.

6 August 2019
"""

import pprint
import time as time_t
from datetime import datetime, timedelta, time
from connection import MEMORY_CLIENT
from src.models.monitoring import (
    PublicAlertSymbols as pas, OperationalTriggerSymbols as ots,
    InternalAlertSymbols as ias, TriggerHierarchies as th)


def set_data_to_memcache(name, data):
    """
    Memcache setter
    """
    final_data = data
    if data == [] or data == {}:
        final_data = "empty"

    temp = f"D3_{name.upper()}"
    MEMORY_CLIENT.set(temp, final_data)


def retrieve_data_from_memcache(table_name, filters_dict=None, retrieve_one=True, retrieve_attr=None):
    """
    Memcache getter
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

        final_return_data = []
        if retrieve_attr:
            if retrieve_one:
                final_return_data = return_data[retrieve_attr]
            else:
                for d in return_data:
                    final_return_data.append(d[retrieve_attr])
        else:
            final_return_data = return_data
    else:
        raise Exception("Table name provided is not found in memcached")

    return final_return_data


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


def format_timestamp_to_string(ts, time_only=False, date_only=False):
    time_locale = "%p"
    if ts.hour in [0, 12]:
        time_locale = "MN" if ts.hour == 0 else "NN"

    time_format = f"%I:%M {time_locale}"

    str_format = f"%B %d, %Y, {time_format}"
    if time_only:
        str_format = time_format

    if date_only:
        str_format = f"%B %d, %Y"

    return ts.strftime(str_format)


def get_unix_ts_value(str_ts):
    """
    Args:
        ts (str)

    return integer
    """

    dt_ts = datetime.strptime(str_ts, "%Y-%m-%d %H:%M:%S")
    int_ts = time_t.mktime(dt_ts.timetuple()) * 1000
    return int_ts


def get_system_time():
    """
    Just a function that returns system time for
    logging purposes.
    """
    system_time = datetime.strftime(
        datetime.now(), "%Y-%m-%d %H:%M:%S")

    return system_time


def get_process_status_log(key, status):
    """
    Just a function used to
    """
    sys_time = get_system_time()
    status_log = f"[{sys_time}] | "
    if status == "request":
        status_log += f"{key} msg request received. Executing {key} process..."
    elif status == "start":
        status_log += f"{key} is starting..."
    elif status == "success" or status:
        status_log += f"{key} SUCCESS!"
    else:
        sys_time += f"{key} FAILED..."

    return status_log
