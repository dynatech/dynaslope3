from marshmallow import fields
from connection import DB, MARSHMALLOW


class SituationReport(DB.Model):
    """
    Class representation of field_survey_logs table
    """
    __tablename__ = "situation_report"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    situation_report_id = DB.Column(DB.Integer, primary_key=True)
    timestamp = DB.Column(DB.String(45))
    summary = DB.Column(DB.String(1000))
    pdf_path = DB.Column(DB.String(255))
    image_path = DB.Column(DB.String(255))

    def __repr__(self):
        return f"Class Representation"


class SituationReportSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of SituationReport class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = SituationReport
