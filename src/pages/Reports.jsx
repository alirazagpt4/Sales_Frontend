// import * as XLSX from 'xlsx'; // Excel export ke liye library
import XLSX from 'xlsx-js-style';

import React, { useState, useEffect } from 'react';
import {
    Typography, Box, TextField, Button, Grid, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Divider, MenuItem, IconButton, Dialog, DialogContent, DialogTitle,
    Checkbox, ListItemText
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
    // 🔴 Multi-select aur "All" ko handle karne ke liye default state "All" rakhenge
    const [selectedNames, setSelectedNames] = useState(['All']);
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [users, setUsers] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(true);
    const [error, setError] = useState(null);

    const exportToExcel = () => {
        if (!reportData || !reportData.report) return;

        const excelData = [];
        const merges = [];
        let currentRow = 0;

        // --- 1. Header Style (Portal Green) ---
        const headerStyle = {
            fill: { fgColor: { rgb: "2E7D32" } }, // Green Background
            font: { color: { rgb: "FFFFFF" }, bold: true, sz: 12 }, // White Bold Font
            alignment: { vertical: "center", horizontal: "center" },
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } }
            }
        };

        // --- 2. Body Style ---
        const bodyStyle = {
            alignment: { vertical: "center", horizontal: "center", wrapText: true },
            border: {
                top: { style: "thin", color: { rgb: "DDDDDD" } },
                bottom: { style: "thin", color: { rgb: "DDDDDD" } },
                left: { style: "thin", color: { rgb: "DDDDDD" } },
                right: { style: "thin", color: { rgb: "DDDDDD" } }
            }
        };

        // Headers set karna - Sales Person column shamil kiya hai multi-user report ke liye
        const headers = [
            "Date", "Sales Person", "Time", "Type", "Customer Name", "Tehsil",
            "City", "Region", "Visit Purpose", "Bags Potential", "Day Start Info"
        ];

        // Header Row with Style
        excelData.push(headers.map(h => ({ v: h, s: headerStyle })));
        currentRow++;

        reportData.report.forEach((group) => {
            const startRow = currentRow;

            const displayVisits = group.visits.length > 0 ? group.visits : [null];

            displayVisits.forEach((visit) => {
                excelData.push([
                    { v: group.date, s: bodyStyle },
                    { v: visit?.sales_person || "N/A", s: bodyStyle },
                    { v: visit?.visit_time || 'N/A', s: bodyStyle },
                    { v: visit?.type || "-", s: bodyStyle },
                    { v: visit?.customer_name || "-", s: bodyStyle },
                    { v: visit?.tehsil || "-", s: bodyStyle },
                    { v: visit?.city || "-", s: bodyStyle },
                    { v: visit?.region || "-", s: bodyStyle },
                    { v: visit ? getVisitPurposeLabel(visit.visit_purpose) : "-", s: bodyStyle },
                    { v: visit?.bags_potential || "-", s: bodyStyle },
                    { v: group.is_leave ? `Status: ${group.leave_status}` : `Started: ${formatTime(group.start_time)}\nMeter: ${group.meter_reading}`, s: bodyStyle }
                ]);
                currentRow++;
            });

            if (displayVisits.length > 1) {
                merges.push({ s: { r: startRow, c: 0 }, e: { r: currentRow - 1, c: 0 } }); // Date Merge
                merges.push({ s: { r: startRow, c: 10 }, e: { r: currentRow - 1, c: 10 } }); // Info Merge
            }
        });

        const worksheet = XLSX.utils.aoa_to_sheet(excelData);
        worksheet['!merges'] = merges;
        worksheet['!cols'] = [
            { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 15 },
            { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 35 }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Report");

        // Dynamic file name generation based on selected metadata
        const fileNameSuffix = selectedNames.includes('All') ? 'All_Users' : selectedNames.join('_');
        XLSX.writeFile(workbook, `FSPL_Report_${fileNameSuffix}.xlsx`);
    };

    const getVisitPurposeLabel = (purpose) => {
        const mapping = {
            'New': 'Customer Regular Visit',
            'Old': 'Follow Up Visit',
            'Mature': 'Mature Order',
            'NewPotentialCustomer': 'New Potential Customer'
        };
        return mapping[purpose] || purpose;
    };

    const handleOpenMap = (lat, lng) => {
        if (!lat || !lng) {
            alert("Coordinates not available");
            return;
        }
        const url = `https://maps.google.com/?q=${lat},${lng}`;
        window.open(url, '_blank');
    };

    const [openImage, setOpenImage] = useState(false);
    const [currentImg, setCurrentImg] = useState('');

    const handleShowImage = (path) => {
        const baseUrl = "http://38.242.201.229:3000";
        const fileName = path.split('/').pop();
        const finalUrl = `${baseUrl}/public/${fileName}`;
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
            const fileName = imageUrl.split('/').pop();
            link.download = fileName || 'meter-reading.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            window.open(imageUrl, '_blank');
        }
    };

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

    // 🔴 Dropdown selection logic to handle Multi-Select constraints and "All" toggle smoothly
    const handleNameChange = (event) => {
        const { value } = event.target;

        // Case 1: Agar "All" select kiya gaya hai, baki sab uncheck karo
        if (value[value.length - 1] === 'All') {
            setSelectedNames(['All']);
            return;
        }

        // Case 2: Agar pehle se "All" tha aur koi individual user select kiya, toh "All" ko nikal do
        if (value.includes('All') && value.length > 1) {
            const cleanValues = value.filter(name => name !== 'All');
            setSelectedNames(cleanValues);
            return;
        }

        // Case 3: Agar sab unselect kar diye, toh automatically default to "All"
        if (value.length === 0) {
            setSelectedNames(['All']);
            return;
        }

        setSelectedNames(value);
    };

    const fetchReport = async () => {
        if (selectedNames.length === 0) {
            setError("Please select at least one Sales Person.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Backend parameters matching backend initialization
            const payloadNames = selectedNames.includes('All') ? 'All' : selectedNames;

            const response = await API.get('/reports/daily-report', {
                params: { names: payloadNames, fromDate, toDate }
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
            <Typography variant="h5">
                Daily Visit Reports
            </Typography>
            <Divider sx={{ mb: 4 }} />

            {/* --- Filters Section --- */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                        <TextField
                            select
                            size="small"
                            fullWidth
                            label="Filter Sale Executives"
                            SelectProps={{
                                multiple: true,
                                value: selectedNames,
                                onChange: handleNameChange,
                                // 🔥 FIXED: Yeh input field ke andar lambi strings ke bajaye clean text render karega
                                renderValue: (selected) => {
                                    if (selected.includes('All')) {
                                        return "All Sale Executives Selected";
                                    }
                                    if (selected.length === 1) {
                                        // Dropdown ke andar display name behtar lagta hai, ya direct array count dikhao
                                        return "1 Sale Executive Selected";
                                    }
                                    return `${selected.length} Sale Executives Selected`;
                                },
                                MenuProps: {
                                    PaperProps: {
                                        style: {
                                            maxHeight: 300, // Dropdown list ko zyada lamba hone se rokega
                                            width: 250,
                                        },
                                    },
                                },
                            }}
                            disabled={fetchingUsers}
                        >
                            <MenuItem value="All">
                                <Checkbox checked={selectedNames.includes('All')} />
                                <ListItemText primary="All Users" />
                            </MenuItem>
                            {users.map((u) => (
                                <MenuItem key={u.id} value={u.name}>
                                    <Checkbox checked={selectedNames.includes(u.name)} />
                                    <ListItemText primary={u.fullname} />
                                </MenuItem>
                            ))}
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

                    <Grid item xs={12} sm={3}>
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

            {/* --- Output Section Header --- */}
            {reportData && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden', mb: 3 }}>
                    <Box sx={{
                        p: 2.5,
                        bgcolor: '#ffffff',
                        borderBottom: '2px solid #2e7d32',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.5, // Perfect semantic spacing between row 1 and row 2
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>

                        {/* --- ROW 1: METADATA & PERIOD WINDOW --- */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                            flexWrap: { xs: 'wrap', sm: 'nowrap' },
                            gap: 2
                        }}>
                            {/* Left Element: Target Agents */}
                            <Box>
                                <Typography variant="caption" sx={{ color: '#666', display: 'block', fontWeight: 'bold', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Sale Executive Target
                                </Typography>
                                <Box sx={{ display: 'inline-block', bgcolor: '#f5f5f5', px: 1.5, py: 0.6, borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#333' }}>
                                        {selectedNames.includes('All')
                                            ? 'All Sale Executives Selected'
                                            : selectedNames.length === 1
                                                ? '1 Sale Executive Selected'
                                                : `${selectedNames.length} Sale Executives Selected`}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Right Element: Report Window Execution Range */}
                            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                <Typography variant="caption" sx={{ color: '#666', display: 'block', fontWeight: 'bold', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Report Period
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1b5e20', bgcolor: '#e8f5e9', p: '6px 14px', borderRadius: '6px', display: 'inline-block', whiteSpace: 'nowrap', border: '1px solid #c8e6c9' }}>
                                    {formatForDisplay(fromDate)} — {formatForDisplay(toDate)}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed', my: 0.5 }} />

                        {/* --- ROW 2: ANALYSIS COUNTER BADGES MATRIX --- */}
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="caption" sx={{ color: '#666', display: 'block', fontWeight: 'bold', mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Performance Metrics Breakdown
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ bgcolor: '#e8f5e9', px: 2, py: 0.8, borderRadius: '8px', border: '1px solid #c8e6c9' }}>
                                    <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                        Total Visits: <span style={{ fontSize: '0.85rem', marginLeft: '4px' }}>{reportData.meta.total_visits}</span>
                                    </Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#efebe9', px: 2, py: 0.8, borderRadius: '8px', border: '1px solid #d7ccc8' }}>
                                    <Typography variant="caption" sx={{ color: '#5d4037', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                        New Potential: <span style={{ fontSize: '0.85rem', marginLeft: '4px' }}>{reportData.meta.newPotentialCustomer || 0}</span>
                                    </Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#e3f2fd', px: 2, py: 0.8, borderRadius: '8px', border: '1px solid #bbdefb' }}>
                                    <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                        Regular: <span style={{ fontSize: '0.85rem', marginLeft: '4px' }}>{reportData.meta.new || 0}</span>
                                    </Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#fff3e0', px: 2, py: 0.8, borderRadius: '8px', border: '1px solid #ffe0b2' }}>
                                    <Typography variant="caption" sx={{ color: '#e65100', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                        Follow Up: <span style={{ fontSize: '0.85rem', marginLeft: '4px' }}>{reportData.meta.old || 0}</span>
                                    </Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#f3e5f5', px: 2, py: 0.8, borderRadius: '8px', border: '1px solid #e1bee7' }}>
                                    <Typography variant="caption" sx={{ color: '#4a148c', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                        Mature: <span style={{ fontSize: '0.85rem', marginLeft: '4px' }}>{reportData.meta.mature || 0}</span>
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                    </Box>
                    <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                        <TableHead sx={{ bgcolor: '#eeeeee' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd', width: '120px' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Sales Person</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Time</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Customer Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Tehsil</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Visit Purpose</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd', width: '60px', whiteSpace: 'normal', lineHeight: '1.2', textAlign: 'center' }}>Bags Potential</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>Visit Location</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>Day Start Info</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reportData.report.map((group, gIndex) => {
                                const isOnLeave = group.is_leave === true || group.leave_status !== "PRESENT";
                                const displayVisits = group.visits.length > 0 ? group.visits : [null];

                                return displayVisits.map((visit, vIndex) => (
                                    <TableRow key={`${gIndex}-${vIndex}`}>
                                        {/* Date Column */}
                                        {vIndex === 0 && (
                                            <TableCell
                                                rowSpan={displayVisits.length}
                                                sx={{ border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'middle' }}
                                            >
                                                {formatForDisplay(group.date)}
                                            </TableCell>
                                        )}

                                        <TableCell sx={{ border: '1px solid #ddd', fontWeight: '500' }}>{visit?.sales_person || "N/A"}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit?.visit_time || "-"}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit?.type || "-"}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit?.customer_name || (isOnLeave && vIndex === 0 ? "--" : "-")}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit?.tehsil || "-"}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit ? getVisitPurposeLabel(visit.visit_purpose) : "-"}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd', textAlign: 'center' }}>{visit?.bags_potential || "-"}</TableCell>

                                        {/* Visit Location */}
                                        <TableCell sx={{ border: '1px solid #ddd', textAlign: 'center' }}>
                                            {visit ? (
                                                <IconButton size="small" color="primary" onClick={() => handleOpenMap(visit.visit_location?.lat, visit.visit_location?.lng)}>
                                                    <LocationOnIcon fontSize="small" />
                                                </IconButton>
                                            ) : "-"}
                                        </TableCell>

                                        {/* Day Start Info */}
                                        {vIndex === 0 && (
                                            <TableCell
                                                rowSpan={displayVisits.length}
                                                sx={{ border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'middle' }}
                                            >
                                                {isOnLeave ? (
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold', display: 'block' }}>STATUS</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#f44336' }}>{group.leave_status}</Typography>
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold', fontSize: '0.7rem' }}>STARTED AT</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: '700' }}>
                                                            {formatTime(group.start_time)}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {group.meter_reading}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                            {group.photoUri && (
                                                                <IconButton size="small" onClick={() => handleShowImage(group.photoUri)} sx={{ color: '#2e7d32' }}>
                                                                    <VisibilityIcon fontSize="small" />
                                                                </IconButton>
                                                            )}
                                                            <IconButton size="small" onClick={() => handleOpenMap(group.start_location?.lat, group.start_location?.lng)}>
                                                                <LocationOnIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ));
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* --- Image Preview Modal --- */}
            <Dialog
                open={openImage}
                onClose={() => setOpenImage(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}
            >
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#2e7d32', color: 'white' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Meter Reading Proof
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => handleDownloadImage(currentImg)} sx={{ color: 'white', mr: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }} title="Download Image">
                            <DownloadIcon />
                        </IconButton>
                        <IconButton onClick={() => setOpenImage(false)} sx={{ color: 'white' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 2, textAlign: 'center', bgcolor: '#f0ececff', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    {currentImg && (
                        <img
                            src={currentImg}
                            alt="Meter Reading"
                            style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', borderRadius: '4px' }}
                            onError={(e) => {
                                e.target.onerror = null;
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