import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import WarningIcon from '@material-ui/icons/Warning';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import HeightIcon from '@material-ui/icons/Height';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import { Grid, Button, IconButton, Tooltip} from '@material-ui/core';
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDatePicker } from "@material-ui/pickers";
import moment from "moment";
import { getCurrentUser } from "../../sessions/auth";
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import {createDateTime } from "../shifts_and_reports/EndOfShiftGenerator";
import SelectInputForm from "../../reusables/SelectInputForm";
import MenuIcon from '@material-ui/icons/Menu';

//subComponents
import Event from "./subcomponents/Event";
import Lowering from "./subcomponents/Lowering";
import Extended from "./subcomponents/Extended";
import Routine from "./subcomponents/Routine";


const drawerWidth = 240;
const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },

  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
    padding:20,
  },
  drawerContainer: {
    overflow: 'auto',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    overFlowY: 'auto',
  },
}));

const TabCompenents = (props) => {
  const {selectedTab} = props;
  const components = [
    <Event/>,
    <Lowering/>,
    <Extended/>,
    <Routine/>
    ];
  return components[selectedTab];
}


export default function QAContainer() {
    const classes = useStyles();
    const [selectedTab, setSelectedTab] = useState(0);
    const datetime_now = moment();
    const dt_hr = datetime_now.hour();
    const [start_ts, setStartTs] = useState(datetime_now.format("YYYY-MM-DD"));
    const [shift_time, setShiftTime] = useState(dt_hr >= 10 && dt_hr <= 22 ? "am" : "pm");
    const [isLoading, setIsLoading] = useState(false);
    const [eosData, setEosData] = useState(null);
    const [selectedEosData, setSelectedEosData] = useState(null);
    const [shift_start_ts, setShiftStartTs] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const current_user = getCurrentUser();

    const handleDateTime = value => {
        setStartTs(value);
    };

    const handleClick = key => event => {
        // if (key === "generate_report") {
        //     setModalOpen(false);
        // } else {
        //     setModalOpen(true);
        //     const ts = prepareEOSRequest(start_ts, shift_time, setEosData);
        //     setShiftStartTs(ts);
        // }
        console.log(start_ts, shift_start_ts, shift_time);
    };

    const closeDrawer = () => {
      setDrawerOpen(!drawerOpen)
    };

    const handleChangeTab = (index) => {
      setSelectedTab(index);
      closeDrawer();
    };

  return (
    <div className={classes.root}>
      <CssBaseline />
      <Drawer
        className={classes.drawer}
        variant="temporary"
        classes={{
          paper: classes.drawerPaper,
        }}
        open={drawerOpen}
        onClose={closeDrawer}
      >
        <div className={classes.drawerContainer}>
          <List>
              <Typography variant="overline">select Monitoring Type</Typography>
              <ListItem button onClick={e=> handleChangeTab(0)}>
                <ListItemIcon><WarningIcon/></ListItemIcon>
                <ListItemText primary="Event" />
              </ListItem>
              <ListItem button onClick={e=> handleChangeTab(1)}>
                <ListItemIcon><ArrowDownwardIcon/></ListItemIcon>
                <ListItemText primary="Event Lowering" />
              </ListItem>
              <ListItem button onClick={e=> handleChangeTab(2)}>
                <ListItemIcon><HeightIcon style={{ transform: 'rotate(90deg)'}}/></ListItemIcon>
                <ListItemText primary="Extended" />
              </ListItem>
              <ListItem button onClick={e=> handleChangeTab(3)}>
                <ListItemIcon><AutorenewIcon/></ListItemIcon>
                <ListItemText primary="Routine" />
              </ListItem>
          </List>
          <Divider />
        </div>
      </Drawer>
      <main className={classes.content}>
       <Grid container>
       <Typography variant="h5" color="textSecondary">Quality Assurance</Typography>
       <MuiPickersUtilsProvider utils={MomentUtils}>
                <Grid 
                    container
                    justify="space-between"
                    alignContent="center"
                    alignItems="center"
                    spacing={4}
                    //style={{ display: hidden ? "none !important" : "" }}
                >
                   <Grid item xs={12} sm>
                      <Tooltip placement="top" title="Select Monitoring Type">
                        <IconButton onClick={e=>setDrawerOpen(!drawerOpen)}> 
                          <MenuIcon/>
                        </IconButton>
                      </Tooltip>
                   </Grid>
                  <Grid></Grid>
                    {
                        [
                            { label: "Shift Start", value: start_ts, id: "start_ts" },
                        ].map(row => {
                            const { id } = row;

                            return (
                                <Grid item xs={12} sm key={id} className={classes.inputGridContainer}>
                                    { createDateTime(row, handleDateTime) }
                                </Grid>
                            );
                        })
                    }

                    <Grid item xs={12} sm>
                        <SelectInputForm
                            div_id="shift_time"
                            label="Shift Time"
                            changeHandler={event => setShiftTime(event.target.value)}
                            value={shift_time}
                            list={[{ id: "am", label: "AM" }, { id: "pm", label: "PM" }]}
                            mapping={{ id: "id", label: "label" }}
                            required
                        />
                    </Grid>

                    <Grid
                        item xs={12} sm
                        className={`${classes.inputGridContainer} ${classes.buttonGrid}`}
                    >
                        <Button 
                            variant="contained"
                            color="secondary"
                            //size={isWidthDown("sm", width) ? "small" : "medium"}
                            onClick={
                                handleClick("site_list")
                            }
                            endIcon={<ArrowForwardIosIcon className={classes.button} />}
                        >
                            Generate 
                        </Button>
                    </Grid>
                </Grid>
            </MuiPickersUtilsProvider>
            
            <TabCompenents selectedTab={selectedTab}/>
       </Grid>
      </main>
    </div>
  )}