import datetime
from connection import DB, MARSHMALLOW


class GndmeasAutomation(DB.Model):
    """
    Class representation of gndmeas_automation table
    """
    __tablename__ = "gndmeas_automation"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    automation_id = DB.Column(DB.Integer, primary_key=True)
    type = DB.Column(DB.String(45))
    message = DB.Column(DB.String(200))
    recipient = DB.Column(DB.String(45))
    site_id = DB.Column(
        DB.Integer, DB.ForeignKey("sites.site_id"))
    altered_template = DB.Column(DB.Integer, nullable=False)
    ts_release = DB.Column(DB.DateTime, default=datetime.datetime.now)
    send_status = DB.Column(DB.Integer, nullable=False)
    modified = DB.Column(DB.Integer, nullable=False)
    automation_category_id = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return f"{self.msg}\n"


class GndmeasAutomationSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of GndmeasAutomation class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = GndmeasAutomation
