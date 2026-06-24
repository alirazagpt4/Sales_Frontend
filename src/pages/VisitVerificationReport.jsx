import XLSX from 'xlsx-js-style';
import React, { useState, useEffect } from 'react';
import {
    Typography, Box, TextField, Button, Grid, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Divider, MenuItem, Checkbox, ListItemText, Tooltip, IconButton,
    OutlinedInput, FormControl, InputLabel, Select
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

const VisitVerificationReport = () => {
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [users, setUsers] = useState([]);
    const [selectedUsernames, setSelectedUsernames] = useState([]);
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

    const handleUserChange = (event) => {
        const value = event.target.value;
        if (value.includes('all_users')) {
            setSelectedUsernames(selectedUsernames.length === users.length ? [] : ['all_users']);
            return;
        }
        setSelectedUsernames(typeof value === 'string' ? value.split(',') : value);
    };

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();

            if (selectedUsernames.length > 0 && !selectedUsernames.includes('all_users')) {
                selectedUsernames.forEach(username => {
                    params.append('names[]', username);
                });
            } else {
                params.append('names', 'All');
            }

            params.append('fromDate', fromDate);
            params.append('toDate', toDate);

            const response = await API.get(`reports/visit-verification-report?${params.toString()}`);

            if (response.data && response.data.report && response.data.report.length > 0) {
                setReportData(response.data);
            } else {
                setReportData(null);
                setError("No visit verification records found.");
            }
        } catch (err) {
            setError("Server error fetching verification records.");
            setReportData(null);
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
        }).filter(day => day.visits.length > 0 || (statusFilter === 'all' && (day.visits || []).length === 0));
    };

    const filteredReportPayload = getFilteredReport();

    // DVR style Header text generator logic for the report table
    const getReportHeaderText = () => {
        if (selectedUsernames.length === 0 || selectedUsernames.includes('all_users')) {
            return "All Sale Executives Selected";
        }

        // Check if exactly one person is selected to show singular form
        const label = selectedUsernames.length === 1 ? "Sale Executive" : "Sale Executives";
        return `${selectedUsernames.length} ${label} Selected`;
    };

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
            "Visit Date", "Sales Person", "Customers",
            "Customer Location", "Visit Location (User)", "Distance", "Status"
        ];

        excelData.push(headers.map(h => ({ v: h, s: headerStyle })));
        currentRow++;

        filteredReportPayload.forEach((day) => {
            const startRow = currentRow;
            const visitRecords = day.visits || [];

            if (visitRecords.length === 0) {
                excelData.push([
                    { v: formatForDisplay(day.date), s: centerStyle },
                    { v: day.sales_person || "N/A", s: regularStyle },
                    { v: `NO VISITS (${day.leave_status || 'PRESENT'})`, s: regularStyle },
                    { v: "N/A", s: regularStyle },
                    { v: "N/A", s: regularStyle },
                    { v: "N/A", s: regularStyle },
                    { v: "N/A", s: centerStyle }
                ]);
                currentRow++;
            } else {
                visitRecords.forEach((row) => {
                    const normalizedStatus = (row.verification_status || '').toLowerCase();
                    const displayStatus = normalizedStatus === 'verified' ? 'VERIFIED' : 'UNVERIFIED';

                    excelData.push([
                        { v: formatForDisplay(day.date), s: centerStyle },
                        { v: row.sales_person || day.sales_person || "N/A", s: regularStyle },
                        { v: row.customer_name || "N/A", s: regularStyle },
                        { v: formatCoordsText(row.customer_coordinates), s: regularStyle },
                        { v: formatCoordsText(row.user_coordinates), s: regularStyle },
                        { v: row.calculated_distance || "0m", s: regularStyle },
                        { v: displayStatus, s: { ...regularStyle, alignment: { horizontal: "center" } } }
                    ]);
                    currentRow++;
                });
            }

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
        <Box>
            <Typography variant="h5" sx={{ mb: 1 }}>Visit Verification Detailed Report</Typography>
            <Divider sx={{ mb: 3 }} />

            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderTop: '3px solid #2e7d32' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3.2}>
                        <FormControl
                            size="small"
                            fullWidth
                            variant="outlined"
                            // Yahan manual width control de diya hai jo kisi her haal mein structure ko lock rakhega
                            sx={{ minWidth: '250px', maxWidth: '280px' }}
                        >
                            <InputLabel id="sales-person-multi-select-label">Select Sales Person</InputLabel>
                            <Select
                                labelId="sales-person-multi-select-label"
                                id="sales-person-multi-select"
                                multiple
                                value={selectedUsernames}
                                onChange={handleUserChange}
                                // Explicitly linking input outline with matching label string to completely bypass clippping/S.. bugs
                                input={<OutlinedInput label="Select Sales Person" />}
                                renderValue={(selected) => {
                                    if (!selected || selected.length === 0 || selected.includes('all_users')) {
                                        return "All Executives Selected";
                                    }
                                    if (selected.length === 1) {
                                        return "1 Sale Executive Selected";
                                    }
                                    return `${selected.length} Sale Executives Selected`;
                                }}
                                disabled={fetchingUsers}
                                MenuProps={{
                                    PaperProps: {
                                        style: { maxHeight: 320, width: 260 }
                                    }
                                }}
                            >
                                <MenuItem value="all_users">
                                    <Checkbox checked={selectedUsernames.includes('all_users') || selectedUsernames.length === 0} />
                                    <ListItemText primary="All Sales Persons" primaryTypographyProps={{ fontWeight: 'bold' }} />
                                </MenuItem>
                                {users.map((u) => (
                                    <MenuItem key={u.id} value={u.name}>
                                        <Checkbox checked={selectedUsernames.includes(u.name)} />
                                        <ListItemText primary={u.fullname || u.name} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
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

                    <Grid item xs={12} sm={6} md={2.5}>
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

                    <Grid item xs={12} sm={6} md={2.5}>
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

                    <Grid item xs={12} sm={6} md={0.5}>
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
                                minWidth: '100px',
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
                            <Typography variant="caption" sx={{ color: '#888', fontWeight: 'bold', display: 'block' }}>TEAM VERIFICATION LOG ENGINE</Typography>
                            {/* DVR Alignment: Table Subtitle rendered exactly dynamically based on person counts */}
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {getReportHeaderText()}
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
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Customer Location</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Visit Location</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Distance</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Verification Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredReportPayload.map((day, dIndex) => {
                                const visitRecords = day.visits || [];

                                if (visitRecords.length === 0) {
                                    return (
                                        <TableRow key={`empty-${dIndex}`} hover>
                                            <TableCell sx={{ fontWeight: 'bold' }}>{formatForDisplay(day.date)}</TableCell>
                                            <TableCell sx={{ fontWeight: 'medium' }}>{day.sales_person || "N/A"}</TableCell>
                                            <TableCell colSpan={4} sx={{ color: '#757575', fontStyle: 'italic' }}>
                                                No field visits recorded — Status: {day.leave_status || 'PRESENT'}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#757575' }}>
                                                    N/A
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }

                                return (
                                    <React.Fragment key={dIndex}>
                                        {visitRecords.map((row, rIndex) => {
                                            const normalizedStatus = (row.verification_status || '').toLowerCase();
                                            const isVerified = normalizedStatus === 'verified';

                                            const cLat = row.customer_coordinates?.lat;
                                            const cLng = row.customer_coordinates?.lng;
                                            const uLat = row.user_coordinates?.lat;
                                            const uLng = row.user_coordinates?.lng;

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
                                                        {row.sales_person || day.sales_person || "N/A"}
                                                    </TableCell>
                                                    <TableCell>{row.customer_name || "N/A"}</TableCell>

                                                    <TableCell align="center">
                                                        {cLat && cLng ? (
                                                            <Tooltip title="Open Customer Location on Google Maps">
                                                                <IconButton
                                                                    component="a"
                                                                    href={`https://maps.google.com/?q=${cLat},${cLng}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    aria-label={`View customer coordinates ${cLat}, ${cLng} on Google Maps`}
                                                                    size="small"
                                                                >
                                                                    <LocationOnIcon sx={{ color: '#d32f2f' }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        ) : (
                                                            <Typography variant="body2" color="textSecondary">N/A</Typography>
                                                        )}
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        {uLat && uLng ? (
                                                            <Tooltip title="Open Visit Location on Google Maps">
                                                                <IconButton
                                                                    component="a"
                                                                    href={`https://maps.google.com/?q=${uLat},${uLng}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    aria-label={`View sales person coordinates ${uLat}, ${uLng} on Google Maps`}
                                                                    size="small"
                                                                >
                                                                    <LocationOnIcon sx={{ color: '#1976d2' }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        ) : (
                                                            <Typography variant="body2" color="textSecondary">N/A</Typography>
                                                        )}
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