import XLSX from 'xlsx-js-style';
import React, { useState, useEffect } from 'react';
import {
    Typography, Box, TextField, Button, Grid, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Divider, MenuItem, Checkbox, ListItemText,
    OutlinedInput, FormControl, InputLabel, Select
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import API from '../api/axiosClient.jsx';

const formatForDisplay = (dateString) => {
    if (!dateString) return "N/A";
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

const VisitCountReport = () => {
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [users, setUsers] = useState([]);
    const [selectedUsernames, setSelectedUsernames] = useState([]);
    const [fetchingUsers, setFetchingUsers] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch Users List on Mount
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
            // Agar multiple arrays hain ya single hai, to bina [] ke join karke single key bhein jaise backend demand kar raha hai
            params.append('names', selectedUsernames.join(','));
        } else {
            params.append('names', 'All');
        }

        params.append('fromDate', fromDate);
        params.append('toDate', toDate);

        // Raw query URL banega: ?names=hafiz.zia&fromDate=...
        const response = await API.get(`reports/visit-count-report?${params.toString()}`);

        if (response.data && response.data.report && response.data.report.length > 0) {
            setReportData(response.data);
        } else {
            setReportData(null);
            setError("No visit count records found.");
        }
    } catch (err) {
        setError("Server error fetching visit counts.");
        setReportData(null);
    } finally {
        setLoading(false);
    }
};

    const getReportHeaderText = () => {
        if (selectedUsernames.length === 0 || selectedUsernames.includes('all_users')) {
            return "All Sale Executives Selected";
        }
        const label = selectedUsernames.length === 1 ? "Sale Executive" : "Sale Executives";
        return `${selectedUsernames.length} ${label} Selected`;
    };

    const exportToExcel = () => {
        if (!reportData || !reportData.report || reportData.report.length === 0) return;

        const excelData = [];
        
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

        const headers = ["Customer Name", "Visit Count", "Last Visit"];
        excelData.push(headers.map(h => ({ v: h, s: headerStyle })));

        reportData.report.forEach((row) => {
            excelData.push([
                { v: row.customer_name || "N/A", s: regularStyle },
                { v: row.visit_count ?? 0, s: centerStyle },
                { v: formatForDisplay(row.last_visit), s: centerStyle }
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        ws['!cols'] = [{ wch: 40 }, { wch: 18 }, { wch: 22 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Visit Summary");

        let fileNamePerson = "All";
        if (selectedUsernames.length > 0 && !selectedUsernames.includes('all_users')) {
            fileNamePerson = selectedUsernames.join('_').replace(/\s+/g, '-');
        }

        XLSX.writeFile(wb, `Visit_Count_Report_${fileNamePerson}_${fromDate}_to_${toDate}.xlsx`);
    };

    return (
        <Box component="main" aria-label="Visit Count Report Dashboard">
            <Typography variant="h5" sx={{ mb: 1 }}>Visit Count Detailed Report</Typography>
            <Divider sx={{ mb: 3 }} />

            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderTop: '3px solid #2e7d32' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControl size="small" fullWidth variant="outlined"
                        sx={{ minWidth: '250px', maxWidth: '280px' }}
                        >
                            <InputLabel id="count-sales-person-label">Select Sales Person</InputLabel>
                            <Select
                                labelId="count-sales-person-label"
                                id="count-sales-person-select"
                                multiple
                                value={selectedUsernames}
                                onChange={handleUserChange}
                                input={<OutlinedInput label="Select Sales Person" />}
                                renderValue={(selected) => {
                                    if (!selected || selected.length === 0 || selected.includes('all_users')) {
                                        return "All Executives Selected";
                                    }
                                    if (selected.length === 1) return selected[0];
                                    return `${selected.length} Sale Executives Selected`;
                                }}
                                disabled={fetchingUsers}
                                MenuProps={{ PaperProps: { style: { maxHeight: 320, width: 260 } } }}
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

                    <Grid item xs={12} sm={6} md={3}>
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

                    <Grid item xs={12} sm={6} md={3}>
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
                            sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' }, height: '40px', fontWeight: 'bold' }}
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
                            disabled={!reportData || loading}
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

            {reportData && reportData.report && reportData.report.length > 0 && (
                <TableContainer component={Paper} variant="outlined">
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#888', fontWeight: 'bold', display: 'block' }}>VISIT COUNTER ENGINE</Typography>
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

                    <Table size="small" aria-label="Visit Counts Summary Table">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Customer Name</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Visit Count</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Last Visit Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reportData.report.map((row, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>{row.customer_name || "N/A"}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                        {row.visit_count ?? 0}
                                    </TableCell>
                                    <TableCell align="center">
                                        {formatForDisplay(row.last_visit)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default VisitCountReport;