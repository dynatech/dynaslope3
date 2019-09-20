
"""
Contains server run configurations
"""


class Config(object):
    """
    Common configurations
    """

    # Put any config here
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False


class DevelopmentConfig(Config):
    """
    Development configurations
    """

    DEBUG = True
    # SQLALCHEMY_ECHO = True
    SQLALCHEMY_ECHO = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class ProductionConfig(Config):
    """
    Production configurations
    """

    DEBUG = False
    SQLALCHEMY_ECHO = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False


APP_CONFIG = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "generated_alerts_path": "Documents/monitoringoutput/"
}
