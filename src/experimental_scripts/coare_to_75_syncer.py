import os
import sys
sys.path.append(
    r"D:\Users\swat-dynaslope\Documents\DYNASLOPE-3.0\dynaslope3-final")
import logging
from connection import create_app
from connection import DB

import atexit
import time
from datetime import datetime
from config import APP_CONFIG
from instance.config import SCHEMA_DICT

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from src.models.analysis import get_rain_table, get_tilt_table


class Tables(DB.Model):
    """
    Class representation of monitoring_events table
    """

    __tablename__ = "tables"
    __bind_key__ = "information_schema"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    table_schema = DB.Column(DB.String(100), nullable=False)
    table_name = DB.Column(DB.String(100), nullable=False, primary_key=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> "
                f" Table Schema: {self.table_schema} Table Name: {self.table_name}")


def sync_data():
    save_path = f"{APP_CONFIG['logs_path']}/last_processed.txt"
    last_table_processed = None
    if os.path.exists(save_path):
        with open(save_path, "r+") as save_file:
            last_table_processed = save_file.read()

    if last_table_processed:
        logging.debug(f"LAST PROCESSED TABLE: {last_table_processed}...")

    # get list of tables to sync
    # SELECT table_name FROM information_schema.tables WHERE table_schema = 'mia_senslopedb'
    # AND (table_name LIKE "rain\_%" OR table_name LIKE "tilt\_%") AND table_name NOT IN (
    # "rain_gauges", "rain_health", "rain_props")

    tables = Tables.query.filter(
        DB.and_(
            Tables.table_schema == "mia_senslopedb",
            DB.or_(
                Tables.table_name.like(r"rain\_%"),
                Tables.table_name.like(r"tilt\_%")
            ),
            Tables.table_name.notin_(
                ["rain_gauges", "rain_health", "rain_props"])
        )).all()

    if last_table_processed and last_table_processed != tables[-1].table_name:
        tables = [table for table in tables if table.table_name
                  > last_table_processed]

    # LOOP TABLE NAMES
    # tables = ["tilt_agbsb"]
    for table in tables:
        table_name = table.table_name
        # table_name = table

        logging.debug(f"Syncing table {table_name}...")

        is_rain = "rain" in table_name
        is_tilt = "tilt" in table_name

        if is_rain:
            local_table = get_rain_table(table_name, schema="senslopedb_75")
            cloud_table = get_rain_table(table_name, schema="senslopedb")
        elif is_tilt:
            local_table = get_tilt_table(table_name, schema="senslopedb_75")
            cloud_table = get_tilt_table(table_name, schema="senslopedb")

        try:
            # Get last data row from local database
            last_row = local_table.query.order_by(
                local_table.data_id.desc()).first()

            data_id = 0
            if last_row:
                data_id = last_row.data_id
        except Exception:
            logging.warning(
                f"Table {table_name} NOT EXISTING on local... Create table on local")
            continue

        logging.debug(f"Started sync at ID {data_id}")

        try:
            data = cloud_table.query.filter(
                cloud_table.data_id > data_id).limit(10000).all()
        except Exception:
            logging.exception(
                f"Cloud version of Table {table_name} has querying problems...")
            continue

        try:
            for row in data:
                if is_rain:
                    entry = local_table(
                        data_id=row.data_id,
                        ts=row.ts,
                        rain=row.rain,
                        temperature=row.temperature,
                        humidity=row.humidity,
                        battery1=row.battery1,
                        battery2=row.battery2,
                        csq=row.csq
                    )

                if is_tilt:
                    entry = local_table(
                        data_id=row.data_id,
                        ts=row.ts,
                        node_id=row.node_id,
                        type_num=row.type_num,
                        xval=row.xval,
                        yval=row.yval,
                        zval=row.zval,
                        batt=row.batt  # ,
                        # is_live=row.is_live
                    )

                DB.session.add(entry)
                # DB.session.flush()

            DB.session.commit()
        except Exception as e:
            DB.session.rollback()
            logging.exception(
                "Encountered a problem in saving data from cloud to local...")
            continue

        if data:
            last_row = data[-1]
            logging.debug(
                f"Syncing ended at ID {last_row.data_id} ({last_row.ts})")
        else:
            logging.debug("Table is up-to-date!")

        logging.debug(f"Finished syncing table {table_name}...")

        with open(save_path, "w+") as save_file:
            save_file.write(table_name)


if __name__ == "__main__":
    CONFIG_NAME = os.getenv("FLASK_CONFIG")
    app = create_app(CONFIG_NAME, skip_memcache=True)

    # local_engine = create_engine(
    #     "mysql://pysys_local:NaCAhztBgYZ3HwTkvHwwGVtJn5sVMFgg@192.168.150.75/senslopedb")
    # LocalSession = sessionmaker(bind=local_engine)
    # local_session = LocalSession()

    with app.app_context():
        ts = datetime.now().strftime("%m-%d-%Y_%H-%M-%S")
        # log_file = f"{APP_CONFIG['logs_path']}/coare_to_75_syncer/{ts}.txt"
        log_file = f"{APP_CONFIG['logs_path']}/coare_to_75_syncer.txt"

        if not os.path.exists(log_file):
            os.makedirs(log_file)

        logging.root.handlers = []
        logging.basicConfig(level=logging.DEBUG,
                            format='%(asctime)s -%(levelname)s- %(message)s',
                            datefmt='%d-%b-%y %H:%M:%S',
                            handlers=[
                                logging.FileHandler(log_file, mode="w+"),
                                logging.StreamHandler()
                            ])

        logging.debug("=== SYNCING SCRIPT START ===")

        while True:
            try:
                sync_data()
            except Exception as e:
                logging.exception("Exception occured")

            logging.debug("=== Sleeping for 60 seconds... ===")
            time.sleep(60)


@atexit.register
def teardown():
    logging.debug("=== SYNCING SCRIPT END ===")
