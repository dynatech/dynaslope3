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
    }
});

export default styles;
