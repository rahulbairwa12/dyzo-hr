import { useEffect, useState, createContext, useContext } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const UserAuthContext = createContext()

export const UserAuthCheck = ({ children }) => {
    const userInfo = useSelector(state => state.auth.user)
    const navigate = useNavigate()

    useEffect(() => {
        const checkUserRole = () => {
            if (!(userInfo?.isAdmin || userInfo?.team_leader)) {
                navigate('/404');
              }
        };
    
        if (userInfo) {
            checkUserRole();
        }
    }, []);
    

    return (
        <UserAuthContext.Provider value = {null}>
          { children}
        </UserAuthContext.Provider>
    )
}

export const useUserAuth = () => {
    return useContext(UserAuthContext)
}
