"""
    Utility file for Rainfall tables.
    Contains functions essential in accessing and saving into Rainfall table.
"""

import json
from datetime import datetime
from connection import DB
from src.models.analysis import RainfallAlerts as ra
from src.models.sites import Sites, SitesSchema
from src.utils.extra import get_unix_ts_value
from analysis.rainfall.rainfall import main as rainfall_main, web_plotter


def get_rainfall_alerts(site_id=None, latest_trigger_ts=None):
    """
    Query rainfall alerts
    Not in use except for tech_info_maker (which was not yet imported)
    """

    if site_id and latest_trigger_ts:
        rain_alerts = ra.query.order_by(DB.desc(ra.ts)).filter(
            ra.site_id == site_id, ra.ts == latest_trigger_ts).all()
    else:
        rain_alerts = ra.query.all()

    return rain_alerts


def get_rainfall_gauge_name(rainfall_alert):
    """
    Just check rainfall
    """

    rain_gauge_name = ""
    try:
        rain_gauge_name = rainfall_alert.rainfall_gauge.gauge_name
        data_source = rainfall_alert.rainfall_gauge.data_source

        if data_source == "noah":
            rain_gauge_name = "NOAH " + str(rain_gauge_name)
        rain_gauge_name = f"RAIN {rain_gauge_name.upper()}"
    except:
        pass

    return rain_gauge_name


def get_rainfall_plot_data(site_code, ts, days):
    """
    """

    json_rainfall_data = web_plotter(site_code, ts, days)
    temp = json.loads(json_rainfall_data)
    rainfall_data = temp[0]  # return behavior by pandas
    plot_data = process_rainfall_plot_data(rainfall_data)

    return plot_data


def process_rainfall_plot_data(rainfall_data):
    """
    """

    raw_plot = rainfall_data["plot"]
    plot_data = []

    for gauge_data in raw_plot:
        temp = {
            "24h": [],
            "72h": [],
            "rain": [],
            "null_ranges": [],
            "max_rval": 0,
            "max_72h": 0
        }

        data = gauge_data["data"]
        push_null_flag = False
        start = None
        end = None
        instance_count = len(data)

        if data:
            for index, row in enumerate(data):
                rain_val = row["rain"]
                ts = row["ts"] + ":00"  # take note that seconds is missing
                int_ts = get_unix_ts_value(ts)

                seventytwo_hr_cumulative = row["72hr cumulative rainfall"]
                if seventytwo_hr_cumulative and seventytwo_hr_cumulative > temp["max_72h"]:
                    temp["max_72h"] = seventytwo_hr_cumulative

                if rain_val is None:
                    if start is None:
                        start = int_ts
                    end = int_ts

                    if index == instance_count - 1:
                        push_null_flag = True
                else:
                    if rain_val > temp["max_rval"]:
                        temp["max_rval"] = rain_val

                    if start:
                        push_null_flag = True

                if push_null_flag:
                    arr_range = {"from": start, "to": end}
                    temp["null_ranges"].append(arr_range)
                    start = None
                    end = None
                    push_null_flag = False

                temp_arr = [
                    (rain_val, "rain"),
                    (seventytwo_hr_cumulative, "72h"),
                    (row["24hr cumulative rainfall"], "24h")
                ]

                for val, key in temp_arr:
                    temp[key].append([int_ts, val])

        temp.update(gauge_data)
        del temp["data"]
        plot_data.append(temp)

    return plot_data


def get_all_site_rainfall_data(site_codes_string=None, end_ts=datetime.now()):
    rainfall_summary = rainfall_main(
        site_code=site_codes_string,
        end=end_ts, Print=False,
        write_to_db=False, print_plot=False, save_plot=False,
        is_command_line_run=False)

    return rainfall_summary


def process_rainfall_information_message(rainfall_summary, sites, as_of, is_express):
    messages = []

    decoded_data = json.loads(rainfall_summary)
    for row in decoded_data:
        decoded_site_code = row["site_code"]
        for sites_row in sites:
            if sites_row["site_code"] == decoded_site_code:
                site_info = sites_row["site_info"]

        one_day_cml = row["1D cml"]
        half_of_2yr_max = row["half of 2yr max"]
        three_day_cml = row["3D cml"]
        two_year_max = row["2yr max"]

        if one_day_cml is not None:
            one_day = int(one_day_cml / half_of_2yr_max * 100)
            three_day = int(three_day_cml / two_year_max * 100)

            one_day_percentage = (f"One-day cumulative rainfall percentage: {str(one_day)}% \n")
            one_day_cumulative = (f"One-day cumulative rainfall: {str(one_day_cml)} mm \n")
            one_day_threshold = (f"One-day rainfall threshold: {str(half_of_2yr_max)} mm \n")
            three_day_percentage = (f"Three-day cumulative rainfall percentage: {str(three_day)}% \n")
            three_day_cumulative = (f"Three-day cumulative rainfall: {str(three_day_cml)} mm \n")
            three_day_threshold = (f"Three-day rainfall threshold: {str(two_year_max)} mm \n")
            if is_express:
                rain_info = (f"{one_day_percentage} {three_day_percentage}")
            else:
                rain_info = (f"{one_day_cumulative} {one_day_threshold} \n\n {three_day_cumulative} {three_day_threshold}")

            message = (f"Rainfall Information for {site_info} as of <as_of> : \n {rain_info} ")
            data = {
                "message": message
            }
        else:
            data = {
                "message": str("No data for " + site_info)
            }

        messages.append(data)

    final_message = ""
    for row in messages:
        final_message += "\n" + str(row["message"])

    return final_message
