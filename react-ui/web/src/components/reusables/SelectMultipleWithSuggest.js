/* eslint-disable react/prop-types, react/jsx-handler-names */

import React from "react";
import Select from "react-select";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import NoSsr from "@material-ui/core/NoSsr";
import TextField from "@material-ui/core/TextField";
import Paper from "@material-ui/core/Paper";
import Chip from "@material-ui/core/Chip";
import MenuItem from "@material-ui/core/MenuItem";
import CancelIcon from "@material-ui/icons/Cancel";
import { emphasize } from "@material-ui/core/styles/colorManipulator";

const styles = theme => ({
    root: {
        flexGrow: 1
    },
    input: {
        display: "flex",
        padding: 0,
        height: "auto"
    },
    valueContainer: {
        display: "flex",
        flexWrap: "wrap",
        flex: 1,
        alignItems: "center",
        overflow: "hidden",
    },
    chip: {
        margin: theme.spacing(1 * 0.5, 1 * 0.25),
    },
    chipFocused: {
        backgroundColor: emphasize(
            theme.palette.type === "light" ? theme.palette.grey[300] : theme.palette.grey[700],
            0.08,
        ),
    },
    noOptionsMessage: {
        padding: theme.spacing(1, 2)
    },
    singleValue: {
        fontSize: 16,
    },
    placeholder: {
        position: "absolute",
        left: 2,
        fontSize: 16,
    },
    paper: {
        position: "absolute",
        zIndex: 2,
        marginTop: theme.spacing(1),
        left: 0,
        right: 0,
    },
    divider: {
        height: theme.spacing(2),
    }
});

function NoOptionsMessage (props) {
    const { selectProps, innerProps, children } = props;

    return (
        <Typography
            color="textSecondary"
            className={selectProps.classes.noOptionsMessage}
            {...innerProps}
        >
            {children}
        </Typography>
    );
}

function inputComponent ({ inputRef, ...props }) {
    return <div ref={inputRef} {...props} />;
}

function Control (props) {
    const {
        selectProps, innerRef,
        children, innerProps, isDisabled
    } = props;
    
    return (
        <TextField
            fullWidth
            InputProps={{
                inputComponent,
                inputProps: {
                    className: selectProps.classes.input,
                    inputRef: innerRef,
                    children,
                    ...innerProps,
                },
            }}
            {...selectProps.textFieldProps}
            disabled={isDisabled}
        />
    );
}

function Option (props) {
    const {
        innerRef, isFocused, isSelected,
        innerProps, children, data
    } = props;
    const fcolor = data.color;
    return (
        <MenuItem
            buttonRef={innerRef}
            selected={isFocused}
            component="div"
            style={{
                fontWeight: isSelected ? 500 : 400,
                color: fcolor,
            }}
            {...innerProps}
        >
            {children}
        </MenuItem>
    );
}

function Placeholder (props) {
    const { selectProps, innerProps, children } = props;

    return (
        <Typography
            color="textSecondary"
            className={selectProps.classes.placeholder}
            {...innerProps}
        >
            {children}
        </Typography>
    );
}

function ValueContainer (props) {
    const { selectProps, children } = props;
    return <div className={selectProps.classes.valueContainer}>{children}</div>;
}

function MultiValue (props) {
    const {
        children, selectProps, isFocused,
        data, removeProps
    } = props;

    const { chipLabel } = data;
    const label = typeof chipLabel !== "undefined" ? chipLabel : children;

    return (
        <Chip
            tabIndex={-1}
            label={label}
            className={`${selectProps.classes.chip} ${
                { [selectProps.classes.chipFocused]: isFocused,
                }}`
            }
            onDelete={removeProps.onClick}
            deleteIcon={<CancelIcon {...removeProps} />}
        />
    );
}

function Menu (props) {
    const { selectProps, innerProps, children } = props;

    return (
        <Paper square className={selectProps.classes.paper} {...innerProps}>
            {children}
        </Paper>
    );
}

function SelectMultipleWithSuggest (props) {
    const {
        classes, changeHandler, isRequired,
        options, value, label, placeholder,
        renderDropdownIndicator, openMenuOnClick, isMulti,
        isDisabled, isClearable, hasAlternativeChipLabel
    } = props;

    const selectStyles = {
        input: base => ({
            ...base,
            color: "blue",
            "& input": {
                font: "inherit"
            }
        }),
        menuPortal: provided => ({ ...provided, zIndex: 9999 })
    };

    const components = {
        Control,
        Menu,
        MultiValue,
        NoOptionsMessage,
        Option,
        Placeholder,
        ValueContainer
    };

    const open_menu_on_click = openMenuOnClick === undefined ? true : openMenuOnClick;
    const is_multi = isMulti === undefined ? false : isMulti;
    const is_disabled = isDisabled === undefined ? false : isDisabled;
    const is_clearable = isClearable === undefined ? false : isClearable;
    const is_required = isRequired === undefined ? false : isRequired;

    const rdd = renderDropdownIndicator === undefined ? true : renderDropdownIndicator;
    if (rdd === false) {
        components.DropdownIndicator = () => null;
        components.IndicatorSeparator = () => null;
    }

    return (
        <div className={classes.root}>
            <NoSsr>
                <Select
                    required={is_required}
                    classes={classes}
                    styles={selectStyles}
                    textFieldProps={{
                        label,
                        InputLabelProps: {
                            shrink: true,
                        }
                    }}
                    menuPortalTarget={document.body}
                    options={options}
                    components={components}
                    value={value}
                    onChange={changeHandler}
                    placeholder={placeholder}
                    isMulti={is_multi}
                    openMenuOnFocus={false}
                    openMenuOnClick={open_menu_on_click}
                    isDisabled={is_disabled}
                    isClearable={is_clearable}
                    hasAlternativeChipLabel={hasAlternativeChipLabel}
                />
            </NoSsr>
        </div>
    );
}

export default withStyles(styles, { withTheme: true })(SelectMultipleWithSuggest);