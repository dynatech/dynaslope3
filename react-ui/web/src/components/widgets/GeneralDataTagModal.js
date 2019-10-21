import React, { useState, useEffect, forwardRef } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, withStyles
} from "@material-ui/core";
import { compose } from "recompose";
import axios from "axios";
import SelectMultipleWithSuggest from "../reusables/SelectMultipleWithSuggest";
import { SlideTransition, FadeTransition } from "../reusables/TransitionList";
import host from "../../config";

const styles = theme => ({
    link: { textDecoration: "none" }
});

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
        clickHandler, tagOption, isMobile,
        tagObject
    } = props;

    const tag_options = useFetchTagOptions(tagOption);
    const [tags, update_tags] = useState([]);

    useEffect(() =>{
        const tag_arr = preparePassedTags(tagObject);
        update_tags(tag_arr);
    }, [tagObject]);

    const update_tags_fn = value => update_tags(value);

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
                <Button color="primary" onClick={clickHandler}>
                    Submit
                </Button>
                <Button onClick={clickHandler}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default compose(withStyles(styles), withMobileDialog())(GeneralDataTagModal);
