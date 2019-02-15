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


class ProductionConfig(Config):
    """
    Production configurations
    """

    DEBUG = False


APP_CONFIG = {
    "development": DevelopmentConfig,
    "production": ProductionConfig
}
