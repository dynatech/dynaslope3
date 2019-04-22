from marshmallow import fields
from connection import DB, MARSHMALLOW


# class EwiTemplates(DB.Model):
#     """
#     Class representation of ewi_templates table
#     """
#     __tablename__ = "ewi_templates"
#     __bind_key__ = "ewi_db"
#     __table_args__ = {"schema": "ewi_db"}

#     template_id = DB.Column(DB.Integer, primary_key=True)
#     type = DB.Column(DB.String(45))
#     alert_type = DB.Column(DB.String(45))
#     template = DB.Column(DB.String(255))
#     modified_log = DB.Column(DB.String(45))

#     def __repr__(self):
#         return f"Class Representation"


# class EwiTemplatesSchema(MARSHMALLOW.ModelSchema):
#     """
#     Schema representation of EwiTemplates class
#     """

#     class Meta:
#         """Saves table class structure as schema model"""
#         model = EwiTemplates
