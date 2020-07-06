
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

    CELERY_BROKER_URL = 'redis://localhost:6379',
    CELERY_RESULT_BACKEND = 'redis://localhost:6379'
    CELERY_TIMEZONE = "Asia/Manila"
    # CELERY_ROUTES = {
    #     "long_task": {"queue": "q1"},
    #     "periodic_task": {"queue": "q2"}
    # }


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
APP_CONFIG = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "root_path": ROOT_PATH,
    "generated_alerts_path": f"{ROOT_PATH}/temp/alerts",
    "bulletin_save_path": f"{ROOT_PATH}/temp/bulletin",
    "charts_render_path": f"{ROOT_PATH}/temp/charts",
    "attachment_path": f"{ROOT_PATH}/temp/attachments",
    "logs_path": f"{ROOT_PATH}/logs",
    # "url": "http://192.168.150.167:3000",
    "url": "http://192.168.150.110",
    "is_live_mode": False,
    "smtp_server": "smtp.gmail.com",
    "port": 587
}
