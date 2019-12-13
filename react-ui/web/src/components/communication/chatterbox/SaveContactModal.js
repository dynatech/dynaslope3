import React, { useState, useEffect } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import ContactForm from "../contacts/ContactForm";
import { getListOfMunicipalities } from "../ajax";


function prepareGeographicalList (data, category) {
    let list = [];
    if (category === "municipality") {
        const municipalities = data.map(({ municipality, province }) => ({ id: municipality, label: `${municipality}, ${province}` }));
        list = [...municipalities];
    } else if (["province", "region"].includes(category)) {
        const unique = [...new Set(data.map(x => x[category]).sort())];
        const selection = unique.map(x => ({ id: x, label: x }));
        list = [...selection];
    }

    return list;
}

function SaveContactModal (props) {
    const {
        open, setSaveContactModal, mobileDetails
    } = props;
    const { sim_num, mobile_id } = mobileDetails;
    
    const mobile_numbers = [{
        sim_num,
        mobile_id,
        priority: 0,
        status: 1
    }];

    const user = {
        emails: [],
        ewi_recipient: [],
        ewi_restriction: [],
        landline_numbers: [],
        first_name: "",
        last_name: "",
        middle_name: "",
        nickname: "",
        user_id: 0,
        organizations: []
    };
    const initial_user_data = { mobile_numbers, user };
    const is_from_chatterbox = true;
    const [reason, setReason] = useState("");
    const [is_edit_mode, setEditMode] = useState(true);
    const [is_contact_form_open, setContactFormOpen] = useState(false);

    const [municipalities, setMunicipalities] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [regions, setRegions] = useState([]);


    const setContactForm = bool => {
        setContactFormOpen(bool);
        setEditMode(false);
    };

    const setContactFormForEdit = bool => {
        setEditMode(bool);
        setContactFormOpen(bool);
    };

    const handleClose = () => setSaveContactModal(false);
    const handleExited = () => setReason("");

    useEffect(() => {
        getListOfMunicipalities(data => {
            setMunicipalities(prepareGeographicalList(data, "municipality"));
            setProvinces(prepareGeographicalList(data, "province"));
            setRegions(prepareGeographicalList(data, "region"));
        });
    }, []);


    return (
        <Dialog
            open={open}
            onExited={handleExited}
            aria-labelledby="form-dialog-title"
        >
            <DialogTitle id="form-dialog-title">{`Save mobile number (+${sim_num})`}</DialogTitle>
            <DialogContent>
                <ContactForm 
                    municipalities={municipalities}
                    provinces={provinces}
                    regions={regions}
                    setContactForm={setContactForm}
                    chosenContact={initial_user_data}
                    isEditMode={is_edit_mode}
                    setContactFormForEdit={setContactFormForEdit}
                    handleClose={handleClose}
                    isFromChatterbox={is_from_chatterbox}
                /> 
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default React.memo(SaveContactModal);