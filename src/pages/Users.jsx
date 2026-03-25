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

import VisibilityIcon from '@mui/icons-material/Visibility';

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
    { label: 'Report To', align: 'left' },
    { label: 'City', align: 'left' },        // ✅ NEW: City
    // { label: 'Report To', align: 'left' }, 
    { label: 'Region', align: 'left' },       // ✅ NEW: City
    { label: 'Actions', align: 'center' },
];

const initialFormData = {
    name: '',
    role: 'user',
    password: '',
    // ✅ NEW FIELDS ADDED
    fullname: '',        // <--- ADD THIS
    mobile_ph: '',       // <--- ADD THIS
    whatsapp_ph: '',
    city_id: '', // Integer ID will be sent
    designation: '',
    designationId: '',
    reportTo: '',
    region: ''
};



// Available roles: sirf Admin aur User
const AVAILABLE_ROLES = ['admin', 'user', 'superadmin'];

// ✅ Regions ki list define ki
const REGIONS = [
    'Gojra',
    'Sargodha',
    'Jhang',
    'South',
    'Rahim Yar Khan',
    'Layyah',
    'Sahiwal',
    'Narowal',
    'Pindi Bhattian',
    'Gujranwala',
    'Multan',
    'Bahawalpur',
    'Khanewal',
    'Jaranwala',
    'Rawalpindi'
];


const Users = () => {
    const { logout, user } = useAuth();
    console.log("user .... in customers", user);

    const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';
    // --- State Management ---
    const [originalUsers, setOriginalUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Inside Users component
    const [cities, setCities] = useState([]); // To store city list
    const [designations, setDesignations] = useState([]); // Designation list ke liye
    const [managers, setManagers] = useState([]);


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


    const fetchDesignations = useCallback(async () => {
        try {
            const response = await API.get('/designations'); // Aapki nayi API
            setDesignations(response.data);
        } catch (err) {
            console.error("Designations fetch failed:", err);
        }
    }, []);

    const fetchManagers = useCallback(async () => {
        try {
            // Hum saare users mangwa rahe hain dropdown ke liye
            const response = await API.get('/users?limit=1000');
            // Filter: Sirf wo bante jin ka designationId 1 (Sales Executive) NAHI hai
            const filteredManagers = response.data.users.filter(u => u.designationId !== 1);
            setManagers(filteredManagers);
        } catch (err) {
            console.error("Managers fetch failed:", err);
        }
    }, []);



    // ✅ NEW: Pagination States
    const [page, setPage] = useState(1); // Current page (MUI default 1-based)
    const [totalPages, setTotalPages] = useState(1);
    const USERS_PER_PAGE = 10; // Const for page size


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
            const response = await API.get(`/users?page=${page}&limit=${USERS_PER_PAGE}&search=${searchTerm}`);
            console.log("USERSSSSS ......", response.data.users);

            // ✅ API Response Parsing Update
            const data = response.data;

            setOriginalUsers(Array.isArray(data.users) ? data.users : []);
            setTotalPages(data.totalPages || 1); // Total pages set kiya

        } catch (err) {
            // ... (error handling code remains same)
        } finally {
            setLoading(false);
        }
    }, [logout, page , searchTerm]); // Dependency mein 'page' add kiya


    useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
        setPage(1); // Nayi search par page 1 par wapis jao
        fetchUsers();
    }, 500); // 500ms wait karega typing rukne ka

    return () => clearTimeout(delayDebounceFn);
}, [searchTerm]); // Sirf searchTerm par trigger hoga


    // --- 1. Initial Data Fetch ---
    // ✅ UPDATED: Jab 'page' change hoga tab bhi fetchUsers call hoga
    useEffect(() => {
        fetchUsers();
        fetchCities();
        fetchDesignations();
        fetchManagers();
        // 30 Seconds ka Interval setup karne ke liye
        const interval = setInterval(() => {
            console.log("Auto-refreshing user list...");
            fetchUsers();
        }, 30000); // 30000ms = 30 seconds

        // Component unmount hote waqt interval ko clear karna zaroori hai
        // warna memory leak ho sakti hai
        return () => clearInterval(interval);
    }, [fetchUsers , fetchCities, fetchDesignations, fetchManagers]); // Multiple dependencies
    // ...



   


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
            role: user.role.toLowerCase() || 'user', // Load existing role, default to 'user'
            password: '',
            // ✅ NEW FIELDS LOAD
            fullname: user.fullname || '',        // <--- ADD THIS
            mobile_ph: String(user.mobile_ph || ''),// <--- ADD THIS (String conversion is safe for TextField)
            whatsapp_ph: String(user.whatsapp_ph || ''),
            city_id: String(user.city_id || ''), // Assuming cityDetails has id
            designation: String(user.designation || ''),
            region: String(user.region || ''),
            designationId: String(user.designationId || ''),
            reportTo: String(user.reportTo || ''),
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
            console.log("..... payload = rest ", rest);

        }

        // Validation check
        if (!payload.name || (!isEditMode && !payload.password)) {
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
                    label="Search Users by User Name"
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

                {/* <Typography variant="h6">
                    My Role: {user?.role} | Am I SuperAdmin? {user?.role === 'superadmin' ? 'YES' : 'NO'}
                </Typography> */}

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
                                        fontSize: '0.70rem', // Header thora bara
                                        py: 1.5
                                    }}
                                >
                                    {header.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {originalUsers.map((user, index) => (
                            <TableRow
                                key={user.id}
                                hover
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                {/* Table Cells: Font size chota kiya gaya hai (0.8rem) */}
                                <TableCell sx={{ fontSize: '0.65rem', py: 1 }}>{(page - 1) * USERS_PER_PAGE + index + 1}</TableCell>
                                <TableCell sx={{ fontSize: '0.65rem', fontWeight: 500 }}>{user.name}</TableCell>

                                <TableCell sx={{
                                    fontSize: '0.65rem',
                                    minWidth: 130, // 150 se kam karkay 130 kiya
                                    whiteSpace: 'nowrap'
                                }}>
                                    {user.fullname || 'N/A'}
                                </TableCell>

                                <TableCell sx={{
                                    fontSize: '0.65rem',
                                    minWidth: 110,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {user.designationDetails?.designation || 'N/A'}
                                </TableCell>

                                <TableCell sx={{ fontSize: '0.65rem' }}>{user.mobile_ph || 'N/A'}</TableCell>
                                <TableCell sx={{ fontSize: '0.65rem' }}>{user.whatsapp_ph || 'N/A'}</TableCell>
                                <TableCell sx={{ fontSize: '0.57rem', textTransform: 'capitalize' }}>{user.manager?.name || 'N/A'}</TableCell>
                                <TableCell sx={{ fontSize: '0.65rem' }}>{user.cityName || 'N/A'}</TableCell>

                                <TableCell sx={{
                                    fontSize: '0.65rem',
                                    minWidth: 120,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {user.region || 'N/A'}
                                </TableCell>

                                {/* Actions Column: Buttons ko mazeed compact kiya gaya hai */}
                                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                    {isSuperAdmin && (
                                        <Button
                                            size="small"
                                            onClick={() => handleOpenEditModal(user)}
                                            sx={{ minWidth: 0, p: 0.5, mr: 1 }}
                                        >
                                            <EditIcon fontSize="small" color="primary" />
                                        </Button>
                                    )}

                                    <Button
                                        size="small"
                                        color="info"
                                        onClick={() => handleOpenViewModal(user)}
                                        sx={{ minWidth: 0, p: 0.5 }}
                                    >
                                        <VisibilityIcon fontSize="small" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {totalPages > 1 && (
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
            )}

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
                                label="Full Name"
                                name="fullname"
                                value={formData.fullname}
                                onChange={handleFormChange}
                                fullWidth margin="normal" required
                            />

                            <TextField
                                label="Designation"
                                name="designation"
                                value={formData.designation}
                                onChange={handleFormChange}
                                fullWidth margin="normal"
                            />

                            <TextField
                                label="Username"
                                name="name"
                                value={formData.name}
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

                            <FormControl fullWidth margin="normal" required>
                                <InputLabel id="city-select-label">City</InputLabel>
                                <Select
                                    labelId="city-select-label"
                                    label="City"
                                    name="city_id" // Dhyan dein: name property 'city_id' hai
                                    value={formData.city_id}
                                    onChange={handleFormChange}
                                >
                                    <MenuItem value=""><em>Select Tehsil</em></MenuItem>
                                    {cities.map(city => (
                                        // Value mein City ID jaa raha hai, lekin Display mein City Name
                                        <MenuItem key={city.id} value={city.id}>
                                            {city.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* ✅ Region Select (Replaced Referred To) */}
                            <FormControl fullWidth margin="normal" required>
                                <InputLabel id="region-select-label">Region</InputLabel>
                                <Select
                                    labelId="region-select-label"
                                    label="Region"
                                    name="region"
                                    value={formData.region}
                                    onChange={handleFormChange}
                                >
                                    <MenuItem value=""><em>Select Region</em></MenuItem>
                                    {REGIONS.map((reg) => (
                                        <MenuItem key={reg} value={reg}>
                                            {reg}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

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





                            {/* Referred To Dropdown
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
                            {/* {formData.referred_to && !originalUsers.find(u => u.name === formData.referred_to) && (
                                        <MenuItem value={formData.referred_to}>{formData.referred_to}</MenuItem>
                                    )}
                                    {/* originalUsers array se names nikaal kar dropdown banaya */}
                            {/* {originalUsers.map((u) => (
                                        <MenuItem key={u.id} value={u.name}>
                                            {u.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl> */}

                            <FormControl fullWidth margin="normal" required>
                                <InputLabel id="designation-select-label">Designation</InputLabel>
                                <Select
                                    labelId="designation-select-label"
                                    label="Designation"
                                    name="designationId"
                                    value={formData.designationId}
                                    onChange={handleFormChange}
                                >
                                    <MenuItem value=""><em>Select Designation</em></MenuItem>
                                    {designations.map(des => (
                                        <MenuItem key={des.id} value={des.id}>
                                            {des.designation}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>


                            <FormControl fullWidth margin="normal">
                                <InputLabel id="report-to-label">Reports To (Manager)</InputLabel>
                                <Select
                                    labelId="report-to-label"
                                    label="Reports To (Manager)"
                                    name="reportTo"
                                    value={formData.reportTo}
                                    onChange={handleFormChange}
                                >
                                    <MenuItem value=""><em>None / Self</em></MenuItem>
                                    {managers.map(m => (
                                        <MenuItem key={m.id} value={m.id}>
                                            {m.fullname} ({m.designationDetails?.designation || 'No Rank'})
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