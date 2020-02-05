
"""
Contains server run configurations
"""

import os


class Config(object):
    """
    Common configurations
    """

    # Put any config here
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 3600,
        "pool_size": 10
    }


class DevelopmentConfig(Config):
    """
    Development configurations
    """

    DEBUG = True
    SQLALCHEMY_ECHO = False


class ProductionConfig(Config):
    """
    Production configurations
    """

    DEBUG = False
    SQLALCHEMY_ECHO = False


def get_root_directory():
    """
    returns root directory
    """

    root_dir = os.path.dirname(os.path.abspath(__file__))
    return root_dir


ROOT_PATH = get_root_directory()
# NOTE: transfer all emails to database
APP_CONFIG = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "root_path": ROOT_PATH,
    "generated_alerts_path": f"{ROOT_PATH}/temp/alerts",
    "bulletin_save_path": f"{ROOT_PATH}/temp/bulletin",
    "charts_render_path": f"{ROOT_PATH}/temp/charts",
    # "url": "http://192.168.150.167:3000",
    "url": "http://192.168.150.110",
    "is_live_mode": True,
    "director_and_head_emails": ["rusolidum@phivolcs.dost.gov.ph", "asdaag48@gmail.com"],
    "dynaslope_groups": [
        "phivolcs-dynaslope@googlegroups.com",
        "phivolcs-senslope@googlegroups.com"
    ],
    "dev_email": "dynaslopeswat@gmail.com",
    "dev_password": "dynaslopeswat",
    "monitoring_email": "dewsl.monitoring2@gmail.com",
    "monitoring_password": "landslides1234",
    "smtp_server": "smtp.gmail.com",
    "port": 587
}
