import React, { useState, useEffect, Fragment } from "react";
import {
    Paper, Typography, Grid, Divider
} from "@material-ui/core";
import Avatar from "@material-ui/core/Avatar";
import { makeStyles } from "@material-ui/core/styles";
import GeneralStyles from "../../../GeneralStyles";
import GenericAvatar from "../../../images/generic-user-icon.jpg";
import { getCommunityStaff } from "../ajax";

const useStyle = makeStyles(theme => {
    const general_styles = GeneralStyles(theme);
    return {
        ...general_styles,
        customPaper: {
            padding: 8,
            marginTop: 20,
            textAlign: "center"
        },
        bigAvatar: {
            margin: 10,
            width: 60,
            height: 60
        }
    };
});


function prepareOrgList (classes, community_orgs) {
    const community_org_list = Object.keys(community_orgs);

    return community_org_list.map((org, org_index) => {
        const user_list_for_ui = community_orgs[org].map((user, user_index) => {
            const {
                last_name, first_name, salutation
            } = user;
            return (
                <Grid item xs={12} sm={3} justify="center" 
                    alignItems="center" container spacing={1}
                    key={`staff_${user_index + 1}`}
                >
                    <Avatar alt="User" src={GenericAvatar} className={classes.bigAvatar} />
                    <Typography variant="subtitle1" >
                        {`${salutation} ${first_name} ${last_name}`}
                    </Typography>
                </Grid>
            );
        });
        return (
            <Fragment key={`fragment_${org_index + 1}`}>
                <Grid item xs={12} key={`org_label_${org_index + 1}`} 
                    style={{ paddingTop: 15 }}
                >
                    <Typography variant="h6" >
                        {org.toUpperCase()}
                    </Typography>
                </Grid>
                <Grid item xs={12} justify="space-evenly"
                    alignItems="center" container spacing={1}
                    key={`staff_list_${org_index + 1}`}
                >
                    {user_list_for_ui}
                </Grid>
                <Divider className={classes.Divider} />
            </Fragment>            
        );
    });
}


function SiteStakeholdersList (props) {
    const classes = useStyle();
    const {
        siteCode
    } = props;

    const [community_contacts, setCommunityContacts] = useState([]);

    useEffect(() => {
        getCommunityStaff(siteCode, ret => {
            console.log(classes, ret);
            const comm_contacts_ui = prepareOrgList(classes, ret);
            setCommunityContacts(comm_contacts_ui);
        });
    }, []);
    return (
        <Fragment>
            <Grid item xs={12} align="center">
                <Typography variant="h6" color="textPrimary">
                    <strong>Site Stakeholders</strong>
                </Typography>
            </Grid>

            <Grid item xs={12} align="center">
                {community_contacts}
            </Grid>
        </Fragment>
    );
}

export default (SiteStakeholdersList);