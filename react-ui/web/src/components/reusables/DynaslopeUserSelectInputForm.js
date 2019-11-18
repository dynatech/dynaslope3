import React, { Fragment, useState, useEffect } from "react";
import axios from "axios";
import SelectInputForm from "./SelectInputForm";
import OutlinedSelectInputForm from "./OutlinedSelectInputForm";
import { host } from "../../config";

const mapping = { id: "user_id", label: "name" };

function prepareUsersArray (arr) {
    return arr.map(({ user_id, first_name, last_name }) => ({ user_id, name: `${last_name}, ${first_name}` }));
}

function DynaslopeUserSelectInputForm (props) {
    const {
        variant, label, div_id,
        changeHandler, value, css,
        disabled, returnFullNameCallback        
    } = props;
    const [users, setUsers] = useState([]);

    useEffect(() => {
        axios.get(`${host}/api/users/get_dynaslope_users`)
        .then(response => {
            const arr = prepareUsersArray(response.data);
            setUsers(arr);
        })
        .catch(error => {
            console.log(error);
        });
    }, []);
    
    const callback = typeof returnFullNameCallback === "undefined" ? false : returnFullNameCallback;

    if (callback) {
        const user = users.find(o => o.user_id === value);
        if (typeof user !== "undefined") returnFullNameCallback(user.name);
    }

    return (
        <Fragment>
            {
                variant === "standard" && (
                    <SelectInputForm
                        label={label}
                        div_id={div_id}
                        changeHandler={changeHandler}
                        value={value}
                        list={users}
                        mapping={mapping}
                        css={css}
                        disabled={disabled}
                    />
                )
            }
            {
                variant === "outlined" && (
                    <OutlinedSelectInputForm
                        label={label}
                        div_id={div_id}
                        changeHandler={changeHandler}
                        value={value}
                        list={users}
                        mapping={mapping}
                        css={css}
                    />
                )
            }
        </Fragment>
    );
}

export default DynaslopeUserSelectInputForm;

