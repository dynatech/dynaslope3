
const handleChange = (setTriggersState, trigger_type) => (key, element_id) => x => {
    const data = key === "timestamp" ? x : x.target.value;
    const alert_level = parseInt(element_id.charAt(1), 10);

    setTriggersState({
        action: "UPDATE_DETAILS",
        trigger_type,
        value: {
            alert_level,
            [key]: data
        }
    });
};

const handleSwitchChange = (setTriggersState, trigger_type) => event => {
    const is_checked = event.target.checked;
    setTriggersState({ action: "TOGGLE_SWITCH", trigger_type, value: is_checked });

    if (["on_demand", "earthquake"].includes(trigger_type)) {
        const action = is_checked ? "ADD_TRIGGER" : "REMOVE_TRIGGER";

        let special_case_states;
        let internal_sym_id = null;
        // hardcoded internal_sym_id from database
        if (trigger_type === "on_demand") {
            special_case_states = { reason: "", reporterId: 2 };
            internal_sym_id = 12;
        } else if (trigger_type === "earthquake") {
            special_case_states = { magnitude: "", longitude: "", latitude: "" };
            internal_sym_id = 11;
        }

        setTriggersState({
            action,
            trigger_type,
            value: {
                alert_level: 1, // Uses alert_level 1 since all earthquake and on_demand alerts are Alert 1 only
                timestamp: null,
                tech_info: "",
                internal_sym_id,
                ...special_case_states
            }
        });
    }
};

const handleCheckboxChange = (setTriggersState, trigger_type) => value => event => {
    const is_checked = event.target.checked;
    const action = is_checked ? "ADD_TRIGGER" : "REMOVE_TRIGGER";

    let internal_sym_id = null;
    // hardcoded internal_sym_id from database
    if (trigger_type === "surficial") {
        if (value === 2) internal_sym_id = 6;
        else if (value === 3) internal_sym_id = 4;
    } else if (trigger_type === "subsurface") {
        if (value === 2) internal_sym_id = 3;
        else if (value === 3) internal_sym_id = 1;
    }

    setTriggersState({
        action,
        trigger_type,
        value: {
            alert_level: value,
            status: is_checked,
            disabled: false,
            timestamp: null,
            tech_info: "",
            internal_sym_id
        }
    });
};

const handleRadioChange = (setTriggersState, trigger_type) => event => {
    const { value } = event.target;

    setTriggersState({
        action: "REMOVE_TRIGGER",
        trigger_type,
        value: "clear_all"
    });

    setTriggersState({
        action: "ADD_TRIGGER",
        trigger_type,
        value: {
            alert_level: parseInt(value, 10),
            timestamp: null,
            tech_info: "",
            internal_sym_id: 8 // Hardcoded internal sym_id ng Rainfall (R)
        }
    });
};

const handleEventChange = (key, setTriggersState, trigger_type) => event => {
    const { value } = event.target;

    setTriggersState({
        action: "UPDATE_DETAILS",
        trigger_type,
        value: {
            alert_level: 1, // Uses alert_level 1 since all earthquake and ondemand alerts are Alert 1 only
            [key]: value
        }
    });
};

export { handleChange, handleCheckboxChange, handleRadioChange, handleEventChange, handleSwitchChange };
