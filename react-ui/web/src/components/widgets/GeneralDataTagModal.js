import React, { useState, useEffect, Fragment } from "react";

import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, makeStyles,
    Radio, RadioGroup, FormControlLabel,
    FormLabel
} from "@material-ui/core";

import axios from "axios";
import moment from "moment";

import GeneralStyles from "../../GeneralStyles";
import SelectMultipleWithSuggest from "../reusables/SelectMultipleWithSuggest";
import { SlideTransition, FadeTransition } from "../reusables/TransitionList";
import { host } from "../../config";
import { handleUpdateInsertTags, handleDeleteTags } from "./ajax";
import { getCurrentUser } from "../sessions/auth";
import { mobileUserFormatter } from "../communication/chatterbox/MessageList";
import DynaslopeSiteSelectInputForm from "../reusables/DynaslopeSiteSelectInputForm";

const useStyles = makeStyles(theme => GeneralStyles(theme));

function prepareContactPerson (mobileDetails) {
    const { sim_num, users } = mobileDetails;
    let name = sim_num;

    if (users.length > 0) {
        const formatted_users = mobileUserFormatter(users, false);
        const { sender_arr } = formatted_users;
        const temp = [];
        sender_arr.forEach(row => {
            const { sender, level, inactive } = row;
            if (!inactive) {
                const position = level !== null ? `${level} ` : "";
                temp.push(`${position}${sender}`);
            }
        });

        if (temp.length > 0) name = temp.join(", ");
        if (temp.length > 1) name += "(shared number)";
    }
    
    return name;
}

function useFetchTagOptions (tag_selection) {
    const [tags, update_tags] = useState([]);
    const cancel_token = axios.CancelToken;
    const source = cancel_token.source();

    useEffect(() => {
        const api_link = `${host}/api/chatterbox/get_message_tag_options/sms${tag_selection}_users`;

        axios.get(api_link, { cancelToken: source.token })
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

        // return source.cancel();
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
        tagObject, mobileDetails, message
    } = props;

    const classes = useStyles();

    const tag_options = useFetchTagOptions(tagOption);
    const [tags, update_tags] = useState(null);
    const [orig_tags, setOrigTags] = useState([]);
    const [has_fyi_tag, setHasFyiTag] = useState(false);
    const [sites, setSites] = useState(null);
    const [fyi_purpose, setFyiPurspose] = useState("");

    const is_saved_number = mobileDetails.users.length > 0;

    useEffect(() => {
        let bool = false;
        if (tags !== null) bool = tags.some(x => x.label === "#AlertFYI");
        setHasFyiTag(bool);
    }, [tags]);

    const [is_disabled, setIsDisabled] = useState(false);
    useEffect(() => {
        let bool = false;
        if (is_saved_number) {
            if (has_fyi_tag) {
                if (sites === null || fyi_purpose === "") bool = true;
            }
        } else {
            bool = true;
        }
        setIsDisabled(bool);
    }, [has_fyi_tag, sites, fyi_purpose]);

    useEffect(() =>{
        const tag_arr = preparePassedTags(tagObject);
        update_tags(tag_arr);
        setOrigTags(tag_arr);
    }, [tagObject]);

    const update_tags_fn = value => update_tags(value);

    const submitTagHandler = () => {
        const { id, source, ts } = tagObject;

        let contact_person = null;
        let site_id_list = [];
        if (is_saved_number && !has_fyi_tag) {
            mobileDetails.users.forEach(row => {
                const { user } = row;

                const user_organizations = user.organizations;
                user_organizations.forEach(org => {
                    const { site: { site_id } } = org;
                    !site_id_list.includes(site_id) && site_id_list.push(site_id);
                });
            });

            contact_person = prepareContactPerson(mobileDetails);
        } else if (has_fyi_tag) {
            site_id_list = sites.map(x => x.value);
        }
        
        const var_key_id = source === "inbox" ? "inbox_id" : "outbox_id";

        // DELETE MISSING TAGS
        let missing_tags = [];
        // console.log(orig_tags, tags);
        if (orig_tags.length > 0) {
            if (tags === null) missing_tags = [...orig_tags];
            else {
                missing_tags = orig_tags.filter(row => !tags.some(x => x.value === row.value));
            }
        }

        if (missing_tags.length > 0) {
            // console.log("missing_tags", missing_tags);
            const delete_tag_id_list = missing_tags.map(tag => {
                return tag.value;
            });
            const delete_payload = {
                tag_type: `sms${source}_user_tags`,
                tag_details: {
                    [var_key_id]: id,
                    delete_tag_id_list
                }
            };
            console.log("delete_payload", delete_payload);
            handleDeleteTags(delete_payload, response => {
                console.log("untag response", response);
            });
        }

        // ADD NEW TAGS
        let new_tags = [];
        if (tags !== null) new_tags = tags.filter((i => a => a !== orig_tags[i] || !++i)(0));
        if (new_tags.length > null) {            
            // console.log("new_tags", new_tags);
            const tag_id_list = new_tags.map(tag => {
                return tag.value;
            });
            const payload = {
                tag_type: `sms${source}_user_tags`,
                contact_person,
                message: has_fyi_tag ? fyi_purpose : message,
                tag_details: {
                    user_id: getCurrentUser().user_id,
                    [var_key_id]: id,
                    tag_id_list,
                    site_id_list,
                    ts: moment().format("YYYY-MM-DD HH:mm:ss"),
                    ts_message: ts
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
                Chatterbox Message Tagging
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Attach or remove tags to a message.
                </DialogContentText>

                <DialogContentText className={classes.dyna_error}>
                    NOTE: You must manually remove any site logs created (if any) 
                    by a tag when removing a tag to a message.
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
                    has_fyi_tag && <Fragment>
                        <DialogContentText color="textPrimary">
                            Alert FYI
                        </DialogContentText>

                        
                        <DynaslopeSiteSelectInputForm
                            value={sites}
                            changeHandler={value => setSites(value)}
                            isMulti
                            required
                        />


                        <FormLabel component="legend" style={{ marginTop: 24 }}>Purpose</FormLabel>
                        <RadioGroup
                            aria-label="fyi-purpose"
                            name="fyi-purpose"
                            row
                            style={{ justifyContent: "space-around" }}
                            value={fyi_purpose}
                            onChange={e => setFyiPurspose(e.target.value)}
                        >
                            <FormControlLabel value="alert raising" control={<Radio />} label="Alert raising" />
                            <FormControlLabel value="alert lowering" control={<Radio />} label="Alert lowering" />
                        </RadioGroup>
                    </Fragment>
                }

                {
                    !isMobile && <div style={{ height: 240 }} />
                }
            </DialogContent>
            <DialogActions>
                <Button 
                    color="primary"
                    onClick={submitTagHandler}
                    disabled={is_disabled}
                >
                    Submit
                </Button>
                <Button onClick={closeHandler}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default withMobileDialog()(GeneralDataTagModal);
