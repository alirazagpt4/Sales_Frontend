import XLSX from 'xlsx-js-style';
import React, { useState, useEffect } from 'react';
import {
    Typography, Box, TextField, Button, Grid, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Divider, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import API from '../api/axiosClient.jsx';

const formatForDisplay = (dateString) => {
    if (!dateString) return "";
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

// Global Memory Cache for Geocoding to optimize performance O(1) and bypass rate-limits
const geocodeCache = {};

const LocationName = ({ coords, index }) => {
    const [address, setAddress] = useState('Fetching Area...');

    useEffect(() => {
        if (!coords || coords.lat === null || coords.lng === null || coords.lat === undefined || coords.lng === undefined) {
            setAddress('Unknown Location');
            return;
        }

        const cacheKey = `${Number(coords.lat).toFixed(5)},${Number(coords.lng).toFixed(5)}`;
        
        // Hit Cache if available
        if (geocodeCache[cacheKey]) {
            setAddress(geocodeCache[cacheKey]);
            return;
        }

        let isMounted = true;

        const fetchAddress = async () => {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
                    { 
                        headers: { 
                            'Accept': 'application/json',
                            'User-Agent': 'CoreConnectSalesLogProcessor/2.0 (Production Verification Tool)' 
                        } 
                    }
                );
                
                if (!response.ok) throw new Error("Rate Limited");
                const data = await response.json();
                
                if (isMounted) {
                    if (data && data.address) {
                        const addr = data.address;
                        
                        // Strict Pakistan Local Area Extraction Hierarchy
                        let areaName = addr.road || addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.village || addr.city;
                        
                        if (!areaName && data.display_name) {
                            // Deep parsing: extract human readable string chunks if specific tags are missing
                            const parts = data.display_name.split(',');
                            areaName = parts.length > 1 ? `${parts[0].trim()}, ${parts[1].trim()}` : parts[0];
                        }

                        const finalArea = areaName || 'Active Business Area';
                        geocodeCache[cacheKey] = finalArea; // Cache set
                        setAddress(finalArea);
                    } else if (data && data.display_name) {
                        const parts = data.display_name.split(',');
                        const finalArea = parts[0] || 'Business Zone';
                        geocodeCache[cacheKey] = finalArea;
                        setAddress(finalArea);
                    } else {
                        setAddress('Business Zone');
                    }
                }
            } catch (err) {
                if (isMounted) {
                    // Coordinates strict ban policy. If API fails, show generic area instead of numbers.
                    setAddress('Location Logged');
                }
            }
        };

        // Staggered Request Queue: Add incremental delay based on row index to prevent concurrent blockings
        const staggeredDelay = (index % 10) * 350; 
        const timer = setTimeout(() => {
            fetchAddress();
        }, staggeredDelay);

        return () => { 
            isMounted = false; 
            clearTimeout(timer);
        };
    }, [coords, index]);

    return <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{address}</Typography>;
};

const VisitVerificationReport = () => {
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [users, setUsers] = useState([]);
    const [selectedUsername, setSelectedUsername] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [fetchingUsers, setFetchingUsers] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsersList = async () => {
            try {
                const response = await API.get('/users?limit=1000');
                const data = response.data.users || response.data || [];
                const EXCLUDED_DESIGNATIONS = [null, 7, 8];
                const filteredUsers = Array.isArray(data)
                    ? data.filter(u => !EXCLUDED_DESIGNATIONS.includes(u.designationId))
                    : [];
                setUsers(filteredUsers);
            } catch (err) {
                setUsers([]);
            } finally {
                setFetchingUsers(false);
            }
        };
        fetchUsersList();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            let query = `reports/visit-verification-report`;
            const params = new URLSearchParams();
            
            if (selectedUsername) {
                params.append('name', selectedUsername);
            }
            params.append('fromDate', fromDate);
            params.append('toDate', toDate);

            const finalQuery = `${query}?${params.toString()}`;
            const response = await API.get(finalQuery);
            
            if (response.data && response.data.report && response.data.report.length > 0) {
                setReportData(response.data);
            } else {
                setReportData(null);
                setError("No visit verification records found.");
            }
        } catch (err) {
            setError("Server error fetching verification records.");
        } finally {
            setLoading(false);
        }
    };

    const getFilteredReport = () => {
        if (!reportData || !reportData.report) return [];

        return reportData.report.map(day => {
            const filteredVisits = (day.visits || []).filter(visit => {
                const normalizedStatus = (visit.verification_status || '').toLowerCase();
                const isVerified = normalizedStatus === 'verified';
                const isUnverified = normalizedStatus === 'unverified' || normalizedStatus === 'location mismatch' || normalizedStatus === '';

                if (statusFilter === 'verified') return isVerified;
                if (statusFilter === 'unverified') return isUnverified;
                return true;
            });

            return {
                ...day,
                visits: filteredVisits
            };
        }).filter(day => day.visits.length > 0);
    };

    const filteredReportPayload = getFilteredReport();

    // Flatten array to assign distinct incremental sequential indexes for API throttling
    let globalVisitCounter = 0;

    const exportToExcel = () => {
        if (filteredReportPayload.length === 0) return;

        const excelData = [];
        const merges = [];
        let currentRow = 0;

        const headerStyle = {
            fill: { fgColor: { rgb: "2E7D32" } },
            font: { color: { rgb: "FFFFFF" }, bold: true },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: "thin" }, bottom: { style: "thin" },
                left: { style: "thin" }, right: { style: "thin" }
            }
        };

        const centerStyle = {
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: "thin" }, bottom: { style: "thin" },
                left: { style: "thin" }, right: { style: "thin" }
            }
        };

        const regularStyle = {
            alignment: { vertical: "center" },
            border: {
                top: { style: "thin" }, bottom: { style: "thin" },
                left: { style: "thin" }, right: { style: "thin" }
            }
        };

        const formatCoordsText = (coords) => {
            if (!coords || coords.lat === null || coords.lng === null) return 'N/A';
            return `${Number(coords.lat).toFixed(5)}, ${Number(coords.lng).toFixed(5)}`;
        };

        const headers = [
            "Visit Date", "Sales Person", "Customer / Shop", 
            "Customer Location", "Visit Location (User)", "Distance", "Status"
        ];

        excelData.push(headers.map(h => ({ v: h, s: headerStyle })));
        currentRow++;

        const salesPersonName = reportData.meta?.sales_person || "N/A";

        filteredReportPayload.forEach((day) => {
            const startRow = currentRow;
            const visitRecords = day.visits || [];

            visitRecords.forEach((row) => {
                const normalizedStatus = (row.verification_status || '').toLowerCase();
                const displayStatus = normalizedStatus === 'verified' ? 'VERIFIED' : 'UNVERIFIED';

                excelData.push([
                    { v: formatForDisplay(day.date), s: centerStyle },
                    { v: salesPersonName, s: regularStyle },
                    { v: row.customer_name || "N/A", s: regularStyle },
                    { v: formatCoordsText(row.customer_coordinates), s: regularStyle }, 
                    { v: formatCoordsText(row.user_coordinates), s: regularStyle },     
                    { v: row.calculated_distance || "0m", s: regularStyle },
                    { v: displayStatus, s: { ...regularStyle, alignment: { horizontal: "center" } } }
                ]);
                currentRow++;
            });

            merges.push({
                s: { r: startRow, c: 0 },
                e: { r: currentRow - 1, c: 0 }
            });
        });

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        ws['!merges'] = merges;
        ws['!cols'] = [
            { wch: 18 }, { wch: 28 }, { wch: 32 }, { wch: 24 }, { wch: 24 }, { wch: 12 }, { wch: 15 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Verification Detail");
        XLSX.writeFile(wb, `Visit_Verification_Report_${fromDate}_to_${toDate}.xlsx`);
    };

    return (
        <Box >
            <Typography variant="h5" sx={{  mb: 1 }}>Visit Verification Detailed Report</Typography>
            <Divider sx={{ mb: 3 }} />

            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderTop: '3px solid #2e7d32' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={2.5}>
                        <TextField 
                            select 
                            size="small" 
                            sx={{width:'220px'}}
                            label="Sales Person" 
                            value={selectedUsername}
                            onChange={(e) => setSelectedUsername(e.target.value)} 
                            disabled={fetchingUsers}
                        >
                            <MenuItem value=""><em>All Sales Persons</em></MenuItem>
                            {users.map((u) => (
                                <MenuItem key={u.id} value={u.name}>{u.fullname || u.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            select
                            size="small"
                            fullWidth
                            label="Verification Status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value="all">All Statuses</MenuItem>
                            <MenuItem value="verified">Verified Only</MenuItem>
                            <MenuItem value="unverified">Unverified Only</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.25}>
                        <TextField 
                            size="small" 
                            fullWidth
                            type="date" 
                            label="From Date" 
                            InputLabelProps={{ shrink: true }}
                            value={fromDate} 
                            onChange={(e) => setFromDate(e.target.value)} 
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.25}>
                        <TextField 
                            size="small" 
                            fullWidth
                            type="date" 
                            label="To Date" 
                            InputLabelProps={{ shrink: true }}
                            value={toDate} 
                            onChange={(e) => setToDate(e.target.value)} 
                        />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={1.5}>
                        <Button 
                            variant="contained" 
                            fullWidth 
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                            onClick={fetchReport} 
                            disabled={loading}
                            sx={{ 
                                bgcolor: '#2e7d32', 
                                '&:hover': { bgcolor: '#1b5e20' }, 
                                height: '40px',
                                fontWeight: 'bold'
                            }}
                        >
                            GENERATE
                        </Button>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={1.5}>
                        <Button 
                            variant="outlined" 
                            fullWidth 
                            startIcon={<DownloadIcon />}
                            onClick={exportToExcel} 
                            disabled={filteredReportPayload.length === 0 || loading}
                            sx={{ 
                                color: '#2e7d32', 
                                borderColor: '#2e7d32', 
                                height: '40px',
                                fontWeight: 'bold',
                                '&:hover': { borderColor: '#1b5e20', bgcolor: '#f1f8e9' }
                            }}
                        >
                            EXPORT
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {error && <Alert severity="info" sx={{ mb: 2 }}>{error}</Alert>}

            {reportData && filteredReportPayload.length > 0 && (
                <TableContainer component={Paper} variant="outlined">
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#888', fontWeight: 'bold', display: 'block' }}>VERIFICATION TRACKER</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {reportData.meta?.sales_person || "Detailed Log"} ({reportData.meta?.designation || "BDM"})
                            </Typography>
                        </Box>
                        <Box sx={{ textTransform: 'uppercase', textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: '#888', fontWeight: 'bold', display: 'block' }}>REPORT PERIOD</Typography>
                            <Box sx={{ bgcolor: '#f1f8e9', px: 1, py: 0.2, borderRadius: '4px' }}>
                                <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                                    {formatForDisplay(fromDate)} — {formatForDisplay(toDate)}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Visit Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Sales Person</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Customer Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Customer Location</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Visit Location</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Distance</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Verfication Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredReportPayload.map((day, dIndex) => {
                                const visitRecords = day.visits || [];
                                
                                return (
                                    <React.Fragment key={dIndex}>
                                        {visitRecords.map((row, rIndex) => {
                                            const normalizedStatus = (row.verification_status || '').toLowerCase();
                                            const isVerified = normalizedStatus === 'verified';
                                            
                                            // Assign a continuous flat sequence id to correctly space network calls
                                            const currentVisitIndex = globalVisitCounter;
                                            globalVisitCounter++;
                                            
                                            return (
                                                <TableRow key={`${dIndex}-${rIndex}`} hover>
                                                    {rIndex === 0 && (
                                                        <TableCell 
                                                            rowSpan={visitRecords.length} 
                                                            sx={{ borderRight: '1px solid #eee', verticalAlign: 'center', fontWeight: 'bold' }}
                                                        >
                                                            {formatForDisplay(day.date)}
                                                        </TableCell>
                                                    )}
                                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                                        {reportData.meta?.sales_person || "N/A"}
                                                    </TableCell>
                                                    <TableCell>{row.customer_name || "N/A"}</TableCell>
                                                    
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <LocationOnIcon sx={{ color: '#d32f2f' }} fontSize="small" />
                                                            <LocationName coords={row.customer_coordinates} index={currentVisitIndex} />
                                                        </Box>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <LocationOnIcon sx={{ color: '#1976d2' }} fontSize="small" />
                                                            <LocationName coords={row.user_coordinates} index={currentVisitIndex + 1} />
                                                        </Box>
                                                    </TableCell>

                                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                                        {row.calculated_distance || "0m"}
                                                    </TableCell>
                                                    
                                                    <TableCell align="center">
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight="bold"
                                                            sx={{ 
                                                                color: isVerified ? '#2e7d32' : '#d32f2f',
                                                                textTransform: 'uppercase',
                                                                fontSize: '0.75rem'
                                                            }}
                                                        >
                                                            {isVerified ? "VERIFIED" : "UNVERIFIED"}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            
            {reportData && filteredReportPayload.length === 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                    No records match the selected verification filter status.
                </Alert>
            )}
        </Box>
    );
};

export default VisitVerificationReport;