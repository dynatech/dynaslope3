from connection import DB, MARSHMALLOW

class EwiTemplate(DB.Model):
    __tablename__ = "ewi_template"

    __bind_key__ = "comms_db"

    id = DB.Column(DB.Integer, primary_key=True)
    alert_symbol_level = DB.Column(DB.String(45))
    key_input = DB.Column(DB.String(800))
    last_update_by = DB.Column(DB.String(45))
    alert_status = DB.Column(DB.String(45))
 
    def __repr__(self):
        return f"{self.key_input}\n"

class EwiTemplateSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = EwiTemplate
