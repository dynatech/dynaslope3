import { useState, useEffect } from "react";
import { moms_entry } from "./state_handlers";
import { getMOMsFeatures } from "./ajax";
import { capitalizeFirstLetter } from "../../../UtilityFunctions";

export default function MomsInitialState (site_code) {
    const [ moms_feature_types, setMomsFeatureTypes ] = useState([]);

    useEffect(() => {
        getMOMsFeatures(site_code, data => {
            const feature_types = data.map(feat => {
                const { feature_id, feature_type, instances, alerts } = feat;
                const cap = capitalizeFirstLetter(feature_type);
                return { value: feature_id, label: cap, instances, alerts }; 
            });

            setMomsFeatureTypes({ ...moms_feature_types, feature_type: feature_types });
        });
    }, []);

    const moms_entry_copy = moms_entry;
    moms_entry_copy.options.feature_type = moms_feature_types.feature_type;

    const initial_state = [moms_entry_copy];

    return initial_state;
}