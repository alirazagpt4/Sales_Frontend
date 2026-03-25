import React, { useState } from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Divider, Box, Collapse, Tooltip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import GroupIcon from '@mui/icons-material/Group';
import BarChartIcon from '@mui/icons-material/BarChart';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const Sidebar = ({ drawerWidth, open }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openReports, setOpenReports] = useState(false);

  const handleReportsToggle = () => {
    if (!open) return; // Agar sidebar band hai toh toggle na ho
    setOpenReports(!openReports);
  };

  const FarmSolutionsLogoPath = '/farmsolution.png';

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : 64,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : 64,
          overflowX: 'hidden',
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: [1] }}>
        {open ? (
          <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
             <img src={FarmSolutionsLogoPath} alt="Logo" style={{ height: 50 }} />
          </Box>
        ) : (
          <img src={FarmSolutionsLogoPath} alt="Logo" style={{ height: 30 }} /> 
        )}
      </Toolbar>
      <Divider />
      
      <List>
        {/* Dashboard */}
        <Tooltip title={!open ? "Dashboard" : ""} placement="right">
            <ListItemButton 
                onClick={() => navigate('/')} 
                selected={location.pathname === '/'}
                sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }}
            >
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>
                    <DashboardIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Dashboard" />}
            </ListItemButton>
        </Tooltip>

        {/* Customers */}
        <Tooltip title={!open ? "Customers" : ""} placement="right">
            <ListItemButton 
                onClick={() => navigate('/customers')} 
                selected={location.pathname === '/customers'}
                sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }}
            >
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>
                    <GroupIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Customers" />}
            </ListItemButton>
        </Tooltip>

        {/* Users */}
        <Tooltip title={!open ? "Users" : ""} placement="right">
            <ListItemButton 
                onClick={() => navigate('/users')} 
                selected={location.pathname === '/users'}
                sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }}
            >
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>
                    <PeopleIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Users" />}
            </ListItemButton>
        </Tooltip>

        {/* Reports Parent */}
        <Tooltip title={!open ? "Reports" : ""} placement="right">
            <ListItemButton 
                onClick={handleReportsToggle}
                sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }}
            >
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>
                    <BarChartIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Reports" />}
                {open && (openReports ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
        </Tooltip>

        {/* Nested Items - Sirf open state mein dikhenge */}
        <Collapse in={open && openReports} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton sx={{ pl: 4 }} onClick={() => navigate('/reports')} selected={location.pathname === '/reports'}>
              <ListItemText primary="Daily Visit Report" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 4 }} onClick={() => navigate('/summary-reports')} selected={location.pathname === '/summary-reports'}>
              <ListItemText primary="Summary Visit Report" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 4 }} onClick={() => navigate('/meter-reading-reports')} selected={location.pathname === '/meter-reading-reports'}>
              <ListItemText primary="Meter Reading Report" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
    </Drawer>
  );
};

export default Sidebar;