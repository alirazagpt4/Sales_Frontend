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
    Select, MenuItem, InputLabel, FormControl // Added back for role selection
} from '@mui/material';

import API from '../api/axiosClient'; 
import { useAuth } from '../context/authContext'; 
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add'; 

// --- HEADERS for Users ---
const HEADERS = [
    { label: 'ID', align: 'left' }, 
    { label: 'Username', align: 'left' },
    { label: 'Email', align: 'left' },
    { label: 'Role', align: 'left' }, // Role added back
    { label: 'Actions', align: 'center' },
];

const initialFormData = {
    name: '', 
    email: '', 
    role: 'user', // Default role is 'user'
    password: ''
};

// Available roles: sirf Admin aur User
const AVAILABLE_ROLES = ['admin', 'user'];


const Users = () => { 
    const { logout } = useAuth();
    
    // --- State Management ---
    const [originalUsers, setOriginalUsers] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); 

    // Modal and Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null); 
    const [formData, setFormData] = useState(initialFormData);


    // --- Core Data Fetching Logic (useCallback for efficiency) ---
    const fetchUsers = useCallback(async () => { 
        setLoading(true);
        setError(null);
        try {
            const response = await API.get('/users'); 
            console.log("USERSSSSS ......" , response.data);
            // Guarantees an array
            setOriginalUsers(Array.isArray(response.data.users) ? response.data.users : []); 
        } catch (err) {
            console.error("Error fetching users:", err);
            if (err.response && err.response.status === 401) {
                setError("Session expired. Logging out...");
                setTimeout(logout, 2000); 
            } else {
                setError("Failed to load user data from server.");
            }
        } finally {
            setLoading(false);
        }
    }, [logout]);


    // --- 1. Initial Data Fetch ---
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]); 


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
            password: '' 
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
        
        // In Edit mode, if password is empty, remove it from payload
        if (isEditMode && !formData.password) {
             const { password, ...rest } = formData;
             payload = rest;
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

    const handleDeleteUser = async (userId) => {
        if (!window.confirm(`Are you sure you want to delete user ID ${userId}?`)) {
            return;
        }
        
        setError(null);

        try {
            await API.delete(`/users/${userId}`); 
            await fetchUsers();
        } catch (err) {
            console.error("Failed to delete user:", err);
            const apiError = err.response?.data.users?.message || `Error deleting user ID ${userId}.`;
            setError(apiError);
        }
    };
    

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
        <Box>
            <Typography variant="h4" gutterBottom>
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
            <TableContainer component={Paper} elevation={3}>
                <Table sx={{ minWidth: 800 }} aria-label="user table">
                    
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            {HEADERS.map(header => (
                                <TableCell 
                                    key={header.label} 
                                    align={header.align} 
                                    sx={{ fontWeight: 'bold' }}
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
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell>{user.id}</TableCell> 
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role || 'N/A'}</TableCell> {/* Display role */}
                                <TableCell align="center">
                                    <Button size="small" color="primary" startIcon={<EditIcon />} sx={{ minWidth: 0, p: '4px', mr: 1 }}
                                        onClick={() => handleOpenEditModal(user)}
                                    />
                                    <Button size="small" color="error" startIcon={<DeleteIcon />} sx={{ minWidth: 0, p: '4px' }}
                                        onClick={() => handleDeleteUser(user.id)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredUsers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={HEADERS.length} align="center">
                                    <Typography variant="subtitle1" color="textSecondary">
                                        {loading ? "Fetching data..." : (searchTerm ? `No users found matching "${searchTerm}"` : "No users created yet.")}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- MODAL FOR ADD/EDIT (Role Select added) --- */}
            <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingUser ? `Edit User ID: ${editingUser.id}` : 'Add New User'}
                </DialogTitle>
                <form onSubmit={handleFormSubmit}>
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
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
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
                        
                    </DialogContent>
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
            
        </Box>
    );
};

export default Users;