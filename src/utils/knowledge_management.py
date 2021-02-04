"""
Utility file for Knowledge Management tables.
"""

import uuid
from connection import DB
from datetime import datetime
from src.models.knowledge_management import (
    KnowledgeFiles,
    KnowledgeFolder
)


# def get_folder_contents(parent_folder_id):
#     """
#     Get folder contents
#     """

#     p_folder_id = "base"
#     base_folder = {
#         "id": "base",
#         "name": "Knowledge Management",
#         "isDir": True,
#         "childrenIds": []
#     }

#     if parent_folder_id:
#         folder = KnowledgeFolder.query.filter_by(
#             folder_id=parent_folder_id).first()
#         base_folder.update(
#             {"id": folder.folder_id, "name": folder.folder_name})
#         p_folder_id = parent_folder_id

#     folder_list = KnowledgeFolder.query.filter_by(
#         parent_folder_id=parent_folder_id).all()

#     file_list = KnowledgeFiles.query.filter_by(
#         folder_id=parent_folder_id).all()

#     entry_list = {}
#     entry_list[p_folder_id] = base_folder

#     for folder in folder_list:
#         temp_id = folder.folder_id
#         temp = {
#             "id": temp_id,
#             "name": folder.folder_name,
#             "isDir": True,
#             "modDate": datetime.strftime(folder.ts_created, "%Y-%m-%d %H:%M:%S"),
#             "parentID": p_folder_id
#         }

#         entry_list[p_folder_id]["childrenIds"].append(temp_id)
#         entry_list[temp_id] = temp

#     for file in file_list:
#         temp_id = file.file_id
#         temp = {
#             "id": temp_id,
#             "name": file.display_name,
#             "modDate": datetime.strftime(file.ts_uploaded, "%Y-%m-%d %H:%M:%S"),
#             "parentId": p_folder_id,
#             "location": file.location
#         }

#         if file.entry_type == "file":
#             temp["ext"] = file.ext
#         else:
#             temp["isSymLink"] = True

#         entry_list[p_folder_id]["childrenIds"].append(temp_id)
#         entry_list[temp_id] = temp

#     return entry_list

def get_folder_contents(parent_folder_id):
    """
    Get folder contents
    """

    p_folder_id = "base"
    base_folder = {
        "id": "base",
        "name": "Knowledge Management",
        "isDir": True,
        "childrenIds": []
    }

    if parent_folder_id:
        folder = KnowledgeFolder.query.filter_by(
            folder_id=parent_folder_id).first()
        base_folder.update(
            {"id": folder.folder_id, "name": folder.folder_name})
        p_folder_id = parent_folder_id

    folder_list = KnowledgeFolder.query.filter_by(
        parent_folder_id=parent_folder_id).all()
    file_list = KnowledgeFiles.query.filter_by(
        folder_id=parent_folder_id).all()

    entry_list = {}
    entry_list[p_folder_id] = base_folder

    for folder in folder_list:
        temp_id = folder.folder_id

        temp = {
            "id": temp_id,
            "name": folder.folder_name,
            "isDir": True,
            "modDate": datetime.strftime(folder.ts_created, "%Y-%m-%d %H:%M:%S"),
            "parentId": p_folder_id
        }

        children = get_folder_contents(temp_id)
        del children[temp_id]
        if children:
            children_ids = list(children.keys())
            entry_list.update(children)
        else:
            children_ids = []

        temp["childrenIds"] = children_ids

        entry_list[p_folder_id]["childrenIds"].append(temp_id)
        entry_list[temp_id] = temp

    for file in file_list:
        temp_id = file.file_id
        temp = {
            "id": temp_id,
            "name": file.display_name,
            "modDate": datetime.strftime(file.ts_uploaded, "%Y-%m-%d %H:%M:%S"),
            "parentId": p_folder_id,
            "location": file.location
        }

        if file.entry_type == "file":
            temp["ext"] = file.ext
        else:
            temp["isSymlink"] = True

        entry_list[p_folder_id]["childrenIds"].append(temp_id)
        entry_list[temp_id] = temp

    return entry_list


def process_files(file_list):
    """
    """

    children_ids = []
    for file in file_list:
        temp_id = file.file_id
        temp = {
            "id": temp_id,
            "name": file.display_name,
            "modDate": datetime.strftime(file.ts_uploaded, "%Y-%m-%d %H:%M:%S"),
            "parentId": p_folder_id,
            "location": file.location
        }

        if file.entry_type == "file":
            temp["ext"] = file.ext
        else:
            temp["isSymLink"] = True

        children_ids.append(temp_id)

    return children_ids

# def get_folders():
#     """
#     Query all folders
#     """

#     folders_list = KnowledgeFolder.query.filter(
#         KnowledgeFolder.is_active == 1) \
#         .order_by(DB.asc(KnowledgeFolder.folder_name)).all()

#     return folders_list


# def create_folder(folder_name, user_id):
#     """
#     create new folder
#     """

#     stmt = KnowledgeFolder(
#         folder_id=uuid.uuid4().hex,
#         folder_name=folder_name,
#         modified_by=user_id
#     )
#     DB.session.add(stmt)
#     DB.session.commit()

#     return "Created"


# def delete_folder(data):
#     """
#     create new folder
#     """

#     folder_id = data["folder_id"]
#     user_id = data["user_id"]
#     folder = KnowledgeFolder.query.filter(
#         KnowledgeFolder.folder_id == folder_id).first()
#     folder.modified_by = user_id
#     folder.is_active = False
#     DB.session.commit()

#     return "Folder deleted"


# def delete_file(data):
#     """
#     create new folder
#     """

#     file_id = data["file_id"]
#     user_id = data["user_id"]
#     file = KnowledgeFiles.query.filter(
#         KnowledgeFiles.file_id == file_id).first()
#     file.is_active = False
#     file.modified_by = user_id
#     DB.session.commit()

#     return "File deleted"


# def rename_folder(folder_name, user_id, folder_id):
#     """
#     create new folder
#     """

#     folder = KnowledgeFolder.query.filter(
#         KnowledgeFolder.folder_id == folder_id).first()
#     folder.folder_name = folder_name
#     folder.modified_by = user_id
#     DB.session.commit()

#     return "Folder renamed"


# def update_file(data):
#     """
#     create new folder
#     """

#     file_name = data["file_name"]
#     file_id = data["file_id"]
#     user_id = data["user_id"]

#     file = KnowledgeFiles.query.filter(
#         KnowledgeFiles.file_id == file_id).first()
#     file.file_display_name = file_name
#     file.modified_by = user_id

#     DB.session.commit()
#     return True


# def save_file_(form, file_id, directory=None, file_type=None):
#     """
#     save data
#     """

#     dirc = ""
#     file_name = form["file_name"]
#     folder_id = form["folder_id"]
#     link = form["link"]
#     record_type = form["type"]
#     user_id = form["user_id"]
#     if directory is not None:
#         dirc = directory + "/"

#     if folder_id is not None:
#         stmt = KnowledgeFiles(
#             file_id=file_id,
#             folder_id=folder_id,
#             file_display_name=file_name,
#             modified_by=user_id,
#             record_type=record_type,
#             link=link,
#             dir=dirc,
#             ext=file_type
#         )
#         DB.session.add(stmt)
#         DB.session.commit()

#     return True
