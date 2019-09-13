import React from "react";
import Grow from "@material-ui/core/Grow";
import TextField from "@material-ui/core/TextField";
import IconButton from "@material-ui/core/IconButton";
import ForwardIcon from "@material-ui/icons/Forward";
import ClearIcon from "@material-ui/icons/Clear";
import { withStyles } from "@material-ui/core/styles";

const defaultSearchStyles = theme => ({
    main: {
        display: "flex",
        flex: "1 0 auto",
    },
    searchText: {
        flex: "0.8 0",
    },
    clearIcon: {
        "&:hover": {
            color: theme.palette.error.main,
        },
    },
});

class CustomSearchRender extends React.Component {
    componentDidMount () {
        document.addEventListener("keydown", this.onKeyDown, false);
    }

    componentWillUnmount () {
        document.removeEventListener("keydown", this.onKeyDown, false);
    }

handleTextChange = event => {
    const { options, onSearch } = this.props;
    const { onSearchChange } = options;

    if (onSearchChange) {
        onSearchChange(event.target.value);
    }

    onSearch(event.target.value);
};

onKeyDown = event => {
    const { onHide, onSearchClick } = this.props;
    if (event.keyCode === 27) {
        onHide();
    } else if (event.keyCode === 13) {
        onSearchClick();
    }
};

render () {
    const { classes, options, onHide, searchText, onSearchClick } = this.props;

    return (
        <Grow appear in timeout={300}>
            <div className={classes.main} ref={el => (this.rootRef = el)}>
                <TextField
                    placeholder="Type words to search event start and end columns..."
                    className={classes.searchText}
                    InputProps={{
                        "aria-label": options.textLabels.toolbar.search,
                    }}
                    value={searchText || ""}
                    onChange={this.handleTextChange}
                    fullWidth
                    inputRef={el => (this.searchField = el)}
                />
                <IconButton className={classes.clearIcon} style={{ marginLeft: 6 }} onClick={onSearchClick}>
                    <ForwardIcon />
                </IconButton>
                <IconButton className={classes.clearIcon} onClick={onHide}>
                    <ClearIcon />
                </IconButton>
            </div>
        </Grow>
    );
}
}

export default withStyles(defaultSearchStyles, { name: "CustomSearchRender" })(CustomSearchRender);