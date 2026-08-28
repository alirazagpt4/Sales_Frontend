import XLSX from 'xlsx-js-style';
import React, { useState, useEffect } from 'react';
import {
    Typography, Box, TextField, Button, Grid, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Divider, MenuItem
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import API from '../api/axiosClient.jsx';

// Display Date Formatter: Aug 1, 2026
const formatForDisplay = (dateString) => {
    if (!dateString) return "";
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

// Short date for column header: "1 Aug"
const formatShortDate = (dateString) => {
    if (!dateString) return "";
    const options = { day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

// Day name for column header: "Sat"
const formatDayName = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });
};

// Sticky first-column ("Field") style, reused across all rows
const stickyLabelStyle = {
    position: 'sticky',
    left: 0,
    zIndex: 2,
    bgcolor: '#eeeeee',
    fontWeight: 'bold',
    border: '1px solid #ddd',
    minWidth: 150,
    whiteSpace: 'nowrap'
};

const SalesPersonWiseDvrReport = () => {
    const [selectedUser, setSelectedUser] = useState('');
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [users, setUsers] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsersList = async () => {
            try {
                const response = await API.get('/users?page=1&limit=1000&is_active=true');
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
        if (!selectedUser) {
            setError("Please select a Sales Person.");
            return;
        }
        setLoading(true);
        setError(null);
        setReportData(null);
        try {
            const response = await API.get('/reports/sales-person-wise-dvr-report', {
                params: { name: selectedUser, fromDate, toDate }
            });

            if (response.data?.success && response.data?.report?.length > 0) {
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

    const exportToExcel = () => {
        if (!reportData || !reportData.report) return;
        const { meta, report } = reportData;

        const headerStyle = {
            fill: { fgColor: { rgb: "2E7D32" } },
            font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
            alignment: { vertical: "center", horizontal: "center", wrapText: true },
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            }
        };

        const labelStyle = {
            fill: { fgColor: { rgb: "E8F5E9" } },
            font: { bold: true, color: { rgb: "1B5E20" }, sz: 10 },
            alignment: { vertical: "center", horizontal: "left" },
            border: {
                top: { style: "thin", color: { rgb: "DDDDDD" } },
                bottom: { style: "thin", color: { rgb: "DDDDDD" } },
                left: { style: "thin", color: { rgb: "DDDDDD" } },
                right: { style: "thin", color: { rgb: "DDDDDD" } }
            }
        };

        const bodyStyle = {
            alignment: { vertical: "center", horizontal: "center", wrapText: true },
            border: {
                top: { style: "thin", color: { rgb: "DDDDDD" } },
                bottom: { style: "thin", color: { rgb: "DDDDDD" } },
                left: { style: "thin", color: { rgb: "DDDDDD" } },
                right: { style: "thin", color: { rgb: "DDDDDD" } }
            }
        };

        const leaveStyle = {
            ...bodyStyle,
            fill: { fgColor: { rgb: "FFEBEE" } },
            font: { color: { rgb: "C62828" }, bold: true }
        };

        const excelData = [];
        const merges = [];

        // Title row
        excelData.push([{ v: "Sales Person Wise DVR Report", s: { font: { bold: true, sz: 14 } } }]);
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: report.length } });
        excelData.push([]);

        // Meta info rows (person header block)
        const metaRows = [
            ["Sales Person", meta.sales_person || "N/A"],
            ["Designation", meta.designation || "N/A"],
            ["Region", meta.region || "N/A"],
            ["Report Period", `${formatForDisplay(meta.from_date)} - ${formatForDisplay(meta.to_date)}`],
            ["Total KM Traveled", `${meta.total_km_traveled || 0} km`],
            ["Total Days Tracked", meta.total_days_tracked || 0]
        ];
        metaRows.forEach(([label, value]) => {
            excelData.push([{ v: label, s: labelStyle }, { v: value, s: bodyStyle }]);
        });
        excelData.push([]);

        // Table header row: "Field" + one column per date
        const headerRow = [{ v: "Field", s: headerStyle }];
        report.forEach(day => {
            headerRow.push({ v: `${formatShortDate(day.date)} (${formatDayName(day.date)})`, s: headerStyle });
        });
        excelData.push(headerRow);

        const buildRow = (label, valueFn) => {
            const row = [{ v: label, s: labelStyle }];
            report.forEach(day => {
                row.push({ v: valueFn(day), s: day.is_leave ? leaveStyle : bodyStyle });
            });
            return row;
        };

        excelData.push(buildRow("Customers", d => d.is_leave ? "-" : ((d.visited_customers || []).join(", ") || "-")));
        excelData.push(buildRow("Region", () => meta.region || "-"));
        excelData.push(buildRow("Meter Reading", d => d.is_leave ? "-" : d.meter_reading));
        excelData.push(buildRow("Daily KM", d => d.is_leave ? "-" : d.daily_km));
        excelData.push(buildRow("Total Visits", d => d.is_leave ? "-" : d.total_visits));

        const worksheet = XLSX.utils.aoa_to_sheet(excelData);
        worksheet['!merges'] = merges;

        const colWidths = [{ wch: 22 }];
        report.forEach(() => colWidths.push({ wch: 16 }));
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DVR Report");

        const fileNameUser = (meta.sales_person || 'Report').replace(/\s+/g, '_');
        XLSX.writeFile(workbook, `Sales_Person_DVR_Report_${fileNameUser}.xlsx`);
    };

    // Fewer date columns -> give each a bit more room (content-based, no ugly stretching).
    // Many date columns -> use a small, equal width and let the table scroll horizontally.
    const columnCount = reportData?.report?.length || 0;
    const dateColWidth = columnCount > 10 ? 95 : columnCount > 5 ? 125 : 160;

    return (
        <Box>
            <Typography variant="h5">
                Sales Person Wise DVR Report
            </Typography>
            <Divider sx={{ mb: 4 }} />

            {/* --- Filters Section --- */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={2.4}>
                        <TextField
                            select
                            size="small"
                            fullWidth
                            label="Select Sales Person"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            disabled={fetchingUsers}
                            sx={{ minWidth: 220 }}
                        >
                            {users.map((u) => (
                                <MenuItem key={u.id} value={u.name}>
                                    {u.fullname}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12} sm={2.4}>
                        <TextField size="small" fullWidth type="date" label="From" InputLabelProps={{ shrink: true }}
                            value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                            InputProps={{ startAdornment: <Box sx={{ position: 'absolute', left: 10, bgcolor: '#fff', width: 'calc(100% - 45px)', pointerEvents: 'none' }}><Typography variant="body2">{formatForDisplay(fromDate)}</Typography></Box> }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={2.4}>
                        <TextField size="small" fullWidth type="date" label="To" InputLabelProps={{ shrink: true }}
                            value={toDate} onChange={(e) => setToDate(e.target.value)}
                            InputProps={{ startAdornment: <Box sx={{ position: 'absolute', left: 10, bgcolor: '#fff', width: 'calc(100% - 45px)', pointerEvents: 'none' }}><Typography variant="body2">{formatForDisplay(toDate)}</Typography></Box> }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={2.4}>
                        <Button variant="contained" disableElevation fullWidth startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                            onClick={fetchReport} sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' }, height: '40px' }}>
                            Generate
                        </Button>
                    </Grid>

                    <Grid item xs={12} sm={2.4}>
                        <Button
                            variant="outlined"
                            fullWidth
                            startIcon={<DownloadIcon />}
                            onClick={exportToExcel}
                            disabled={!reportData}
                            sx={{ color: '#1b5e20', borderColor: '#1b5e20', height: '40px', '&:hover': { borderColor: '#2e7d32', bgcolor: '#f1f8e9' } }}
                        >
                            Export Excel
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {error && <Alert severity="info" sx={{ mb: 2 }}>{error}</Alert>}

            {reportData && (
                <>
                    {/* --- Meta / Person Header Card --- */}
                    <Paper variant="outlined" sx={{ p: 1.25, mb: 3, borderRadius: '8px', borderBottom: '3px solid #2e7d32' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 3, rowGap: 0.5 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 3, rowGap: 0.5 }}>
                                <Typography variant="body2">
                                    <Box component="span" sx={{ color: '#666', fontWeight: 700 }}>Sales Person:</Box>{' '}
                                    <Box component="span" sx={{ fontWeight: 700 }}>{reportData.meta.sales_person}</Box>
                                </Typography>
                                <Typography variant="body2">
                                    <Box component="span" sx={{ color: '#666', fontWeight: 700 }}>Designation:</Box>{' '}
                                    <Box component="span" sx={{ fontWeight: 700 }}>{reportData.meta.designation}</Box>
                                </Typography>
                                <Typography variant="body2">
                                    <Box component="span" sx={{ color: '#666', fontWeight: 700 }}>Region:</Box>{' '}
                                    <Box component="span" sx={{ fontWeight: 700 }}>{reportData.meta.region}</Box>
                                </Typography>
                                <Typography variant="body2">
                                    <Box component="span" sx={{ color: '#666', fontWeight: 700 }}>Total KM:</Box>{' '}
                                    <Box component="span" sx={{ fontWeight: 700, color: '#2e7d32' }}>{reportData.meta.total_km_traveled} km</Box>
                                </Typography>
                                <Typography variant="body2">
                                    <Box component="span" sx={{ color: '#666', fontWeight: 700 }}>Days Tracked:</Box>{' '}
                                    <Box component="span" sx={{ fontWeight: 700 }}>{reportData.meta.total_days_tracked}</Box>
                                </Typography>
                            </Box>

                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1b5e20', bgcolor: '#e8f5e9', p: '3px 10px', borderRadius: '6px', border: '1px solid #c8e6c9', whiteSpace: 'nowrap' }}>
                                {formatForDisplay(reportData.meta.from_date)} — {formatForDisplay(reportData.meta.to_date)}
                            </Typography>
                        </Box>
                    </Paper>

                    {/* --- Transposed Data Table: dates across the top --- */}
                    {/* width: 'fit-content' -> the white card only wraps as wide as the actual table (no big empty
                        gap on the right when there's just 1-2 date columns). maxWidth: '100%' + overflowX: 'auto' on
                        the container -> once there are enough dates to exceed the page width, it fills the row and
                        scrolls horizontally instead of overflowing. */}
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflowX: 'auto', mb: 3, width: 'fit-content', maxWidth: '100%' }}>
                        <Table size="small" sx={{ borderCollapse: 'collapse', width: 'auto', tableLayout: 'auto' }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ ...stickyLabelStyle, bgcolor: '#1b5e20', color: '#fff' }}>Dates</TableCell>
                                    {reportData.report.map((day, i) => (
                                        <TableCell key={i} sx={{ bgcolor: '#2e7d32', color: '#fff', fontWeight: 'bold', textAlign: 'center', border: '1px solid #1b5e20', width: dateColWidth }}>
                                            {formatShortDate(day.date)}
                                            <Typography variant="caption" display="block" sx={{ opacity: 0.85 }}>{formatDayName(day.date)}</Typography>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={stickyLabelStyle}>Customers</TableCell>
                                    {reportData.report.map((day, i) => (
                                        <TableCell key={i} sx={{ border: '1px solid #ddd', fontSize: '0.8rem', p: 0, verticalAlign: 'top' }}>
                                            {day.is_leave ? (
                                                <Box sx={{ p: 1, textAlign: 'center' }}>-</Box>
                                            ) : (day.visited_customers && day.visited_customers.length) ? (
                                                day.visited_customers.map((c, idx) => (
                                                    <Box
                                                        key={idx}
                                                        sx={{
                                                            px: 1,
                                                            py: 0.6,
                                                            borderBottom: idx !== day.visited_customers.length - 1 ? '1px solid #ddd' : 'none'
                                                        }}
                                                    >
                                                        {c}
                                                    </Box>
                                                ))
                                            ) : (
                                                <Box sx={{ p: 1, textAlign: 'center' }}>-</Box>
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>

                                <TableRow>
                                    <TableCell sx={stickyLabelStyle}>Region</TableCell>
                                    {reportData.report.map((day, i) => (
                                        <TableCell key={i} sx={{ border: '1px solid #ddd', textAlign: 'center' }}>
                                            {reportData.meta.region || '-'}
                                        </TableCell>
                                    ))}
                                </TableRow>

                                <TableRow>
                                    <TableCell sx={stickyLabelStyle}>Total Visits</TableCell>
                                    {reportData.report.map((day, i) => (
                                        <TableCell key={i} sx={{ border: '1px solid #ddd', textAlign: 'center' }}>
                                            {day.is_leave ? '-' : day.total_visits}
                                        </TableCell>
                                    ))}
                                </TableRow>

                                <TableRow>
                                    <TableCell sx={stickyLabelStyle}>Meter Reading</TableCell>
                                    {reportData.report.map((day, i) => (
                                        <TableCell key={i} sx={{ border: '1px solid #ddd', textAlign: 'center', fontWeight: 600 }}>
                                            {day.is_leave ? '-' : day.meter_reading}
                                        </TableCell>
                                    ))}
                                </TableRow>

                                <TableRow>
                                    <TableCell sx={stickyLabelStyle}>Daily KM</TableCell>
                                    {reportData.report.map((day, i) => (
                                        <TableCell key={i} sx={{ border: '1px solid #ddd', textAlign: 'center', fontWeight: 700, color: '#2e7d32' }}>
                                            {day.is_leave ? '-' : `${day.daily_km} km`}
                                        </TableCell>
                                    ))}
                                </TableRow>


                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Box>
    );
};

export default SalesPersonWiseDvrReport;