from marshmallow import fields
from connection import DB, MARSHMALLOW


class FieldSurveyLog(DB.Model):
    """
    Class representation of field_survey_logs table
    """
    __tablename__ = "field_survey_logs"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    field_survey_id = DB.Column(DB.Integer, primary_key=True)
    features = DB.Column(DB.String(1000))
    mat_characterization = DB.Column(DB.String(255))
    mechanism = DB.Column(DB.String(255))
    exposure = DB.Column(DB.String(255))
    note = DB.Column(DB.String(255))
    date = DB.Column(DB.String(45))

    def __repr__(self):
        return f"Class Representation"


class FieldSurveyLogSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of FieldSurveyLog class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = FieldSurveyLog
