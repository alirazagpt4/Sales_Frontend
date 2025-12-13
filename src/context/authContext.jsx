import React, { createContext, useContext, useState, useEffect } from 'react';
import { CircularProgress, Box, Typography } from '@mui/material'; // MUI components for loading screen

// Create the AuthContext
const AuthContext = createContext();

// useAuth custom hook for easy access to AuthContext
export const useAuth = () => {
    return useContext(AuthContext);
}

// AuthProvider component to wrap around the app

 export const AuthProvider = ({ children }) =>{


    //  State to hold authentication status
    const [token, setToken] = useState(null); 
    const [user, setUser] = useState(
         localStorage.getItem('username') || null 
    );
     
    console.log("user in auth context ...." , user)
    const [loading, setLoading] = useState(true);

    

    // initial token check and load
    useEffect(() => {
        
       // Sirf LocalStorage se token check karein
        const storedToken = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username')
        
        
        if (storedToken) {
            setToken(storedToken);
            if (storedUsername) {
                setUser(storedUsername); 
            }
           
        }
        
        setLoading(false); // Load hone ke baad loading state false karein
    }, []);
``

    // Login function
    const login = (receivedToken , username) => { 
    localStorage.setItem('token', receivedToken); // Seedha local storage mein set kiya
    localStorage.setItem('username' , username);

    console.log("user ... login auth , ..." , username);

    setToken(receivedToken); // Sahi value state mein set ki
    setUser(username);
   
}


    // --- 3. Logout Function ---
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username')
       // User details bhi remove karein
        setToken(null);
        setUser(null)
      
        
    };

    // Context value to be provided
    const value = {
        user,
        token,
        login,
        logout,
        loading,
    };

    // --- Loading Screen ---

    if (loading) {

        return (

            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f8' }}>

                <CircularProgress color="primary" sx={{ mb: 2 }} />

                <Typography variant="h6">Loading Admin Portal...</Typography>

            </Box>

        );

    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );

    
}




