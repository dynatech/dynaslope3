"""
Narratives functions API File
"""

import json
from datetime import datetime
from flask import Blueprint, jsonify, request
from connection import DB
from src.utils.knowledge_management import (
    get_folders
)
from src.models.repository import (
    KnowledgeFolderSchema, KnowledgeFilesSchema
)
KNOWLEDGE_MANAGEMENT_BLUEPRINT = Blueprint(
    "knowledge_management", __name__)


# Function used in monitoring_ws



@KNOWLEDGE_MANAGEMENT_BLUEPRINT.route("/knowledge/get_folders", methods=["GET"])
def wrap_get_folders():
    """
    list of folders
    """
    folders_list = get_folders()
    data = KnowledgeFolderSchema(many=True).dump(folders_list).data

    # return data
    return json.dumps(data)
