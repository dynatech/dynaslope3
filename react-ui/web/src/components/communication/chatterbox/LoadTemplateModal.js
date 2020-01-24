import React, { useState, useEffect, Fragment } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, Slide,
    Fade, withStyles, Grid
} from "@material-ui/core";
import MomentUtils from "@date-io/moment";
import moment from "moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";
import { compose } from "recompose";
import { axios } from "axios";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";
import SelectInputForm from "../../reusables/SelectInputForm";

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

function LoadTemplateModal (props) {
    const {
        classes, fullScreen, isOpen,
        clickHandler, isMobile
    } = props;

    const selector_list = [
        { id: 0, label: "Benguet Sites" },
        { id: 1, label: "Samar Sites" }
    ];
    const [selector, setSelector] = useState(selector_list);
    const [date_time, setDateTime] = useState("");

    useEffect(() => {
        console.log(selector_list[selector]);
    }, [selector]);

    const handleDateTime = key => value => {
        console.log(key);
        console.log(moment(value));
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
                Load Templates
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Select template to be loaded.
                </DialogContentText>
                <Grid
                    container 
                    spacing={1} 
                    alignItems="center"
                    justify="space-evenly"
                >
                    <Grid item xs={6}>
                        <SelectInputForm
                            div_id="select_per"
                            label="Rain information for"
                            changeHandler={event => setSelector(event.target.value)}
                            value={selector}
                            list={selector_list}
                            mapping={{ id: "id", label: "label" }}
                            required
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <MuiPickersUtilsProvider utils={MomentUtils}>
                            <KeyboardDateTimePicker
                                required
                                autoOk
                                label="Data timestamp"
                                value={date_time}
                                onChange={handleDateTime("dataTimestamp")}
                                ampm={false}
                                placeholder="2010/01/01 00:00"
                                format="YYYY/MM/DD HH:mm"
                                mask="__/__/____ __:__"
                                clearable
                                disableFuture
                            />
                        </MuiPickersUtilsProvider>
                    </Grid>
                </Grid>
               
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
