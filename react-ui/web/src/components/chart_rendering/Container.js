import React, { Fragment, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core";
import { useSnackbar } from "notistack";

import RainfallGraph from "../analysis/integrated_site/RainfallGraph";
import SurficialGraph from "../analysis/integrated_site/SurficialGraph";
import SubsurfaceGraph from "../analysis/integrated_site/SubsurfaceGraph";
import { getCurrentUser } from "../sessions/auth";
import PageTitle from "../reusables/PageTitle";
import GeneralStyles from "../../GeneralStyles";
import { capitalizeFirstLetter } from "../../UtilityFunctions";

function Container (props) {
    const { match: { params: {
        site_code, ts_end,
        chart_type, tsm_sensor
    } } } = props;
    const [rainfall_comp, setRainfallComp] = useState("");
    const [surficial_comp, setSurficialComp] = useState("");
    const [subsurface_comp, setSubsurfaceComp] = useState("");

    const { enqueueSnackbar } = useSnackbar();

    const current_user = getCurrentUser();
    const classes = makeStyles(theme => GeneralStyles(theme))();

    useEffect(() => {
        enqueueSnackbar(
            "Please wait for the charts to load before closing the page. " +
            "If loading took long enough, please wait for about a minute and check " +
            "your connection before trying again. " +
            "If loading problem persist, contact the developers.",
            {
                variant: "warning",
                autoHideDuration: 10000,
                style: { whiteSpace: "pre-line" },
                anchorOrigin: {
                    vertical: "top",
                    horizontal: "center",
                }
            }
        );

        const input = { site_code, ts_end }; // "2017-06-09 04:30:00"
        let temp;

        if (chart_type === "rainfall") {
            temp = <RainfallGraph 
                {...props}
                input={input}
                currentUser={current_user}
                disableBack 
                saveSVG
            />;
            setRainfallComp(temp);
        } else if (chart_type === "surficial") {
            temp = <SurficialGraph 
                {...props}
                input={input}
                currentUser={current_user}
                disableBack
                disableMarkerList
                isEndOfShift
                saveSVG
            />;
            setSurficialComp(temp);
        } else if (chart_type === "subsurface") {
            input.tsm_sensor = tsm_sensor;
            temp = <SubsurfaceGraph 
                {...props}
                input={input}
                currentUser={current_user}
                disableBack
                saveSVG
                isEOS
            />;
            setSubsurfaceComp(temp);
        }
    }, []);

    const type = capitalizeFirstLetter(chart_type);

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle
                    title={`Chart Rendering | ${site_code.toUpperCase()} | ${type}`}
                />
            </div>
            <div className={classes.pageContentMargin}>
                { rainfall_comp }
                { surficial_comp }
                { subsurface_comp }
            </div>
        </Fragment>
    );
}

export default Container;
