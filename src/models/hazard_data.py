from marshmallow import fields
from connection import DB, MARSHMALLOW


class HazardData(DB.Model):
    """
    Class representation of hazard_data table
    """
    __tablename__ = "hazard_data"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    hazard_data_id = DB.Column(DB.Integer, primary_key=True)
    hazard = DB.Column(DB.String(45))
    speed_of_onset = DB.Column(DB.String(45))
    early_warning = DB.Column(DB.String(100))
    impact = DB.Column(DB.String(100))

    def __repr__(self):
        return f"Class Representation"


class HazardDataSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of HazardData class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = HazardData
