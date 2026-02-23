import XLSX from 'xlsx-js-style';
import React, { useState } from 'react';
import {
    Typography, Box, TextField, Button, Grid, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
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

    const exportSummaryToExcel = () => {
        if (!reportData || !reportData.report) return;

        const excelData = [];
        const merges = [];
        let currentRow = 0;

        // --- Styles ---
        const headerStyle = {
            fill: { fgColor: { rgb: "2E7D32" } },
            font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
            alignment: { horizontal: "center", vertical: "center" },
            border: { top: {style: "thin"}, bottom: {style: "thin"}, left: {style: "thin"}, right: {style: "thin"} }
        };

        const bodyStyle = {
            alignment: { horizontal: "center", vertical: "center" },
            border: { top: {style: "thin", color: {rgb: "DDDDDD"}}, bottom: {style: "thin", color: {rgb: "DDDDDD"}} }
        };

        const subTotalStyle = {
            fill: { fgColor: { rgb: "F1F8E9" } },
            font: { bold: true, color: { rgb: "2E7D32" } },
            alignment: { horizontal: "center" },
            border: { top: {style: "thin"}, bottom: {style: "thin"} }
        };

        // --- Headers ---
        const headers = ["Visit Date", "Sales Person", "Total Visits", "Regular", "Follow-up", "Mature Order", "Meter Reading"];
        excelData.push(headers.map(h => ({ v: h, s: headerStyle })));
        currentRow++;

        // --- Data Processing ---
        reportData.report.forEach((day) => {
            const dateStartRow = currentRow;

            // Har salesperson ki row
            day.data.forEach((row) => {
                excelData.push([
                    { v: formatForDisplay(day.visit_date), s: bodyStyle },
                    { v: row.sales_person, s: bodyStyle },
                    { v: row.total_visits, s: bodyStyle },
                    { v: row.regular_visit, s: bodyStyle },
                    { v: row.followup_visit, s: bodyStyle },
                    { v: row.mature_order, s: bodyStyle },
                    { v: row.meter_reading, s: bodyStyle }
                ]);
                currentRow++;
            });

            // Daily Sub-Total Row
            excelData.push([
                { v: "Daily Total", s: subTotalStyle },
                { v: `Sales Persons: ${day.data.length}`, s: subTotalStyle },
                { v: day.date_summary.total_visits, s: subTotalStyle },
                { v: day.date_summary.regular, s: subTotalStyle },
                { v: day.date_summary.followup, s: subTotalStyle },
                { v: day.date_summary.mature, s: subTotalStyle },
                { v: "-", s: subTotalStyle }
            ]);
            
            // Date column ko merge karna (jaisa UI mein rowSpan hai)
            merges.push({ s: { r: dateStartRow, c: 0 }, e: { r: currentRow, c: 0 } });
            currentRow++;
        });

        const worksheet = XLSX.utils.aoa_to_sheet(excelData);
        worksheet['!merges'] = merges;
        worksheet['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 20 }];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");
        XLSX.writeFile(workbook, `Summary_Report_${fromDate}_to_${toDate}.xlsx`);
    };

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await API.get(`reports/summary-report?fromDate=${fromDate}&toDate=${toDate}`);
            if (response.data && response.data.report) {
                console.log("Fetched Summary Report Data:", response.data.report);
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

                    <Grid item xs={12} sm={2.5}>
                        <Button 
                            variant="outlined" 
                            fullWidth 
                            startIcon={<DownloadIcon />}
                            onClick={exportSummaryToExcel}
                            disabled={!reportData}
                            sx={{ color: '#1b5e20', borderColor: '#1b5e20', height: '40px' }}
                        >
                            Export Excel
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
            {day.data.map((row, rIndex) => {
                // Leave Check
                const isOnLeave = row.is_leave === true || row.status === "LEAVE";

                return (
                    <TableRow key={`${dIndex}-${rIndex}`}>
                        {/* Date Merged Column */}
                        {rIndex === 0 && (
                            <TableCell 
                                rowSpan={day.data.length + 1} 
                                sx={{ border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'middle', bgcolor: '#fff', fontWeight: 'bold' }}
                            >
                                {formatForDisplay(day.visit_date)}
                            </TableCell>
                        )}
                        
                        <TableCell sx={{ border: '1px solid #ddd' }}>{row.sales_person}</TableCell>
                        
                        {/* Visits Columns: Agar leave hai toh '0' ya '-' dikhayen */}
                        <TableCell align="center" sx={{ border: '1px solid #ddd' }}>{isOnLeave ? 0 : row.total_visits}</TableCell>
                        <TableCell align="center" sx={{ border: '1px solid #ddd' }}>{isOnLeave ? 0 : row.regular_visit}</TableCell>
                        <TableCell align="center" sx={{ border: '1px solid #ddd' }}>{isOnLeave ? 0 : row.followup_visit}</TableCell>
                        <TableCell align="center" sx={{ border: '1px solid #ddd' }}>{isOnLeave ? 0 : row.mature_order}</TableCell>
                        
                        {/* Meter Reading Column: Yahan condition lagayi hai */}
                        <TableCell sx={{ border: '1px solid #ddd', fontWeight: isOnLeave ? 'normal' : 'normal', color: isOnLeave ? '#f44336' : 'inherit' }}>
                            {isOnLeave ? "LEAVE" : row.meter_reading}
                        </TableCell>
                    </TableRow>
                );
            })}
            
            {/* Daily Sub-Total Row */}
            <TableRow sx={{ bgcolor: '#f9f9f9' }}>
                <TableCell sx={{ border: '1px solid #ddd', fontWeight: 'bold', color: '#2e7d32' }}>
                    Total Sales Person : {day.data.length}
                </TableCell>
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