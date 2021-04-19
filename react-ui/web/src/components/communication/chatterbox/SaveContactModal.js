import React, { useState, useContext } from "react";

import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContentText from "@material-ui/core/DialogContentText";
import FormControl from "@material-ui/core/FormControl";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Checkbox from "@material-ui/core/Checkbox";
import Tooltip from "@material-ui/core/Tooltip";

import { useSnackbar } from "notistack";

import ContactForm from "../contacts/ContactForm";
import SelectMultipleWithSuggest from "../../reusables/SelectMultipleWithSuggest";
import { CommsContext } from "./CommsContext";
import { attachMobileNumberToExistingUser } from "../ajax";

function SaveContactModal (props) {
    const {
        open, setSaveContactModal, mobileDetails
    } = props;
    const { sim_num, mobile_id } = mobileDetails;
    const unknown_number = {
        mobile_number: { sim_num, mobile_id },
        priority: 0,
        status: 1
    };

    const data = {
        emails: [],
        ewi_recipient: [],
        ewi_restriction: [],
        landline_numbers: [],
        first_name: "",
        last_name: "",
        middle_name: "",
        nickname: "",
        user_id: 0,
        organizations: [],
        status: 0,
        mobile_numbers: [unknown_number]
    };
    const initial_user_data = data;

    const { contacts } = useContext(CommsContext);
    const [save_type, setSaveType] = useState("existing");
    const [is_edit_mode, setEditMode] = useState(true);
    const [selected_contact, setSelectedContact] = useState(null);
    const [is_active, setIsActive] = useState(true);
    const { enqueueSnackbar } = useSnackbar();

    const options = contacts.map(row => {
        const { user_id, first_name, last_name } = row;
        return {
            label: `${first_name} ${last_name}`,
            value: user_id,
            data: row
        };
    });

    const setContactForm = bool => {
        setEditMode(false);
    };

    const setContactFormForEdit = bool => {
        setEditMode(bool);
    };

    const handleClose = () => {
        setSaveContactModal(false);
    };

    const handleSave = () => {
        const input = {
            user_id: selected_contact.value,
            mobile_id,
            status: is_active ? 1 : 0
        };

        attachMobileNumberToExistingUser(input, ret => {
            const { status, message } = ret;
            let variant;
            if (status === true) {
                handleClose();
                variant = "success";
            } else {
                variant = "error";
            }

            enqueueSnackbar(
                message,
                {
                    variant,
                    autoHideDuration: 4000
                }
            );
        });
    };

    return (
        <Dialog
            open={open}
            aria-labelledby="form-dialog-title"
        >
            <DialogTitle id="form-dialog-title">{`Save mobile number (+${sim_num})`}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Choose whether to add number to an existing contact or fill-out a new contact form.
                </DialogContentText>
                <FormControl component="fieldset" style={{ display: "flex", marginBottom: 16 }}>
                    <RadioGroup
                        aria-label="save-number-options"
                        name="save-number-options"
                        row
                        style={{ justifyContent: "space-around" }}
                        value={save_type}
                        onChange={e => setSaveType(e.target.value)}
                    >
                        <FormControlLabel value="existing" control={<Radio />} label="Add to existing contact" />
                        <FormControlLabel value="new" control={<Radio />} label="Create new contact" />
                    </RadioGroup>
                </FormControl>

                {
                    save_type === "existing" && (
                        <Grid container spacing={2} style={{ marginBottom: 200 }}>
                            <Grid item xs={8}>
                                <SelectMultipleWithSuggest
                                    label="Contact Person"
                                    options={options}
                                    value={selected_contact}
                                    changeHandler={e => setSelectedContact(e)}
                                    placeholder="Type name of contact person"
                                    openMenuOnClick={false}
                                    renderDropdownIndicator={false}
                                    isClearable
                                />
                            </Grid>

                            <Grid item xs={4}>
                                <Tooltip
                                    title="Inactive numbers will not receive EWI if a contact is an EWI recipient."
                                    arrow
                                >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={is_active}
                                                onChange={e => setIsActive(e.target.checked)}
                                                name="is_active"
                                                color="primary"
                                            />
                                        }
                                        label="Set as active"
                                    />
                                </Tooltip>
                            </Grid>
                        </Grid>
                    )
                }
                
                { 
                    save_type === "new" && (
                        <ContactForm
                            setContactForm={setContactForm}
                            chosenContact={initial_user_data}
                            isEditMode={is_edit_mode}
                            setContactFormForEdit={setContactFormForEdit}
                            handleClose={handleClose}
                            isFromChatterbox
                        />
                    )
                }
            </DialogContent>

            {
                save_type === "existing" && (
                    <DialogActions>
                        <Button variant="text" onClick={handleSave} color="secondary">
                            Save
                        </Button>
                        <Button variant="text" onClick={handleClose} color="primary">
                            Cancel
                        </Button>
                    </DialogActions>
                )
            }
        </Dialog>
    );
}

export default React.memo(SaveContactModal);