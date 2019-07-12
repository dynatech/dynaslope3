
"""
Contains server run configurations
"""


class Config(object):
    """
    Common configurations
    """

    # Put any config here


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


APP_CONFIG = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    # "generated_alerts_path": "D:/Users/swat-dynaslope/Documents/DYNASLOPE-3.0/",
    "generated_alerts_path": "/var/www/dynaslope3/outputs/"
}
