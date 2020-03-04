from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from connection import DB
from sqlalchemy import func
from src.models.sites import Sites, SitesSchema
from src.models.monitoring import (
    MonitoringMoms, MomsInstances, MomsFeatures,
    MonitoringMomsSchema, MomsInstancesSchema,
    MomsFeaturesSchema
)
from src.utils.sites import get_sites_data

from src.utils.monitoring import get_event_moms
from src.utils.extra import var_checker


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


def get_critical_instances(instance_id_list):
    """
    """
    moms = MonitoringMoms
    mi = MomsInstances
    critical_ids = []
    unique_instances = []
    unique_moms_instance_set = set({})

    moms_list = moms.query.order_by(DB.desc(moms.observance_ts)).join(mi).filter(mi.instance_id.in_(instance_id_list)).filter(moms.op_trigger == 3).all()

    for site_moms in moms_list:
        instance_id = site_moms.instance_id
        if not instance_id in unique_moms_instance_set:
            critical_ids.append(instance_id)
            unique_moms_instance_set.add(instance_id)

    return critical_ids


def get_latest_released_moms(instance_id_list):
    """
    REturns only the latest moms that ARE RELEASED
    """
    moms = MonitoringMoms
    mi = MomsInstances
    released_moms = []
    unique_instances = []
    unique_moms_instance_set = set({})

    try:
        moms_list = moms.query.order_by(DB.desc(moms.observance_ts)).join(mi).filter(mi.instance_id.in_(instance_id_list)).all()

        for site_moms in moms_list:
            instance_id = site_moms.instance_id

            moms_data = None
            # if moms not yet released or attached
            # to any trigger or release
            if site_moms.moms_release or site_moms.op_trigger == 0:
                if not instance_id in unique_moms_instance_set:
                    moms_data = MonitoringMomsSchema().dump(site_moms).data
                    released_moms.append(moms_data)

                    # if site_moms.op_trigger > 0:
                    #     if moms_data is None:
                    #         moms_data = MonitoringMomsSchema(exclude=MOMS_SCHEMA_EXCLUSION) \
                    #             .dump(site_moms).data
                    #     unresolved_moms_list.append(moms_data)

                    unique_moms_instance_set.add(instance_id)

    except Exception as err:
        print(err)
        raise
    

    return released_moms


# @MOMS_BLUEPRINT.route("/manifestations_of_movement/get_latest_site_moms_alerts", methods=["GET", "POST"])
def get_latest_site_moms_alerts(instance_id_list):
    """
    MonitoringMoms 
    """
    moms = MonitoringMoms
    mi = MomsInstances
   
    try:
        site_moms_alerts_list = moms.query.order_by(DB.desc(moms.observance_ts)).join(mi).filter(moms.op_trigger > 0).filter(mi.instance_id.in_(instance_id_list)).all()
    except Exception:
        site_moms_alerts_list = []
    
    unique_instances = []
    unique_instance_ids = set({})

    list_length = len(instance_id_list)

    for item in site_moms_alerts_list:
        if len(unique_instances) == list_length:
            break

        instance_id = item.moms_instance.instance_id
        if instance_id not in unique_instance_ids:
            unique_instance_ids.add(instance_id)
            unique_instances.append(item)
    
    data = MonitoringMomsSchema(many=True, exclude=("moms_releases",)).dump(unique_instances).data

    for entry in data:
        if len(entry["moms_release"]):
            entry["is_moms_released"] = True
        else:
            entry["is_moms_released"] = False

    return data


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


@MOMS_BLUEPRINT.route("/manifestations_of_movement/get_event_moms", methods=["GET"])
# @MOMS_BLUEPRINT.route("/manifestations_of_movement/get_event_moms", methods=["POST"])
def wrap_get_event_moms():
    """
    """
    # Commented because we only have one site UMI
    # json_input = requests.get_json()
    try:
        event_moms = get_event_moms(site_id=50)
        event_moms_data = MonitoringMomsSchema(many=True, exclude=("moms_releases",)).dump(event_moms).data
    except Exception as err:
        event_moms_data = []
    # return jsonify(event_moms_data)
    return event_moms_data