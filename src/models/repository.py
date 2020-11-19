"""
File containing class representation of
Issues and Reminders tables
"""

from datetime import datetime
from marshmallow import fields
from instance.config import SCHEMA_DICT
from connection import DB, MARSHMALLOW


class KnowledgeFolder(DB.Model):
    """
    Class representation of knowledge_folder table
    """

    __tablename__ = "knowledge_folders"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    folder_id = DB.Column(DB.String, primary_key=True, nullable=False)
    folder_name = DB.Column(DB.String(50))
    ts_created = DB.Column(DB.DateTime, default=datetime.now, nullable=False)
    modified_by = DB.Column(DB.Integer)

    files = DB.relationship(
        "KnowledgeFiles",
        backref=DB.backref("folders", lazy="joined"),
        lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> FOLDER_ID: {self.folder_id}"
                f" Folder Name: {self.folder_name} ts_created: {self.ts_created}"
                f" modified_by: {self.modified_by}")


class KnowledgeFiles(DB.Model):
    """
    Class representation of knowledge_files table
    """

    __tablename__ = "knowledge_files"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    file_id = DB.Column(DB.String, primary_key=True, nullable=False)
    file_display_name = DB.Column(DB.String(100))
    folder_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.knowledge_folders.folder_id"), nullable=False)
    ts_uploaded = DB.Column(DB.DateTime, default=datetime.now, nullable=False)
    modified_by = DB.Column(DB.Integer)
    record_type = DB.Column(DB.String(20))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> FILE_ID: {self.file_id}"
                f" Display Name: {self.file_display_name} ts_uploaded: {self.ts_upload}"
                f" modified_by: {self.modified_by}")

class KnowledgeFilesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Common IssuesAndReminders class
    """
    ts_uploaded = fields.DateTime("%Y-%m-%d %H:%M:%S")

    class Meta:
        """Saves table class structure as schema model"""
        model = KnowledgeFiles

class KnowledgeFolderSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Common IssuesAndReminders class
    """

    ts_created = fields.DateTime("%Y-%m-%d %H:%M:%S")
    files = fields.Nested("KnowledgeFilesSchema", many=True)
    # ts_expiration = fields.DateTime("%Y-%m-%d %H:%M:%S")
    # user_id = fields.Integer()
    # issue_reporter = fields.Nested(
    #     "UsersSchema", exclude=("issue_and_reminder", ))
    # postings = fields.Nested(
    #     "IssuesRemindersSitePostingsSchema", many=True, exclude=("issue_and_reminder", ))

    class Meta:
        """Saves table class structure as schema model"""
        model = KnowledgeFolder