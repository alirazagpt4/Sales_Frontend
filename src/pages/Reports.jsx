import React, { useState } from 'react';
import { 
    Typography, 
    Box, 
    TextField, 
    Button, 
    Grid, 
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,         // Data display ke liye
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress, // Loading ke liye
    Alert
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import API from '../api/axiosClient.jsx'; // Assuming your configured Axios client

// Table Headers jo aapke data keys se mapped hain
const REPORT_HEADERS = [
    { id: 'Date', label: 'Date' },
    { id: 'AgentID', label: 'Agent ID' }, // Needs Agent Name mapping
    { id: 'DayStartTime', label: 'Day Start Time' },
    { id: 'TotalVisits', label: 'Total Visits' },
    { id: 'UniqueCustomers', label: 'Unique Customers' },
];


// --- Helper function to convert CSV string to Array of Objects ---
const csvToArray = (csvText) => {
    // CSV headers aur rows ko line-by-line alag karna
    const [headerLine, ...dataLines] = csvText.trim().split('\n').map(line => line.trim());
    
    // Headers ko keys banana
    const headers = headerLine.split(',').map(h => h.replace(/"/g, ''));

    if (dataLines.length === 0 || (dataLines.length === 1 && dataLines[0] === '')) return [];

    // Har data line ko object mein convert karna
    return dataLines.map(line => {
        const values = line.split(',').map(v => v.replace(/"/g, ''));
        return headers.reduce((obj, header, index) => {
            // Numbers ko number mein convert karna
            const value = values[index];
            obj[header] = isNaN(Number(value)) || value.trim() === '' ? value : Number(value);
            return obj;
        }, {});
    });
};

const Reports = () => {
    // Current date (today) and 7 days ago set kiye hain as defaults
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(sevenDaysAgo);
    const [endDate, setEndDate] = useState(today);
    // Report Type ko "Activity" par set kar diya
    const [reportType, setReportType] = useState('activity'); 
    
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Backend URL: http://localhost:3000/api/reports/detailed
    const API_BASE_URL = API; // Assuming API points to http://localhost:3000
    const REPORT_ENDPOINT = '/reports/detailed';


    

    const handleGenerateReport = async () => {
        setLoading(true);
        setReportData(null);
        setError(null);

        const params = { start: startDate, end: endDate };

        try {
            // 🚨 FIX 1: responseType: 'text' set kiya gaya hai
            const response = await API.get(REPORT_ENDPOINT, { 
                params,
                responseType: 'text' 
            });
            
            // 🚨 FIX 2: CSV string ko manually parse karna
            const parsedData = csvToArray(response.data);

            if (parsedData.length > 0) {
                setReportData(parsedData);
                // console.log("Parsed Data:", parsedData); // Check karne ke liye
            } else {
                 setError("No data found for the selected period.");
            }

        } catch (err) {
            console.error("Error fetching report data:", err);
            // Error ko generic rakha
            setError("Failed to fetch report data. Check network or API response format."); 
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!reportData) {
            alert("Please generate the report first before downloading.");
            return;
        }

        // CSV download ke liye direct backend URL use karna zaroori hai
        // Backend khud hi file generate karke bhej dega
        const downloadUrl = `${API_BASE_URL}${REPORT_ENDPOINT}?start=${startDate}&end=${endDate}`;
        
        // Link create karke download trigger karna
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `${reportType}_report_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Render Function
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                📅 Agent Activity Reports
            </Typography>

            {/* --- 1. Filter Section --- */}
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Report Filters
                </Typography>
                <Grid container spacing={2} alignItems="flex-end">
                    
                    {/* Report Type Selector (Fixed to Activity) */}
                    <Grid item xs={12} sm={4}>
                         <FormControl fullWidth disabled> {/* Disable, kyunki abhi sirf Activity Report hai */}
                             <InputLabel id="report-type-label">Report Type</InputLabel>
                             <Select
                                 labelId="report-type-label"
                                 value={reportType}
                                 label="Report Type"
                                 onChange={(e) => setReportType(e.target.value)}
                             >
                                 <MenuItem value={'activity'}>Agent Activity Summary</MenuItem>
                             </Select>
                         </FormControl>
                    </Grid>

                    {/* Start Date Picker */}
                    <Grid item xs={12} sm={3}>
                        <TextField
                            label="Start Date"
                            type="date"
                            fullWidth
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    {/* End Date Picker */}
                    <Grid item xs={12} sm={3}>
                        <TextField
                            label="End Date"
                            type="date"
                            fullWidth
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    {/* Generate Button */}
                    <Grid item xs={12} sm={2}>
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={handleGenerateReport}
                            startIcon={<SearchIcon />}
                            sx={{ height: '56px' }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* --- 2. Report Output Section --- */}
            <Box>
                <Paper elevation={3} sx={{ p: 3, minHeight: 400 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                            ACTIVITY REPORT PREVIEW
                        </Typography>
                        
                        {/* Download Button */}
                        <Button
                            variant="outlined"
                            color="success"
                            onClick={handleDownload}
                            startIcon={<DownloadIcon />}
                            disabled={!reportData || reportData.length === 0} // Data hone par hi download hoga
                        >
                            Download CSV
                        </Button>
                    </Box>
                    <hr />
                    
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    
                    {/* --- Data Table --- */}
                    {!loading && reportData && reportData.length > 0 ? (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        {REPORT_HEADERS.map((head) => (
                                            <TableCell key={head.id} sx={{ fontWeight: 'bold' }}>
                                                {head.label}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportData.map((row, index) => (
                                        <TableRow key={index} hover>
                                            {REPORT_HEADERS.map((head) => (
                                                <TableCell key={head.id}>
                                                    {/* Agar AgentID hai toh special note de sakte hain */}
                                                    {head.id === 'AgentID' ? 
                                                        `${row[head.id]} (Fix Agent Name)` : 
                                                        row[head.id]
                                                    }
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : !loading && !error && (
                         <Typography color="text.secondary" sx={{ mt: 5, textAlign: 'center' }}>
                            {reportData === null ? "Click 'Generate' to fetch the report data." : "No data found for this date range."}
                         </Typography>
                    )}
                </Paper>
            </Box>
        </Box>
    );
};

export default Reports;