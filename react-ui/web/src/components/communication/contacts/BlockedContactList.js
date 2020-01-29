import React from "react";

import {
    Grid, Typography,
    List, ListItem, ListItemAvatar,
    ListItemText, Avatar
} from "@material-ui/core";
import { Block } from "@material-ui/icons";


function BlockedContactList (props) {
    const { blocked_numbers, onBlockContactClickFn, } = props;
    if (blocked_numbers.length === 0) {
        return (<div>No blocked contact</div>);
    }
    return (
        <List dense style={{ paddingTop: 0 }}>
            {
                blocked_numbers.map(row => {
                    const { mobile_number } = row;
                    const { mobile_id, sim_num } = mobile_number;
                    return (
                        <ListItem 
                            button
                            onClick={onBlockContactClickFn(row)}
                            key={mobile_id}
                        >
                            <ListItemAvatar>
                                <Avatar>
                                    <Block />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Grid 
                                        container
                                        spacing={0}
                                        justify="flex-start"
                                        alignItems="center"
                                    >
                                        <Grid 
                                            item xl
                                            style={{ flexGrow: 1 }}
                                        >
                                            <Typography 
                                                variant="body1" 
                                                style={{ marginRight: 8 }}
                                            >
                                                {`+${sim_num}`}
                                            </Typography>
                                        </Grid>   
                                    </Grid>
                                }
                            />
                        </ListItem>
                    );
                })
            }
        </List>
    );
}

export default React.memo(BlockedContactList);