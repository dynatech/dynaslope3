"""
API/Controller file for moms
"""

from flask import Blueprint, jsonify, request
from connection import DB
from sqlalchemy import func
from sqlalchemy.orm import raiseload
from src.models.sites import Sites, SitesSchema
from src.models.monitoring import (
    MonitoringMoms, MomsInstances, MomsFeatures,
    MonitoringMomsSchema, MomsInstancesSchema,
    MomsFeaturesSchema
)
from src.utils.sites import get_sites_data
from src.utils.monitoring import write_monitoring_moms_to_db
from src.utils.extra import var_checker
from src.utils.manifestations_of_movements import get_moms_report

MOMS_BLUEPRINT = Blueprint("moms_blueprint", __name__)


@MOMS_BLUEPRINT.route("/manifestations_of_movement/write_monitoring_moms_to_db", methods=["POST"])
def wrap_write_monitoring_moms_to_db(internal_json=None):
    """
    Handles moms. Make sure you pass lists to this function
    """
    try:
        if internal_json:
            json_data = internal_json
        else:
            json_data = request.get_json()

        var_checker("json_data", json_data, True)
        site_code = json_data["site_code"]
        site_id = DB.session.query(Sites).options(
            raiseload("*")).filter_by(site_code=site_code).first().site_id
        var_checker("site_id", site_id, True)
        moms_list = json_data["moms_list"]

        for moms_obs in moms_list:
            write_monitoring_moms_to_db(moms_details=moms_obs, site_id=site_id)

        DB.session.commit()
    except Exception as err:
        print(err)
        DB.session.rollback()
        return jsonify({"status": False, "message": "failed"})

    return jsonify({"status": True, "message": "success"})


@MOMS_BLUEPRINT.route("/manifestations_of_movement/get_latest_alerts", methods=["GET"])
def get_latest_alerts():
    mm = MonitoringMoms
    mi = MomsInstances

    subquery = DB.session.query(DB.func.max(mi.site_id).label("site_id"), mi.instance_id, DB.func.max(
        mm.observance_ts).label("max_ts")).join(mm).group_by(mi.instance_id).subquery("t2")

    max_alerts = DB.session.query(DB.func.max(mm.op_trigger), subquery.c.site_id).join(mi).join(subquery, DB.and_(
        mm.observance_ts == subquery.c.max_ts, mi.instance_id == subquery.c.instance_id)).group_by(subquery.c.site_id).all()

    sites = get_sites_data(raise_load=True)
    sites_data = SitesSchema(many=True).dump(sites)

    for site in sites_data:
        site_id = site["site_id"]
        alert = next((x[0] for x in max_alerts if x[1] == site_id), 0)
        site["moms_alert"] = alert

    sites_data.sort(key=lambda x: x["moms_alert"], reverse=True)

    return jsonify(sites_data)


@MOMS_BLUEPRINT.route("/manifestations_of_movement/get_moms_instances/<site_code>", methods=["GET"])
def get_moms_instances(site_code):
    mi = MomsInstances
    query = mi.query.join(Sites).filter(Sites.site_code == site_code).all()
    result = MomsInstancesSchema(many=True).dump(query) #NOTE EXCLUDE:  exclude=("moms.moms_releases", )

    return jsonify(result)


@MOMS_BLUEPRINT.route("/manifestations_of_movement/get_moms_features", methods=["GET"])
@MOMS_BLUEPRINT.route("/manifestations_of_movement/get_moms_features/<site_code>", methods=["GET"])
def get_moms_features(site_code=None):
    features = MomsFeatures.query.all()

    result = MomsFeaturesSchema(
        many=True, exclude=("instances.site", )).dump(features)

    if site_code:
        sites_data = get_sites_data(site_code=site_code)
        site_id = sites_data.site_id

        for feature in result:
            instances = feature["instances"]
            filtered = [d for d in instances if d["site_id"] == site_id]

            feature["instances"] = filtered

    return jsonify(result)

@MOMS_BLUEPRINT.route("/moms/get_test_data", methods=["GET"])
def get_test_lang():
    result = get_moms_report()

    return jsonify(result)
