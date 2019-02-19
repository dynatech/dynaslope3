from connection import DB, MARSHMALLOW

class UserTeamMembers(DB.Model):
    __tablename__ = "user_team_members"

    __bind_key__ = "comms_db"

    members_id = DB.Column(DB.Integer, primary_key=True)
    users_users_id = DB.Column(DB.Integer, nullable=False)
    dewsl_teams_team_id = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return (f"Member ID : {self.members_id} | User ID : {self.users_users_id}| Dewsl Team ID : {self.dewsl_teams_team_id} \n")

class UserTeamMembersSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = UserTeamMembers
