from connection import DB, MARSHMALLOW

class EwiBackboneTemplate(DB.Model):
    __tablename__ = "ewi_backbone_template"

    __bind_key__ = "comms_db"

    id = DB.Column(DB.Integer, primary_key=True)
    alert_status = DB.Column(DB.String(45))
    template = DB.Column(DB.String(800))
    last_modified_by = DB.Column(DB.String(45))
 
    def __repr__(self):
        return f"{self.__class__.__name__}"

class EwiBackboneTemplateSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = EwiBackboneTemplate
