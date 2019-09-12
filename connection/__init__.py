"""
Main application file
Contains initialization lines for main project methods
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_login import LoginManager
from flask_cors import CORS
# from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager, create_access_token
from connection import memory

from threading import Thread, Lock

from config import APP_CONFIG

DB = SQLAlchemy()
MARSHMALLOW = Marshmallow()
# # BCRYPT = Bcrypt()
JWT = JWTManager()
LOGIN_MANAGER = LoginManager()
SOCKETIO = SocketIO()

MONITORING_WS_THREAD = None
THREAD_LOCK = Lock()

MEMORY_CLIENT = memory


def start_monitoring_ws_bg_task():
    """
    Start monitoring websocket background thread
    """
    from src.websocket.monitoring_ws import monitoring_background_task

    global MONITORING_WS_THREAD
    with THREAD_LOCK:
        if MONITORING_WS_THREAD is None:
            MONITORING_WS_THREAD = Thread(target=monitoring_background_task)
            MONITORING_WS_THREAD.setDaemon(True)
            MONITORING_WS_THREAD.start()


def create_app(config_name, skip_memcache=False, skip_websocket=False):
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
    CORS(app)
    SOCKETIO.init_app(app)

    if not skip_memcache:
        from connection import set_memcache
        set_memcache.main(MEMORY_CLIENT)

    if not skip_websocket:
        start_monitoring_ws_bg_task()

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

    from src.api.inbox_outbox import INBOX_OUTBOX_BLUEPRINT
    app.register_blueprint(INBOX_OUTBOX_BLUEPRINT, url_prefix="/api")

    from src.api.general_data_tag import GENERAL_DATA_TAG_BLUEPRINT
    app.register_blueprint(GENERAL_DATA_TAG_BLUEPRINT, url_prefix="/api")

    from src.api.routine import ROUTINE_BLUEPRINT
    app.register_blueprint(ROUTINE_BLUEPRINT, url_prefix="/api")

    from src.api.ewi_templates import EWI_TEMPLATE_BLUEPRINT
    app.register_blueprint(EWI_TEMPLATE_BLUEPRINT, url_prefix="/api")

    from src.api.login import LOGIN_BLUEPRINT
    app.register_blueprint(LOGIN_BLUEPRINT, url_prefix="/api")

    from src.api.register import REGISTER_BLUEPRINT
    app.register_blueprint(REGISTER_BLUEPRINT, url_prefix="/api")

    from src.api.family_profile import FAMILY_PROFILE_BLUEPRINT
    app.register_blueprint(FAMILY_PROFILE_BLUEPRINT, url_prefix="/api")

    from src.api.risk_assessment_summary import RISK_ASSESSMENT_BLUEPRINT
    app.register_blueprint(RISK_ASSESSMENT_BLUEPRINT, url_prefix="/api")

    from src.api.hazard_data import HAZARD_DATA_BLUEPRINT
    app.register_blueprint(HAZARD_DATA_BLUEPRINT, url_prefix="/api")

    from src.api.resources_and_capacities import RESOURCES_AND_CAPACITIES_BLUEPRINT
    app.register_blueprint(
        RESOURCES_AND_CAPACITIES_BLUEPRINT, url_prefix="/api")

    from src.api.field_survey_logs import FIELD_SURVEY_LOGS_BLUEPRINT
    app.register_blueprint(
        FIELD_SURVEY_LOGS_BLUEPRINT, url_prefix="/api")

    from src.api.sensor_maintenance import SENSOR_MAINTENANCE_BLUEPRINT
    app.register_blueprint(
        SENSOR_MAINTENANCE_BLUEPRINT, url_prefix="/api")

    from src.api.surficial_data import SURFICIAL_DATA_BLUEPRINT
    app.register_blueprint(SURFICIAL_DATA_BLUEPRINT, url_prefix="/api")

    from src.api.situation_report import SITUATION_REPORT_BLUEPRINT
    app.register_blueprint(SITUATION_REPORT_BLUEPRINT, url_prefix="/api")

    # from src.api.rainfall import RAINFALL_BLUEPRINT
    # app.register_blueprint(RAINFALL_BLUEPRINT, url_prefix="/api")

    from src.api.analysis import ANALYSIS_BLUEPRINT
    app.register_blueprint(ANALYSIS_BLUEPRINT, url_prefix="/api")

    from src.api.manifestations_of_movement import MOMS_BLUEPRINT
    app.register_blueprint(MOMS_BLUEPRINT, url_prefix="/api")

    return app
