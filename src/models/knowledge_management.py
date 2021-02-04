"""
File containing class representation of
Knowledge Management tables
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
    parent_folder_id = DB.Column(DB.String)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Folder ID: {self.folder_id}"
                f" Folder Name: {self.folder_name} ts_created: {self.ts_created}"
                f" Parent Folder: {self.parent_folder_id}")


class KnowledgeFiles(DB.Model):
    """
    Class representation of knowledge_files table
    """

    __tablename__ = "knowledge_files"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    file_id = DB.Column(DB.String, primary_key=True, nullable=False)
    folder_id = DB.Column(DB.String)
    display_name = DB.Column(DB.String(100))
    ts_uploaded = DB.Column(DB.DateTime, default=datetime.now, nullable=False)
    entry_type = DB.Column(DB.String(20))
    location = DB.Column(DB.String(500))
    ext = DB.Column(DB.String(10))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> File ID: {self.file_id}"
                f" Display Name: {self.display_name} ts_uploaded: {self.ts_uploaded}"
                f" Entry Type: {self.entry_type}")


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

    class Meta:
        """Saves table class structure as schema model"""
        model = KnowledgeFolder
