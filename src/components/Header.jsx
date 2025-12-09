import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useAuth } from '../context/authContext';

const Header = ({ drawerWidth, onLogout }) => {
  const { logout } = useAuth();

  console.log("logout function in Header:", logout);

  

  return (
    <AppBar
      position="fixed"
      // Header ki width ko Sidebar se offset (calculate) karna zaroori hai
      sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Sales Admin Portal
        </Typography>
        <Button color="inherit" onClick={logout}>Logout</Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;