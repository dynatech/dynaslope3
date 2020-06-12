"""
"""

from celery.signals import worker_ready, user_preload_options
from celery.schedules import crontab
from connection import create_app, create_celery

APP = create_app(None, skip_memcache=True, enable_webdriver=False)
CELERY = create_celery(APP)
APP.app_context().push()

from src.websocket.monitoring_tasks import (
    alert_generation_background_task,
    rainfall_summary_background_task
)
from src.websocket.communications_tasks import (
    initialize_comms_data,
    communication_background_task,
    ground_data_reminder_bg_task,
    no_ground_data_narrative_bg_task
)
from src.websocket.misc_ws import (
    monitoring_shift_background_task
)

ENABLE_ALERT_GEN = None
ENABLE_COMMS = None
ENABLE_RAINFALL = None
INITIALIZE_COMMS = None


@user_preload_options.connect
def on_preload_parsed(options, **kwargs):
    """
    """

    print(options)

    global ENABLE_ALERT_GEN
    global ENABLE_COMMS
    global ENABLE_RAINFALL
    global ENABLE_GROUND_DATA
    global INITIALIZE_COMMS

    ENABLE_ALERT_GEN = options["enable_alert_gen"]
    ENABLE_COMMS = options["enable_comms"]
    INITIALIZE_COMMS = options["initialize_comms"]
    ENABLE_RAINFALL = options["enable_rainfall"]
    ENABLE_GROUND_DATA = options["enable_ground_data"]


@worker_ready.connect
def at_start(sender, **k):
    """
    """

    app = sender.app
    with app.connection():
        if ENABLE_ALERT_GEN:
            app.send_task("alert_generation_background_task")

        if ENABLE_COMMS:
            app.send_task("communication_background_task", countdown=30)
        elif INITIALIZE_COMMS:
            app.send_task("initialize_comms_data")

        if ENABLE_RAINFALL:
            app.send_task("rainfall_summary_background_task", countdown=15)

        app.send_task("issues_and_reminder_bg_task")
        app.send_task("server_time_background_task")
        app.send_task("monitoring_shift_background_task")


@CELERY.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """
    """

    if ENABLE_ALERT_GEN:
        sender.add_periodic_task(
            crontab(minute="1-59/5"),
            alert_generation_background_task.s(),
            name="monitoring-background-task"
        )

    if ENABLE_RAINFALL:
        sender.add_periodic_task(
            crontab(minute="18,48"),
            rainfall_summary_background_task.s(),
            name="rainfall-summary-background-task"
        )

    if ENABLE_GROUND_DATA:
        sender.add_periodic_task(
            crontab(minute="30", hour="5,9,13"),
            ground_data_reminder_bg_task.s(),
            name="ground-data-reminder-bg-task"
        )
        sender.add_periodic_task(
            crontab(minute="59", hour="7,11,15"),
            no_ground_data_narrative_bg_task.s(),
            name="no-ground-data-narrative-bg-task"
        )

    sender.add_periodic_task(
        crontab(minute="30"),
        monitoring_shift_background_task.s(),
        name="monitoring-shift-background-task"
    )
