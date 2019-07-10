import React, { Component, Fragment } from "react";
import { Divider, IconButton, Grid } from "@material-ui/core";
import { AddBox } from "@material-ui/icons";
import MessageInputTextbox from "./MessageInputTextbox";
import SelectMultipleWithSuggest from "../../reusables/SelectMultipleWithSuggest";
import QuickSelectModal from "./QuickSelectModal";

const options = [
    { label: "Afghanistan" },
    { label: "Aland Islands" },
    { label: "Albania" },
    { label: "Algeria" },
    { label: "American Samoa" },
    { label: "Andorra" },
    { label: "Angola" },
    { label: "Anguilla" },
    { label: "Antarctica" },
    { label: "Antigua and Barbuda" },
    { label: "Argentina" },
    { label: "Armenia" },
    { label: "Aruba" },
    { label: "Australia" },
    { label: "Austria" },
    { label: "Azerbaijan" },
    { label: "Bahamas" },
    { label: "Bahrain" },
    { label: "Bangladesh" },
    { label: "Barbados" },
    { label: "Belarus" },
    { label: "Belgium" },
    { label: "Belize" },
    { label: "Benin" },
    { label: "Bermuda" },
    { label: "Bhutan" },
    { label: "Bolivia, Plurinational State of" },
    { label: "Bonaire, Sint Eustatius and Saba" },
    { label: "Bosnia and Herzegovina" },
    { label: "Botswana" },
    { label: "Bouvet Island" },
    { label: "Brazil" },
    { label: "British Indian Ocean Territory" },
    { label: "Brunei Darussalam" },
].map(suggestion => ({
    value: suggestion.label,
    label: suggestion.label,
}));

class SendMessageForm extends Component {
    state = {
        recipients: null,
        quick_select: false
    }
    
    handleChange = name => value => {
        this.setState({
            [name]: value,
        });
    };

    handleBoolean = (name, value) => () => {
        this.setState({
            [name]: value,
        });
    }

    render () {
        const { recipients, quick_select } = this.state;
        const { isMobile } = this.props;

        return (
            <Fragment>
                <Grid container justify="space-around" alignItems="flex-end">
                    <Grid item xs={10} sm={11}>
                        <SelectMultipleWithSuggest
                            label="Recipients"
                            options={options}
                            value={recipients}
                            changeHandler={this.handleChange("recipients")}
                            placeholder="Select recipients"
                            renderDropdownIndicator={false}
                            openMenuOnClick={false}
                            isMulti
                        />
                    </Grid>

                    <Grid item xs={2} sm={1} style={{ textAlign: "right" }}>
                        <IconButton
                            aria-label="Quick select option"
                            onClick={this.handleBoolean("quick_select", true)}
                        >
                            <AddBox />
                        </IconButton>
                    </Grid>
                </Grid>

                <QuickSelectModal value={quick_select} closeHandler={this.handleBoolean("quick_select", false)} />

                {
                    !isMobile && <div style={{ height: 80 }} />
                }
                
                <div style={{ marginTop: 16 }}>
                    <MessageInputTextbox limitRows={false} />
                </div>
                
            </Fragment>
        );
    }
}

export default SendMessageForm;
