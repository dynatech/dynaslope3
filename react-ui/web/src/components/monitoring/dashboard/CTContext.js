import React, { createContext, useState } from "react";

export const CTContext = createContext();

export const CTProvider = ({ children }) => {
    const [reporter_id_ct, setReporterIdCt] = useState("");
    const [ct_full_name, setCTFullName] = useState("---");

    return (
        <CTContext.Provider value={{
            reporter_id_ct, setReporterIdCt,
            ct_full_name, setCTFullName
        }}>
            {children}
        </CTContext.Provider>
    );
};