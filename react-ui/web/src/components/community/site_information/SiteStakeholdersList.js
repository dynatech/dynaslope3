import React, { useState, useEffect, Fragment } from "react";

import {
    Typography, Grid, Divider,
    Avatar, makeStyles, Tooltip,
    Badge, withStyles
} from "@material-ui/core";
import { Stars, CheckCircle, RemoveCircle } from "@material-ui/icons";

import GeneralStyles from "../../../GeneralStyles";
import GenericAvatar from "../../../images/generic-user-icon.jpg";
import { getCommunityStakeholders } from "../ajax";

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
            width: 40,
            height: 40
        }
    };
});

const StyledBadge = withStyles((theme) => ({
    badge: {
        right: 14,
        top: 48,
        padding: "0 4px",
    },
}))(Badge);

function prepareOrgList (classes, community_orgs) {
    const lgu = [];
    const non_lgu = [];
    Object.keys(community_orgs).forEach(x => {
        let temp = non_lgu;
        if (/lewc|lgu/i.test(x)) temp = lgu;
        temp.push(x);
    });


    return lgu.concat(non_lgu).map((org, org_index, arr) => {
        const user_list_for_ui = community_orgs[org].map((user, user_index) => {
            const {
                last_name, first_name, salutation, status, primary_contact
            } = user;

            const sal = salutation || "";
            let title = "Active";
            let icon = <CheckCircle style={{ color: "green" }} />;
            if (Boolean(primary_contact) && status) {
                title = "Contact Priority";
                icon = <Stars style={{ color: "gold" }} />;
            } else if (!status) {
                title = "Inactive";
                icon = <RemoveCircle style={{ color: "gray" }} />;
            }

            const primary_badge = <Tooltip 
                arrow
                title={title}
                placement="top"
                enterTouchDelay={200}
            >
                { icon }
            </Tooltip>;

            return (
                <Grid 
                    item xs={12} sm={6} md={4} lg={3} justify="center" 
                    alignItems="center" container spacing={1}
                    key={`staff_${user_index + 1}`}
                >
                    <StyledBadge
                        // overlap="circle"
                        // anchorOrigin={{
                        //     vertical: "bottom",
                        //     horizontal: "right",
                        // }}
                        badgeContent={primary_badge}
                    >
                        <Avatar 
                            alt="Stakeholder" src={GenericAvatar} 
                            className={classes.bigAvatar}
                        />
                    </StyledBadge>

                    <Typography 
                        variant="subtitle1" 
                        color={ status ? "textPrimary" : "textSecondary" }
                    >
                        {`${sal} ${first_name} ${last_name}`}
                    </Typography>
                </Grid>
            );
        });

        return (
            <Fragment key={`fragment_${org_index + 1}`}>
                <Grid item xs={12} key={`org_label_${org_index + 1}`}>
                    <Typography variant="subtitle1" >
                        <strong>{org.toUpperCase()}</strong>
                    </Typography>
                </Grid>

                <Grid item xs={12} justify="space-evenly"
                    alignItems="center" container spacing={1}
                    key={`staff_list_${org_index + 1}`}
                >
                    {user_list_for_ui}
                </Grid>

                {
                    arr.length > org_index + 1 && (
                        <Grid item xs={12}>
                            <Divider style={{ margin: "16px 0" }} />
                        </Grid>
                    )
                }
            </Fragment>            
        );
    });
}

function SiteStakeholdersList (props) {
    const classes = useStyle();
    const { siteCode } = props;

    const [community_contacts, setCommunityContacts] = useState(null);

    useEffect(() => {
        getCommunityStakeholders(siteCode, com_orgs => {
            const comm_contacts_ui = prepareOrgList(classes, com_orgs);
            setCommunityContacts(comm_contacts_ui);
        });
    }, []);

    return (
        <Fragment>
            <Grid item xs={12} align="center">
                <Typography variant="h6" color="textPrimary" gutterBottom>
                    <strong>Site Stakeholders</strong>
                </Typography>
            </Grid>

            <Grid item xs={12} align="center" container spacing={1} justify="center">
                {
                    // eslint-disable-next-line 
                    community_contacts === null ? (
                        "Loading..."
                    ) : (
                        community_contacts.length !== 0 ? (
                            community_contacts
                        ) : (
                            "No site stakeholders"
                        )
                    )
                }
                
            </Grid>
        </Fragment>
    );
}

export default SiteStakeholdersList;
