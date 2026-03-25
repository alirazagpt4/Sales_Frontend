import XLSX from 'xlsx-js-style';
import React, { useState, useEffect } from 'react';
import {
    Typography, Box, TextField, Button, Grid, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Divider, MenuItem, IconButton, Dialog, DialogContent, DialogTitle
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import API from '../api/axiosClient.jsx';

const formatForDisplay = (dateString) => {
    if (!dateString) return "";
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

const MeterReadingReport = () => {
    const [selectedName, setSelectedName] = useState('');
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [users, setUsers] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(true);
    const [error, setError] = useState(null);
    const [openImage, setOpenImage] = useState(false);
    const [currentImg, setCurrentImg] = useState('');

    const baseUrl = "http://38.242.201.229";

    // --- Excel Export Logic ---
    const exportToExcel = () => {
        if (!reportData || !reportData.report) return;

        const excelData = [];
        const headerStyle = {
            fill: { fgColor: { rgb: "2E7D32" } },
            font: { color: { rgb: "FFFFFF" }, bold: true },
            alignment: { horizontal: "center" },
            border: { bottom: { style: "thin", color: { rgb: "000000" } } }
        };

        const headers = ["Date", "User Name", "Meter Reading", "Status"];
        excelData.push(headers.map(h => ({ v: h, s: headerStyle })));

        reportData.report.forEach(item => {
            excelData.push([
                { v: item.date },
                { v: item.user_fullname },
                { v: item.meter_reading },
                { v: item.status }
            ]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(excelData);
        worksheet['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 }];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Meter Readings");
        XLSX.writeFile(workbook, `Meter_Report_${selectedName}.xlsx`);
    };

    const handleShowImage = (path) => {
        if (!path) return;
        const fileName = path.split('/').pop();
        const finalUrl = `${baseUrl}/public/${fileName}`;
        setCurrentImg(finalUrl);
        setOpenImage(true);
    };

    useEffect(() => {
        const fetchUsersList = async () => {
            try {
                const response = await API.get('/users?limit=1000'); // Assuming this endpoint returns all users without pagination
                console.log("USERS RESPONSE ......", response.data.users);
                const data = response.data.users || response.data || [];
                // 1. Technical Audit: Define excluded IDs in a constant to avoid "Magic Numbers"
                const EXCLUDED_DESIGNATIONS = [null, 7, 8];

                const filteredUsers = Array.isArray(data)
                    ? data.filter(u => !EXCLUDED_DESIGNATIONS.includes(u.designationId))
                    : [];

                setUsers(filteredUsers);
            } catch (err) { setUsers([]); }
            finally { setFetchingUsers(false); }
        };
        fetchUsersList();
    }, []);

    const fetchReport = async () => {
        if (!selectedName) {
            setError("Please select a person.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await API.get('/reports/meterreading-report', {
                params: { name: selectedName, fromDate, toDate }
            });
            if (response.data?.report?.length > 0) {
                setReportData(response.data);
            } else {
                setReportData(null);
                setError("No records found.");
            }
        } catch (err) { setError("Server error."); }
        finally { setLoading(false); }
    };

    return (
        <Box>
            <Typography variant="h5">Meter Reading Reports</Typography>
            <Divider sx={{ mb: 4 }} />

            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                        <TextField select size="small" fullWidth value={selectedName}
                            onChange={(e) => setSelectedName(e.target.value)}
                            disabled={fetchingUsers}
                            SelectProps={{ displayEmpty: true, renderValue: (val) => val || "Select Person" }}
                        >
                            {users.map((u) => <MenuItem key={u.id} value={u.name}>{u.name}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField size="small" fullWidth type="date" label="From" InputLabelProps={{ shrink: true }}
                            value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField size="small" fullWidth type="date" label="To" InputLabelProps={{ shrink: true }}
                            value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={1.5}>
                        <Button variant="contained" fullWidth startIcon={<SearchIcon />} onClick={fetchReport} sx={{ bgcolor: '#2e7d32' }}>
                            Generate
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={1.5}>
                        <Button variant="outlined" fullWidth startIcon={<DownloadIcon />} onClick={exportToExcel} disabled={!reportData}>
                            Excel
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {error && <Alert severity="info">{error}</Alert>}

            {reportData && (
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Full Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Meter Reading</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Meter Reading Picture</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reportData.report.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>{formatForDisplay(row.date)}</TableCell>
                                    <TableCell>{row.user_fullname}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{row.meter_reading}</TableCell>
                                    <TableCell>
                                        <Box sx={{
                                            color: row.status === 'PRESENT' ? 'green' : 'orange',
                                            fontWeight: 'bold'
                                        }}>
                                            {row.status}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        {row.picture ? (
                                            <IconButton size="small" onClick={() => handleShowImage(row.picture)}>
                                                <VisibilityIcon sx={{ color: '#2e7d32' }} />
                                            </IconButton>
                                        ) : "-"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Image Modal - Exactly same as your design */}
            <Dialog open={openImage} onClose={() => setOpenImage(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: '#2e7d32', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Meter Reading Proof</Typography>
                    <IconButton onClick={() => setOpenImage(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center', p: 2, bgcolor: '#f0ececff' }}>
                    <img src={currentImg} alt="Proof" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' }} />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default MeterReadingReport;