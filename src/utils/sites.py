"""
Utility file for Sites Table
Contains functions for getting and accesing Sites table only
"""

from src.models.sites import Sites


def get_site_data(site_code):
    """
    Function that gets all site data by site code
    """
    site = Sites.query.filter_by(site_code=site_code).first()
    return site
