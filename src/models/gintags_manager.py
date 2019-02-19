from connection import DB, MARSHMALLOW

class GintagsManager(DB.Model):
    __tablename__ = "gintags_manager"

    __bind_key__ = "comms_db"

    id = DB.Column(DB.Integer, primary_key=True)
    tag_id_fk = DB.Column(DB.Integer, nullable=False)
    description = DB.Column(DB.String(60))
    narrative_input = DB.Column(DB.String(100))
    last_update = DB.Column(DB.String(45))
 
    def __repr__(self):
        return f"{self.narrative_input}\n"

class GintagsManagerSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = GintagsManager
