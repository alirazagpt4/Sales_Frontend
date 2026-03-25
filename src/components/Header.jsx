import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, Menu, MenuItem, IconButton, Avatar } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import MenuIcon from '@mui/icons-material/Menu'; // Hamburger Icon
import { useAuth } from '../context/authContext';

const Header = ({ drawerWidth, handleDrawerToggle }) => {
    const { logout, user } = useAuth(); 
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const userName = user?.fullname || "Admin User";
    const HeaderColor = '#2e7d32'; 

    return (
        <AppBar
            position="fixed"
            sx={{ 
                width: `calc(100% - ${drawerWidth}px)`, 
                ml: `${drawerWidth}px`,
                backgroundColor: HeaderColor,
                transition: (theme) => theme.transitions.create(['width', 'margin'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                }),
            }}
        >
            <Toolbar>
                {/* Hamburger Button */}
                <IconButton
                    color="inherit"
                    aria-label="toggle drawer"
                    onClick={handleDrawerToggle}
                    edge="start"
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>
                
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" noWrap component="div" sx={{ color: '#fff' }}>
                        Farm Solutions Portal
                    </Typography>
                </Box>
                
                <div>
                    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} color="inherit">
                        <Avatar sx={{ bgcolor: '#fff', color: HeaderColor, width: 32, height: 32 }}>
                             <FilterListIcon fontSize="small" /> 
                        </Avatar>
                    </IconButton>
                    
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <MenuItem disabled>
                            <Typography variant="subtitle1" fontWeight="bold">Hi, {userName}</Typography>
                        </MenuItem>
                        <MenuItem onClick={() => { logout(); setAnchorEl(null); }}>Logout</MenuItem>
                    </Menu>
                </div>
            </Toolbar>
        </AppBar>
    );
};

export default Header;