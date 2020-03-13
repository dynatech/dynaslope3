from marshmallow import fields
from connection import DB, MARSHMALLOW


class RiskAssessmentSummary(DB.Model):
    """
    Class representation of ewi_templates table
    """
    __tablename__ = "risk_assessment_summary"
    __bind_key__ = "mia_commons_db"
    __table_args__ = {"schema": "mia_commons_db"}

    summary_id = DB.Column(DB.Integer, primary_key=True)
    location = DB.Column(DB.String(150))
    impact = DB.Column(DB.String(45))
    adaptive_capacity = DB.Column(DB.String(45))
    vulnerability = DB.Column(DB.String(45))

    def __repr__(self):
        return f"Class Representation"


class RiskAssessmentSummarySchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of RiskAssessmentSummary class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = RiskAssessmentSummary
