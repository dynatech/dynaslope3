const styles = theme => ({
    dynaslopeLogo: {
        width: "60px",
        height: "47.28px"
    },
    phivolcsLogo: {
        width: "42.72px",
        height: "53px",
        marginLeft: "7px"
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
