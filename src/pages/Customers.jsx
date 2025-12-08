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
  Chip // Status ke liye
} from '@mui/material';

// --- 1. Fake Data ---
const fakeCustomers = [
  { id: 101, name: 'Ravi Sharma', email: 'ravi.s@example.com', orders: 15, spend: 45000, status: 'Active' },
  { id: 102, name: 'Priya Singh', email: 'priya.s@example.com', orders: 5, spend: 12500, status: 'Pending' },
  { id: 103, name: 'Amit Verma', email: 'amit.v@example.com', orders: 45, spend: 155000, status: 'VIP' },
  { id: 104, name: 'Sana Khan', email: 'sana.k@example.com', orders: 2, spend: 6800, status: 'Inactive' },
  { id: 105, name: 'Vikram Patel', email: 'vikram.p@example.com', orders: 22, spend: 78000, status: 'Active' },
];

// --- 2. Helper Function for Status Badge ---
const getStatusChip = (status) => {
  let color;
  switch (status) {
    case 'Active':
      color = 'success';
      break;
    case 'VIP':
      color = 'primary';
      break;
    case 'Pending':
      color = 'warning';
      break;
    case 'Inactive':
      color = 'error';
      break;
    default:
      color = 'default';
  }
  return <Chip label={status} color={color} size="small" />;
};

// --- 3. Main Component ---
const Customers = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Customers Management
      </Typography>

      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }} aria-label="customer table">
          
          {/* Table Header */}
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Customer ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Orders Count</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Spend (₹)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          
          {/* Table Body */}
          <TableBody>
            {fakeCustomers.map((customer) => (
              <TableRow
                key={customer.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {customer.id}
                </TableCell>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell align="right">{customer.orders}</TableCell>
                {/* Indian number formatting ke liye toLocaleString use kiya hai */}
                <TableCell align="right">
                    {customer.spend.toLocaleString('en-IN')} 
                </TableCell> 
                <TableCell>
                  {getStatusChip(customer.status)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Customers;