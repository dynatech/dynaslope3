"""
    Utility file for knowledge management tables.
"""
from datetime import datetime
from connection import DB
from src.models.repository import (
    KnowledgeFiles,
    KnowledgeFolder,
    KnowledgeFilesSchema,
    KnowledgeFolderSchema
)

def get_folders():
    """
    query all folders
    """
    folders_list = KnowledgeFolder.query.order_by(DB.asc(KnowledgeFolder.folder_name)).all()

    return folders_list
