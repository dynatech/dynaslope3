import React, { forwardRef } from "react";
import { Fade, Slide } from "@material-ui/core";

export const SlideTransition = forwardRef((props, ref) => (
    <Slide direction="up" {...props} ref={ref} />
));

export const FadeTransition = forwardRef((props, ref) => (
    <Fade {...props} ref={ref} />
));