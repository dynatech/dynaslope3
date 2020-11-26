"""
    Utility file for knowledge management tables.
"""
from datetime import datetime
from connection import DB
import uuid
from src.models.repository import (
    KnowledgeFiles,
    KnowledgeFolder,
    KnowledgeFilesSchema,
    KnowledgeFolderSchema,
)

def get_folders():
    """
    query all folders
    """
    folders_list = KnowledgeFolder.query.filter( \
        KnowledgeFolder.is_active == 1) \
        .order_by(DB.asc(KnowledgeFolder.folder_name)).all()

    return folders_list

def create_folder(folder_name, user_id):
    """
    create new folder
    """
    stmt = KnowledgeFolder(
        folder_id=uuid.uuid4().hex,
        folder_name=folder_name,
        modified_by=user_id
    )
    DB.session.add(stmt)
    DB.session.commit()
    return "Created"

def delete_folder(data):
    """
    create new folder
    """
    folder_id = data["folder_id"]
    user_id = data["user_id"]
    folder = KnowledgeFolder.query.filter(KnowledgeFolder.folder_id == folder_id).first()
    folder.modified_by = user_id
    folder.is_active = False
    DB.session.commit()
    return "Folder deleted"

def delete_file(data):
    """
    create new folder
    """
    file_id = data["file_id"]
    user_id = data["user_id"]
    file = KnowledgeFiles.query.filter(
        KnowledgeFiles.file_id == file_id).first()
    file.is_active = False
    file.modified_by = user_id
    DB.session.commit()
    return "File deleted"

def rename_folder(folder_name, user_id, folder_id):
    """
    create new folder
    """
    folder = KnowledgeFolder.query.filter(KnowledgeFolder.folder_id == folder_id).first()
    folder.folder_name = folder_name
    folder.modified_by = user_id
    DB.session.commit()
    return "Folder renamed"

def update_file(data):
    """
    create new folder
    """
    file_name = data["file_name"]
    file_id = data["file_id"]
    user_id = data["user_id"]

    file = KnowledgeFiles.query.filter( \
        KnowledgeFiles.file_id == file_id).first() 
    file.file_display_name = file_name
    file.modified_by = user_id

    DB.session.commit()
    return True

def save_file_(form, file_id, directory=None, file_type=None):
    """
    save data
    """
    dirc = ""
    file_name = form["file_name"]
    folder_id = form["folder_id"]
    link = form["link"]
    record_type = form["type"]
    user_id = form["user_id"]
    if directory is not None:
        dirc = directory+"/"

    if folder_id is not None:
        stmt = KnowledgeFiles(
            file_id=file_id,
            folder_id=folder_id,
            file_display_name=file_name,
            modified_by=user_id,
            record_type=record_type,
            link=link,
            dir=dirc,
            ext=file_type
        )
        DB.session.add(stmt)
        DB.session.commit()
    return True
