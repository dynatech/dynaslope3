const phivolcs_red = "#FE0000";
const dynaslope_blue = "#16526D";
const dynaslope_orange = "#F8991D";
const daag_yellow = "#FCEE27";
const zarcon_red = "#991B1E";

const styles = theme => ({
    dynaslopeLogo: {
        // width: 60,
        // height: 47.28
        height: 60
    },
    phivolcsLogo: {
        height: 70,
        marginTop: 8
    },
    phivolcsDynaslopeLogo: {
        height: 62
    },
    pageContentMargin: {
        margin: "0 16px",
        [theme.breakpoints.up("md")]: {
            margin: "0 64px"
        },
        [theme.breakpoints.up("lg")]: {
            margin: "0 100px"
        }
    },
    paperContainer: {
        width: "100%",
        overflowX: "auto"
    },
    sectionHeadContainer: {
        margin: "20px 0"
    },
    sectionHead: {
        fontSize: "1.5rem",
        [theme.breakpoints.down("xs")]: {
            fontSize: "1.2rem"
        }
    },
    extended: {
        backgroundColor: "green"
    },
    alert0: {
        backgroundColor: "#EEEEEE"
    },
    alert1: {
        backgroundColor: daag_yellow
    },
    alert2: {
        backgroundColor: dynaslope_orange,
        "& *": {
            color: "white !important"
        }
    },
    alert3: {
        backgroundColor: zarcon_red,
        "& *": {
            color: "white !important"
        }
    },
    dyna_error: {
        color: phivolcs_red
    }
});

export const alert_1 = daag_yellow;
export const alert_2 = dynaslope_orange;
export const alert_3 = zarcon_red;

export default styles;
