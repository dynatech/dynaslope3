from marshmallow import fields
from connection import DB, MARSHMALLOW


class SimPrefix(DB.Model):
    """
    Class representation of sim_prefix table
    """
    __tablename__ = "sim_prefix"
    __bind_key__ = "comms_db"
    __table_args__ = {"schema": "comms_db"}

    prefix_id = DB.Column(DB.Integer, primary_key=True)
    prefix = DB.Column(DB.String(200))
    network_id_fk = DB.Column(DB.Integer, nullable=False)
    gsm_server_id_fk = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return f"Class Representation"


class SimPrefixSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of SimPrefix class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = SimPrefix
