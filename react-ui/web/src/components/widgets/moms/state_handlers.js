import { capitalizeFirstLetter } from "../../../UtilityFunctions";

const moms_entry = {
    moms: {
        feature_type: null,
        feature_name: null,
        alert_level: null,
        observance_ts: null,
        narrative: "",
        reporter: "",
        remarks: "",
        validator: "",
        location: ""
    }, 
    options: {
        feature_type: [],
        feature_name: {
            options: [],
            disabled: true
        },
        alert_level: {
            options: [],
            disabled: true
        }
    }
};

function reducerFunction (state, payload) {
    const { action, key, attribute, value } = payload;
    const new_state = JSON.parse(JSON.stringify(state));

    switch (action) {
        case "OVERWRITE":
            return [
                ...value
            ];
        case "ADD_INSTANCE":
            return [
                ...state,
                JSON.parse(JSON.stringify(moms_entry))
            ];
        case "DELETE_INSTANCE":
            new_state.splice(key, 1);

            return [...new_state];
        case "UPDATE_DETAILS":
            new_state[key].moms[attribute] = value;

            if (attribute === "feature_type") {
                const { instances, alerts } = value;

                const instances_opt = instances.map(ins => {
                    const { instance_id, feature_name } = ins;
                    const cap = capitalizeFirstLetter(feature_name);
                    return { value: instance_id, label: cap }; 
                });
                // LOUIE ADDS Add new instance option
                instances_opt.push({ value: 0, label: "(Add new instance)" });

                const alerts_opt = alerts.map(al => {
                    const { feature_alert_id, alert_level, description } = al;
                    return { value, feature_alert_id, label: alert_level, description };
                });

                const { moms, options } = new_state[key];

                new_state[key].options = {
                    ...options,
                    feature_name: {
                        options: instances_opt,
                        disabled: false
                    },
                    alert_level: {
                        options: alerts_opt,
                        disabled: false
                    },
                };

                new_state[key].moms = {
                    ...moms,
                    feature_name: null,
                    alert_level: null
                };
            }

            return [...new_state];
        default:
            return state;
    }
}

export { moms_entry, reducerFunction };