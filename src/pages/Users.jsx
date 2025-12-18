import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Select, MenuItem, InputLabel, FormControl, Pagination, Grid, Divider// Added back for role selection
} from '@mui/material';

import API from '../api/axiosClient';
import { useAuth } from '../context/authContext';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';

// --- HEADERS for Users ---
const HEADERS = [
    { label: 'ID', align: 'left' },
    { label: 'User Name', align: 'left' },
    { label: 'Full Name', align: 'left' },
    { label: 'Designation', align: 'left' }, // ✅ NEW: Designation
    // { label: 'Email', align: 'left' },
    { label: 'Mobile', align: 'left' },    // <--- ADD THIS
    { label: 'WhatsApp', align: 'left' },
    { label: 'Role', align: 'left' },
    { label: 'City', align: 'left' },        // ✅ NEW: City
    { label: 'Report To', align: 'left' },        // ✅ NEW: City
    { label: 'Actions', align: 'center' },
];

const initialFormData = {
    name: '',
    email: '',
    role: 'user',
    password: '',
    // ✅ NEW FIELDS ADDED
    fullname: '',        // <--- ADD THIS
    mobile_ph: '',       // <--- ADD THIS
    whatsapp_ph: '',
    city_id: '', // Integer ID will be sent
    designation: '',
    referred_to: ''
};



// Available roles: sirf Admin aur User
const AVAILABLE_ROLES = ['admin', 'user'];


const Users = () => {
    const { logout, user } = useAuth();
    console.log("user .... in customers", user);

    // --- State Management ---
    const [originalUsers, setOriginalUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Inside Users component
    const [cities, setCities] = useState([]); // To store city list
    const fetchCities = useCallback(async () => {
        try {
            // Assume API endpoint is /cities
            const response = await API.get('/cities');
            console.log("Cities ........", response.data);
            setCities(response.data);
        } catch (err) {
            console.error("Failed to fetch cities:", err);
        }
    }, []);



    // ✅ NEW: Pagination States
    const [page, setPage] = useState(1); // Current page (MUI default 1-based)
    const [totalPages, setTotalPages] = useState(1);
    const USERS_PER_PAGE = 5; // Const for page size


    // Modal and Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState(initialFormData);


    // ✅ NEW: View Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingUser, setViewingUser] = useState(null); // User data to display
    // ...


    // ✅ NEW: Pagination Handler
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // --- Core Data Fetching Logic (useCallback for efficiency) ---
    // ... (inside Users component)

    // ✅ UPDATED: fetchUsers ab page number ko API ko bhejega
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // API call mein pagination parameters bheje
            const response = await API.get(`/users`);
            console.log("USERSSSSS ......", response.data);

            // ✅ API Response Parsing Update
            const data = response.data;

            setOriginalUsers(Array.isArray(data.users) ? data.users : []);
            setTotalPages(data.totalPages || 1); // Total pages set kiya

        } catch (err) {
            // ... (error handling code remains same)
        } finally {
            setLoading(false);
        }
    }, [logout, page]); // Dependency mein 'page' add kiya

    // --- 1. Initial Data Fetch ---
    // ✅ UPDATED: Jab 'page' change hoga tab bhi fetchUsers call hoga
    useEffect(() => {
        fetchUsers();
        fetchCities();
    }, [fetchUsers]);
    // ...



    // --- 2. Filtering Logic (Role check added back) ---
    const filteredUsers = useMemo(() => {
        // Safety check to prevent .map/filter errors
        const usersToFilter = Array.isArray(originalUsers) ? originalUsers : [];

        if (!searchTerm) {
            return usersToFilter;
        }

        const lowerCaseSearch = searchTerm.toLowerCase();

        return usersToFilter.filter(user => {
            const id = String(user.id || '');
            const name = user.name || '';
            const email = user.email || '';
            const role = user.role || ''; // Role check added

            return (
                id.includes(lowerCaseSearch) ||
                name.toLowerCase().includes(lowerCaseSearch) ||
                email.toLowerCase().includes(lowerCaseSearch) ||
                role.toLowerCase().includes(lowerCaseSearch) // Filtering by role
            );
        });
    }, [originalUsers, searchTerm]);


    // --- 3. MODAL & FORM HANDLERS ---
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };


    // ✅ NEW: View Modal Handlers
    const handleOpenViewModal = (user) => {
        setViewingUser(user);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setViewingUser(null);
        setIsViewModalOpen(false);
    };

    const handleOpenAddModal = () => {
        setEditingUser(null);
        setFormData(initialFormData); // Role: 'user' is default
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role.toLowerCase() || 'user', // Load existing role, default to 'user'
            password: '',
            // ✅ NEW FIELDS LOAD
            fullname: user.fullname || '',        // <--- ADD THIS
            mobile_ph: String(user.mobile_ph || ''),// <--- ADD THIS (String conversion is safe for TextField)
            whatsapp_ph: String(user.whatsapp_ph || ''),
            city_id: String(user.city_id || ''), // Assuming cityDetails has id
            designation: String(user.designation || ''),
            referred_to: String(user.referred_to || '')
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setError(null);
        setFormData(initialFormData);
    };


    // --- 4. CRUD API HANDLERS (Manual Refresh) ---

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const isEditMode = editingUser !== null;
        const method = isEditMode ? 'patch' : 'post';

        const url = isEditMode ? `/users/${editingUser.id}` : '/users/register';

        let payload = formData;
        console.log(">>>> referred_to : ", payload.referred_to);

        // In Edit mode, if password is empty, remove it from payload
        if (isEditMode && !formData.password) {
            const { password, ...rest } = formData;
            payload = rest;
            console.log("..... payload = rest " , rest);

        }

        // Validation check
        if (!payload.name || !payload.email || (!isEditMode && !payload.password)) {
            setError("Please fill all required fields.");
            return;
        }

        try {
            await API[method](url, payload);
            handleCloseModal();
            await fetchUsers();
        } catch (err) {
            console.error(`Failed to ${method} user:`, err);
            const apiError = err.response?.data?.message || `Error ${isEditMode ? 'updating' : 'adding'} user.`;
            setError(apiError);
        }
    };




    // const handleDeleteUser = async (userId) => {
    //     if (!window.confirm(`Are you sure you want to delete user ID ${userId}?`)) {
    //         return;
    //     }

    //     setError(null);

    //     try {
    //         await API.delete(`/users/${userId}`);
    //         await fetchUsers();
    //     } catch (err) {
    //         console.error("Failed to delete user:", err);
    //         const apiError = err.response?.data.users?.message || `Error deleting user ID ${userId}.`;
    //         setError(apiError);
    //     }
    // };


    // --- 5. Conditional Rendering ---
    if (loading && originalUsers.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>Loading User Data...</Typography>
            </Box>
        );
    }

    // --- 6. Main Component Render ---
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
                Users Management
            </Typography>

            {error && !isModalOpen && originalUsers.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>
            )}

            {/* Search Bar and Add button */}
            <Box display="flex" justifyContent="space-between" mb={2} alignItems="center">

                <TextField
                    label="Search Users (ID, Username, Email, Role)"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: '40%' }}
                />

                <Button
                    variant="contained"
                    color="success"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddModal}
                >
                    ADD NEW USER
                </Button>
            </Box>

            {/* --- User Table --- */}
            {/* --- User Table --- */}
            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
                <Table size="small" sx={{ minWidth: 800 }} aria-label="user table">

                    {/* Header styling: Background dark green aur font bold */}
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            {HEADERS.map(header => (
                                <TableCell
                                    key={header.label}
                                    align={header.align}
                                    sx={{

                                        fontWeight: 'bold',
                                        fontSize: '0.75rem', // Header thora bara
                                        py: 1.5
                                    }}
                                >
                                    {header.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow
                                key={user.id}
                                hover
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                {/* Table Cells: Font size chota kiya gaya hai (0.8rem) */}
                                <TableCell sx={{ fontSize: '0.82rem', py: 1 }}>{user.id}</TableCell>
                                <TableCell sx={{ fontSize: '0.82rem', fontWeight: 500 }}>{user.name}</TableCell>

                                <TableCell sx={{
                                    fontSize: '0.82rem',
                                    minWidth: 130, // 150 se kam karkay 130 kiya
                                    whiteSpace: 'nowrap'
                                }}>
                                    {user.fullname || 'N/A'}
                                </TableCell>

                                <TableCell sx={{
                                    fontSize: '0.82rem',
                                    minWidth: 110,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {user.designation || 'N/A'}
                                </TableCell>

                                <TableCell sx={{ fontSize: '0.82rem' }}>{user.mobile_ph || 'N/A'}</TableCell>
                                <TableCell sx={{ fontSize: '0.82rem' }}>{user.whatsapp_ph || 'N/A'}</TableCell>
                                <TableCell sx={{ fontSize: '0.82rem', textTransform: 'capitalize' }}>{user.role || 'N/A'}</TableCell>
                                <TableCell sx={{ fontSize: '0.82rem' }}>{user.cityDetails?.name || 'N/A'}</TableCell>

                                <TableCell sx={{
                                    fontSize: '0.82rem',
                                    minWidth: 120,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {user.referred_to || 'N/A'}
                                </TableCell>

                                {/* Actions Column: Buttons ko mazeed compact kiya gaya hai */}
                                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                    <Button
                                        size="small"
                                        color="primary"
                                        onClick={() => handleOpenEditModal(user)}
                                        sx={{ minWidth: 0, p: 0.5, mr: 1 }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </Button>
                                    <Button
                                        size="small"
                                        color="info"
                                        onClick={() => handleOpenViewModal(user)}
                                        sx={{ minWidth: 0, p: 0.5 }}
                                    >
                                        <PeopleIcon fontSize="small" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3} pb={2}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handleChangePage}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )} */}

            {/* --- MODAL FOR ADD/EDIT (Role Select added) --- */}
            <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingUser ? `Edit User ID: ${editingUser.id}` : 'Add New User'}
                </DialogTitle>

                <form onSubmit={handleFormSubmit}>
                    <div key={editingUser ? editingUser.id : 'new-user'}>

                        <DialogContent dividers>
                            {error && isModalOpen && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                            <TextField
                                label="Username"
                                name="name"
                                value={formData.name}
                                onChange={handleFormChange}
                                fullWidth margin="normal" required
                            />
                            <TextField
                                label="Full Name"
                                name="fullname"
                                value={formData.fullname}
                                onChange={handleFormChange}
                                fullWidth margin="normal" required
                            />
                            <TextField
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleFormChange}
                                fullWidth margin="normal" required
                            />

                            <TextField
                                label="Mobile Phone"
                                name="mobile_ph"
                                type="number"
                                value={formData.mobile_ph}
                                onChange={handleFormChange}
                                fullWidth margin="normal" required
                            />

                            <TextField
                                label="WhatsApp Phone"
                                name="whatsapp_ph"
                                type="number"
                                value={formData.whatsapp_ph}
                                onChange={handleFormChange}
                                fullWidth margin="normal" required
                            />

                            {/* 🚨 Role Select Field Added Back */}
                            <FormControl fullWidth margin="normal" required>
                                <InputLabel id="role-select-label">Role</InputLabel>
                                <Select
                                    labelId="role-select-label"
                                    label="Role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleFormChange}
                                >
                                    {AVAILABLE_ROLES.map(role => (
                                        <MenuItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label={editingUser ? "New Password (Leave blank to keep old)" : "Password"}
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleFormChange}
                                fullWidth margin="normal"
                                required={!editingUser}
                                helperText={editingUser ? "Only fill to change password" : "Required for new users. Default Role is 'User'."}
                            />


                            <FormControl fullWidth margin="normal" required>
                                <InputLabel id="city-select-label">City</InputLabel>
                                <Select
                                    labelId="city-select-label"
                                    label="City"
                                    name="city_id" // Dhyan dein: name property 'city_id' hai
                                    value={formData.city_id}
                                    onChange={handleFormChange}
                                >
                                    <MenuItem value=""><em>Select City</em></MenuItem>
                                    {cities.map(city => (
                                        // Value mein City ID jaa raha hai, lekin Display mein City Name
                                        <MenuItem key={city.id} value={city.id}>
                                            {city.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Designation"
                                name="designation"
                                value={formData.designation}
                                onChange={handleFormChange}
                                fullWidth margin="normal"
                            />

                            {/* Referred To Dropdown */}
                            <FormControl fullWidth margin="normal">
                                <InputLabel id="referred-to-label">Referred To</InputLabel>
                                <Select
                                    labelId="referred-to-label"
                                    label="Referred To"
                                    name="referred_to"
                                    value={formData.referred_to}
                                    onChange={handleFormChange}
                                >
                                    <MenuItem value=""><em>None</em></MenuItem>

                                    {/* 1. Agar koi purani value hai jo list mein nahi mil rahi, usay yahan add karein */}
                                    {formData.referred_to && !originalUsers.find(u => u.name === formData.referred_to) && (
                                        <MenuItem value={formData.referred_to}>{formData.referred_to}</MenuItem>
                                    )}
                                    {/* originalUsers array se names nikaal kar dropdown banaya */}
                                    {originalUsers.map((u) => (
                                        <MenuItem key={u.id} value={u.name}>
                                            {u.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                        </DialogContent>
                    </div>
                    <DialogActions>
                        <Button onClick={handleCloseModal} color="error">
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" color="primary">
                            {editingUser ? 'Save Changes' : 'Create User'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>


            {/* ✅ NEW: VIEW DETAILS MODAL */}
            <Dialog open={isViewModalOpen} onClose={handleCloseViewModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#f0f0f0', color: '#333', }}>
                    User Details (ID: {viewingUser?.id})
                </DialogTitle>
                <DialogContent dividers>
                    {viewingUser ? (
                        <Box sx={{ p: 1 }}>
                            {[
                                { label: "Username", value: viewingUser.name },
                                { label: "Full Name", value: viewingUser.fullname },
                                { label: "Designation", value: viewingUser.designation },
                                { label: "Mobile", value: viewingUser.mobile_ph },
                                { label: "WhatsApp", value: viewingUser.whatsapp_ph },
                                { label: "Reports To", value: viewingUser.referred_to },
                                { label: "City", value: viewingUser.cityDetails?.name },
                            ].map((item, index) => (
                                <Grid container key={index} sx={{ mb: 1.5 }}>
                                    {/* Static Label Section */}
                                    <Grid item xs={5} sm={4}>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                                            {item.label}
                                        </Typography>
                                    </Grid>

                                    {/* Separator (Optional but looks clean) */}
                                    <Grid item xs={1}>
                                        <Typography variant="body1">:</Typography>
                                    </Grid>

                                    {/* Dynamic Value Section */}
                                    <Grid item xs={6} sm={7}>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {item.value || 'N/A'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            ))}

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'right' }}>
                                Joined: {new Date(viewingUser.createdAt).toLocaleDateString()}
                            </Typography>
                        </Box>
                    ) : (
                        <Typography>Loading user details...</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseViewModal} color="primary" variant="contained">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default Users;