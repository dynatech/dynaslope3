"""
Communications Analytics Util
"""

import json
import re
from datetime import datetime
from src.utils.extra import get_unix_ts_value
from ops.comms_analytics.ewisms import main as ewi_sms
from ops.comms_analytics.ewiack import main as ewi_ack
from ops.comms_analytics.gndmeas import main as ground_meas


def get_ewi_sms():
    #stack bar chart
    start_ts = "2019-01-01 00:00:00"
    end_ts = "2019-04-30 23:59:59"
    ts_format = "%Y-%m-%d %H:%M:%S"
    data = ewi_sms(start=datetime.strptime(start_ts, ts_format), end=datetime.strptime(end_ts, ts_format))

    months = []
    sent_count = []
    queud_count = []
    quarters = []
    quarter_sent_count = []
    querter_queud_count = []
    for index, row in data.iterrows():
        print(row)
        month = row["ts"]
        sent = row["sent"]
        queud = row["queud"]
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
    #https://www.highcharts.com/demo/column-stacked-percent/sand-signika
    return feedback


def get_ewi_ack():
    start_ts = "2019-01-01 00:00:00"
    end_ts = "2019-04-30 23:59:59"
    ts_format = "%Y-%m-%d %H:%M:%S"
    data = ewi_ack(start=datetime.strptime(start_ts, ts_format), end=datetime.strptime(end_ts, ts_format))
    # print(data)
    final_data = []
    
    print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ per site per hour")
    print(data[0])
    per_hour_per_site = data[0]
    data_per_hour = {}
    data_per_site = {}
    hours = []
    for index, per_site in per_hour_per_site.iterrows():
        hour = per_site["hour"]
        site_code = per_site["site_code"]
        count = per_site["ts_sms"]
        if hour in data_per_hour:
            data_per_hour[hour].append(count)
        else:
            hours.append(hour)
            data_per_hour[hour] = [count]

    sum_per_hour = []
    for key in data_per_hour:
        total = sum(data_per_hour[key])
        sum_per_hour.append(total)


    print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~per day")
    per_day = data[2]
    print(data[2])
    data_per_day = {}
    days = []
    for index, per_day in per_day.iterrows():
        day = str(per_day["day"])
        site_code = per_day["site_code"]
        count = per_day["ts_sms"]
        if day in data_per_day:
            data_per_day[day].append(count)
        else:
            days.append(day)
            data_per_day[day] = [count]
    sum_per_day = []
    for key in data_per_day:
        total = sum(data_per_day[key])
        sum_per_day.append(total)


    feedback = {
        "per_day": {
            "days": days,
            "data": sum_per_day
        },
        "per_hour": {
            "hours": hours,
            "data": sum_per_hour
        }
    }
    #https://www.highcharts.com/demo/column-stacked/sand-signika
    return feedback


def get_gnd_meas():
    start_ts = "2019-01-01 00:00:00"
    end_ts = "2019-04-30 23:59:59"
    ts_format = "%Y-%m-%d %H:%M:%S"
    data = ground_meas(start=datetime.strptime(start_ts, ts_format), end=datetime.strptime(end_ts, ts_format))
    print(data)
    final_data = []
    months = []
    for index, row in data.iterrows():
        site_code = row["site_code"]
        expected = row["expected"]
        received = int(row["received"])
        ts = row["ts"]
        final_data.append({
            "site_code": row["site_code"],
            "expected": row["expected"],
            "received": int(row["received"]),
            "ts": row["ts"]
        })
    #https://www.highcharts.com/demo/column-stacked/sand-signika
    return final_data

