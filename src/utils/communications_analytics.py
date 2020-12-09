"""
Communications Analytics Util
"""

import re
from datetime import datetime
from ops.comms_analytics.ewisms import main as ewi_sms
from ops.comms_analytics.ewiack import main as ewi_ack
from ops.comms_analytics.gndmeas import main as ground_meas
from src.models.sites import Sites


def get_ewi_sms(start_ts, end_ts):
    """
    Function that get ewi sms sent and queud
    """
    ts_format = "%Y-%m-%d %H:%M:%S"
    data = ewi_sms(start=datetime.strptime(start_ts, ts_format),
                   end=datetime.strptime(end_ts, ts_format))

    months = []
    sent_count = []
    queud_count = []
    quarters = []
    quarter_sent_count = []
    querter_queud_count = []
    for index, row in data.iterrows():
        month = row["ts"]
        sent = round(row["sent"], 2)
        queud = round(row["queud"], 2)
        if month not in months:
            is_quarter = bool(re.search("[Q]", month))
            if is_quarter:
                quarters.append(month)
                quarter_sent_count.append(sent)
                querter_queud_count.append(queud)
            else:
                months.append(month)
                sent_count.append(sent)
                queud_count.append(queud)

    feedback = {
        "per_month": {
            "month": months,
            "sent": sent_count,
            "queud": queud_count
        },
        "per_quarter": {
            "month": quarters,
            "sent": quarter_sent_count,
            "queud": querter_queud_count
        }
    }

    return feedback


def get_ewi_ack(start_ts, end_ts, site_filter=None):
    """
    Function that get ewi acknowledgement
    """
    ts_format = "%Y-%m-%d %H:%M:%S"
    data = ewi_ack(start=datetime.strptime(start_ts, ts_format),
                   end=datetime.strptime(end_ts, ts_format))
    final_data = []
    per_hour_per_site = data[0]

    data_per_hour = {}
    data_per_site = {}

    for index, per_site in per_hour_per_site.iterrows():
        hour = per_site["hour"]
        site_code = per_site["site_code"]
        count = per_site["ts_sms"]
        if site_filter:
            if site_code == site_filter:
                if hour in data_per_site:
                    data_per_site[hour].append(count)
                else:
                    data_per_site[hour] = [count]
        else:
            if hour in data_per_hour:
                data_per_hour[hour].append(count)
            else:
                data_per_hour[hour] = [count]

    if site_filter:
        final_data = data_per_site
    else:
        final_data = data_per_hour

    sum_per_hour = [
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]
    for key in final_data:
        total = sum(final_data[key])
        sum_per_hour[key] = total

    per_day = data[2]
    data_per_day = {}

    for index, per_day in per_day.iterrows():
        day = str(per_day["day"])
        site_code = per_day["site_code"]
        count = per_day["ts_sms"]
        if day in data_per_day:
            data_per_day[day].append(count)
        else:
            data_per_day[day] = [count]
    sum_per_day = [0, 0, 0, 0, 0, 0, 0]
    for index, key in enumerate(data_per_day):
        total = sum(data_per_day[key])
        sum_per_day[index] = total


    feedback = {
        "per_day": {
            "days": [
                "Monday", "Tuesday", "Wednesday",
                "Thursday", "Friday", "Saturday",
                "Sunday"
            ],
            "data": sum_per_day
        },
        "per_hour": {
            "hours": [
                "00:00", "01:00", "02:00", "03:00",
                "04:00", "05:00", "06:00", "07:00",
                "08:00", "09:00", "10:00", "11:00",
                "12:00", "13:00", "14:00", "15:00",
                "16:00", "17:00", "18:00", "19:00",
                "20:00", "21:00", "22:00", "23:00"
            ],
            "data": sum_per_hour
        }
    }

    return feedback


def get_gnd_meas(start_ts, end_ts):
    """
    Function that gets ground measurement count per site
    """
    ts_format = "%Y-%m-%d %H:%M:%S"

    sites = Sites.query.filter(Sites.active == 1).all()
    site_codes = {}

    for row in sites:
        site_codes[row.site_code] = {"expected": [], "received": []}

    data = ground_meas(start=datetime.strptime(start_ts, ts_format),
                       end=datetime.strptime(end_ts, ts_format))

    sites = []
    expected_data = []
    received_data = []
    for index, row in data.iterrows():
        site_code = row["site_code"]
        expected = int(row["expected"])
        received = int(row["received"])
        site_codes[site_code]["expected"].append(expected)
        site_codes[site_code]["received"].append(received)

    for key in site_codes:
        sites.append(key.upper())
        expected_count = sum(site_codes[key]["expected"])
        received_count = sum(site_codes[key]["received"])

        expected_data.append(expected_count)
        received_data.append(received_count)

    feedback = {
        "sites": sites,
        "expected": expected_data,
        "received": received_data
    }

    return feedback
