import React, { Fragment, useState, useEffect } from "react";
import { Route, Link } from "react-router-dom";
import {
    Grid, Paper, Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import moment from "moment";
import GeneralStyles from "../../../GeneralStyles";
import { getCommunityStaff } from "../ajax";

const useStyle = makeStyles(theme => {
    const general_styles = GeneralStyles(theme);
    return {
        ...general_styles,
        customPaper: {
            padding: 8,
            marginTop: 20,
            textAlign: "center"
        }
    };
});


function prepareOrgList (community_staff_list) {
    return community_staff_list.map((user, index) => {
        const { last_name, first_name, salutation } = user;
        return (
            <Typography>{`${salutation} ${first_name} ${last_name}`}</Typography>
        );
    });
}


function SiteStakeholdersList (props) {
    const classes = useStyle();
    const {
        siteCode
    } = props;
    // const [community_contacts, setCommunityContacts] = useState({});
    const [community_contacts, setCommunityContacts] = useState([]);

    useEffect(() => {
        getCommunityStaff(siteCode, ret => {
            const comm_contacts_ui = prepareOrgList(ret);
            setCommunityContacts(comm_contacts_ui);
            console.log(ret);
        });
    }, []);

    return (
        <Paper className={classes.customPaper}>
            Site Stakeholders
            {community_contacts}
        </Paper>
    );

}

export default (SiteStakeholdersList);