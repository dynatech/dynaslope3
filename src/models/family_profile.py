from marshmallow import fields
from connection import DB, MARSHMALLOW


class FamilyProfile(DB.Model):
    """
    Class representation of ewi_templates table
    """
    __tablename__ = "family_profile"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    family_profile_id = DB.Column(DB.Integer, primary_key=True)
    members_count = DB.Column(DB.Integer, nullable=False)
    vulnerable_members_count = DB.Column(DB.Integer, nullable=False)
    vulnerability_nature = DB.Column(DB.String(255))

    def __repr__(self):
        return f"Class Representation"


class RiskProfile(DB.Model):
    """
    Class representation of ewi_templates table
    """
    __tablename__ = "risk_profile"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    risk_profile_id = DB.Column(DB.Integer, primary_key=True)
    entry = DB.Column(DB.String(1000))
    timestamp = DB.Column(DB.String(45))

    def __repr__(self):
        return f"Class Representation"


class FamilyProfileSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of FamilyProfile class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = FamilyProfile


class RiskProfileSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of RiskProfile class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = RiskProfile
