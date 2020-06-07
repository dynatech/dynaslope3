import React, { Fragment, useState } from "react";
import moment from "moment";
import { Grid } from "@material-ui/core";

import BackToMainButton from "./BackToMainButton";
import RainfallGraph from "./RainfallGraph";
import SurficialGraph from "./SurficialGraph";
import SubsurfaceGraph from "./SubsurfaceGraph";


function ConsolidatedSiteCharts (props) {
    const { 
        match: { params: { site_code } },
        location
    } = props;
    const [ selected, setSelected ] = useState("7 days");
    const default_range_info = { label: "7 days", unit: "day", duration: 7 };
    const [ selected_range_info, setSelectedRangeInfo ] = useState(default_range_info);
    const {
        site: site_data, ts_end,
        to_include, subsurface_columns
    } = location;
    
    let end_ts = ts_end;
    let subsurface_cols = subsurface_columns;
    let show_charts = { ...to_include };
    if (typeof site_data === "undefined") {
        end_ts = moment();
        subsurface_cols = [];
        show_charts = { rainfall: true, surficial: true };
    }

    const input = { site_code, ts_end: end_ts.format("YYYY-MM-DD HH:mm:ss"), range_info: selected_range_info };
    return (
        <Fragment>
            <BackToMainButton 
                {...props}
                selected={selected}
                setSelected={setSelected}
                setSelectedRangeInfo={setSelectedRangeInfo}
            />
            
            <Grid container spacing={1}>
                {
                    show_charts.rainfall && (
                        <Grid item xs={12}>
                            <RainfallGraph {...props} input={input} disableBack />
                        </Grid>
                    )
                }
                
                {
                    show_charts.surficial && (
                        <Grid item xs={12}>
                            <SurficialGraph {...props} input={input} disableBack />
                        </Grid>
                    )
                }
                
                {
                    subsurface_cols.map(sc => {
                        const temp = { ...input, tsm_sensor: sc };
                        return (
                            <Grid key={sc} item xs={12}>
                                <SubsurfaceGraph {...props} input={temp} disableBack />
                            </Grid>
                        );
                    })
                }
            </Grid>
        </Fragment>
    );
}

export default ConsolidatedSiteCharts;
