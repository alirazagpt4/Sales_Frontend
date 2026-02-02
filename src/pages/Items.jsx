import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Box, CircularProgress, Button, Alert, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, Pagination, Grid, Divider
} from '@mui/material';

import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import InventoryIcon from '@mui/icons-material/Inventory'; // Main Icon for Items

import API from '../api/axiosClient';
import { useAuth } from '../context/authContext';

// --- HEADERS for Items ---
const HEADERS = [
    { label: 'SR #', align: 'left' },
    { label: 'Item Code', align: 'left' },
    { label: 'Item Name', align: 'left' },
    { label: 'Price', align: 'left' },
    { label: 'Created At', align: 'left' },
    { label: 'Actions', align: 'center' },
];

const initialFormData = {
    item_code: '',
    item_name: '',
    price: ''
};

const Items = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';

    // --- State Management ---
    const [originalItems, setOriginalItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination States
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Modal and Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);
    const [formData, setFormData] = useState(initialFormData);

    // --- Pagination Handler ---
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // --- Data Fetching Logic ---
    const fetchItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // URL format matching your backend: ?page=1&size=10
            const response = await API.get(`/items?page=${page}&size=${ITEMS_PER_PAGE}`);
            const data = response.data;

            // Handling response structure (totalItems, items, totalPages)
            setOriginalItems(Array.isArray(data.items) ? data.items : []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error("Failed to fetch items:", err);
            setError(err.response?.data?.error || "Failed to load items.");
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchItems();
        const interval = setInterval(() => {
            fetchItems();
        }, 30000); // 30 seconds auto-refresh
        return () => clearInterval(interval);
    }, [fetchItems]);

    // --- Filtering Logic ---
    const filteredItems = useMemo(() => {
        const itemsToFilter = Array.isArray(originalItems) ? originalItems : [];
        if (!searchTerm) return itemsToFilter;

        const lowerCaseSearch = searchTerm.toLowerCase();
        return itemsToFilter.filter(item => 
            item.item_code.toLowerCase().includes(lowerCaseSearch) ||
            item.item_name.toLowerCase().includes(lowerCaseSearch)
        );
    }, [originalItems, searchTerm]);

    // --- Modal Handlers ---
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenAddModal = () => {
        setEditingItem(null);
        setFormData(initialFormData);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            item_code: item.item_code,
            item_name: item.item_name,
            price: item.price
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setError(null);
    };

    const handleOpenViewModal = (item) => {
        setViewingItem(item);
        setIsViewModalOpen(true);
    };

    // --- CRUD Handlers ---
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const isEditMode = editingItem !== null;
        const method = isEditMode ? 'patch' : 'post';
        const url = isEditMode ? `/items/${editingItem.id}` : '/items/create-items';

        try {
            await API[method](url, formData);
            handleCloseModal();
            fetchItems();
        } catch (err) {
            setError(err.response?.data?.message || "Error saving item.");
        }
    };

    if (loading && originalItems.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>Loading Items...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                 Items Management
            </Typography>

            <Box display="flex" justifyContent="space-between" mb={2} mt={3} alignItems="center">
                <TextField
                    label="Search by Code or Name"
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
                    ADD NEW ITEM
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            {HEADERS.map(header => (
                                <TableCell key={header.label} align={header.align} sx={{ fontWeight: 'bold', fontSize: '0.70rem', py: 1.5 }}>
                                    {header.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredItems.map((item, index) => (
                            <TableRow key={item.id} hover>
                                <TableCell sx={{ fontSize: '0.65rem' }}>{(page - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                                <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>{item.item_code}</TableCell>
                                <TableCell sx={{ fontSize: '0.65rem' }}>{item.item_name}</TableCell>
                                <TableCell sx={{ fontSize: '0.65rem' }}>Rs. {parseFloat(item.price).toLocaleString()}</TableCell>
                                <TableCell sx={{ fontSize: '0.65rem' }}>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell align="center">
                                    {isSuperAdmin && (
                                        <Button size="small" onClick={() => handleOpenEditModal(item)} sx={{ minWidth: 0, p: 0.5, mr: 1 }}>
                                            <EditIcon fontSize="small" color="primary" />
                                        </Button>
                                    )}
                                    <Button size="small" color="info" onClick={() => handleOpenViewModal(item)} sx={{ minWidth: 0, p: 0.5 }}>
                                        <VisibilityIcon fontSize="small" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                    <Pagination count={totalPages} page={page} onChange={handleChangePage} color="primary" size="large" showFirstButton showLastButton />
                </Box>
            )}

            {/* --- ADD/EDIT MODAL --- */}
            <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="xs" fullWidth>
                <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                <form onSubmit={handleFormSubmit}>
                    <DialogContent dividers>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <TextField label="Item Code" name="item_code" value={formData.item_code} onChange={handleFormChange} fullWidth margin="normal" required disabled={editingItem !== null} />
                        <TextField label="Item Name" name="item_name" value={formData.item_name} onChange={handleFormChange} fullWidth margin="normal" required />
                        <TextField label="Price" name="price" type="number" value={formData.price} onChange={handleFormChange} fullWidth margin="normal" required />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseModal} color="error">Cancel</Button>
                        <Button type="submit" variant="contained" color="primary">{editingItem ? 'Update' : 'Create'}</Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* --- VIEW DETAILS MODAL --- */}
            <Dialog open={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#f0f0f0' }}>Item Details</DialogTitle>
                <DialogContent dividers>
                    {viewingItem && (
                        <Box sx={{ p: 1 }}>
                            {[
                                { label: "Item Code", value: viewingItem.item_code },
                                { label: "Item Name", value: viewingItem.item_name },
                                { label: "Price", value: `Rs. ${viewingItem.price}` },
                                { label: "Added On", value: new Date(viewingItem.createdAt).toLocaleString() }
                            ].map((row, i) => (
                                <Grid container key={i} sx={{ mb: 1.5 }}>
                                    <Grid item xs={5}><Typography sx={{ fontWeight: 'bold', color: 'text.secondary' }}>{row.label}</Typography></Grid>
                                    <Grid item xs={1}>:</Grid>
                                    <Grid item xs={6}><Typography sx={{ fontWeight: 500 }}>{row.value}</Typography></Grid>
                                </Grid>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsViewModalOpen(false)} variant="contained">Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Items;