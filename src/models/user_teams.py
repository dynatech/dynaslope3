from connection import DB, MARSHMALLOW

class UserTeams(DB.Model):
    __tablename__ = "user_teams"

    __bind_key__ = "comms_db"

    team_id = DB.Column(DB.Integer, primary_key=True)
    team_code = DB.Column(DB.String(20))
    team_name = DB.Column(DB.String(20))
    remarks = DB.Column(DB.String(45))

    def __repr__(self):
        return f"{self.team_code}"

class UserTeamsSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = UserTeams
