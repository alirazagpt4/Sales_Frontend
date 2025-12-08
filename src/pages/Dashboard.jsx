import React from 'react';
import { 
    Typography, 
    Grid, 
    Card, 
    CardContent, 
    Box, 
    Icon // Icons ko display karne ke liye
} from '@mui/material';
// Icons import karein
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// --- 1. KPI Data ---
const salesStats = [
    { 
        title: 'Total Revenue', 
        value: '₹ 5.4 Lakh', 
        icon: <AttachMoneyIcon fontSize="large" sx={{ color: '#4caf50' }} />, 
        color: '#e8f5e9' 
    },
    { 
        title: 'Total Orders', 
        value: '1,250', 
        icon: <ShoppingCartIcon fontSize="large" sx={{ color: '#2196f3' }} />, 
        color: '#e3f2fd' 
    },
    { 
        title: 'New Customers', 
        value: '25', 
        icon: <GroupAddIcon fontSize="large" sx={{ color: '#ff9800' }} />, 
        color: '#fff3e0' 
    },
    { 
        title: 'Conversion Rate', 
        value: '12.5%', 
        icon: <TrendingUpIcon fontSize="large" sx={{ color: '#f44336' }} />, 
        color: '#ffebee' 
    },
];

// --- 2. Main Dashboard Component ---
const Dashboard = () => {
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Dashboard - Sales Overview
            </Typography>
            
            {/* KPI Cards ke liye Grid Layout */}
            <Grid container spacing={3}>
                {salesStats.map((stat) => (
                    // md={3} se har card ko 12 column system mein 3 column ki space milegi (i.e., 4 cards in a row)
                    <Grid item xs={12} sm={6} md={3} key={stat.title}>
                        <Card 
                            elevation={3} // Card ko halka shadow dene ke liye
                            sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                padding: 2, 
                                backgroundColor: stat.color, 
                                height: '100%',
                            }}
                        >
                            {/* Icon Section */}
                            <Box sx={{ mr: 2, display: 'flex' }}>
                                {stat.icon}
                            </Box>
                            
                            {/* Text Content Section */}
                            <CardContent sx={{ flexGrow: 1, p: '8px !important' }}>
                                <Typography color="text.secondary" variant="subtitle2">
                                    {stat.title}
                                </Typography>
                                <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                                    {stat.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            
            {/* Yahan aap charts aur graphs ke liye section add kar sakte hain */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Detailed Reports
                </Typography>
                <Card sx={{ p: 3, minHeight: 300 }}>
                    <Typography color="text.secondary">
                        Placeholder for Sales Trend Chart (e.g., Line Chart)
                    </Typography>
                </Card>
            </Box>
            
        </Box>
    );
};

export default Dashboard;