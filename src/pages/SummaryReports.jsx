import React, { useState } from 'react';
import {
    Typography, Box, TextField, Button, Grid, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import API from '../api/axiosClient.jsx';

// UI ke liye Date format: Dec 16, 2025
const formatForDisplay = (dateString) => {
    if (!dateString) return "";
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

const SummaryReports = () => {
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await API.get(`reports/summary-report?fromDate=${fromDate}&toDate=${toDate}`);
            if (response.data && response.data.report) {
                setReportData(response.data);
            } else {
                setReportData(null);
                setError("No records found for the selected range.");
            }
        } catch (err) {
            setError("Server error. Please try again.");
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h5">
                Summary Visit Reports
            </Typography>
            <Divider sx={{ mb: 4 }} />

            {/* --- Filters Section (Same as Reports) --- */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <TextField size="small" fullWidth type="date" label="From" InputLabelProps={{ shrink: true }}
                            value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                            InputProps={{ startAdornment: <Box sx={{ position: 'absolute', left: 10, bgcolor: '#fff', width: 'calc(100% - 45px)', pointerEvents: 'none' }}><Typography variant="body2">{formatForDisplay(fromDate)}</Typography></Box> }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <TextField size="small" fullWidth type="date" label="To" InputLabelProps={{ shrink: true }}
                            value={toDate} onChange={(e) => setToDate(e.target.value)}
                            InputProps={{ startAdornment: <Box sx={{ position: 'absolute', left: 10, bgcolor: '#fff', width: 'calc(100% - 45px)', pointerEvents: 'none' }}><Typography variant="body2">{formatForDisplay(toDate)}</Typography></Box> }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Button variant="contained" disableElevation fullWidth startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                            onClick={fetchReport} sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' }, height: '40px' }}>
                            {loading ? 'Generating...' : 'Generate'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {error && <Alert severity="info" sx={{ mb: 2 }}>{error}</Alert>}

            {/* --- Output Section (Same Header Style) --- */}
            {reportData && (
                <TableContainer component={Paper} variant="outlined">
                    <Box sx={{
                        p: 2, bgcolor: '#ffffff', borderBottom: '2px solid #2e7d32',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        {/* Left: Summary Stats (Pills) */}
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Box sx={{ minWidth: '150px' }}>
                                <Typography variant="caption" sx={{ color: '#666', display: 'block', fontWeight: 'bold' }}>OVERALL SUMMARY</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>Sales Performance</Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Box sx={{ bgcolor: '#e8f5e9', px: 1.5, py: 0.5, borderRadius: '20px', border: '1px solid #c8e6c9' }}>
                                    <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>Grand Total: {reportData.grand_summary.total_visits}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#e3f2fd', px: 1.5, py: 0.5, borderRadius: '20px', border: '1px solid #bbdefb' }}>
                                    <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 'bold' }}>Regular: {reportData.grand_summary.total_regular}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#e3f2fd', px: 1.5, py: 0.5, borderRadius: '20px', border: '1px solid #bbdefb' }}>
                                    <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 'bold' }}>Followup: {reportData.grand_summary.total_followup}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#e3f2fd', px: 1.5, py: 0.5, borderRadius: '20px', border: '1px solid #bbdefb' }}>
                                    <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 'bold' }}>Mature: {reportData.grand_summary.total_mature}</Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Right: Date Range Display */}
                        <Box sx={{ textAlign: 'right', pl: 3, borderLeft: '1px solid #eee' }}>
                            <Typography variant="caption" sx={{ color: '#666', display: 'block', fontWeight: 'bold' }}>PERIOD</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1b5e20', bgcolor: '#f1f8e9', p: '4px 12px', borderRadius: '4px' }}>
                                {formatForDisplay(fromDate)} — {formatForDisplay(toDate)}
                            </Typography>
                        </Box>
                    </Box>

                    <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                        <TableHead sx={{ bgcolor: '#eeeeee' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd', width: '130px' }}>Visit Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Sales Person</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Total Visits</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Regular</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Follow-up</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Mature Order</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Meter Reading</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reportData.report.map((day, dIndex) => (
                                <React.Fragment key={dIndex}>
                                    {day.data.map((row, rIndex) => (
                                        <TableRow key={`${dIndex}-${rIndex}`}>
                                            {/* Date Merged Column */}
                                            {rIndex === 0 && (
                                                <TableCell 
                                                    rowSpan={day.data.length + 1} // +1 for the summary row
                                                    sx={{ border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'middle', bgcolor: '#fff', fontWeight: 'bold' }}
                                                >
                                                    {formatForDisplay(day.visit_date)}
                                                </TableCell>
                                            )}
                                            <TableCell sx={{ border: '1px solid #ddd' }}>{row.sales_person}</TableCell>
                                            <TableCell align="center" sx={{ border: '1px solid #ddd' }}>{row.total_visits}</TableCell>
                                            <TableCell align="center" sx={{ border: '1px solid #ddd' }}>{row.regular_visit}</TableCell>
                                            <TableCell align="center" sx={{ border: '1px solid #ddd' }}>{row.followup_visit}</TableCell>
                                            <TableCell align="center" sx={{ border: '1px solid #ddd' }}>{row.mature_order}</TableCell>
                                            <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.8rem' }}>{row.meter_reading}</TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Daily Sub-Total Row */}
                                    <TableRow sx={{ bgcolor: '#f9f9f9' }}>
                                        <TableCell sx={{ border: '1px solid #ddd', fontWeight: 'bold', color: '#2e7d32' }}>Daily Total:</TableCell>
                                        <TableCell align="center" sx={{ border: '1px solid #ddd', fontWeight: 'bold' }}>{day.date_summary.total_visits}</TableCell>
                                        <TableCell align="center" sx={{ border: '1px solid #ddd', fontWeight: 'bold' }}>{day.date_summary.regular}</TableCell>
                                        <TableCell align="center" sx={{ border: '1px solid #ddd', fontWeight: 'bold' }}>{day.date_summary.followup}</TableCell>
                                        <TableCell align="center" sx={{ border: '1px solid #ddd', fontWeight: 'bold' }}>{day.date_summary.mature}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }} />
                                    </TableRow>
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default SummaryReports;