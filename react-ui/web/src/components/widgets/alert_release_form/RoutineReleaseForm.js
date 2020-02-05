import React, { useState, useEffect } from "react";
import MomentUtils from "@date-io/moment";
import moment from "moment";
import {
    Grid, Divider, makeStyles
} from "@material-ui/core";
import {
    MuiPickersUtilsProvider,
    KeyboardDateTimePicker, KeyboardTimePicker
} from "@material-ui/pickers";
import List from "@material-ui/core/List";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Checkbox from "@material-ui/core/Checkbox";
import Button from "@material-ui/core/Button";

import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";
import { CTContext } from "../../monitoring/dashboard/CTContext";
import { getUnreleasedRoutineSites } from "./ajax";

const useStyles = makeStyles(theme => ({
    inputGridContainer: {
        marginTop: 6,
        marginBottom: 6
    },
    checkboxGridContainer: {
        marginTop: 12,
        marginBottom: 6
    },
    selectInput: {
        width: "auto",
        [theme.breakpoints.down("xs")]: {
            width: "250px"
        }
    },
    root: {
        margin: "auto",
    },
    cardHeader: {
        padding: theme.spacing(1, 2),
    },
    list: {
        width: 200,
        height: 230,
        backgroundColor: theme.palette.background.paper,
        overflow: "auto",
    },
    button: {
        margin: theme.spacing(0.5, 0),
    },
}));

function not (a, b) {
    return a.filter(row => !b.some(x => x.value === row.value));
}
  
function intersection (a, b) {
    return a.filter(row => b.some(x => x.value === row.value));
}
  
function union (a, b) {
    return [...a, ...not(b, a)];
}

function RoutineReleaseForm (comp_props) {
    const {
        routineData, setRoutineData,
        a0SiteList, setA0SiteList,
        NDSiteList, setNDSiteList,
        dataTimestamp, setDataTimestamp
    } = comp_props;
    const classes = useStyles();
    const { reporter_id_ct } = React.useContext(CTContext);

    const [form_release_time, setFormReleaseTime] = useState(null);

    useEffect(() => {
        setFormReleaseTime(routineData.release_time);
    }, [routineData]);

    const { reporter_id_mt } = routineData;

    const handleDateTime = key => value => {
        const temp = { ...routineData, [key]: value };
        setDataTimestamp(moment(value).format("YYYY-MM-DD HH:mm:00"));
        setRoutineData(temp);
    };
    

    const [checked, setChecked] = React.useState([]);

    const leftChecked = intersection(checked, a0SiteList.site_id_list);
    const rightChecked = intersection(checked, NDSiteList.site_id_list);

    const handleToggle = (value, list) => () => {
        const currentIndex = checked.findIndex(row => row.value === value);
        const newChecked = [...checked];

        if (currentIndex === -1) {
            const site = list.find(row => row.value === value);
            newChecked.push(site);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        setChecked(newChecked);
    };

    const numberOfChecked = items => intersection(checked, items).length;

    const handleToggleAll = items => () => {
        if (numberOfChecked(items) === items.length) {
            setChecked(not(checked, items));
        } else {
            setChecked(union(checked, items));
        }
    };

    const handleCheckedRight = () => {
        setNDSiteList({
            ...NDSiteList,
            site_id_list: NDSiteList.site_id_list.concat(leftChecked)
        });
        setA0SiteList({
            ...a0SiteList,
            site_id_list: not(a0SiteList.site_id_list, leftChecked)
        });
        setChecked(not(checked, leftChecked));
    };

    const handleCheckedLeft = () => {
        setA0SiteList({
            ...a0SiteList,
            site_id_list: a0SiteList.site_id_list.concat(rightChecked)
        });
        setNDSiteList({
            ...NDSiteList,
            site_id_list: not(NDSiteList.site_id_list, rightChecked)
        });
        setChecked(not(checked, rightChecked));
    };

    const customList = (title, items) => {
        const { site_id_list } = items;
        return (
            <Card>
                <CardHeader
                    className={classes.cardHeader}
                    avatar={
                        <Checkbox
                            onClick={handleToggleAll(site_id_list)}
                            checked={numberOfChecked(site_id_list) === site_id_list.length && site_id_list.length !== 0}
                            indeterminate={numberOfChecked(site_id_list) !== site_id_list.length && numberOfChecked(site_id_list) !== 0}
                            disabled={site_id_list.length === 0}
                            inputProps={{ "aria-label": "all site_id_list selected" }}
                        />
                    }
                    title={title}
                    // subheader={`${numberOfChecked(site_id_list)}/${site_id_list.length} selected`}
                />
                <Divider />
                <List className={classes.list} dense component="div" role="list">
                    {site_id_list.map(value => {
                        const { value: site_id, label } = value;
                        const labelId = `transfer-list-all-item-${site_id}-label`;

                        return (
                            <ListItem key={site_id} role="listitem" button onClick={handleToggle(site_id, site_id_list)}>
                                <ListItemIcon>
                                    <Checkbox
                                        checked={checked.some(row => row.value === site_id)}
                                        tabIndex={-1}
                                        disableRipple
                                        inputProps={{ "aria-labelledby": labelId }}
                                    />
                                </ListItemIcon>
                                <ListItemText id={labelId} primary={label} />
                            </ListItem>
                        );
                    })}
                    <ListItem />
                </List>
            </Card>
        );
    };

    return (
        <MuiPickersUtilsProvider utils={MomentUtils}>
            <Grid
                container
                justify="space-evenly"
                alignItems="center"
                spacing={1}
            >

                <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                    <KeyboardDateTimePicker
                        required
                        autoOk
                        label="Data timestamp"
                        value={dataTimestamp}
                        onChange={handleDateTime("data_timestamp")}
                        ampm={false}
                        placeholder="2010/01/01 00:00"
                        format="YYYY/MM/DD HH:mm"
                        mask="____/__/__ __:__"
                        clearable
                        disableFuture
                        error={dataTimestamp === null}
                    />
                </Grid>

                <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                    <KeyboardTimePicker
                        required
                        autoOk
                        ampm={false}
                        label="Time of release"
                        mask="__:__"
                        placeholder="00:00"
                        value={form_release_time}
                        onChange={handleDateTime("release_time")}
                        clearable
                    />
                </Grid>

                {/* TRANSFER LIST GOES HERE */}
                <Grid container spacing={2} justify="center" alignItems="center" className={classes.root}>
                    <Grid item>{customList("A0 Sites", a0SiteList)}</Grid>
                    <Grid item>
                        <Grid container direction="column" alignItems="center">
                            <Button
                                variant="outlined"
                                size="small"
                                className={classes.button}
                                onClick={handleCheckedRight}
                                disabled={leftChecked.length === 0}
                                aria-label="move selected NDSiteList"
                            >
                                &gt;
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                className={classes.button}
                                onClick={handleCheckedLeft}
                                disabled={rightChecked.length === 0}
                                aria-label="move selected a0SiteList"
                            >
                                &lt;
                            </Button>
                        </Grid>
                    </Grid>
                    <Grid item>{customList("ND Sites", NDSiteList)}</Grid>
                </Grid>

                <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                    <DynaslopeUserSelectInputForm
                        variant="standard"
                        label="MT Personnel"
                        div_id="reporter_id_mt"
                        value={reporter_id_mt}
                        disabled
                    />
                </Grid>

                <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                    <DynaslopeUserSelectInputForm
                        variant="standard"
                        label="CT Personnel"
                        div_id="reporter_id_ct"
                        value={reporter_id_ct}
                        disabled
                    />
                </Grid>
            </Grid>
        </MuiPickersUtilsProvider>
    );

}

export default RoutineReleaseForm;
