from connection import DB, MARSHMALLOW

class GintagsReference(DB.Model):
    __tablename__ = "gintags_reference"

    __bind_key__ = "comms_db"

    tag_id = DB.Column(DB.Integer, primary_key=True)
    tag_name = DB.Column(DB.String(200))
    tag_description = DB.Column(DB.String(1000))
 
    def __repr__(self):
        return f"{self.tag_name}\n"

class GintagsReferenceSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = GintagsReference
