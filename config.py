
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
    SQLALCHEMY_ECHO = True
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
    << << << < HEAD
    # "generated_alerts_path": "D:/Users/swat-dynaslope/Documents/DYNASLOPE-3.0/",
    "generated_alerts_path": "Documents/monitoringoutput/"
    == == == =
    # "generated_alerts_path": "D:/Users/swat-dynaslope/Documents/DYNASLOPE-3.0/",
    "generated_alerts_path": "/var/www/dynaslope3/outputs/"
    >> >>>> > ee51f4f2ea7c2a01385c7a041ed7ac561bc3186b
}
