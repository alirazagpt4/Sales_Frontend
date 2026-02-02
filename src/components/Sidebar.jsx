import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Divider, Box, Collapse } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import GroupIcon from '@mui/icons-material/Group';
import BarChartIcon from '@mui/icons-material/BarChart';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import InventoryIcon from '@mui/icons-material/Inventory';
// import CircleIcon from '@mui/icons-material/Circle'; // Sub-menu ke liye chota icon
// import EventNoteIcon from '@mui/icons-material/EventNote'; // Daily Visit ke liye perfect hai
// import SummarizeIcon from '@mui/icons-material/Summarize'; // Summary ke liye professional hai

const Sidebar = ({ drawerWidth }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Is state se Reports wala hissa khulay ga ya band hoga
  const [openReports, setOpenReports] = useState(false);

  const handleReportsToggle = () => {
    setOpenReports(!openReports);
  };

  const FarmSolutionsLogoPath = '/farmsolution.png';

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
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%', pl: 4 }}>
          <img src={FarmSolutionsLogoPath} alt="FarmSolutions Logo" style={{ height: 60, filter: 'brightness(1.1)' }} />
        </Box>
      </Toolbar>
      <Divider />
      
      <List>
        {/* Dashboard */}
        <ListItemButton onClick={() => navigate('/')} selected={location.pathname === '/'}>
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        {/* Customers */}
        <ListItemButton onClick={() => navigate('/customers')} selected={location.pathname === '/customers'}>
          <ListItemIcon><GroupIcon /></ListItemIcon>
          <ListItemText primary="Customers" />
        </ListItemButton>

        {/* Users */}
        <ListItemButton onClick={() => navigate('/users')} selected={location.pathname === '/users'}>
          <ListItemIcon><PeopleIcon /></ListItemIcon>
          <ListItemText primary="Users" />
        </ListItemButton>
        {/* Items */}
        <ListItemButton onClick={() => navigate('/items')} selected={location.pathname === '/items'}>
          <ListItemIcon><InventoryIcon /></ListItemIcon>
          <ListItemText primary="Items" />
        </ListItemButton>

        

        {/* --- MAIN REPORTS PARENT (Clickable to Expand) --- */}
        <ListItemButton onClick={handleReportsToggle}>
          <ListItemIcon>
            <BarChartIcon />
          </ListItemIcon>
          <ListItemText primary="Reports" />
          {/* Arrow icon jo rotate hota hai */}
          {openReports ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        {/* --- NESTED ITEMS (In par click karne se page khulega) --- */}
        <Collapse in={openReports} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            
            {/* DVR Report */}
            <ListItemButton 
              sx={{ pl: 3.5 }} 
              onClick={() => navigate('/reports')} 
              selected={location.pathname === '/reports'}
            >
              
              <ListItemText primary="Daily Visit Report" />
            </ListItemButton>

            {/* Summary Report */}
            <ListItemButton 
              sx={{ pl: 3.5 }} 
              onClick={() => navigate('/summary-reports')} 
              selected={location.pathname === '/summary-reports'}
            >
              
              <ListItemText primary="Summary Visit Report" />
            </ListItemButton>

          </List>
        </Collapse>
      </List>
    </Drawer>
  );
};

export default Sidebar;