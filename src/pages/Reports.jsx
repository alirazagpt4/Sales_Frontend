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
    MenuItem
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';

const Reports = () => {
    // State to hold filter selections (demo purposes)
    const [startDate, setStartDate] = useState('2025-11-01');
    const [endDate, setEndDate] = useState('2025-12-05');
    const [reportType, setReportType] = useState('sales');

    const handleGenerateReport = () => {
        // Yahan actual API call hogi data fetch karne ke liye
        console.log(`Generating report for: ${reportType} from ${startDate} to ${endDate}`);
        alert(`Report Generated (Mock Data): ${reportType} from ${startDate} to ${endDate}`);
    };

    const handleDownload = () => {
        // Yahan data ko CSV ya PDF format mein download karne ka logic aayega
        alert(`Downloading ${reportType} Report...`);
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Detailed Sales Reports
            </Typography>

            {/* --- 1. Filter Section --- */}
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Report Filters
                </Typography>
                <Grid container spacing={2} alignItems="flex-end">
                    
                    {/* Report Type Selector */}
                    <Grid item xs={12} sm={4}>
                         <FormControl fullWidth>
                            <InputLabel id="report-type-label">Report Type</InputLabel>
                            <Select
                                labelId="report-type-label"
                                value={reportType}
                                label="Report Type"
                                onChange={(e) => setReportType(e.target.value)}
                            >
                                <MenuItem value={'sales'}>Sales Summary</MenuItem>
                                <MenuItem value={'customer'}>Customer Acquisition</MenuItem>
                                <MenuItem value={'product'}>Product Performance</MenuItem>
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
                        >
                            Generate
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* --- 2. Report Output Section --- */}
            <Box>
                <Paper elevation={3} sx={{ p: 3, minHeight: 400 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                            {reportType.toUpperCase()} REPORT PREVIEW
                        </Typography>
                        
                        {/* Download Button */}
                        <Button
                            variant="outlined"
                            color="success"
                            onClick={handleDownload}
                            startIcon={<DownloadIcon />}
                        >
                            Download CSV
                        </Button>
                    </Box>
                    <hr />
                    
                    <Typography color="text.secondary" sx={{ mt: 5, textAlign: 'center' }}>
                        Report data (charts, tables, raw data) will appear here after clicking 'Generate'.
                    </Typography>
                </Paper>
            </Box>
        </Box>
    );
};

export default Reports;