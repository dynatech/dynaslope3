"""
"""

from instance.config import SCHEMA_DICT
from connection import DB, MARSHMALLOW


class ManifestationsOfMovements(DB.Model):
    """
    Class representation of manifestations_of_movements table
    """
    __tablename__ = "manifestations_of_movements"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    moms_id = DB.Column(DB.Integer, primary_key=True)
    type_of_feature = DB.Column(DB.String(45))
    description = DB.Column(DB.String(455))
    name_of_feature = DB.Column(DB.String(255))
    date = DB.Column(DB.String(45))

    def __repr__(self):
        return f"Class Representation"


class ManifestationsOfMovementsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of ManifestationsOfMovements class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = ManifestationsOfMovements
