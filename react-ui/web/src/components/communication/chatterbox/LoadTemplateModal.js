import React, { useState, useEffect, forwardRef } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, Slide,
    Fade, withStyles
} from "@material-ui/core";
import { compose } from "recompose";
import { axios } from "axios";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";

const styles = theme => ({
    link: { textDecoration: "none" }
});

function useFetchTagOptions (tag_selection) {
    const [tags, update_tags] = useState([]);

    useEffect(() => {
        // AJAX CALLS HERE FOR OPRIONS
        // axios.get("http://192.168.150.167:5000/api/users/get_dynaslope_users")
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

function LoadTemplateModal (props) {
    const {
        classes, fullScreen, isOpen,
        clickHandler, isMobile
    } = props;
    const [tags, update_tags] = useState(null);

    return (
        <Dialog
            fullWidth
            fullScreen={fullScreen}
            open={isOpen}
            aria-labelledby="form-dialog-title"
            TransitionComponent={fullScreen ? SlideTransition : FadeTransition}      
        >
            <DialogTitle id="form-dialog-title">
                Load Templates
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Select template to be loaded.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button color="primary" onClick={clickHandler}>
                    Select
                </Button>
                <Button onClick={clickHandler}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default compose(withStyles(styles), withMobileDialog())(LoadTemplateModal);
