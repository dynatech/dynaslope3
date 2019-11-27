import React, { useState, Fragment } from "react";
import { IconButton, Grid } from "@material-ui/core";
import { AddBox } from "@material-ui/icons";
import MessageInputTextbox from "./MessageInputTextbox";
import SelectMultipleWithSuggest from "../../reusables/SelectMultipleWithSuggest";
import QuickSelectModal from "./QuickSelectModal";

function SendMessageForm (props) {
    const [recipients, setRecipients] = useState(null);
    const [quick_select, setQuickSelect] = useState(false);
    const { isMobile, textboxValue } = props;

    return (
        <Fragment>
            <Grid container justify="space-around" alignItems="flex-end">
                <Grid item xs={10} sm={11}>
                    <SelectMultipleWithSuggest
                        label="Recipients"
                        options={[]}
                        value={recipients}
                        changeHandler={value => setRecipients(value)}
                        placeholder="Select recipients"
                        renderDropdownIndicator={false}
                        openMenuOnClick={false}
                        isMulti
                    />
                </Grid>

                <Grid item xs={2} sm={1} style={{ textAlign: "right" }}>
                    <IconButton
                        aria-label="Quick select option"
                        onClick={value => setQuickSelect(true)}
                    >
                        <AddBox />
                    </IconButton>
                </Grid>
            </Grid>

            <QuickSelectModal value={quick_select} closeHandler={value => setQuickSelect(false)} />

            {
                !isMobile && <div style={{ height: 80 }} />
            }
                
            <div style={{ marginTop: 16 }}>
                <MessageInputTextbox limitRows={false} value={textboxValue} />
            </div>
                
        </Fragment>
    );
}

export default SendMessageForm;
