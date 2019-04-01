from connection import DB
from src.models.general_data_tag import GeneralDataTagManager


def get_all_tag(tag_id=None):
    if tag_id is None:
        general_data_tag = GeneralDataTagManager.query.all()
    else:
        general_data_tag = GeneralDataTagManager.query.filter_by(
            id=tag_id).first()

    return general_data_tag
