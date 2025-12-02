import React, { createContext, useContext, useState, useEffect } from "react";
import { useSelector } from "react-redux";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const user = useSelector((state) => state.auth.user);
    const [isAuthenticated, setIsAuthenticated] = useState(!!user);

    useEffect(() => {
        setIsAuthenticated(!!user);
    }, [user]);

    return (
        <AuthContext.Provider value={{ isAuthenticated,user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
