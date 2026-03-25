// import * as XLSX from 'xlsx'; // Excel export ke liye library
import XLSX from 'xlsx-js-style';

import React, { useState, useEffect } from 'react';
import {
    Typography, Box, TextField, Button, Grid, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Divider, MenuItem, IconButton, Dialog, DialogContent, DialogTitle
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
    const [selectedName, setSelectedName] = useState('');
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

        // Headers set karna
        const headers = [
            "Date", "Time", "Type", "Customer Name", "Tehsil",
            "City", "Region", "Visit Purpose", "Bags Potential", "Day Start Info"
        ];

        // Header Row with Style
        excelData.push(headers.map(h => ({ v: h, s: headerStyle })));
        currentRow++;

        reportData.report.forEach((group) => {
            const startRow = currentRow;

            group.visits.forEach((visit) => {
                excelData.push([
                    { v: group.date, s: bodyStyle },
                    { v: visit.visit_time || 'N/A', s: bodyStyle },
                    { v: visit.type, s: bodyStyle },
                    { v: visit.customer_name, s: bodyStyle },
                    { v: visit.tehsil, s: bodyStyle },
                    { v: visit.city, s: bodyStyle },
                    { v: visit.region, s: bodyStyle },
                    { v: getVisitPurposeLabel(visit.visit_purpose), s: bodyStyle },
                    { v: visit.bags_potential, s: bodyStyle },
                    { v: `Started: ${formatTime(group.start_time)}\nMeter: ${group.meter_reading}`, s: bodyStyle }
                ]);
                currentRow++;
            });

            if (group.visits.length > 1) {
                merges.push({ s: { r: startRow, c: 0 }, e: { r: currentRow - 1, c: 0 } }); // Date Merge
                merges.push({ s: { r: startRow, c: 9 }, e: { r: currentRow - 1, c: 9 } }); // Info Merge
            }
        });

        const worksheet = XLSX.utils.aoa_to_sheet(excelData);
        worksheet['!merges'] = merges;
        worksheet['!cols'] = [
            { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 15 },
            { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 35 }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Report");
        XLSX.writeFile(workbook, `FSPL_Report_${selectedName}.xlsx`);
    };

    //    purpose label mapping
    const getVisitPurposeLabel = (purpose) => {
        const mapping = {
            'New': 'Customer Regular Visit',
            'Old': 'Follow Up Visit',
            'Mature': 'Mature Order'
        };
        return mapping[purpose] || purpose; // Agar koi naya code ho toh wahi dikha de
    };


    // google map handling for location
    const handleOpenMap = (lat, lng) => {
        if (!lat || !lng) {
            alert("Coordinates not available");
            return;
        }
        const url = `https://www.google.com/maps?q=${lat},${lng}`;
        window.open(url, '_blank');
    };


    // Image Modal State
    const [openImage, setOpenImage] = useState(false);
    const [currentImg, setCurrentImg] = useState('');

    const handleShowImage = (path) => {
        const baseUrl = "http://38.242.201.229:3000";

        // Agar path "uploads/image-123.jpg" hai, toh humein sirf "image-123.jpg" chahiye
        const fileName = path.split('/').pop();

        // Final URL: http://38.242.201.229:3000/public/image-123.jpg
        const finalUrl = `${baseUrl}/public/${fileName}`;

        console.log("Image Target URL:", finalUrl);
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

            // File ka naam: Image URL se nikaal kar download ke liye set karna
            const fileName = imageUrl.split('/').pop();
            link.download = fileName || 'meter-reading.jpg';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            // Agar fetch kaam na kare (CORS issue), toh direct link open kar dein
            window.open(imageUrl, '_blank');
        }
    };

    useEffect(() => {
        const fetchUsersList = async () => {
            try {
                const response = await API.get('/users?limit=1000'); // Assuming this endpoint returns all users without pagination
                const data = response.data.users || response.data || [];
                console.log("USERS RESPONSE ......", response.data.users);

                // 1. Technical Audit: Define excluded IDs in a constant to avoid "Magic Numbers"
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
                console.log("Report Data: ........... ", response.data);
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
                            disabled={!reportData} // Jab tak report generate na ho, button band rahega
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
                <TableContainer component={Paper} variant="outlined">
                    <Box sx={{
                        p: 2,
                        bgcolor: '#ffffff',
                        borderBottom: '2px solid #2e7d32',
                        display: 'flex',
                        flexWrap: 'nowrap', // Is se line break nahi hogi
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        {/* Left Side: Information & Stats */}
                        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>

                            {/* User Info with fixed widths to prevent overlapping */}
                            <Box sx={{ minWidth: '120px' }}>
                                <Typography variant="caption" sx={{ color: '#666', display: 'block', fontWeight: 'bold' }}>SALES PERSON</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{reportData.meta.sales_person}</Typography>
                            </Box>

                            <Box sx={{ minWidth: '130px' }}>
                                <Typography variant="caption" sx={{ color: '#666', display: 'block', fontWeight: 'bold' }}>DESIGNATION</Typography>
                                <Typography variant="body2">{reportData.meta.designation || 'N/A'}</Typography>
                            </Box>

                            <Box sx={{ minWidth: '100px' }}>
                                <Typography variant="caption" sx={{ color: '#666', display: 'block', fontWeight: 'bold' }}>Region</Typography>
                                <Typography variant="body2">{reportData.meta.region || 'N/A'}</Typography>
                            </Box>

                            {/* Vertical Separator */}
                            <Divider orientation="vertical" flexItem sx={{ mx: 1, height: '30px', alignSelf: 'center' }} />

                            {/* Counts - Wahi purana style Pill wala */}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Box sx={{ bgcolor: '#e8f5e9', px: 1.5, py: 0.5, borderRadius: '20px', border: '1px solid #c8e6c9' }}>
                                    <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>Total: {reportData.meta.total_visits}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#e3f2fd', px: 1.5, py: 0.5, borderRadius: '20px', border: '1px solid #bbdefb' }}>
                                    <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 'bold' }}>New: {reportData.meta.new || 0}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#e3f2fd', px: 1.5, py: 0.5, borderRadius: '20px', border: '1px solid #bbdefb' }}>
                                    <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 'bold' }}>Old: {reportData.meta.old || 0}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#e3f2fd', px: 1.5, py: 0.5, borderRadius: '20px', border: '1px solid #bbdefb' }}>
                                    <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 'bold' }}>Mature: {reportData.meta.mature || 0}</Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Right Side: Date Range - Locked to Right */}
                        <Box sx={{ textAlign: 'right', pl: 3, borderLeft: '1px solid #eee' }}>
                            <Typography variant="caption" sx={{ color: '#666', display: 'block', fontWeight: 'bold' }}>REPORT PERIOD</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1b5e20', bgcolor: '#f1f8e9', p: '4px 12px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                {formatForDisplay(fromDate)} — {formatForDisplay(toDate)}
                            </Typography>
                        </Box>
                    </Box>
                    <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                        <TableHead sx={{ bgcolor: '#eeeeee' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd', width: '120px' }}>Date</TableCell>
                                {/* Yahan visit hata kar simple Heading likhein */}
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Time</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Customer Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Tehsil</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>City</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Region</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>Visit Purpose</TableCell>
                                <TableCell sx={{
                                    fontWeight: 'bold',
                                    border: '1px solid #ddd',
                                    width: '60px',       // Width kam kar di
                                    whiteSpace: 'normal', // Text ko wrap hone dega
                                    lineHeight: '1.2',    // Lines ke darmiyan gap kam karega
                                    textAlign: 'center'
                                }}>Bags Potential</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>Visit Location</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd', textAlign: 'center' }}>Day Start Info</TableCell>

                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reportData.report.map((group, gIndex) => {
                                // Leave check: agar leave_status "PRESENT" nahi hai toh matlab leave hai
                                const isOnLeave = group.is_leave === true || group.leave_status !== "PRESENT";

                                // Agar visits nahi hain toh [null] ki array banate hain taake row render ho
                                const displayVisits = group.visits.length > 0 ? group.visits : [null];

                                return displayVisits.map((visit, vIndex) => (
                                    <TableRow key={`${gIndex}-${vIndex}`}>

                                        {/* 1. Date Column */}
                                        {vIndex === 0 && (
                                            <TableCell
                                                rowSpan={displayVisits.length}
                                                sx={{ border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'middle' }}
                                            >
                                                {formatForDisplay(group.date)}
                                            </TableCell>
                                        )}

                                        {/* 2. Visit Columns (Simple text or dash) */}
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit?.visit_time || "-"}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit?.type || "-"}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit?.customer_name || (isOnLeave && vIndex === 0 ? "--" : "-")}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit?.tehsil || "-"}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit?.city || "-"}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit?.region || "-"}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd' }}>{visit ? getVisitPurposeLabel(visit.visit_purpose) : "-"}</TableCell>
                                        <TableCell sx={{ border: '1px solid #ddd', textAlign: 'center' }}>{visit?.bags_potential || "-"}</TableCell>

                                        {/* 3. Visit Location Icon */}
                                        <TableCell sx={{ border: '1px solid #ddd', textAlign: 'center' }}>
                                            {visit ? (
                                                <IconButton size="small" color="primary" onClick={() => handleOpenMap(visit.visit_location?.lat, visit.visit_location?.lng)}>
                                                    <LocationOnIcon fontSize="small" />
                                                </IconButton>
                                            ) : "-"}
                                        </TableCell>

                                        {/* 4. Day Start Info (Meter Reading / Leave Status) */}
                                        {vIndex === 0 && (
                                            <TableCell
                                                rowSpan={displayVisits.length}
                                                sx={{ border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'middle' }}
                                            >
                                                {isOnLeave ? (
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold', display: 'block' }}>STATUS</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#f44336' }}>{group.leave_status}</Typography>
                                                        {/* <Typography variant="caption" sx={{ color: '#888' }}></Typography> */}
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
                maxWidth="md" // 'sm' se badha kar 'md' kar diya taake box bada ho
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        overflow: 'hidden' // Header ke corners round rakhne ke liye
                    }
                }}
            >
                <DialogTitle sx={{
                    m: 0,
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: '#2e7d32',
                    color: 'white'
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Meter Reading Proof
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* --- Download Button --- */}
                        <IconButton
                            onClick={() => handleDownloadImage(currentImg)}
                            sx={{
                                color: 'white',
                                mr: 1,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                            }}
                            title="Download Image"
                        >
                            <DownloadIcon /> {/* Yeh hai wo standard icon jo aap keh rahe hain */}
                        </IconButton>

                        {/* --- Close Button --- */}
                        <IconButton
                            onClick={() => setOpenImage(false)}
                            sx={{ color: 'white' }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent
                    dividers
                    sx={{
                        p: 2, // Thori padding taake image bilkul deewaron se na lage
                        textAlign: 'center',
                        bgcolor: '#f0ececff', // Dark background taake image uth kar nazar aaye
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '400px' // Minimum height taake choti image par box collapse na kare
                    }}
                >
                    {currentImg && (
                        <img
                            src={currentImg}
                            alt="Meter Reading"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '70vh', // Screen ki 70% height se zyada na ho
                                objectFit: 'contain', // Image ki ratio kharab nahi hogi
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)', // Image par depth effect
                                borderRadius: '4px'
                            }}
                            onError={(e) => {
                                e.target.onerror = null; // Loop rokne ke liye
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