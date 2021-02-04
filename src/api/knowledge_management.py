"""
Narratives functions API File
"""

import json
import os
import uuid
from flask import Blueprint, request, send_file
from connection import APP_CONFIG
# from src.utils.knowledge_management import (
#     get_folders, save_file_, create_folder,
#     delete_file, delete_folder, rename_folder
# )
# from src.models.repository import (
#     KnowledgeFolderSchema, KnowledgeFilesSchema
# )

from src.utils.knowledge_management import get_folder_contents


KNOWLEDGE_MANAGEMENT_BLUEPRINT = Blueprint(
    "knowledge_management", __name__)
REPO_DIRECTORY = os.path.join(APP_CONFIG['knowledge_repository'])


@KNOWLEDGE_MANAGEMENT_BLUEPRINT.route("/knowledge_management/get_folder_contents/<folder_id>", methods=["GET"])
def wrap_get_folder(folder_id=None):
    """
    list of folders
    """

    if folder_id == "null":
        folder_id = None
    data = get_folder_contents(folder_id)
    return json.dumps(data)


# @KNOWLEDGE_MANAGEMENT_BLUEPRINT.route("/knowledge/save_file", methods=["POST"])
# def wrap_save_file():
#     """
#     save file
#     """

#     try:
#         files = request.files.getlist("attached_file")
#         json_data = request.form
#         file_id = uuid.uuid4().hex
#         if files:
#             for file in files:
#                 file_extension = os.path.splitext(file.filename)[1]
#                 file.save(os.path.join(REPO_DIRECTORY,
#                                        file_id + file_extension))
#                 save_file_(json_data, file_id, REPO_DIRECTORY, file_extension)
#         else:
#             save_file_(json_data, file_id)
#         return "Success"
#     except KeyError as err:
#         print(err)
#         return "Error uploading..."
#     except Exception as err:
#         raise err


# @KNOWLEDGE_MANAGEMENT_BLUEPRINT.route("/download")
# def download():
#     """
#     DOWNLOAD FILE
#     """

#     file_id = request.args.get("f")
#     ext = request.args.get("t")
#     filename = request.args.get("fdn")
#     file = file_id + ext

#     try:
#         return send_file(REPO_DIRECTORY + "/" + file,
#                          attachment_filename=filename + ext, as_attachment=True)
#     except FileNotFoundError:
#         return "Download error!"


# @KNOWLEDGE_MANAGEMENT_BLUEPRINT.route("/knowledge/create_folder", methods=["POST", "GET"])
# def create():
#     """
#     create
#     """

#     data = request.get_json()

#     new_folder_name = data["folder_name"]
#     user_id = data["user_id"]
#     create_folder(new_folder_name, user_id)
#     return "Completed!"


# @KNOWLEDGE_MANAGEMENT_BLUEPRINT.route("/knowledge/rename_folder", methods=["POST"])
# def rename():
#     """
#     create
#     """

#     data = request.get_json()

#     new_folder_name = data["folder_name"]
#     user_id = data["user_id"]
#     folder_id = data["folder_id"]
#     rename_folder(new_folder_name, user_id, folder_id)
#     return "Completed!"


# @KNOWLEDGE_MANAGEMENT_BLUEPRINT.route("/knowledge/delete_file", methods=["POST", "GET"])
# def delete():
#     """
#     create
#     """

#     data = request.get_json()
#     delete_file(data)
#     return "Completed!"


# @KNOWLEDGE_MANAGEMENT_BLUEPRINT.route("/knowledge/update_file", methods=["POST"])
# def update_files():
#     """
#     create
#     """

#     data = request.get_json()

#     result = delete_file(data)
#     if result:
#         return "Completed!"
#     return "Error"


# @KNOWLEDGE_MANAGEMENT_BLUEPRINT.route("/knowledge/delete_folder", methods=["POST"])
# def delete_folders():
#     """
#     create
#     """

#     data = request.get_json()
#     delete_folder(data)

#     return "Completed!"
