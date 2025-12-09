import React, { useState, useEffect, useCallback } from 'react';
import { 
    Typography, 
    Grid, 
    Card, 
    CardContent, 
    Box, 
    CircularProgress, 
    Alert,
    Paper
} from '@mui/material';



// --- Recharts Imports ---
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';
// ------------------------

// --- ICONS ---
import GroupIcon from '@mui/icons-material/Group';          // Total Users (Sales Team)
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';  // Total Customers
import VisibilityIcon from '@mui/icons-material/Visibility';  // Total Visits
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // System Active Since

import API from '../api/axiosClient.jsx';
import { useAuth } from '../context/authContext'; 


// Default data keys aapke API response keys se match honi chahiye
const initialKpis = {
    totalUsers: 0,
    totalCustomers: 0,
    totalVisits: 0,
    activeUsers:0 
};

// --- KPI Card Component (Reusable UI) ---
const KpiCard = ({ title, value, icon: Icon, color }) => (
    <Paper 
        elevation={3} 
        sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            height: '100%',
            borderLeft: `5px solid ${color}`,
        }}
    >
        {/* Text Content */}
        <Box sx={{ flexGrow: 1, pr: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" noWrap>
                {title}
            </Typography>
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                {value}
            </Typography>
        </Box>
        
        {/* Icon */}
        <Box 
            sx={{ 
                p: 1.5, 
                borderRadius: '50%', 
                backgroundColor: color, 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                boxShadow: 3
            }}
        >
            <Icon fontSize="medium" /> 
        </Box>
    </Paper>
);
// ----------------------------


// --- MOCK CHART DATA (Replace with API data later) ---
const mockDailyActivityData = [
    { name: 'Dec 03', visits: 5, active_users: 2 },
    { name: 'Dec 04', visits: 12, active_users: 4 },
    { name: 'Dec 05', visits: 8, active_users: 3 },
    { name: 'Dec 06', visits: 15, active_users: 5 },
    { name: 'Dec 07', visits: 10, active_users: 4 },
    { name: 'Dec 08', visits: 20, active_users: 6 },
    { name: 'Dec 09', visits: 18, active_users: 5 },
];
// ----------------------------------------------------

const Dashboard = () => {
    const { logout } = useAuth();
    const [kpiData, setKpiData] = useState(initialKpis);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching Logic ---
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 🚨 API Route Update: '/api/kpis' use kiya gaya hai
            const response = await API.get('/kpis'); 
            
            if (response.data && response.data.status === 'success' && response.data.data) {
                 // 🚨 Data ko 'response.data.data' se extract karna
                 setKpiData(prevData => ({ 
                    ...prevData, 
                    ...response.data.data 
                 }));
            } else {
                 throw new Error("Invalid or empty data received from API.");
            }

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            if (err.response && err.response.status === 401) {
                setError("Session expired. Logging out...");
                setTimeout(logout, 2000); 
            } else {
                setError("Failed to load dashboard data. Please check the '/api/kpis' endpoint.");
            }
        } finally {
            setLoading(false);
        }
    }, [logout]); 

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    
    // --- Helper function for formatting numbers/dates ---
    const formatValue = (key, value) => {
        if (key === 'system_start_date' && value) {
            return new Date(value).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        }
        if (typeof value === 'number') {
            return new Intl.NumberFormat('en-IN').format(value);
        }
        return value || '0';
    };


    // --- 4 KPIs Data Array (Mapping API keys to UI titles) ---
    const kpis = [
        {
            title: "Total Sales Team",
            key: "totalUsers", // API key se match
            icon: GroupIcon,
            color: "#4caf50", 
        },
        {
            title: "Total Customers",
            key: "totalCustomers", // API key se match
            icon: PeopleAltIcon,
            color: "#2196f3", 
        },
        {
            title: "Total Visits (Overall)",
            key: "totalVisits", // API key se match
            icon: VisibilityIcon,
            color: "#9c27b0", 
        },
        {
            title: "Active Users",
            key: "activeUsers", // Static key
            icon: AccessTimeIcon,
            color: "#00ff6aff", 
        },
    ];


    // --- Conditional Rendering ---
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>Loading Dashboard...</Typography>
            </Box>
        );
    }

    if (error && kpiData.totalUsers === 0) {
        return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
    }


    // --- Main Component Render ---
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                📊 Dashboard - Sales Activity
            </Typography>
            
            {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}
            
            {/* KPI Cards */}
            <Grid container spacing={3}>
                {kpis.map((stat) => (
                    <Grid item xs={12} sm={6} md={3} key={stat.key}>
                        <KpiCard
                            title={stat.title}
                            // API key se value fetch karna
                            value={formatValue(stat.key, kpiData[stat.key])}
                            icon={stat.icon}
                            color={stat.color}
                        />
                    </Grid>
                ))}
            </Grid>
            
            {/* --- Detailed Reports Section (CHART ADDED) --- */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Activity Trend (Last 7 Days)
                </Typography>
                <Paper sx={{ p: 3, minHeight: 350, boxShadow: 3 }}>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                            data={mockDailyActivityData} // MOCK data use kiya
                            margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                        >
                            {/* Grid lines */}
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            
                            {/* X-Axis: Date/Day */}
                            <XAxis dataKey="name" />
                            
                            {/* Y-Axis: Visits/Count */}
                            <YAxis /> 
                            
                            {/* Tooltip for hover details */}
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
                            
                            {/* Line 1: Total Visits */}
                            <Line 
                                type="monotone" 
                                dataKey="visits" 
                                stroke="#9c27b0" // Purple color (Total Visits ka color)
                                activeDot={{ r: 8 }}
                                name="Total Visits"
                                strokeWidth={2}
                            />
                            {/* Line 2: Active Users (Optional, but useful) */}
                             <Line 
                                type="monotone" 
                                dataKey="active_users" 
                                stroke="#4caf50" // Green color (Active Users ka color)
                                name="Active Users"
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>

                </Paper>
            </Box>
            
        </Box>
    );
};

export default Dashboard;