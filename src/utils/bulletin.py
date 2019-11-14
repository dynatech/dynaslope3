"""
Utility file for Monitoring Tables
Contains functions for getting and accesing Sites table only
"""

import os
import platform
import re
import copy
from datetime import datetime, timedelta, time
from flask import send_file

import img2pdf
from PIL import Image

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

from config import APP_CONFIG

from src.models.monitoring import MonitoringReleasesSchema
from src.utils.monitoring import (
    get_monitoring_releases, get_monitoring_triggers,
    compute_event_validity, round_to_nearest_release_time,
    check_if_onset_release, get_next_ground_data_reporting)
from src.utils.extra import retrieve_data_from_memcache, format_timestamp_to_string


# Number of hours extended if no_data upon validity
NO_DATA_HOURS_EXTENSION = retrieve_data_from_memcache(
    "dynamic_variables", {"var_name": "NO_DATA_HOURS_EXTENSION"}, retrieve_attr="var_value")

RELEASE_INTERVAL_HOURS = retrieve_data_from_memcache(
    "dynamic_variables", {"var_name": "RELEASE_INTERVAL_HOURS"}, retrieve_attr="var_value")

BULLETIN_RESPONSES = retrieve_data_from_memcache("bulletin_responses")

BULLETIN_TRIGGERS = retrieve_data_from_memcache("bulletin_triggers")

INTERNAL_ALERT_SYMBOLS = retrieve_data_from_memcache("internal_alert_symbols")


class DriverContainer:
    dir_name = os.path.dirname
    path = dir_name(dir_name(__file__))
    save_path = f"{path}/temp/bulletin"
    pdf_save_path = f"{path}/temp"

    def __init__(self):
        print("Initializing Selenium WebDriver...")
        options = Options()

        options.add_argument('--headless')
        options.add_argument('--disable-gpu')
        options.add_argument("--disable-extensions")
        options.add_argument('--ignore-certificate-errors')
        options.add_argument('--no-sandbox')
        options.add_argument("--log-level=3")  # Turn of logging

        os_platform = platform.system()
        lc_platform = os_platform.lower()

        extension = ".exe" if lc_platform == "windows" else ""
        # service_args=["--log-path=/../temp/chromedriver.log"]
        self.driver = webdriver.Chrome(
            f"{self.path}/drivers/{lc_platform}/chromedriver{extension}",
            chrome_options=options)

        print("Finished initializing Selenium WebDriver...")

    def render_bulletin(self, release_id):
        error = ""
        pdf_path = ""

        try:
            self.take_screenshot(release_id)
            self.convert_screenshot()
            self.render_to_pdf()
            success = True
            pdf_path = f"{self.pdf_save_path}/bulletin.pdf"
        except Exception as e:
            success = False
            error = str(e)

        return {
            "success": success,
            "error": error,
            "pdf_path": pdf_path
        }

    def take_screenshot(self, release_id):
        print("Taking bulletin screenshots...")
        save_path = self.save_path
        try:
            for file in os.scandir(save_path):
                os.unlink(file.path)
        except FileNotFoundError:
            os.makedirs(save_path)

        driver = self.driver
        driver.set_window_size(1240, 1753)  # 150dpi
        # driver.set_window_size(2480, 3508) # 300dpi

        url = APP_CONFIG["url"]
        driver.get(f"{url}/bulletin/{release_id}")

        try:
            WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.ID, "is-loaded")))
        except TimeoutException:
            print("Loading took too much time!")

        element = driver.find_element(By.ID, "bulletin-root")
        element.screenshot(f"{save_path}/bulletin-1.png")

        try:
            element = driver.find_element(By.ID, "bulletin-root-2")
            driver.execute_script("arguments[0].scrollIntoView()", element)
            actions = ActionChains(driver)
            actions.move_to_element(element).perform()
            element.screenshot(f"{save_path}/bulletin-2.png")
        except NoSuchElementException:
            pass

        print("Finished taking bulletin screenshots...")

    def convert_screenshot(self):
        print("Converting screenshots into JPEG...")
        save_path = self.save_path
        for file in os.scandir(save_path):
            path = file.path

            png = Image.open(path)
            png.load()  # required for png.split()
            background = Image.new("RGB", png.size, (255, 255, 255))
            # 3 is the alpha channel
            background.paste(png, mask=png.split()[3])
            name = file.name.replace("png", "jpg")
            background.save(f"{save_path}/{name}", "JPEG",
                            density=150, quality=100)
        print("Succesfully converted screenshots into JPEG...")

    def render_to_pdf(self):
        print("Rendering to PDF...")
        a4inpt = (img2pdf.mm_to_pt(210), img2pdf.mm_to_pt(297))
        layout_fun = img2pdf.get_layout_fun(a4inpt)
        with open(f"{self.pdf_save_path}/bulletin.pdf", "wb") as f:
            f.write(img2pdf.convert(
                [i.path for i in os.scandir(
                    self.save_path) if i.name.endswith(".jpg")],
                dpi=150, layout_fun=layout_fun))
        print("Succesfully rendered PDF...")


BROWSER_DRIVER = DriverContainer()


def prepare_symbols_list(internal_sym_ids):
    arr = []
    has_ground_trigger = False

    for int_sym_id in internal_sym_ids:
        temp = retrieve_data_from_memcache(
            "bulletin_triggers", {"internal_sym_id": int_sym_id})
        trigger_symbol = temp["internal_sym"]["trigger_symbol"]
        alert_level = trigger_symbol["alert_level"]
        alert_symbol = trigger_symbol["alert_symbol"]
        trigger_origin = trigger_symbol["trigger_hierarchy"]
        is_ground = trigger_origin["is_ground"]
        trigger_source = trigger_origin["trigger_source"]
        hierarchy_id = trigger_origin["hierarchy_id"]

        obj = {
            "internal_sym_id": int_sym_id,
            "alert_level": alert_level,
            "alert_symbol": alert_symbol,
            "trigger_source": "manifestation" if trigger_source == "moms" else trigger_source,
            "is_ground": is_ground,
            "hierarchy_id": hierarchy_id,
            "template": temp["template"],
            "description": temp["description"],
        }

        arr.append(obj)

        if is_ground:
            has_ground_trigger = True

    arr = sorted(arr, key=lambda i: (i["hierarchy_id"], -i["alert_level"]))

    return arr, has_ground_trigger


class AlertDescriptionProcessor:
    """
    Something
    """

    def __init__(self, int_sym_objects):
        self.int_sym_objects = int_sym_objects
        self.critical = []
        self.significant = []
        self.alert_1 = []
        self.trigger_on_demand = False
        self.__sort_triggers()

    def __sort_triggers(self):
        int_sym_objects = self.int_sym_objects
        trigger_sources_accounted = set()

        for int_sym_obj in int_sym_objects:
            alert_level = int_sym_obj["alert_level"]
            is_ground = int_sym_obj["is_ground"]
            template = int_sym_obj["template"]
            trigger_source = int_sym_obj["trigger_source"]

            if is_ground:
                if trigger_source not in trigger_sources_accounted:
                    if alert_level == 3:
                        self.critical.append(template)
                    elif alert_level == 2:
                        self.significant.append(template)

                trigger_sources_accounted.add(trigger_source)
            else:
                if trigger_source == "on demand":
                    self.trigger_on_demand = True
                else:
                    self.alert_1.append(template)

    @staticmethod
    def __join_list(array):
        separator = " and " if len(array) >= 2 else ""
        joined = separator.join([", ".join(array[0:-1]), array[-1]])

        return joined

    def create_alert_description(self):
        alert_description = ""

        critical = self.critical
        if critical:  # returns False if critical is empty
            combined = self.__join_list(critical)
            alert_description += f"Critical movement observed {combined}"

        significant = self.significant
        if significant:  # returns False if significant is empty
            combined = self.__join_list(significant)
            message = f"Significant movement observed {combined}"

            if alert_description == "":
                alert_description += message
            else:
                connector = " and"
                if len(critical) > 1:
                    connector = ";"
                alert_description += f"{connector} {message[0].lower()}{message[1:]}"

        alert_1 = self.alert_1
        if alert_1:  # return False if alert_1 is empty
            combined = self.__join_list(alert_1)
            message = f"{combined} may trigger landslide"

            if not critical and not significant:
                alert_description += f"{message[0].upper()}{message[1:]}"
            else:
                alert_description += f"; {message}"

        if self.trigger_on_demand:
            if alert_description != "":
                alert_description += "; "

            alert_description += "LEWC/LGU requested monitoring"

        return alert_description


def get_alert_description(public_alert_level, internal_sym_id_list):
    """
    Get internal alert description
    """
    alert_description = ""

    if public_alert_level == 0:
        from_above_alert_1 = False
        for i in internal_sym_id_list:
            if i["is_ground"]:
                from_above_alert_1 = True
                break
        alert_description = "Movement reduced to non-significant rates" if from_above_alert_1 \
            else "No significant ground movement"
    else:
        alert_description = AlertDescriptionProcessor(
            internal_sym_id_list).create_alert_description()

    return alert_description


def process_alert_description(alert_level, int_sym_objects, formatted_validity):
    alert_description = get_alert_description(
        alert_level, int_sym_objects)
    alert_description_group = f"Alert {alert_level} ({alert_description})"

    if alert_level > 0:
        alert_description_group += f", valid until {formatted_validity}"

    return alert_description_group


def process_bulletin_responses(pub_sym_id, alert_level, validity, data_ts, is_onset):
    response = [
        row for row in BULLETIN_RESPONSES if row["pub_sym_id"] == pub_sym_id].pop()
    bulletin_response = copy.deepcopy(response)

    if alert_level == 3:
        validity = validity - timedelta(minutes=30)
        validity = format_timestamp_to_string(validity)
        bulletin_response["lewc_lgu"] = bulletin_response["lewc_lgu"].replace(
            "[end of A3 validity period]", f"<strong>{validity}</strong>")
    elif alert_level in [1, 2]:
        reporting_ts = get_next_ground_data_reporting(data_ts, is_onset)
        reporting_ts = format_timestamp_to_string(reporting_ts)
        bulletin_response["lewc_lgu"] = bulletin_response["lewc_lgu"].replace(
            "[date and time of next reporting]", f"<strong>{reporting_ts}</strong>")
    else:
        # TODO: isinsin pa ang returning of bulletin recommendations
        recommended = bulletin_response["recommended"].split("/")
        res = recommended[2]
        if is_onset:
            res = recommended[0]

        bulletin_response["lewc_lgu"] = res
        bulletin_response["recommended"] = res

    return bulletin_response


def process_triggers_information(grouped_triggers, int_sym_objects):
    description_list = []

    for int_sym_obj in int_sym_objects:
        int_sym_id = int_sym_obj["internal_sym_id"]
        description = int_sym_obj["description"]

        triggers = grouped_triggers[int_sym_id]
        first_trigger = triggers.pop()
        latest_triggers = triggers[0:3]

        last_trigger = first_trigger
        if latest_triggers:
            last_trigger = triggers[0]

        first_ts = format_timestamp_to_string(first_trigger.ts)
        description = description.replace(
            "[timestamp]", f"<strong>{first_ts}</strong>")

        retriggers_str = process_recent_ts_triggers(latest_triggers)
        if retriggers_str:
            description = f"{description} Most recent re-trigger/s occurred on <strong>{retriggers_str}</strong>."

        description += f"<br /><strong>Last trigger info:</strong> {last_trigger.info}"

        obj = {
            "description": description,
            "trigger_source": int_sym_obj["trigger_source"],
            "is_ground": int_sym_obj["is_ground"]
        }

        description_list.append(obj)

    return description_list


def process_recent_ts_triggers(latest_triggers):
    current_ts = None
    ts_str = ""
    for row in latest_triggers:
        ts = row.ts
        add = ""
        formatted_ts = format_timestamp_to_string(ts)
        if current_ts is not None:
            add = "; "
            if current_ts.day == ts.day:
                add = ", "
                formatted_ts = format_timestamp_to_string(ts, time_only=True)
            else:
                current_ts = ts
        else:
            current_ts = ts

        ts_str += f"{add}{formatted_ts}"

    return ts_str


def process_no_data_triggers(trigger_list_str):
    sources = set()

    if trigger_list_str:  # check if not None
        for match in re.findall(r"ND|.0", trigger_list_str):
            trigger_symbol = retrieve_data_from_memcache("internal_alert_symbols", {
                "alert_symbol": match}, retrieve_one=True, retrieve_attr="trigger_symbol")
            trigger_source = trigger_symbol["trigger_hierarchy"]["trigger_source"]
            trigger_source = "manifestation" if trigger_source == "moms" else trigger_source
            sources.add(trigger_source)

    return sources


def get_release_publishers_initial(release_publishers):
    """
    """

    sorted(release_publishers, key=lambda i: i.role, reverse=True)

    publishers = []
    for rp in release_publishers:
        user_details = rp.user_details
        first_name = user_details.first_name
        last_name = user_details.last_name

        whole_name = [first_name, last_name]
        letters = [word[0] for word in whole_name]

        publishers.append("".join(letters))

    return ", ".join(publishers)


def create_monitoring_bulletin(release_id):
    """
    Creates monitoring bulletin
    """

    release_id = int(release_id)
    release = get_monitoring_releases(release_id=release_id)
    event_alert = release.event_alert
    event_alert_id = event_alert.event_alert_id
    event = event_alert.event
    site = event.site
    data_ts = release.data_ts
    pub_sym_id = event_alert.pub_sym_id
    alert_level = event_alert.public_alert_symbol.alert_level

    is_onset = check_if_onset_release(event_alert_id, release_id, data_ts)
    updated_data_ts = data_ts
    if not is_onset:
        updated_data_ts = data_ts + timedelta(minutes=30)

    bulletin_control_code = f"{site.site_code.upper()}-{data_ts.year}-{release.bulletin_number}"

    event_id = event_alert.event_id
    trigger_list = get_monitoring_triggers(
        event_id=event_id, ts_end=data_ts)
    most_recent_trigger_ts = trigger_list[0].ts

    grouped_triggers = {}
    for row in trigger_list:
        grouped_triggers.setdefault(row.internal_sym_id, []).append(row)

    trigger_list_str = release.trigger_list
    computed_validity = compute_event_validity(
        most_recent_trigger_ts, alert_level)
    final_validity = computed_validity

    if alert_level > 0:  # validity is not needed in A0 bulletin
        if computed_validity <= updated_data_ts:
            if re.search(r"ND|.0|[Rr]x", trigger_list_str):
                final_validity = updated_data_ts + \
                    timedelta(hours=NO_DATA_HOURS_EXTENSION)

    internal_sym_id_list = grouped_triggers.keys()
    int_sym_objects, has_ground_trigger = prepare_symbols_list(
        internal_sym_id_list)

    formatted_validity = format_timestamp_to_string(final_validity)
    alert_description_group = process_alert_description(
        alert_level, int_sym_objects, formatted_validity)

    bulletin_response = process_bulletin_responses(
        pub_sym_id, alert_level, computed_validity, data_ts, is_onset)

    prepared_triggers = []
    if alert_level > 0:  # triggers not needed in A0 bulletin
        prepared_triggers = process_triggers_information(
            grouped_triggers, int_sym_objects)

    no_data_triggers = process_no_data_triggers(trigger_list_str)
    ground_movement_details = "No significant ground movement detected."
    if "internal" in no_data_triggers:
        ground_movement_details = "No available surficial and subsurface data."

    publishers = get_release_publishers_initial(release.release_publishers)

    next_ewi_release_ts = round_to_nearest_release_time(data_ts)
    if not is_onset:
        next_ewi_release_ts = next_ewi_release_ts + \
            timedelta(hours=RELEASE_INTERVAL_HOURS)

    schema = MonitoringReleasesSchema(
        exclude=["event_alert.event.eos_analysis"]).dump(release).data

    schema = {
        **schema,
        "alert_level": alert_level,
        "bulletin_control_code": bulletin_control_code,
        "site": schema["event_alert"]["event"]["site"],
        "data_ts": format_timestamp_to_string(updated_data_ts),
        "alert_description_group": alert_description_group,
        "recommended_response": bulletin_response["recommended"],
        "community_response": bulletin_response["community"],
        "lewc_lgu_response": bulletin_response["lewc_lgu"],
        "households_at_risk": site.households,
        "has_ground_trigger": has_ground_trigger,
        "ground_movement_details": ground_movement_details,
        "prepared_triggers": prepared_triggers,
        "no_data_triggers": list(no_data_triggers),
        "publishers": publishers,
        "next_ewi_release_ts": format_timestamp_to_string(next_ewi_release_ts)
    }

    return schema


def render_monitoring_bulletin(release_id):
    ret = BROWSER_DRIVER.render_bulletin(release_id)

    if ret["success"]:
        return send_file(ret["pdf_path"], as_attachment=True, attachment_filename="bulletin.pdf")

    return ret["error"]
