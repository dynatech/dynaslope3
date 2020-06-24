"""
Main application file
Contains initialization lines for main project methods
"""

from threading import Thread, Lock
import datetime

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_login import LoginManager
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager
from celery import Celery
from connection import memory

from config import APP_CONFIG

DB = SQLAlchemy()
MARSHMALLOW = Marshmallow()
BCRYPT = Bcrypt()
JWT = JWTManager()
LOGIN_MANAGER = LoginManager()
SOCKETIO = SocketIO(async_mode="gevent")
# SOCKETIO = SocketIO(async_mode="threading")

MONITORING_WS_THREAD = None
COMMUNICATION_WS_THREAD = None
MISC_WS_THREAD = None
THREAD_LOCK = Lock()

MEMORY_CLIENT = memory
CELERY = None


def create_app(config_name, skip_memcache=False, enable_webdriver=False):
    """
    Instantiate Flask App variable and other related packages
    """

    app = Flask(__name__, instance_relative_config=True)

    try:
        app.config.from_object(APP_CONFIG[config_name])
    except:
        app.config.from_object(APP_CONFIG["development"])

    # Imports configuration of app instance from /instance/config.py
    app.config.from_pyfile("config.py")

    DB.app = app
    DB.init_app(app)
    MARSHMALLOW.init_app(app)

    LOGIN_MANAGER.init_app(app)
    LOGIN_MANAGER.login_message = "You must be logged in to access this page."

    # BCRYPT.init_app(app)
    JWT.init_app(app)
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(minutes=30)
    CORS(app)
    SOCKETIO.init_app(app, cors_allowed_origins="*",
                      message_queue=app.config["CELERY_BROKER_URL"][0])

    global CELERY
    CELERY = create_celery(app)
    CELERY.autodiscover_tasks(["src.websocket", "src.api"], force=True)

    if not skip_memcache:
        from connection import set_memcache
        set_memcache.main()

    from src.websocket.monitoring_tasks import (
        alert_generation_background_task, rainfall_summary_background_task,
        issues_and_reminder_bg_task
    )
    from src.websocket.communications_tasks import (
        initialize_comms_data, communication_background_task
    )
    from src.websocket.misc_ws import (
        server_time_background_task, monitoring_shift_background_task
    )

    from src.utils.bulletin import create_browser_driver_instance

    if enable_webdriver:
        create_browser_driver_instance()

    # from src.websocket.monitoring_ws import monitoring_background_task
    # from src.websocket.communications_ws import (
    #     main as comms_ws_main,
    #     communication_background_task
    # )
    # from src.websocket.misc_ws import server_time_background_task

    # if not skip_websocket:
    # start_ws_bg_task("monitoring", monitoring_background_task)
    # comms_ws_main()  # outside from skip_websocket for now
    # start_ws_bg_task("communication", communication_background_task)
    # start_ws_bg_task("misc", server_time_background_task)

    #####################################################
    # Import all created blueprint from each controller
    # and register it to the app instance
    #
    # Note: Will create a better, more automated imple-
    # mentation of this in the future
    #
    # Also register your blueprints with url_prefix="/api"
    #####################################################
    from src.api.sites import SITES_BLUEPRINT
    app.register_blueprint(SITES_BLUEPRINT, url_prefix="/api")

    from src.api.users import USERS_BLUEPRINT
    app.register_blueprint(USERS_BLUEPRINT, url_prefix="/api")

    from src.api.narratives import NARRATIVES_BLUEPRINT
    app.register_blueprint(NARRATIVES_BLUEPRINT, url_prefix="/api")

    from src.api.monitoring import MONITORING_BLUEPRINT
    app.register_blueprint(MONITORING_BLUEPRINT, url_prefix="/api")

    # Do we really need to make individual blueprint for each data category? Or should
    # we put this in a single "monitoring" api?
    from src.api.end_of_shift import END_OF_SHIFT_BLUEPRINT
    app.register_blueprint(END_OF_SHIFT_BLUEPRINT, url_prefix="/api")

    # Do we really need to make individual blueprint for each data category? Or should
    # we put this in a single "analysis" api?
    from src.api.subsurface import SUBSURFACE_BLUEPRINT
    app.register_blueprint(SUBSURFACE_BLUEPRINT, url_prefix="/api")

    # Do we really need to make individual blueprint for each data category? Or should
    # we put this in a single "analysis" api?
    from src.api.surficial import SURFICIAL_BLUEPRINT
    app.register_blueprint(SURFICIAL_BLUEPRINT, url_prefix="/api")

    from src.api.test_controller import TEST_BLUEPRINT
    app.register_blueprint(TEST_BLUEPRINT, url_prefix="/api")

    from src.api.utils import UTILITIES_BLUEPRINT
    app.register_blueprint(UTILITIES_BLUEPRINT, url_prefix="/api/utils")

    from src.api.sending import SENDING_BLUEPRINT
    app.register_blueprint(SENDING_BLUEPRINT, url_prefix="/api")

    from src.api.contacts import CONTACTS_BLUEPRINT
    app.register_blueprint(CONTACTS_BLUEPRINT, url_prefix="/api")

    from src.api.chatterbox import CHATTERBOX_BLUEPRINT
    app.register_blueprint(CHATTERBOX_BLUEPRINT, url_prefix="/api")

    from src.api.mailbox import MAILBOX_BLUEPRINT
    app.register_blueprint(MAILBOX_BLUEPRINT, url_prefix="/api")

    from src.api.bulletin_email import BULLETIN_EMAIL
    app.register_blueprint(BULLETIN_EMAIL, url_prefix="/api")

    from src.api.general_data_tag import GENERAL_DATA_TAG_BLUEPRINT
    app.register_blueprint(GENERAL_DATA_TAG_BLUEPRINT, url_prefix="/api")

    from src.api.routine import ROUTINE_BLUEPRINT
    app.register_blueprint(ROUTINE_BLUEPRINT, url_prefix="/api")

    from src.api.login import LOGIN_BLUEPRINT
    app.register_blueprint(LOGIN_BLUEPRINT, url_prefix="/api")

    # from src.api.register import REGISTER_BLUEPRINT
    # app.register_blueprint(REGISTER_BLUEPRINT, url_prefix="/api")

    # from src.api.family_profile import FAMILY_PROFILE_BLUEPRINT
    # app.register_blueprint(FAMILY_PROFILE_BLUEPRINT, url_prefix="/api")

    # from src.api.risk_assessment_summary import RISK_ASSESSMENT_BLUEPRINT
    # app.register_blueprint(RISK_ASSESSMENT_BLUEPRINT, url_prefix="/api")

    # from src.api.hazard_data import HAZARD_DATA_BLUEPRINT
    # app.register_blueprint(HAZARD_DATA_BLUEPRINT, url_prefix="/api")

    # from src.api.resources_and_capacities import RESOURCES_AND_CAPACITIES_BLUEPRINT
    # app.register_blueprint(
    #     RESOURCES_AND_CAPACITIES_BLUEPRINT, url_prefix="/api")

    # from src.api.field_survey_logs import FIELD_SURVEY_LOGS_BLUEPRINT
    # app.register_blueprint(
    #     FIELD_SURVEY_LOGS_BLUEPRINT, url_prefix="/api")

    # from src.api.sensor_maintenance import SENSOR_MAINTENANCE_BLUEPRINT
    # app.register_blueprint(
    #     SENSOR_MAINTENANCE_BLUEPRINT, url_prefix="/api")

    # from src.api.situation_report import SITUATION_REPORT_BLUEPRINT
    # app.register_blueprint(SITUATION_REPORT_BLUEPRINT, url_prefix="/api")

    from src.api.rainfall import RAINFALL_BLUEPRINT
    app.register_blueprint(RAINFALL_BLUEPRINT, url_prefix="/api")

    from src.api.analysis import ANALYSIS_BLUEPRINT
    app.register_blueprint(ANALYSIS_BLUEPRINT, url_prefix="/api")

    from src.api.manifestations_of_movement import MOMS_BLUEPRINT
    app.register_blueprint(MOMS_BLUEPRINT, url_prefix="/api")

    from src.api.issues_and_reminders import ISSUES_AND_REMINDERS_BLUEPRINT
    app.register_blueprint(ISSUES_AND_REMINDERS_BLUEPRINT, url_prefix="/api")

    from src.api.shift_checker import SHIFT_CHECKER_BLUEPRINT
    app.register_blueprint(SHIFT_CHECKER_BLUEPRINT, url_prefix="/api")

    return app


def create_celery(app):
    """
    """

    celery = Celery(
        app.import_name,
        backend=app.config['CELERY_RESULT_BACKEND'],
        broker=app.config['CELERY_BROKER_URL']
    )
    celery.conf.update(app.config)

    def add_preload_options(parser):
        parser.add_argument(
            '-eag', "--enable_alert_gen", action="store_true",
            help='Start alert generation background task',
        )
        parser.add_argument(
            '-ec', "--enable_comms", action="store_true",
            help='Start communications background task',
        )
        parser.add_argument(
            '-ic', "--initialize_comms", action="store_true",
            help=(f'Initialize comms data. Use this to load '
                  f'comms data without running communications backgound task.'),
        )
        parser.add_argument(
            '-er', "--enable_rainfall", action="store_true",
            help='Start rainfall summary background task',
        )
        parser.add_argument(
            '-egd', "--enable_ground_data", action="store_true",
            help='Start ground data reminder and no ground data sending background tasks',
        )
    celery.user_options['preload'].add(add_preload_options)

    class ContextTask(celery.Task):
        """
        """

        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery
