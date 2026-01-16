import React, { useState, useEffect, useCallback } from 'react';
import {
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    CircularProgress,
    Button,
    Alert,
    Chip,
    TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Pagination,
    Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip//
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import API from '../api/axiosClient';
import { useAuth } from '../context/authContext';
import VisibilityIcon from '@mui/icons-material/Visibility';



// --- Zaroori Headers ---
const HEADERS = [
    { label: 'ID', align: 'left', width: 50 },
    { label: 'Type', align: 'left', width: 30 },
    { label: 'Customer Name', align: 'left', width: 80 },
    { label: 'Contact', align: 'left', width: 80 },


    { label: 'Tehsil', align: 'left' },
    { label: 'City', align: 'left' },
    { label: 'Region', align: 'left' },
    { label: 'Location', align: 'center', width: 80 },
    { label: 'Bags Potential', align: 'center', width: 100 },
    { label: 'Sales Person', align: 'left', width: 100 },
    { label: 'Actions', align: 'center', width: 100 },
];

// --- Helper Function for Status Badge (No change) ---
const getStatusChip = (status) => {
    // ... (Your existing status chip logic)
    let color;
    switch (status) {
        case 'Active': color = 'success'; break;
        case 'VIP': color = 'primary'; break;
        case 'Pending': color = 'warning'; break;
        case 'Inactive': color = 'error'; break;
        default: color = 'default';
    }
    return <Chip label={status} color={color} size="small" />;
};


const REGIONS = ['Region 1', 'Region 2', 'Region 3', 'Region 4', 'Region 5'];


// --- Main Component ---
const Customers = () => {
    const { logout, user } = useAuth();

    const openGoogleMaps = (lat, lng) => {
        if (!lat || !lng) {
            alert("Location coordinates not available for this customer.");
            return;
        }
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        window.open(url, '_blank');
    };


    // 🚀 PAGINATION STATES
    const [customers, setCustomers] = useState([]); // Sirf current page ka data
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10); // Records per page
    const [totalPages, setTotalPages] = useState(1); // Total pages count

    // --- Other States ---
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- MODAL & FORM STATES ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const initialFormData = { customer_name: '', contact: '', area: '', tehsil: '', cityId: '', bags_potential: 0, type: 'Dealer', district: '', division: '', province: '', region: '', latitude: '', longitude: '' };
    const [formData, setFormData] = useState(initialFormData);
    const [cities, setCities] = useState([]);


    // 🚀 Data Fetching aur Pagination Logic
    const fetchCustomers = async () => {
        setLoading(true);
        setError(null);

        try {

            const url = `/customers?&page=${page}&limit=${limit}&search=${searchTerm}`;
            const response = await API.get(url);
            console.log(".....response of customers", response.data.data)

            setCustomers(response.data.data || []);
            setTotalPages(response.data.pagination.totalPages || 1);

        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError("Session expired. Logging out...");
                setTimeout(logout, 2000);
            } else {
                setError("Failed to load customer data.");
            }
        } finally {
            setLoading(false);
        }
    };


    const fetchCities = useCallback(async () => {
        try {
            // ⚠️ Ensure your city API endpoint is correct
            const response = await API.get('/cities');
            // ⚠️ Assuming response.data is an array of city objects: [{ id: 1, name: 'FSD' }, ...]
            setCities(response.data || []);
        } catch (err) {
            console.error("Failed to fetch cities:", err);
            // Agar city list load na ho toh error set kar sakte hain
        }
    }, []);

    // --- useEffect: Data Fetching Dependency ---
    // Jab bhi page, limit, ya searchTerm badle, naya data fetch karein
    useEffect(() => {
        fetchCustomers();
        fetchCities();

        // Polling (Optional but present in original code)
        const intervalId = setInterval(fetchCustomers, 30000);
        return () => clearInterval(intervalId);

    }, [page, limit, searchTerm, logout, fetchCities]);





    // ✅ View Modal States
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingCustomer, setViewingCustomer] = useState(null);

    // ✅ View Handlers
    const handleOpenViewModal = (customer) => {
        setViewingCustomer(customer);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setViewingCustomer(null);
        setIsViewModalOpen(false);
    };



    // --- FORM HANDLERS (Same) ---
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'bags_potential' ? parseInt(value) || 0 : value
        }));
    };

    // --- MODAL HANDLERS (Same) ---
    const handleOpenAddModal = () => {
        const defaultCityId = user && user.city_id ? user.city_id : '';
        setFormData({
            ...initialFormData,
            cityId: defaultCityId // 🚀 Default value set
        });;
        setIsAddModalOpen(true);
        setError(null);
    }

    const handleOpenEditModal = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            customer_name: customer.customer_name, contact: customer.contact,
            area: customer.area, tehsil: customer.tehsil,
            city_id: customer.city_id || '',
            bags_potential: customer.bags_potential, type: customer.type,
            region: customer.region || '',
            district: customer.district || '',
            division: customer.division || '',
            province: customer.province || '',
            latitude: customer.latitude, // 👈 Lat
            longitude: customer.longitude // 👈 Long

        });
        setIsEditModalOpen(true);
        setError(null);
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setIsAddModalOpen(false);
        setEditingCustomer(null);
        setError(null);
    };

    // 🚀 FIX: Handle Form Submission (Add New Customer)
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // 🚀 FIX: Khali strings ko null mein convert karna taaki DB crash na ho
        const payload = {
            ...formData,
            // Agar value khali string hai to null bhejien, warna wahi value
            latitude: formData.latitude === "" ? null : formData.latitude,
            longitude: formData.longitude === "" ? null : formData.longitude,
            region: formData.region === "" ? null : formData.region,
            district: formData.district === "" ? null : formData.district,
            division: formData.division === "" ? null : formData.division,
            province: formData.province === "" ? null : formData.province,
            bags_potential: parseInt(formData.bags_potential) || 0
        };

        try {
            console.log("Sending Payload:", payload); // Debugging ke liye

            await API.post('/customers/create-customer', payload);

            if (page !== 1) setPage(1);
            else fetchCustomers();

            handleCloseModal();
        } catch (err) {
            console.error("Failed to add customer:", err);
            // Error message ko behtar tarike se display karna
            const msg = err.response?.data?.error || err.response?.data?.message || "Error adding customer.";
            setError(msg);
        }
    };

    // 🚀 FIX: Handle Form Update (Edit Customer) - Refresh data instead of manual update
    const handleFormUpdate = async (e) => {
        e.preventDefault();
        setError(null);
        if (!editingCustomer || !editingCustomer.id) return;

        try {
            await API.patch(`/customers/${editingCustomer.id}`, formData);

            // 💡 FIX: Manual state update ki bajaye, data ko dobara fetch karein
            await fetchCustomers();

            handleCloseModal();
            console.log("Customer updated successfully.");

        } catch (err) {
            console.error("Failed to update customer:", err);
            const msg = err.response?.data?.error || "Error updating customer. Please check the data.";
            setError(msg);
        }
    }

    // 🚀 FIX: Handle Delete Customer - Ensure data refresh
    const handleDeleteCustomer = async (customerId) => {
        if (!window.confirm(`Are you sure you want to delete customer ID ${customerId}?`)) {
            return;
        }

        setError(null);
        try {
            await API.delete(`/customers/${customerId}`);

            // 💡 FIX: Data delete hone ke baad, current page ka data dobara load karein
            // Taki agar page par ek hi record tha, toh pichla page load ho jaye
            fetchCustomers();

            console.log(`Customer ID ${customerId} deleted successfully.`);

        } catch (err) {
            console.error("Failed to delete customer:", err);
            setError(`Error deleting customer ID ${customerId}.`);
        }
    };

    // --- Conditional Rendering ---
    if (loading && customers.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>Loading Customer Data...</Typography>
            </Box>
        );
    }

    // --- Main Component Render ---
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
                Customers List
            </Typography>

            {/* --- Search Bar and Add Button --- */}
            <Box display="flex" justifyContent="space-between" mb={2} alignItems="center">
                <TextField
                    label="Search Customers (Name, Contact, Area)"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1); // Search change hone par hamesha page 1 par
                    }}
                    sx={{ width: '40%' }}
                />

                <Button
                    variant="contained"
                    color="success"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddModal}
                >
                    Add New Customer
                </Button>
            </Box>

            {/* Error Message */}
            {error && <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{error}</Alert>}

            {/* --- Customer Table --- */}
            {/* --- Customer Table --- */}
            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
                <Table
                    size="small"
                    sx={{
                        minWidth: 800,
                        tableLayout: 'fixed', // 👈 Yeh sab se zaroori hai columns ko control karne ke liye
                        width: '100%'
                    }}
                >
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            {/* Headers with specific widths */}
                            <TableCell sx={{ width: '40px', fontWeight: 'bold', fontSize: '0.70rem' }}>ID</TableCell>
                            <TableCell sx={{ width: '60px', fontWeight: 'bold', fontSize: '0.70rem' }}>Type</TableCell>
                            <TableCell sx={{ width: '130px', fontWeight: 'bold', fontSize: '0.70rem' }}>Customer Name</TableCell>
                            <TableCell sx={{ width: '100px', fontWeight: 'bold', fontSize: '0.70rem' }}>Contact</TableCell>
                            <TableCell sx={{ width: '80px', fontWeight: 'bold', fontSize: '0.70rem' }}>Tehsil</TableCell>
                            <TableCell sx={{ width: '80px', fontWeight: 'bold', fontSize: '0.70rem' }}>City</TableCell>
                            <TableCell sx={{ width: '70px', fontWeight: 'bold', fontSize: '0.70rem' }}>Region</TableCell>
                            <TableCell sx={{ width: '50px', fontWeight: 'bold', fontSize: '0.70rem' }} align="center">Location</TableCell>
                            <TableCell sx={{ width: '80px', fontWeight: 'bold', fontSize: '0.70rem' }} align="center">Bags Potential</TableCell>
                            <TableCell sx={{ width: '90px', fontWeight: 'bold', fontSize: '0.70rem' }}>CreatedBy</TableCell>
                            <TableCell sx={{ width: '110px', fontWeight: 'bold', fontSize: '0.70rem' }} align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {customers.map((customer) => (
                            <TableRow key={customer.id} hover>
                                <TableCell sx={{ fontSize: '0.65rem' }}>{customer.id}</TableCell>
                                <TableCell sx={{ fontSize: '0.65rem' }}>{customer.type}</TableCell>

                                {/* Name Wrap logic */}
                                <TableCell sx={{
                                    fontSize: '0.70rem',
                                    fontWeight: 600,
                                    whiteSpace: 'normal', // 👈 Text ko agli line pe bheje ga
                                    wordBreak: 'break-word',
                                    lineHeight: 1.2
                                }}>
                                    {customer.customer_name}
                                </TableCell>

                                <TableCell sx={{ fontSize: '0.65rem' }}>{customer.contact}</TableCell>
                                <TableCell sx={{ fontSize: '0.65rem', whiteSpace: 'normal' }}>{customer.tehsil}</TableCell>
                                <TableCell sx={{ fontSize: '0.65rem', whiteSpace: 'normal' }}>{customer.cityName}</TableCell>
                                <TableCell sx={{ fontSize: '0.65rem' }}>{customer.region || 'N/A'}</TableCell>

                                <TableCell align="center">
                                    <IconButton
                                        size="small"
                                        onClick={() => openGoogleMaps(customer.latitude, customer.longitude)}
                                        disabled={!customer.latitude || !customer.longitude}
                                        sx={{ p: 0 }}
                                    >
                                        <LocationOnIcon sx={{ fontSize: '1.2rem', color: '#db4437' }} />
                                    </IconButton>
                                </TableCell>

                                <TableCell align="center" sx={{ fontSize: '0.70rem', fontWeight: 'bold' }}>
                                    {customer.bags_potential || 0}
                                </TableCell>

                                <TableCell sx={{ fontSize: '0.65rem', whiteSpace: 'normal' }}>
                                    {customer.createdBy || 'N/A'}
                                </TableCell>

                                {/* Actions Column - No wrap here to keep icons together */}
                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                        <Tooltip title="Edit">
                                            <IconButton size="small" color="primary" onClick={() => handleOpenEditModal(customer)} sx={{ p: 0.5 }}>
                                                <EditIcon fontSize="inherit" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" color="error" onClick={() => handleDeleteCustomer(customer.id)} sx={{ p: 0.5 }}>
                                                <DeleteIcon fontSize="inherit" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="View">
                                            <IconButton size="small" color="info" onClick={() => handleOpenViewModal(customer)} sx={{ p: 0.5 }}>
                                                <VisibilityIcon fontSize="inherit" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* 🚀 PAGINATION & LIMIT CONTROL (No change) */}
            <Box display="flex" justifyContent="space-between" alignItems="center" marginTop={3} marginBottom={2}>
                <Typography variant="body2" color="textSecondary">
                    Showing {customers.length} items of approx. {(totalPages * limit)}
                </Typography>
                <Box display="flex" alignItems="center">
                    <FormControl variant="outlined" size="small" sx={{ mr: 2 }}>
                        <Select
                            value={limit}
                            onChange={(e) => {
                                setLimit(e.target.value);
                                setPage(1);
                            }}
                        >
                            <MenuItem value={5}>5 / Page</MenuItem>
                            <MenuItem value={10}>10 / Page</MenuItem>
                            <MenuItem value={20}>20 / Page</MenuItem>
                            <MenuItem value={50}>50 / Page</MenuItem>
                        </Select>
                    </FormControl>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(event, value) => setPage(value)}
                        color="primary"
                        disabled={loading}
                        size="large"
                    />
                </Box>
            </Box>


            {/* --- MODAL FOR EDIT / ADD (No change in component structure) --- */}
            <CustomerFormDialog
                isOpen={isEditModalOpen}
                handleClose={handleCloseModal}
                formData={formData}
                handleFormChange={handleFormChange}
                handleFormAction={handleFormUpdate} // Now calls fetchCustomers() internally
                error={error}
                isEdit={true}
                dialogTitle={`Edit Customer ID: ${editingCustomer?.id}`}
                cities={cities}
            />

            <CustomerFormDialog
                isOpen={isAddModalOpen}
                handleClose={handleCloseModal}
                formData={formData}
                handleFormChange={handleFormChange}
                handleFormAction={handleFormSubmit} // Now calls setPage(1) or fetchCustomers() internally
                error={error}
                isEdit={false}
                dialogTitle="Add New Customer"
                cities={cities}
            />

            <ViewCustomerDialog
                isOpen={isViewModalOpen}
                handleClose={handleCloseViewModal}
                customer={viewingCustomer}
            />

        </Box>
    );
};


// --- Customer Form Dialog Component (Reuseable) ---
const CustomerFormDialog = ({ isOpen, handleClose, formData, handleFormChange, handleFormAction, error, isEdit, dialogTitle, cities }) => (
    <Dialog open={isOpen} onClose={handleClose}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <form onSubmit={handleFormAction}>
            <DialogContent dividers>
                {/* Form Fields: Same as before */}
                <TextField label="Type (Dealer/Farmer)" name="type" value={formData.type} onChange={handleFormChange} fullWidth margin="normal" required />
                <TextField label="Customer Name" name="customer_name" value={formData.customer_name} onChange={handleFormChange} fullWidth margin="normal" required />
                <TextField label="Contact" name="contact" value={formData.contact} onChange={handleFormChange} fullWidth margin="normal" required />
                <TextField label="Address" name="area" value={formData.area} onChange={handleFormChange} fullWidth margin="normal" required />
                <TextField label="Tehsil" name="tehsil" value={formData.tehsil} onChange={handleFormChange} fullWidth margin="normal" required />

                {/* 🚀 City Dropdown / Select */}
                <FormControl fullWidth margin="normal">
                    <InputLabel id="city-select-label">City</InputLabel>
                    <Select
                        labelId="city-select-label"
                        label="City"
                        name="city_id"
                        value={formData.city_id || ''} // Null check
                        onChange={handleFormChange}
                        required
                    >
                        <MenuItem value="">
                            <em>Select City</em>
                        </MenuItem>
                        {/* ⚠️ cities array use kiya */}
                        {cities.map((city) => (
                            <MenuItem key={city.id} value={city.id}>
                                {city.name || city.cityName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField label="District" name="district" value={formData.district} onChange={handleFormChange} fullWidth margin="normal" />
                <TextField label="Division" name="division" value={formData.division} onChange={handleFormChange} fullWidth margin="normal" />
                <TextField label="Province" name="province" value={formData.province} onChange={handleFormChange} fullWidth margin="normal" />

                {/* 🚀 Region Dropdown */}
                <FormControl fullWidth margin="normal">
                    <InputLabel id="region-select-label">Region</InputLabel>
                    <Select
                        labelId="region-select-label"
                        label="Region"
                        name="region"
                        value={formData.region || ''}
                        onChange={handleFormChange}
                        required
                    >
                        <MenuItem value="">
                            <em>Select Region</em>
                        </MenuItem>
                        {REGIONS.map((reg) => (
                            <MenuItem key={reg} value={reg}>
                                {reg}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField label="Potential Bags" name="bags_potential" type="number" value={formData.bags_potential} onChange={handleFormChange} fullWidth margin="normal" />

                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="error">Cancel</Button>
                <Button type="submit" variant="contained" color="primary">
                    {isEdit ? 'Save Changes' : 'Add Customer'}
                </Button>
            </DialogActions>
        </form>
    </Dialog>
);


// --- View Customer Modal (Jaisa aapne manga) ---
const ViewCustomerDialog = ({ isOpen, handleClose, customer }) => {
    if (!customer) return null;

    return (
        <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
                Customer Information
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>

                    {/* Basic Info */}
                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="subtitle2"><strong>Name:</strong> {customer.customer_name}</Typography>
                        <Typography variant="subtitle2"><strong>Type:</strong> {customer.type}</Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="subtitle2"><strong>Contact:</strong> {customer.contact}</Typography>
                        <Typography variant="subtitle2"><strong>Region:</strong> {customer.region || 'N/A'}</Typography>
                    </Box>

                    <hr style={{ border: '0.1px solid #eee', width: '100%' }} />

                    {/* Location Info (New Fields Added Here) */}
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>Location Details:</Typography>

                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                        <Typography variant="body2"><strong>Address:</strong> {customer.area || 'N/A'}</Typography>
                        <Typography variant="body2"><strong>Tehsil:</strong> {customer.tehsil || 'N/A'}</Typography>

                        <Typography variant="body2"><strong>City:</strong> {customer.cityName || 'N/A'}</Typography>
                        <Typography variant="body2"><strong>District:</strong> {customer.district || 'N/A'}</Typography>

                        <Typography variant="body2"><strong>Division:</strong> {customer.division || 'N/A'}</Typography>
                        <Typography variant="body2"><strong>Province:</strong> {customer.province || 'N/A'}</Typography>
                    </Box>

                    <hr style={{ border: '0.1px solid #eee', width: '100%' }} />

                    {/* Business Info */}
                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2"><strong>Potential:</strong> {customer.bags_potential} Bags</Typography>
                        <Typography variant="body2"><strong>Created By:</strong> {customer.createdBy || 'N/A'}</Typography>
                    </Box>

                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} variant="contained" color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};


export default Customers;