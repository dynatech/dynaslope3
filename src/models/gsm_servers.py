import datetime
from connection import DB, MARSHMALLOW

class GsmServers(DB.Model):
    __tablename__ = "gsm_servers"

    __bind_key__ = "comms_db"

    gsm_server_id = DB.Column(DB.Integer, primary_key=True)
    name = DB.Column(DB.String(45))
    platform_type = DB.Column(DB.String(45))
    version = DB.Column(DB.Integer, nullable=True)
 
    def __repr__(self):
        return f"{self.name}\n"

class GsmServersSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = GsmServers
