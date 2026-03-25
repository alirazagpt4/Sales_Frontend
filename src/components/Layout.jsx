import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar, CssBaseline } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ onLogout }) => {
  const [open, setOpen] = useState(true); // Sidebar toggle state
  const drawerWidth = 240;

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline /> 
      
      {/* Header ko drawerWidth aur toggle function pass kiya */}
      <Header 
        drawerWidth={open ? drawerWidth : 64} 
        onLogout={onLogout} 
        handleDrawerToggle={handleDrawerToggle}
      />

      {/* Sidebar ko open state pass ki */}
      <Sidebar drawerWidth={drawerWidth} open={open} />

      <Box
        component="main"
        sx={{ 
            flexGrow: 1, 
            p: 3, 
            // Dynamic width calculation based on sidebar state
            width: `calc(100% - ${open ? drawerWidth : 64}px)`,
            transition: (theme) => theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}
      >
        <Toolbar /> 
        <Box sx={{ flexGrow: 1 }}>
            <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;