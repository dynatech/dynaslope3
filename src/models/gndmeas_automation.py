from connection import DB, MARSHMALLOW

class GndmeasAutomation(DB.Model):
    __tablename__ = "gndmeas_automation"

    __bind_key__ = "comms_db"

    automation_id = DB.Column(DB.Integer, primary_key=True)
    type = DB.Column(DB.String(45))
    msg = DB.Column(DB.String(1000))
    office_recipients = DB.Column(DB.String(45))
    site = DB.Column(DB.String(4))
    altered_template = DB.Column(DB.String(45))
    timestamp = DB.Column(DB.String(45))
    status = DB.Column(DB.String(4))
    modified = DB.Column(DB.String(45))
 
    def __repr__(self):
        return f"{self.msg}\n"

class GndmeasAutomationSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = GndmeasAutomation
