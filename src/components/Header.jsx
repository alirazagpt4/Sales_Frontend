import React, { useState } from 'react';
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Box, 
    Menu, 
    MenuItem, 
    IconButton, 
    Avatar 
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList'; // Settings Icon ke liye
import { useAuth } from '../context/authContext';


// NOTE: Agar aapne logo ko 'public' folder mein daala hai, toh yeh path theek kaam karega.

const Header = ({ drawerWidth }) => {
    // useAuth se logout aur user data fetch kiya (user object mein username hai)
    const { logout, user } = useAuth(); 

    console.log("user ....... " , user);
    
    // Dropdown menu ke liye states
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    // Context se username fetch kiya
    const userName = user.fullname || "Admin User";
    
    // --- Handlers for Dropdown Menu ---
    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleClose();
        logout(); // AuthContext ka logout function call kiya
    };

    // 🎨 Green Color Setting (Logo se matching dark green)
    const HeaderColor = '#2e7d32'; // Standard MUI Green (A500)
    // Ya aap aur gehra dark green use kar sakte hain: '#388E3C'; 

    return (
        <AppBar
            position="fixed"
            sx={{ 
                width: `calc(100% - ${drawerWidth}px)`, 
                ml: `${drawerWidth}px`,
                backgroundColor: HeaderColor, // 🟢 Green Color Applied 
            }}
        >
            <Toolbar>
                
                {/* 1. LEFT SIDE: Logo and Portal Title */}
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    
                    <Typography variant="h6" noWrap component="div" sx={{ color: '#fff' }}>
                        Farm Solutions Portal
                    </Typography>
                </Box>
                
                {/* 2. RIGHT SIDE: Settings Icon and Dropdown */}
                <div>
                    <IconButton
                        size="large"
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleMenu}
                        color="inherit" // Icon ka color white/inherit rahega
                    >
                        {/* Settings Icon ko Avatar ke taur par use kiya */}
                        <Avatar sx={{ bgcolor: '#fff', color: HeaderColor, width: 32, height: 32 }}>
                             <FilterListIcon fontSize="small" /> 
                        </Avatar>
                    </IconButton>
                    
                    {/* Dropdown Menu */}
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        keepMounted
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        open={open}
                        onClose={handleClose}
                    >
                        {/* A. Logged-in User Name (Disabled Item) */}
                        <MenuItem disabled>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Hi, {userName}
                            </Typography>
                        </MenuItem>
                        
                        {/* B. Logout Option */}
                        <MenuItem onClick={handleLogout}>
                            Logout
                        </MenuItem>
                    </Menu>
                </div>
            </Toolbar>
        </AppBar>
    );
};

export default Header;