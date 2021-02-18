"""
"""

from datetime import datetime
from marshmallow import fields, EXCLUDE
from instance.config import SCHEMA_DICT
from connection import DB, MARSHMALLOW


class GsmServers(DB.Model):
    """
    """

    __tablename__ = "gsm_servers"
    __bind_key__ = "comms_db_3"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    gsm_server_id = DB.Column(DB.Integer, primary_key=True)
    name = DB.Column(DB.String(45))
    platform_type = DB.Column(DB.String(45))
    version = DB.Column(DB.Integer, nullable=True)

    def __repr__(self):
        return f"{self.name}\n"


class NetworkCarriers(DB.Model):
    """
    Class representation of network_carrier table
    """
    __tablename__ = "network_carriers"
    __bind_key__ = "comms_db_3"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    network_id = DB.Column(DB.Integer, primary_key=True)
    carrier = DB.Column(DB.String(45))

    def __repr__(self):
        return f"Class Representation"


class GsmModules(DB.Model):
    """
    """

    __tablename__ = "gsm_modules"
    __bind_key__ = "comms_db_3"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    gsm_id = DB.Column(DB.Integer, primary_key=True)
    gsm_server_id = DB.Column(
        DB.Integer, DB.ForeignKey(f"{SCHEMA_DICT['comms_db_3']}.gsm_servers.gsm_server_id"))
    gsm_name = DB.Column(DB.String(10))
    gsm_sim_num = DB.Column(DB.String(12))
    network_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['comms_db_3']}.network_carriers.network_id"))
    ser_port = DB.Column(DB.String(20))
    pwr_on_pin = DB.Column(DB.Integer, nullable=True)
    ring_pin = DB.Column(DB.Integer, nullable=True)
    module_type = DB.Column(DB.Integer, nullable=True)

    gsm_server = DB.relationship(
        "GsmServers", backref=DB.backref("gsm_modules", lazy="subquery"), lazy="raise")
    network = DB.relationship(
        "NetworkCarriers", backref=DB.backref("gsm_modules", lazy="subquery"), lazy="select")

    def __repr__(self):
        return f"{self.gsm_name}\n"


class GsmCsqLogs(DB.Model):
    """
    """

    __tablename__ = "gsm_csq_logs"
    __bind_key__ = "comms_db_3"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    log_id = DB.Column(DB.Integer, primary_key=True)
    gsm_id = DB.Column(
        DB.Integer, DB.ForeignKey(f"{SCHEMA_DICT['comms_db_3']}.gsm_modules.gsm_id"))
    ts = DB.Column(DB.DateTime, default=datetime.now())
    csq_val = DB.Column(DB.Integer, nullable=True)

    def __repr__(self):
        return f"{self.ts}\n"


class SimPrefixes(DB.Model):
    """
    Class representation of sim_prefix table
    """

    __tablename__ = "sim_prefixes"
    __bind_key__ = "comms_db_3"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    prefix_id = DB.Column(DB.Integer, primary_key=True)
    prefix = DB.Column(DB.String(4))
    network_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['comms_db_3']}.network_carrier.network_id"))
    gsm_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['comms_db_3']}.gsm_modules.gsm_id"))

    # network = DB.relationship(
    #     "NetworkCarriers", backref=DB.backref("sim_prefixes", lazy="subquery"), lazy="joined", innerjoin=True)
    # gsm_module = DB.relationship(
    #     "GsmModules", backref=DB.backref("sim_prefixes", lazy="raise"), lazy="joined")

    def __repr__(self):
        return f"Class Representation"


class GsmServersSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of GsmServers class
    """

    sim_prefixes = MARSHMALLOW.Nested(
        "SimPrefixesSchema", many=True, exclude=["gsm_server"])

    class Meta:
        model = GsmServers
        exclude = ["sim_prefixes"]


class GsmModulesSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of GsmModules class
    """

    gsm_server_id = fields.Integer()
    network_id = fields.Integer()
    gsm_server = MARSHMALLOW.Nested(GsmServersSchema, exclude=["gsm_modules"])
    network = MARSHMALLOW.Nested(
        "NetworkCarrierSchema", exclude=["gsm_modules"])
    # sim_prefixes = MARSHMALLOW.Nested(
    #     "SimPrefixesSchema", many=True, exclude=["gsm_module"])

    class Meta:
        model = GsmModules
        unknown = EXCLUDE
        exlude = ["gsm_server"]


class GsmCsqLogsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    class Meta:
        model = GsmCsqLogs


class NetworkCarriersSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of NetworkCarriers class
    """

    sim_prefixes = MARSHMALLOW.Nested(
        "SimPrefixesSchema", many=True, exclude=["network"])
    gsm_modules = MARSHMALLOW.Nested(
        GsmModulesSchema, many=True, exclude=["network"])

    class Meta:
        model = NetworkCarriers


class SimPrefixesSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of SimPrefixes class
    """

    network_id = fields.Integer()
    gsm_id = fields.Integer()
    network = MARSHMALLOW.Nested(
        NetworkCarriersSchema, exclude=["sim_prefixes"])
    # gsm_module = MARSHMALLOW.Nested(GsmModulesSchema, exclude=["sim_prefixes"])

    class Meta:
        """Saves table class structure as schema model"""
        model = SimPrefixes
        unknown = EXCLUDE
        # exclude = ["gsm_server"]
