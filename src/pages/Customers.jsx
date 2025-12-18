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
    Select, MenuItem, FormControl, InputLabel //
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import API from '../api/axiosClient';
import { useAuth } from '../context/authContext';

// --- Zaroori Headers ---
const HEADERS = [
    { label: 'ID', align: 'left', width: 50 },
    { label: 'Customer Name', align: 'left', width: 100 },
    { label: 'Contact', align: 'left', width: 100 },
    { label: 'Type', align: 'left' },
    { label: 'Area', align: 'left' },
    { label: 'Tehsil', align: 'left' },
    { label: 'City', align: 'left' },
    { label: 'Potential Bags', align: 'right' },
    { label: 'Actions', align: 'center', width: 120 },
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


// --- Main Component ---
const Customers = () => {
    const { logout, user } = useAuth();


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
    const initialFormData = { customer_name: '', contact: '', area: '', tehsil: '', cityId: '', bags_potential: 0, type: 'Dealer' };
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

        try {
            // API call to create customer
            await API.post('/customers/create-customer', formData);

            // Jab naya customer add hota hai, use page 1 par dikhana behtar hai.
            // setPage(1) useEffect ko trigger karega aur naya data fetch ho jayega.
            if (page !== 1) setPage(1);
            else fetchCustomers(); // Agar already page 1 par hain, toh manual fetch

            handleCloseModal();
        } catch (err) {
            console.error("Failed to add customer:", err);
            const msg = err.response?.data?.error || "Error adding customer. Check required fields.";
            setError(msg);
        }
    }

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
            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
                <Table size="small" sx={{ minWidth: 800 }} aria-label="customer table">

                    {/* Header styling: Professional Dark Green look */}
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            {HEADERS.map(header => (
                                <TableCell
                                    key={header.label}
                                    align={header.align}
                                    sx={{
                                       
                                        fontWeight: 'bold',
                                        fontSize: '0.75rem', // Thora bara header
                                        whiteSpace: 'nowrap',
                                        py: 1.2
                                    }}
                                >
                                    {header.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {customers.map((customer) => (
                            <TableRow
                                key={customer.id}
                                hover
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                {/* Data Cells: Chota font size taake spacing behtar ho */}
                                <TableCell sx={{ fontSize: '0.82rem', py: 0.8 }}>{customer.id}</TableCell>
                                <TableCell sx={{
                                    fontSize: '0.82rem',
                                    fontWeight: 500,
                                    minWidth: 140,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {customer.customer_name}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.82rem' }}>{customer.contact}</TableCell>
                                <TableCell sx={{ fontSize: '0.82rem', textTransform: 'capitalize' }}>{customer.type}</TableCell>
                                <TableCell sx={{ fontSize: '0.82rem' }}>{customer.area}</TableCell>
                                <TableCell sx={{ fontSize: '0.82rem' }}>{customer.tehsil}</TableCell>
                                <TableCell sx={{ fontSize: '0.82rem' }}>{customer.cityName}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.82rem', fontWeight: 'bold' }}>
                                    {customer.bags_potential || 0}
                                </TableCell>

                                {/* Compact Actions Column */}
                                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                    <Button
                                        size="small"
                                        color="primary"
                                        onClick={() => handleOpenEditModal(customer)}
                                        sx={{ minWidth: 0, p: 0.5, mr: 1 }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </Button>
                                    <Button
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteCustomer(customer.id)}
                                        sx={{ minWidth: 0, p: 0.5 }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}

                        {/* No Results Row */}
                        {customers.length === 0 && !loading && (
                            <TableRow key="no-results-row">
                                <TableCell colSpan={HEADERS.length} align="center" sx={{ py: 3 }}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        {searchTerm ? `No customers found matching "${searchTerm}"` : "No customers created yet."}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
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
                <TextField label="Customer Name" name="customer_name" value={formData.customer_name} onChange={handleFormChange} fullWidth margin="normal" required />
                <TextField label="Contact" name="contact" value={formData.contact} onChange={handleFormChange} fullWidth margin="normal" required />
                <TextField label="Area" name="area" value={formData.area} onChange={handleFormChange} fullWidth margin="normal" required />
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
                <TextField label="Potential Bags" name="bags_potential" type="number" value={formData.bags_potential} onChange={handleFormChange} fullWidth margin="normal" />
                <TextField label="Type (Dealer/Farmer)" name="type" value={formData.type} onChange={handleFormChange} fullWidth margin="normal" required />

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


export default Customers;