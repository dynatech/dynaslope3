import React, { useState, useEffect, forwardRef } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, Slide,
    Fade, withStyles
} from "@material-ui/core";
import { compose } from "recompose";
import { axios } from "axios";
import SelectMultipleWithSuggest from "../reusables/SelectMultipleWithSuggest";
import { SlideTransition, FadeTransition } from "../reusables/TransitionList";
import host from "../../config";

const styles = theme => ({
    link: { textDecoration: "none" }
});

function useFetchTagOptions (tag_selection) {
    const [tags, update_tags] = useState([]);

    useEffect(() => {
        // AJAX CALLS HERE FOR OPRIONS
        // axios.get(host + "/api/users/get_dynaslope_users")
        // .then(response => {
        //     const arr = prepareUsersArray(response.data);
        //     this.setState({ users: arr });
        // })
        // .catch(error => {
        //     console.log(error);
        // });

        let json = [];
        if (tag_selection === "messages") {
            json = [
                "#ewireponse", "#ewimessage", "#groundmeasreminder",
                "#groundmeas", "#groundobs", "#groundobsreminder"
            ].map(val => ({
                value: val,
                label: val
            }));
        }

        update_tags(json);
    }, [tag_selection]);

    return tags;
}

function GeneralDataTagModal (props) {
    const {
        classes, fullScreen, isOpen,
        clickHandler, tagOption, isMobile
    } = props;
    const tag_options = useFetchTagOptions(tagOption);
    const [tags, update_tags] = useState(null);

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
