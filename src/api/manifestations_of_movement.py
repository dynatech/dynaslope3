from flask import Blueprint, jsonify
from connection import DB
from sqlalchemy import func
from src.models.sites import Sites, SitesSchema
from src.models.monitoring import (
    MonitoringMoms, MomsInstances, MomsFeatures,
    MonitoringMomsSchema, MomsInstancesSchema,
    MomsFeaturesSchema
)

from src.utils.sites import get_sites_data

MOMS_BLUEPRINT = Blueprint("moms_blueprint", __name__)


@MOMS_BLUEPRINT.route("/manifestations_of_movement/get_latest_alerts", methods=["GET"])
def get_latest_alerts():
    mm = MonitoringMoms
    mi = MomsInstances

    subquery = DB.session.query(DB.func.max(mi.site_id).label("site_id"), mi.instance_id, DB.func.max(
        mm.observance_ts).label("max_ts")).join(mm).group_by(mi.instance_id).subquery("t2")

    max_alerts = DB.session.query(DB.func.max(mm.op_trigger), subquery.c.site_id).join(mi).join(subquery, DB.and_(
        mm.observance_ts == subquery.c.max_ts, mi.instance_id == subquery.c.instance_id)).group_by(subquery.c.site_id).all()

    sites = get_sites_data()
    sites_data = SitesSchema(many=True).dump(sites).data

    for site in sites_data:
        site_id = site["site_id"]
        alert = next((x[0] for x in max_alerts if x[1] == site_id), 0)
        site["moms_alert"] = alert

    sites_data.sort(key=lambda x: x["moms_alert"], reverse=True)

    return jsonify(sites_data)


@MOMS_BLUEPRINT.route("/manifestations_of_movement/get_moms_instances/<site_code>", methods=["GET"])
def get_moms_instances(site_code):
    mi = MomsInstances
    # mm = MonitoringMoms

    # subquery = DB.session.query(mi.instance_id, DB.func.max(
    #     mm.observance_ts).label("max_ts")).join(mm).join(Sites).filter(Sites.site_code == site_code).group_by(mi.instance_id).subquery("t2")

    # query = DB.session.query(mm, mi).join(mi).join(subquery, DB.and_(
    #     mm.observance_ts == subquery.c.max_ts, mi.instance_id == subquery.c.instance_id)).all()

    # print("I'm aquery")
    # print(aquery)

    query = mi.query.join(Sites).filter(Sites.site_code == site_code).all()

    result = MomsInstancesSchema(many=True, exclude=(
        "moms.moms_releases", )).dump(query).data

    return jsonify(result)


@MOMS_BLUEPRINT.route("/manifestations_of_movement/get_moms_features", methods=["GET"])
@MOMS_BLUEPRINT.route("/manifestations_of_movement/get_moms_features/<site_code>", methods=["GET"])
def get_moms_features(site_code=None):
    features = MomsFeatures.query.all()

    result = MomsFeaturesSchema(
        many=True, exclude=("instances.site", )).dump(features).data

    if site_code:
        sites_data = get_sites_data(site_code=site_code)
        site_id = sites_data.site_id

        for feature in result:
            instances = feature["instances"]
            filtered = [d for d in instances if d["site_id"] == site_id]

            feature["instances"] = filtered

    return jsonify(result)
