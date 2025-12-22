import React, { useState, useEffect } from 'react';
import {
    Typography, Box, TextField, Button, Grid, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Divider, MenuItem, IconButton, Dialog, DialogContent, DialogTitle
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import API from '../api/axiosClient.jsx';

// UI ke liye: Dec 16, 2025
const formatForDisplay = (dateString) => {
    if (!dateString) return "";
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

// Time format function
const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const Reports = () => {
    const [selectedName, setSelectedName] = useState('');
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [users, setUsers] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(true);
    const [error, setError] = useState(null);


    // google map handling for location
    const handleOpenMap = (lat, lng) => {
        if (!lat || !lng) {
            alert("Coordinates not available");
            return;
        }
        const url = `https://www.google.com/maps?q=${lat},${lng}`;
        window.open(url, '_blank');
    };


    // Image Modal State
    const [openImage, setOpenImage] = useState(false);
    const [currentImg, setCurrentImg] = useState('');

    const handleShowImage = (path) => {
        const baseUrl = "http://38.242.201.229:3000";

        // Agar path "uploads/image-123.jpg" hai, toh humein sirf "image-123.jpg" chahiye
        const fileName = path.split('/').pop();

        // Final URL: http://38.242.201.229:3000/public/image-123.jpg
        const finalUrl = `${baseUrl}/public/${fileName}`;

        console.log("Image Target URL:", finalUrl);
        setCurrentImg(finalUrl);
        setOpenImage(true);
    };



    const handleDownloadImage = async (imageUrl) => {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Network response was not ok');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // File ka naam: Image URL se nikaal kar download ke liye set karna
            const fileName = imageUrl.split('/').pop();
            link.download = fileName || 'meter-reading.jpg';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            // Agar fetch kaam na kare (CORS issue), toh direct link open kar dein
            window.open(imageUrl, '_blank');
        }
    };

    useEffect(() => {
        const fetchUsersList = async () => {
            try {
                const response = await API.get('/users');
                const data = response.data.users || response.data || [];
                setUsers(Array.isArray(data) ? data : []);
            } catch (err) {
                setUsers([]);
            } finally {
                setFetchingUsers(false);
            }
        };
        fetchUsersList();
    }, []);

    const fetchReport = async () => {
        if (!selectedName) {
            setError("Please select a Sales Person.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await API.get('/reports/daily-report', {
                params: { name: selectedName, fromDate, toDate }
            });

            if (response.data?.report?.length > 0) {
                setReportData(response.data);
            } else {
                setReportData(null);
                setError("No records found for the selected range.");
            }
        } catch (err) {
            setError("Server error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h5" >
                Daily Visit Reports
            </Typography>
            <Divider sx={{ mb: 4 }} />

            {/* --- Filters Section --- */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                        <TextField
                            select size="small" fullWidth value={selectedName}
                            onChange={(e) => setSelectedName(e.target.value)}
                            disabled={fetchingUsers}
                            SelectProps={{ displayEmpty: true, renderValue: (val) => val || <span style={{ color: '#aaa' }}>Select Sales Person</span> }}
                        >
                            <MenuItem value="" disabled>Select Sales Person</MenuItem>
                            {users.map((u) => <MenuItem key={u.id} value={u.name}>{u.name}</MenuItem>)}
                        </TextField>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <TextField size="small" fullWidth type="date" label="From" InputLabelProps={{ shrink: true }}
                            value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                            InputProps={{ startAdornment: <Box sx={{ position: 'absolute', left: 10, bgcolor: '#fff', width: 'calc(100% - 45px)', pointerEvents: 'none' }}><Typography variant="body2">{formatForDisplay(fromDate)}</Typography></Box> }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <TextField size="small" fullWidth type="date" label="To" InputLabelProps={{ shrink: true }}
                            value={toDate} onChange={(e) => setToDate(e.target.value)}
                            InputProps={{ startAdornment: <Box sx={{ position: 'absolute', left: 10, bgcolor: '#fff', width: 'calc(100% - 45px)', pointerEvents: 'none' }}><Typography variant="body2">{formatForDisplay(toDate)}</Typography></Box> }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <Button variant="contained" disableElevation fullWidth startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                            onClick={fetchReport} sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' }, height: '40px' }}>
                            Generate
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {error && <Alert severity="info" sx={{ mb: 2 }}>{error}</Alert>}

            {/* --- Output Section --- */}
            {reportData && (
                <TableContainer component={Paper} variant="outlined">
                    <Box sx={{
                        p: 3,
                        bgcolor: '#ffffff',
                        borderBottom: '2px solid #2e7d32',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        {/* Left Side: User Info */}
                        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#666', display: 'block', textTransform: 'uppercase', fontWeight: 'bold', mb: 0.5 }}>
                                    Sales Person
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                                    {reportData.meta.sales_person}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ color: '#666', display: 'block', textTransform: 'uppercase', fontWeight: 'bold', mb: 0.5 }}>
                                    Designation
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#2c3e50' }}>
                                    {reportData.meta.designation}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ color: '#666', display: 'block', textTransform: 'uppercase', fontWeight: 'bold', mb: 0.5 }}>
                                    City
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#2c3e50' }}>
                                    {reportData.meta.city}
                                </Typography>
                            </Box>

                            <Box sx={{
                                bgcolor: '#e8f5e9',
                                px: 2,
                                py: 0.5,
                                borderRadius: '20px',
                                border: '1px solid #c8e6c9',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                                    Total Visits: {reportData.meta.total_visits}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Right Side: Date Range */}
                        <Box sx={{
                            textAlign: { xs: 'left', sm: 'right' },
                            borderLeft: { sm: '2px solid #eee' },
                            pl: { sm: 3 }
                        }}>
                            <Typography variant="caption" sx={{ color: '#666', display: 'block', textTransform: 'uppercase', fontWeight: 'bold', mb: 0.5 }}>
                                Report Period
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1b5e20', bgcolor: '#f1f8e9', p: '4px 12px', borderRadius: '4px' }}>
                                {formatForDisplay(fromDate)} — {formatForDisplay(toDate)}
                            </Typography>
                        </Box>
                    </Box>

                    <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                        <TableHead sx={{ bgcolor: '#eeeeee' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd', width: '120px' }}>Date</TableCell>
                                {/* Yahan visit hata kar simple Heading likhein */}
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Time</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Customer Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Area</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>Visit Loc</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>Day Start Info</TableCell>

                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reportData.report.map((group, gIndex) => (
                                group.visits.map((visit, vIndex) => (
                                    <TableRow key={`${gIndex}-${vIndex}`}>
                                        {/* ✅ Date: Merged Row */}
                                        {vIndex === 0 && (
                                            <TableCell
                                                rowSpan={group.visits.length}
                                                sx={{ border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'middle', bgcolor: '#fff' }}
                                            >
                                                {formatForDisplay(group.date)}
                                            </TableCell>
                                        )}

                                        <TableCell sx={{ border: '1px solid #ddd' }}>{formatTime(visit.createdAt || group.date)}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit.customer_name}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit.area}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit.type}</TableCell>
                                        {/* Visit Location Icon */}
                                        <TableCell sx={{ border: '1px solid #ddd', textAlign: 'center' }}>
                                            <IconButton size="small" color="primary" onClick={() => handleOpenMap(visit.visit_location?.lat, visit.visit_location?.lng)}>
                                                <LocationOnIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>

                                        {/* Meter + Image Icon: Merged Row */}
                                        {vIndex === 0 && (
                                            <TableCell
                                                rowSpan={group.visits.length}
                                                sx={{ border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'middle', bgcolor: '#fff' }}
                                            >
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>

                                                    {/* --- Start Time Section --- */}
                                                    <Box sx={{ mb: 1 }}>
                                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold', display: 'block', fontSize: '0.7rem' }}>
                                                            STARTED AT
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#1b5e20', fontWeight: '700', bgcolor: '#e8f5e9', px: 1, borderRadius: '4px' }}>
                                                            {formatTime(group.start_time)}
                                                        </Typography>
                                                    </Box>

                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {group.meter_reading}
                                                    </Typography>
                                                    {group.photoUri && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleShowImage(group.photoUri)}
                                                            sx={{ color: '#2e7d32', bgcolor: '#f0f4f0', '&:hover': { bgcolor: '#e0eee0' } }}
                                                        >
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                    <IconButton size="small" color="secondary" onClick={() => handleOpenMap(group.start_location?.lat, group.start_location?.lng)}>
                                                        <LocationOnIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* --- Image Preview Modal --- */}
            <Dialog
                open={openImage}
                onClose={() => setOpenImage(false)}
                maxWidth="md" // 'sm' se badha kar 'md' kar diya taake box bada ho
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        overflow: 'hidden' // Header ke corners round rakhne ke liye
                    }
                }}
            >
                <DialogTitle sx={{
                    m: 0,
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: '#2e7d32',
                    color: 'white'
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Meter Reading Proof
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* --- Download Button --- */}
                        <IconButton
                            onClick={() => handleDownloadImage(currentImg)}
                            sx={{
                                color: 'white',
                                mr: 1,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                            }}
                            title="Download Image"
                        >
                            <DownloadIcon /> {/* Yeh hai wo standard icon jo aap keh rahe hain */}
                        </IconButton>

                        {/* --- Close Button --- */}
                        <IconButton
                            onClick={() => setOpenImage(false)}
                            sx={{ color: 'white' }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent
                    dividers
                    sx={{
                        p: 2, // Thori padding taake image bilkul deewaron se na lage
                        textAlign: 'center',
                        bgcolor: '#f0ececff', // Dark background taake image uth kar nazar aaye
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '400px' // Minimum height taake choti image par box collapse na kare
                    }}
                >
                    {currentImg && (
                        <img
                            src={currentImg}
                            alt="Meter Reading"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '70vh', // Screen ki 70% height se zyada na ho
                                objectFit: 'contain', // Image ki ratio kharab nahi hogi
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)', // Image par depth effect
                                borderRadius: '4px'
                            }}
                            onError={(e) => {
                                e.target.onerror = null; // Loop rokne ke liye
                                e.target.src = 'https://placehold.jp/24/2e7d32/ffffff/400x400.png?text=Image+Not+Found';
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default Reports;