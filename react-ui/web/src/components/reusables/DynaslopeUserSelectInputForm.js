import React, { Component, Fragment } from "react";
import axios from "axios";
import SelectInputForm from "./SelectInputForm";
import OutlinedSelectInputForm from "./OutlinedSelectInputForm";

const mapping = { id: "user_id", label: "name" };

function prepareUsersArray (arr) {
    return arr.map(({ user_id, first_name, last_name }) => ({ user_id, name: `${last_name}, ${first_name}` }));
}

class DynaslopeUserSelectInputForm extends Component {
    state = {
        users: []
    }

    componentDidMount () {
        axios.get("http://192.168.150.167:5000/api/users/get_dynaslope_users")
        .then(response => {
            const arr = prepareUsersArray(response.data);
            this.setState({ users: arr });
        })
        .catch(error => {
            console.log(error);
        });
    }

    render () {
        const { 
            variant, label, div_id,
            changeHandler, value, css
        } = this.props;
        const { users } = this.state;

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
}

export default DynaslopeUserSelectInputForm;

