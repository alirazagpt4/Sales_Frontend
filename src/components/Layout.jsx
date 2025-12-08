import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar, CssBaseline } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const drawerWidth = 240; // Sidebar ki fixed width

const Layout = ({ onLogout }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline /> 
      
      {/* 1. Header */}
      <Header drawerWidth={drawerWidth} onLogout={onLogout} />

      {/* 2. Sidebar */}
      <Sidebar drawerWidth={drawerWidth} />

      {/* 3. Main Content Area */}
      <Box
        component="main"
        sx={{ 
            flexGrow: 1, 
            p: 3, 
            width: `calc(100% - ${drawerWidth}px)`, // Sidebar ke baad ki space
            minHeight: '100vh', // Ensures Footer is at the bottom
            display: 'flex',
            flexDirection: 'column'
        }}
      >
        <Toolbar /> {/* Header ke niche content ko dhakelne ke liye */}
        
        {/* Yeh Main content hai jo sidebar click par change hoga */}
        <Box sx={{ flexGrow: 1 }}>
            <Outlet />
        </Box>

        {/* 4. Footer */}
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;