import React from 'react';
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
    Chip,
    IconButton // Action button ke liye
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// --- 1. Fake User Data ---
const fakeUsers = [
  { id: 201, name: 'Anil Kumar', email: 'anil.k@salesapp.com', role: 'Admin', status: 'Active', lastLogin: '2025-12-05' },
  { id: 202, name: 'Neha Gupta', email: 'neha.g@salesapp.com', role: 'Editor', status: 'Active', lastLogin: '2025-12-04' },
  { id: 203, name: 'Rahul Joshi', email: 'rahul.j@salesapp.com', role: 'Viewer', status: 'Suspended', lastLogin: '2025-11-20' },
  { id: 204, name: 'Geeta Malik', email: 'geeta.m@salesapp.com', role: 'Editor', status: 'Inactive', lastLogin: '2025-10-15' },
  { id: 205, name: 'Suresh Rao', email: 'suresh.r@salesapp.com', role: 'Admin', status: 'Active', lastLogin: '2025-12-05' },
];

// --- 2. Helper Functions for Roles and Status ---

// Role badge
const getRoleChip = (role) => {
  let color;
  switch (role) {
    case 'Admin':
      color = 'secondary';
      break;
    case 'Editor':
      color = 'primary';
      break;
    case 'Viewer':
      color = 'default';
      break;
    default:
      color = 'default';
  }
  return <Chip label={role} color={color} size="small" />;
};

// Status badge
const getStatusChip = (status) => {
  let color;
  switch (status) {
    case 'Active':
      color = 'success';
      break;
    case 'Suspended':
      color = 'error';
      break;
    case 'Inactive':
      color = 'warning';
      break;
    default:
      color = 'default';
  }
  return <Chip label={status} color={color} size="small" variant="outlined" />;
};

// --- 3. Main Component ---
const Users = () => {
    
    // Action handlers (abhi sirf console log karega)
    const handleEdit = (userId) => {
        console.log('Edit user:', userId);
        alert(`Editing User ID: ${userId}`);
    };

    const handleDelete = (userId) => {
        console.log('Delete user:', userId);
        if (window.confirm(`Are you sure you want to delete User ID: ${userId}?`)) {
            // Logic to actually delete the user goes here
            alert(`User ID: ${userId} deleted (mock)`);
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                System Users and Permissions
            </Typography>

            <TableContainer component={Paper} elevation={3}>
                <Table sx={{ minWidth: 700 }} aria-label="user management table">
                    
                    {/* Table Header */}
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>User ID</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Last Login</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    
                    {/* Table Body */}
                    <TableBody>
                        {fakeUsers.map((user) => (
                            <TableRow
                                key={user.id}
                                sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }} // Hover effect
                            >
                                <TableCell component="th" scope="row">{user.id}</TableCell>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{getRoleChip(user.role)}</TableCell>
                                <TableCell>{getStatusChip(user.status)}</TableCell>
                                <TableCell>{user.lastLogin}</TableCell>
                                <TableCell align="center">
                                    <IconButton 
                                        aria-label="edit" 
                                        color="primary" 
                                        onClick={() => handleEdit(user.id)}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton 
                                        aria-label="delete" 
                                        color="error" 
                                        onClick={() => handleDelete(user.id)}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default Users;