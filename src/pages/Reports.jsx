import React, { useState, useEffect } from 'react';
import {
    Typography, Box, TextField, Button, Grid, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Divider, MenuItem, IconButton, Dialog, DialogContent, DialogTitle
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import API from '../api/axiosClient.jsx';

// UI ke liye: Dec 16, 2025
const formatForDisplay = (dateString) => {
    if (!dateString) return "";
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
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


    // Image Modal State
    const [openImage, setOpenImage] = useState(false);
    const [currentImg, setCurrentImg] = useState('');

    const handleShowImage = (path) => {
        const baseUrl = "http://38.242.201.229:3000/public/"; // Aapka static server URL
        setCurrentImg(`${baseUrl}${path}`);
        setOpenImage(true);
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
                            InputProps={{ startAdornment: <Box sx={{ position: 'absolute', left: 10, bgcolor: '#fff', width: '80%', pointerEvents: 'none' }}><Typography variant="body2">{formatForDisplay(fromDate)}</Typography></Box> }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <TextField size="small" fullWidth type="date" label="To" InputLabelProps={{ shrink: true }}
                            value={toDate} onChange={(e) => setToDate(e.target.value)}
                            InputProps={{ startAdornment: <Box sx={{ position: 'absolute', left: 10, bgcolor: '#fff', width: '80%', pointerEvents: 'none' }}><Typography variant="body2">{formatForDisplay(toDate)}</Typography></Box> }}
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
                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd', display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Typography variant="body2"><strong>Sales Person:</strong> {reportData.meta.sales_person}</Typography>
                        <Typography variant="body2"><strong>Designation:</strong> {reportData.meta.designation}</Typography>
                        <Typography variant="body2"><strong>City:</strong> {reportData.meta.city}</Typography>
                        <Typography variant="body2"><strong>Total Visits:</strong> {reportData.meta.total_visits}</Typography>
                        <Typography variant="body2"><strong>Range:</strong> {formatForDisplay(fromDate)} to {formatForDisplay(toDate)}</Typography>
                    </Box>

                    <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                        <TableHead sx={{ bgcolor: '#eeeeee' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd', width: '120px' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Customer Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Area</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd', width: '120px' }}>Meter Reading</TableCell>
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

                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit.customer_name}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit.area}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit.type}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd', color: '#2e7d32', fontWeight: 'bold' }}>{visit.status}</TableCell>

                                        {/* Meter + Image Icon: Merged Row */}
                                        {vIndex === 0 && (
                                            <TableCell
                                                rowSpan={group.visits.length}
                                                sx={{ border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'middle', bgcolor: '#fff' }}
                                            >
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
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
            <Dialog open={openImage} onClose={() => setOpenImage(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#2e7d32', color: 'white' }}>
                    Meter Reading Proof
                    <IconButton onClick={() => setOpenImage(false)} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0, textAlign: 'center', bgcolor: '#f9f9f9' }}>
                    {currentImg && (
                        <img 
                            src={currentImg} 
                            alt="Meter" 
                            style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }} 
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400?text=Image+Not+Found'; }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default Reports;