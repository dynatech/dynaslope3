import React from "react";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Grow from "@material-ui/core/Grow";
import Paper from "@material-ui/core/Paper";
import Popper from "@material-ui/core/Popper";
import MenuItem from "@material-ui/core/MenuItem";
import MenuList from "@material-ui/core/MenuList";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
    },
    paper: {
        marginRight: theme.spacing(2),
    },
}));

export default function MenuListComposition (props) {
    const { open, setOpen, anchorRef, setAnchor, parent, setOpenDialog, setDeleteAction } = props;
    const classes = useStyles();

    const handleClose = (event) => {
        setOpen(false);
        setAnchor(null);
    };

    const handleClick = (event) => {
        setOpenDialog(true);
    };
    
    const handleDelete = () => {
        parent === "file" ? 
            setDeleteAction("removeFile") : 
            setDeleteAction("removeFolder");
        handleClose();
    };

    return (
        <div className={classes.root}>
            <div>
                <Popper open={open} anchorEl={anchorRef} role={undefined} transition disablePortal>
                    {({ TransitionProps, placement }) => (
                        <Grow
                            {...TransitionProps}
                            style={{ transformOrigin: placement === "bottom" ? "center top" : "center bottom" }}
                        >
                            <Paper>
                                <ClickAwayListener onClickAway={handleClose}>
                                    <MenuList autoFocusItem={open} id="menu-list-grow">
                            
                                        <MenuItem onClick={handleClick}>{parent === "file" ? "Edit" : "Rename"}</MenuItem>
                                        <MenuItem onClick={handleDelete}>Delete</MenuItem>
                                    </MenuList>
                                </ClickAwayListener>
                            </Paper>
                        </Grow>
                    )}
                </Popper>
            </div>
        </div>
    );
}