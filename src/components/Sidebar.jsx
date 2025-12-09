import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Divider } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import GroupIcon from '@mui/icons-material/Group';
import BarChartIcon from '@mui/icons-material/BarChart';

const Sidebar = ({ drawerWidth }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Active route path pata karne ke liye

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Customers', icon: <GroupIcon />, path: '/customers' },
    { text: 'Users', icon: <PeopleIcon />, path: '/users' },
    { text: 'Reports', icon: <BarChartIcon />, path: '/reports' },
  ];

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Toolbar /> {/* Header jitni height ki space create karta hai */}
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
                onClick={() => navigate(item.path)}
                // Current path ke hisaab se button ko highlight (selected) karte hain
                selected={location.pathname === item.path || (location.pathname === '/' && item.path === '/')}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;