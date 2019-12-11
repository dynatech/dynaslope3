import React, { useState, useEffect, forwardRef } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, withStyles
} from "@material-ui/core";
import { compose } from "recompose";
import axios from "axios";
import moment from "moment";
import SelectMultipleWithSuggest from "../reusables/SelectMultipleWithSuggest";
import { SlideTransition, FadeTransition } from "../reusables/TransitionList";
import { host } from "../../config";
import { handleUpdateInsertTags, handleDeleteTags } from "./ajax";
import { getCurrentUser } from "../sessions/auth";
import { mobileUserFormatter } from "../communication/chatterbox/MessageList";

const styles = theme => ({
    link: { textDecoration: "none" }
});

function prepareContactPerson (mobileDetails) {
    let name = mobileDetails.sim_num;
    const u_details = mobileDetails.user_details;
    if (u_details !== null) {
        const formatted_user = mobileUserFormatter(u_details);
        const { sender: contact_person, orgs } = formatted_user;

        let org_str = "";
        orgs.forEach(org => {
            org_str += `${org} `;
        });
        name = org_str + contact_person;
    }
    
    return name;
}

function useFetchTagOptions (tag_selection) {
    const [tags, update_tags] = useState([]);

    useEffect(() => {
        axios.get(`${host}/api/chatterbox/get_message_tag_options/sms${tag_selection}_users`)
        .then(({ data }) => {
            const arr = data.map(row => ({
                value: row.tag_id,
                label: row.tag
            }));

            update_tags(arr);
        })
        .catch(error => {
            console.log(error);
        });
    }, [tag_selection]);

    return tags;
}

function preparePassedTags (tag_obj) {
    const { tags } = tag_obj;
    
    const tag_arr = tags.map(x => ({
        value: x.tag_id,
        label: x.tag.tag
    }));

    return tag_arr;
}

function GeneralDataTagModal (props) {
    const {
        fullScreen, isOpen,
        closeHandler, tagOption, isMobile,
        tagObject, mobileDetails
    } = props;

    const tag_options = useFetchTagOptions(tagOption);

    const [tags, update_tags] = useState([]);
    const [orig_tags, setOrigTags] = useState([]);

    useEffect(() =>{
        const tag_arr = preparePassedTags(tagObject);
        update_tags(tag_arr);
        setOrigTags(tag_arr);
    }, [tagObject]);

    const update_tags_fn = value => update_tags(value);

    const submitTagHandler = () => {
        const { id, source } = tagObject;

        const user_organizations = mobileDetails.user_details.user.organizations;
        const site_id_list = [];
        user_organizations.forEach(org => {
            console.log("org", org);
            const { site: { site_id } } = org;
            !site_id_list.includes(site_id) && site_id_list.push(site_id);
        });

        const contact_person = prepareContactPerson(mobileDetails);
        const var_key_id = source === "inbox" ? "inbox_id" : "outbox_id";

        // DELETE MISSING TAGS
        let missing_tags = 0;
        if (orig_tags.length > 0) missing_tags = orig_tags.filter((i => a => a !== tags[i] || !++i)(0));

        if (missing_tags.length > 0) {
            console.log("missing_tags", missing_tags);
            const delete_tag_id_list = missing_tags.map(tag => {
                return tag.value;
            });
            const delete_payload = {
                tag_type: `sms${source}_user_tags`,
                contact_person,
                tag_details: {
                    user_id: getCurrentUser().user_id,
                    [var_key_id]: id,
                    site_id_list,
                    delete_tag_id_list,
                    ts: moment().format("YYYY-MM-DD HH:mm:ss")
                }
            };
            console.log("delete_payload", delete_payload);
            handleDeleteTags(delete_payload, response => {
                console.log("untag response", response);
            });
        }

        // ADD NEW TAGS
        let new_tags = [];
        if (tags.length > 0) new_tags = tags.filter((i => a => a !== orig_tags[i] || !++i)(0));

        if (new_tags.length > 0) {            
            console.log("new_tags", new_tags);
            const tag_id_list = new_tags.map(tag => {
                return tag.value;
            });
            const payload = {
                tag_type: `sms${source}_user_tags`,
                contact_person,
                tag_details: {
                    user_id: getCurrentUser().user_id,
                    [var_key_id]: id,
                    tag_id_list,
                    site_id_list,
                    ts: moment().format("YYYY-MM-DD HH:mm:ss")
                }
            };
            console.log("PAYLOAD", payload);
            handleUpdateInsertTags(payload, response => {
                console.log("tag response", response);
            });
        }

        closeHandler();
    };

    return (
        <Dialog
            fullWidth
            fullScreen={fullScreen}
            open={isOpen}
            aria-labelledby="form-dialog-title"
            TransitionComponent={fullScreen ? SlideTransition : FadeTransition}      
        >
            <DialogTitle id="form-dialog-title">
                General Data Tagging
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Attach tags to selected data.
                </DialogContentText>
                
                <div style={{ margin: "24px 0" }}>
                    <SelectMultipleWithSuggest
                        label="Tags"
                        options={tag_options}
                        value={tags}
                        changeHandler={update_tags_fn}
                        placeholder="Select tags"
                        renderDropdownIndicator={false}
                        openMenuOnClick
                        isMulti
                    />
                </div>

                {
                    !isMobile && <div style={{ height: 240 }} />
                }
            </DialogContent>
            <DialogActions>
                <Button color="primary" onClick={submitTagHandler}>
                    Submit
                </Button>
                <Button onClick={closeHandler}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default compose(withStyles(styles), withMobileDialog())(GeneralDataTagModal);
