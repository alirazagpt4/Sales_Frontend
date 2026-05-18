import XLSX from 'xlsx-js-style';
import React, { useState, useEffect } from 'react';
import {
    Typography, Box, TextField, Button, Grid, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Divider, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import API from '../api/axiosClient.jsx';

const formatForDisplay = (dateString) => {
    if (!dateString) return "";
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

const regionsList = [
    "Gojra", "Sargodha", "Jhang", "South", "Rahim Yar Khan", 
    "Layyah", "Sahiwal", "Narowal", "Pindi Bhattian", 
    "Gujranwala", "Multan", "Bahawalpur", "Khanewal", 
    "Jaranwala", "Rawalpindi"
];

const SummaryReports = () => {
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [region, setRegion] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
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
            let query = `reports/summary-report?fromDate=${fromDate}&toDate=${toDate}`;
            if (region) query += `&region=${region}`;
            if (selectedUserId) query += `&userId=${selectedUserId}`;
            const response = await API.get(query);
            if (response.data && response.data.report) {
                setReportData(response.data);
            } else {
                setReportData(null);
                setError("No records found.");
            }
        } catch (err) {
            setError("Server error.");
        } finally {
            setLoading(false);
        }
    };

   const exportSummaryToExcel = () => {
    if (!reportData) return;

    const excelData = [];
    const merges = [];
    let currentRow = 0;

    // 1. Header Style (Green with White Text)
    const headerStyle = {
        fill: { fgColor: { rgb: "2E7D32" } },
        font: { color: { rgb: "FFFFFF" }, bold: true },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin" }, bottom: { style: "thin" },
            left: { style: "thin" }, right: { style: "thin" }
        }
    };

    // 2. Data Cell Style (Center Aligned for Merged Dates)
    const centerStyle = {
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin" }, bottom: { style: "thin" },
            left: { style: "thin" }, right: { style: "thin" }
        }
    };

    // 3. Regular Data Style (For Names and Numbers)
    const regularStyle = {
        alignment: { vertical: "center" },
        border: {
            top: { style: "thin" }, bottom: { style: "thin" },
            left: { style: "thin" }, right: { style: "thin" }
        }
    };

    const headers = [
        "Visit Date", "Sales Person", "Region", "Total Visits", 
        "Regular", "Follow-up", "Mature Order", "Meter Reading"
    ];

    // Push Styled Headers
    excelData.push(headers.map(h => ({ v: h, s: headerStyle })));
    currentRow++;

    reportData.report.forEach((day) => {
        const startRow = currentRow;

        day.data.forEach((row) => {
            excelData.push([
                { v: formatForDisplay(day.visit_date), s: centerStyle },
                { v: row.sales_person, s: regularStyle },
                { v: row.region, s: regularStyle },
                { v: row.total_visits, s: { ...regularStyle, alignment: { horizontal: "center" } } },
                { v: row.regular_visit, s: { ...regularStyle, alignment: { horizontal: "center" } } },
                { v: row.followup_visit, s: { ...regularStyle, alignment: { horizontal: "center" } } },
                { v: row.mature_order, s: { ...regularStyle, alignment: { horizontal: "center" } } },
                { v: row.meter_reading || "N/A", s: regularStyle }
            ]);
            currentRow++;
        });

        // 4. Daily Total Row (Styled like Image 8)
        const totalRowStyle = {
            fill: { fgColor: { rgb: "E8F5E9" } }, // Light green
            font: { bold: true },
            alignment: { vertical: "center" },
            border: { top: { style: "thin" }, bottom: { style: "thin" } }
        };

        excelData.push([
            { v: "Total Sales Persons:", s: totalRowStyle },
            { v: day.data.length, s: totalRowStyle },
            { v: "", s: totalRowStyle },
            { v: day.date_summary.visits, s: { ...totalRowStyle, alignment: { horizontal: "center" } } },
            { v: day.date_summary.reg, s: { ...totalRowStyle, alignment: { horizontal: "center" } } },
            { v: day.date_summary.fol, s: { ...totalRowStyle, alignment: { horizontal: "center" } } },
            { v: day.date_summary.mat, s: { ...totalRowStyle, alignment: { horizontal: "center" } } },
            { v: "", s: totalRowStyle }
        ]);

        // Merge Date Column
        merges.push({
            s: { r: startRow, c: 0 },
            e: { r: currentRow, c: 0 } // currentRow tak merge taake Total row bhi cover ho
        });
        
        currentRow++;
    });

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    ws['!merges'] = merges;

    // 5. FIXED: Column Widths (Wch is character count)
    ws['!cols'] = [
        { wch: 18 }, // Visit Date
        { wch: 30 }, // Sales Person (Names will show fully now)
        { wch: 20 }, // Region
        { wch: 15 }, // Total Visits
        { wch: 12 }, // Regular
        { wch: 12 }, // Follow-up
        { wch: 15 }, // Mature Order
        { wch: 15 }  // Meter Reading
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Summary Report");
    XLSX.writeFile(wb, `Summary_Report_${fromDate}_to_${toDate}.xlsx`);
};

    return (
        <Box >
            <Typography variant="h5" >Summary Visit Reports</Typography>
            <Divider sx={{ mb: 3 }} />

           {/* Inputs Divided into 2 Rows with Proper Breakpoints */}
<Paper variant="outlined" sx={{ p: 2, mb: 3, borderTop: '3px solid #2e7d32' }}>
    <Grid container spacing={2}>
        
        {/* Row 1: From Date, To Date, Region */}
        <Grid item xs={12} sm={6} md={4}>
            <TextField 
                size="small" 
                 sx={{ width: "230px" }}
                type="date" 
                label="From Date" 
                InputLabelProps={{ shrink: true }}
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)} 
            />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
            <TextField 
                size="small" 
                 sx={{ width: "230px" }}
                type="date" 
                label="To Date" 
                InputLabelProps={{ shrink: true }}
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)} 
            />
        </Grid>
        <Grid item xs={12} md={4}>
            <TextField 
                select 
                size="small" 
                fullWidth
                 sx={{ width: "230px" }}
                label="Region" 
                value={region} 
                onChange={(e) => setRegion(e.target.value)}
            >
                <MenuItem value="">All Regions</MenuItem>
                {regionsList.sort().map((r) => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
            </TextField>
        </Grid>

        {/* Row 2: Sales Person and Action Buttons */}
        <Grid item xs={12} md={6} lg={6}>
            <TextField 
                select 
                size="small" 
                sx={{ width: "230px" }}
                label="Sales Person" 
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)} 
                disabled={fetchingUsers}
            >
                <MenuItem value=""><em>All Sales Persons</em></MenuItem>
                {users.map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.fullname}</MenuItem>
                ))}
            </TextField>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3} lg={3}>
            <Button 
                variant="contained" 
                fullWidth 
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                onClick={fetchReport} 
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
        
        <Grid item xs={12} sm={6} md={3} lg={3}>
            <Button 
                variant="outlined" 
                fullWidth 
                startIcon={<DownloadIcon />}
                onClick={exportSummaryToExcel} 
                disabled={!reportData}
                sx={{ 
                    color: '#2e7d32', 
                    borderColor: '#2e7d32', 
                    height: '40px',
                    fontWeight: 'bold',
                    '&:hover': { borderColor: '#1b5e20', bgcolor: '#f1f8e9' }
                }}
            >
                EXPORT EXCEL
            </Button>
        </Grid>

    </Grid>
</Paper>

            {error && <Alert severity="info" sx={{ mb: 2 }}>{error}</Alert>}

            {reportData && (
                <TableContainer component={Paper} variant="outlined">
                    {/* Overall Summary & Period Header */}
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#888', fontWeight: 'bold', display: 'block' }}>OVERALL SUMMARY</Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Sales Performance</Typography>
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
                        
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: '#888', fontWeight: 'bold', display: 'block' }}>PERIOD</Typography>
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
                                <TableCell sx={{ fontWeight: 'bold' }}>Region</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total Visits</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Regular</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Follow-up</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Mature Order</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Meter Reading</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reportData.report.map((day, dIndex) => (
                                <React.Fragment key={dIndex}>
                                    {day.data.map((row, rIndex) => (
                                        <TableRow key={`${dIndex}-${rIndex}`}>
                                            {rIndex === 0 && (
                                                <TableCell rowSpan={day.data.length + 1} sx={{ borderRight: '1px solid #eee', verticalAlign: 'center' }}>
                                                    {formatForDisplay(day.visit_date)}
                                                </TableCell>
                                            )}
                                            <TableCell>{row.sales_person}</TableCell>
                                            <TableCell>{row.region}</TableCell>
                                            <TableCell align="center">{row.total_visits}</TableCell>
                                            <TableCell align="center">{row.regular_visit}</TableCell>
                                            <TableCell align="center">{row.followup_visit}</TableCell>
                                            <TableCell align="center">{row.mature_order}</TableCell>
                                            <TableCell>{row.meter_reading || "N/A"}</TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Daily Total Row (As per Image 3) */}
                                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                                        <TableCell colSpan={2} sx={{ py: 1.5 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                                Total Sales Person : {day.data.length}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>{day.date_summary.visits}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>{day.date_summary.reg}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>{day.date_summary.fol}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>{day.date_summary.mat}</TableCell>
                                        <TableCell />
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