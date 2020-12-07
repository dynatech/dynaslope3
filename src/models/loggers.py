import datetime
from marshmallow import fields
from sqlalchemy.dialects.mysql import DECIMAL, TEXT
from instance.config import SCHEMA_DICT
from connection import DB, MARSHMALLOW

################################
# Start of Class Declarations #
################################
class Loggers(DB.Model):
    """
    Class representation of loggers table
    """

    __tablename__ = "loggers"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    logger_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.sites.site_id"), nullable=False)
    logger_name = DB.Column(DB.String(7))
    date_activated = DB.Column(DB.Date)
    date_deactivated = DB.Column(DB.Date)
    latitude = DB.Column(DB.Float)
    longitude = DB.Column(DB.Float)
    model_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.logger_models.model_id"), nullable=False)

    site = DB.relationship("Sites", backref=DB.backref(
        "loggers", lazy="dynamic"))

    logger_model = DB.relationship("LoggerModels", backref=DB.backref(
        "loggers", lazy="dynamic"))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Logger ID: {self.logger_id}"
                f" Site_ID: {self.site_id} Logger Name: {self.logger_name}"
                f" Date Activated: {self.date_activated} Model ID: {self.model_id}")


class LoggerModels(DB.Model):
    """
    Class representation of logger_models table
    """

    __tablename__ = "logger_models"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    model_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    has_tilt = DB.Column(DB.Integer)
    has_rain = DB.Column(DB.Integer)
    has_piezo = DB.Column(DB.Integer)
    has_soms = DB.Column(DB.Integer)
    logger_type = DB.Column(DB.String(10))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> TSM ID: {self.tsm_id}"
                f" TSM Name: {self.tsm_name} Number of Segments: {self.number_of_segments}"
                f"Date Activated: {self.date_activated}")

    
class DeploymentLogs(DB.Model):
    """
    Class representation of deployment_logs
    """

    __tablename__ = "deployment_logs"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    dep_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    logger_id = DB.Column(DB.Integer)
    installation_date = DB.Column(DB.DateTime)
    location_description = DB.Column(TEXT)
    network_type = DB.Column(DB.String(7))
    personnel = DB.Column(DB.String(100))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> dep_id: {self.dep_id}"
                f" logger_id: {self.logger_id} installation_date: {self.installation_date}"
                f" location_description: {self.location_description} personnel: {self.personnel}")


class DeployedNode(DB.Model):
    """
    Class representation of deployed_node
    """

    __tablename__ = "deployed_node"
    __bind_key__ = "senslopedb"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    dep_node_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    dep_id = DB.Column(DB.Integer)
    tsm_id = DB.Column(DB.Integer)
    node_id = DB.Column(DB.Integer)
    n_id = DB.Column(DB.Integer)
    version = DB.Column(DB.Integer)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> dep_node_id: {self.dep_node_id}"
                f" dep_id: {self.dep_id} tsm_id: {self.tsm_id}"
                f" node_id: {self.node_id} n_id: {self.n_id}"
                f" version: {self.version}")


class LoggerMobile(DB.Model):
    """
    Class representation of logger_mobile
    """

    __tablename__ = "logger_mobile"
    __bind_key__ = "comms_db_3"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    mobile_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    logger_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.loggers.logger_id"), nullable=False)
    date_activated = DB.Column(DB.Date)
    sim_num = DB.Column(DB.String(12))
    gsm_id = DB.Column(DB.Integer)

    logger = DB.relationship(
        "Loggers", backref=DB.backref(
            "logger_mobile", lazy="joined",
            innerjoin=True, uselist=False
        ),
        lazy="joined", innerjoin=True, uselist=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> mobile_id: {self.mobile_id}"
                f" logger_id: {self.logger_id} date_activated: {self.date_activated}"
                f" sim_num: {self.sim_num} gsm_id: {self.gsm_id}")
    

def get_rain_table(table_name, schema="senslopedb"):
    """
    """

    class GenericRainTable(DB.Model):

        """
        """

        __tablename__ = table_name
        __bind_key__ = schema
        __table_args__ = {
            "schema": SCHEMA_DICT[__bind_key__], "extend_existing": True}

        data_id = DB.Column(DB.Integer, primary_key=True)
        ts = DB.Column(DB.DateTime, nullable=False)
        rain = DB.Column(DB.Float)
        temperature = DB.Column(DB.Float)
        humidity = DB.Column(DB.Float)
        battery1 = DB.Column(DB.Float)
        battery2 = DB.Column(DB.Float)
        csq = DB.Column(DB.Integer)

        def __repr__(self):
            return (f"Type <{self.__class__.__name__}> data_id: {self.data_id}"
                    f" ts: {self.ts}")

    model = GenericRainTable
    return model


def get_temperature_table(table_name):
    """
    """

    class GenericTemperatureTable(DB.Model):
        """
        """

        __tablename__ = table_name
        __bind_key__ = "senslopedb"
        __table_args__ = {
            "schema": SCHEMA_DICT[__bind_key__], "extend_existing": True}

        data_id = DB.Column(DB.Integer, primary_key=True)
        ts = DB.Column(DB.DateTime, nullable=False)
        node_id = DB.Column(DB.Integer)
        type_num = DB.Column(DB.Integer)
        temp_val = DB.Column(DB.Integer)

        def __repr__(self):
            return (f"Type <{self.__class__.__name__}> data_id: {self.data_id}"
                    f" ts: {self.ts}")

    model = GenericTemperatureTable

    return model


def get_piezo_table(table_name):
    """
    """

    class GenericPiezoTable(DB.Model):
        """
        """

        __tablename__ = table_name
        __bind_key__ = "senslopedb"
        __table_args__ = {
            "schema": SCHEMA_DICT[__bind_key__], "extend_existing": True}

        data_id = DB.Column(DB.Integer, primary_key=True)
        ts = DB.Column(DB.DateTime, nullable=False)
        frequency_shift = DB.Column(
            DECIMAL(precision=6, scale=2, asdecimal=True))
        temperature = DB.Column(DB.Float)

        def __repr__(self):
            return (f"Type <{self.__class__.__name__}> data_id: {self.data_id}"
                    f" ts: {self.ts}")

    model = GenericPiezoTable

    return model


def get_soms_table(table_name):
    """
    """

    class GenericSomsTable(DB.Model):
        """
        """

        __tablename__ = table_name
        __bind_key__ = "senslopedb"
        __table_args__ = {
            "schema": SCHEMA_DICT[__bind_key__], "extend_existing": True}

        data_id = DB.Column(DB.Integer, primary_key=True)
        ts = DB.Column(DB.DateTime, nullable=False)
        node_id = DB.Column(DB.Integer)
        type_num = DB.Column(DB.Integer)
        mval1 = DB.Column(DB.Integer)
        mval2 = DB.Column(DB.Integer)

        def __repr__(self):
            return (f"Type <{self.__class__.__name__}> data_id: {self.data_id}"
                    f" ts: {self.ts}")

    model = GenericSomsTable

    return model

#############################
# End of Class Declarations #
#############################


################################
# Start of Schema Declarations #
################################
class LoggersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Loggers class
    """

    model_id = fields.Integer()
    tsm_sensor = fields.Nested("TSMSensorsSchema", exclude=("logger", ))
    logger_mobile = fields.Nested("LoggerMobileSchema", exclude=("logger", ))
    logger_model = fields.Nested("LoggerModelsSchema", exclude=("loggers", ))

    class Meta:
        """Saves table class structure as schema model"""
        model = Loggers
        exclude = ["data_presence"]


class LoggerModelsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of LoggerModels class
    """
    loggers = fields.Nested(LoggersSchema, exclude=("logger_model", ))

    class Meta:
        """Saves table class structure as schema model"""
        model = LoggerModels


class DeploymentLogsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of DeploymentLogs class
    """
    dep_id = fields.Integer()
    logger_id = fields.Integer()
    installation_date = fields.DateTime("%Y-%m-%d %H:%M:%S")

    class Meta:
        """Saves table class structure as schema model"""
        model = DeploymentLogs


class DeployedNodeSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of DeployedNode class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = DeployedNode


class LoggerMobileSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of LoggerMobile class
    """
    logger = fields.Nested(
        LoggersSchema, exclude=("data_presence", "tsm_sensor", "logger_model"))

    class Meta:
        """Saves table class structure as schema model"""
        model = LoggerMobile

