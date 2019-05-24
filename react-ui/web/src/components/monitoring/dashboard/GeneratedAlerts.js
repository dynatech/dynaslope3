import React, { PureComponent, Fragment } from "react";
import {
    Card, CardContent, Typography,
    Grid, CardActionArea,
    Button, Dialog, DialogContent,
    DialogTitle, DialogActions, Divider
} from "@material-ui/core";

let id = 0;
function createData (trigger_type, trigger_ts) {
    id += 1;
    return { id, trigger_type, trigger_ts };
}

class GeneratedAlerts extends PureComponent {
    state = {
        open: false,
        key: 0
    };
    
    handleClickOpen = i => event => {
        this.setState({ open: true, key: i });
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    createCard = (i) => (
        <Grid item xs={6} sm={3} lg={2} key={i}>
            <Card className="alert-card">
                <CardActionArea onClick={this.handleClickOpen(i)}>
                    <CardContent style={{ paddingBottom: 16 }}>
                        <Typography className="card-title" color="textSecondary" gutterBottom>
                            10 April 2019, 16:30
                        </Typography>
                        <div style={{ display: "flex", alignItems: "baseline", alignContent: "flex-end", justifyContent: "space-between" }}>
                            <Typography variant="h5" component="h2">
                                GAM
                            </Typography>
                            <Typography className="card-internal-alert" color="textSecondary">
                                ND-R
                            </Typography>
                        </div>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    )

    render () {
        const { key } = this.state; 

        return (
            <Fragment>
                <Grid container spacing={16}>
                    {
                        [...Array(50)].map((e, i) => this.createCard(i))
                    }
                    {/* {cards} */}
                </Grid>

                <div>
                    <Dialog
                        fullWidth
                        open={this.state.open}
                        onClose={this.handleClose}
                        aria-labelledby="alert-dialog-title"
                        aria-describedby="alert-dialog-description"
                    >
                        <DialogTitle id="alert-dialog-title">
                            Brgy. Gamut, Tago, Surigao Del Sur (GAM)
                            <Typography variant="overline">
                                10 April 2019, 16:30
                            </Typography>
                        </DialogTitle>
                        <DialogContent>
                            <Grid container spacing={8}>
                                <Grid item sm={6}>
                                    <Typography variant="body1" color="textSecondary">Internal Alert Level</Typography>
                                    <Typography variant="body1" color="textPrimary">A3-sG0R</Typography>
                                </Grid>
                                <Grid item sm={6}>
                                    <Typography variant="body1" color="textSecondary">Validity</Typography>
                                    <Typography variant="body1" color="textPrimary">12 April 2019, 20:00</Typography>
                                </Grid>

                                <Grid item xs={12}><Divider /></Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" color="textPrimary">Operational Alert Status</Typography>
                                </Grid>

                                <Grid item sm={4}>
                                    <Typography variant="body1" color="textSecondary">Rainfall Alert</Typography>
                                    <Typography variant="body1" color="textPrimary">r1</Typography>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="body1" color="textSecondary">Surficial Alert</Typography>
                                    <Typography variant="body1" color="textPrimary">g0</Typography>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="body1" color="textSecondary">Manifestation Alert</Typography>
                                    <Typography variant="body1" color="textPrimary">md</Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textPrimary">Subsurface Column Status</Typography>
                                </Grid>

                                {
                                    key % 2 === 0
                                        ? <Fragment>
                                            <Grid item sm={4}>
                                                <Typography variant="body1" color="textSecondary">BLCSB</Typography>
                                                <Typography variant="body1" color="textPrimary">sd</Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Typography variant="body1" color="textSecondary">BLCTA</Typography>
                                                <Typography variant="body1" color="textPrimary">s2</Typography>
                                            </Grid>
                                        </Fragment>
                                        : <Grid item xs={12}>
                                            <Typography variant="body1" color="textSecondary">No subsurface sensors available</Typography>
                                        </Grid>
                                }

                                {/* <Grid item sm={4}>
                                    <Typography variant="body1" color="textSecondary">BLCSB</Typography>
                                    <Typography variant="body1" color="textPrimary">sd</Typography>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="body1" color="textSecondary">BLCTA</Typography>
                                    <Typography variant="body1" color="textPrimary">s2</Typography>
                                </Grid> */}

                                <Grid item xs={12}><Divider /></Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" color="textPrimary">Event Triggers</Typography>
                                </Grid>

                                <Grid item sm={4}>
                                    <Typography variant="body1" color="textSecondary">Rainfall</Typography>
                                    <Typography variant="body1" color="textPrimary">11 April 2019, 21:30</Typography>
                                </Grid>
                                <Grid item sm={4}>
                                    <Typography variant="body1" color="textSecondary">Subsurface (s)</Typography>
                                    <Typography variant="body1" color="textPrimary">09 April 2019, 03:00</Typography>
                                </Grid>
                                <Grid item sm={4}>
                                    <Typography variant="body1" color="textSecondary">Surficial (G)</Typography>
                                    <Typography variant="body1" color="textPrimary">10 April 2019, 11:30</Typography>
                                </Grid>
                            </Grid>
                            
                            {/* <Divider />
                            
                            <Table style={{ minWidth: 400 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Trigger Type</TableCell>
                                        <TableCell align="right">Trigger Timestamp</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map(row => (
                                        <TableRow key={row.id}>
                                            <TableCell component="th" scope="row">
                                                {row.trigger_type}
                                            </TableCell>
                                            <TableCell align="right">{row.trigger_ts}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table> */}
                            
                            {/* <DialogContentText id="alert-dialog-description">
                                Internal Alert: A1-R
                            </DialogContentText> */}
                        </DialogContent>
                        
                        <DialogActions>
                            <Button onClick={this.handleClose} color="primary" autoFocus>
                                Close
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            </Fragment>
        );
    }
}


export default GeneratedAlerts;