import React, { useState, useEffect , useMemo} from 'react';
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
  CircularProgress, // Loading ke liye
  Button, // Add button ke liye
  Alert, // Error message ke liye
  Chip, // Status ke liye,
  TextField,
  // Modal Components
    Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';



import AddIcon from '@mui/icons-material/Add';
import API from '../api/axiosClient'; 
import { useAuth } from '../context/authContext'; // Logout handling ke liye
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';


// --- Zaroori Headers (Aapke Data Structure ke mutabik) ---
const HEADERS = [
    { label: 'ID', align: 'left' },
    { label: 'Customer Name', align: 'left' },
    { label: 'Contact', align: 'left' },
    { label: 'Area', align: 'left' },
    { label: 'Tehsil', align: 'left' },
    { label: 'Potential Bags', align: 'right' },
    { label: 'Type', align: 'left' },
    { label: 'Actions', align: 'center' }, // CRUD Actions
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
  const { logout } = useAuth();
    
    // States: Ab ek naya state `originalCustomers` rakhenge
    const [originalCustomers, setOriginalCustomers] = useState([]); // API se fetched saara data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // 👈 Naya Search state


    // 🚨 FIX 1: New State to Force Refresh
    const [refreshTrigger, setRefreshTrigger] = useState(0);


    // --- MODAL & FORM STATES (Ab sirf Edit ke liye) ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null); // Woh customer jo edit ho raha hai
    const [formData, setFormData] = useState({ 
        customer_name: '', 
        contact: '', 
        area: '', 
        tehsil: '', 
        bags_potential: 0, 
        type: 'Dealer' 
    });




    // / Polling ke liye zaroori function:
    const fetchCustomers = async () => {
        setLoading(true); 
        try {
            const response = await API.get('/customers'); 
            // setOriginalCustomers ko tabhi call karein jab naya data pichle data se alag ho
            // Taa'ke unwanted re-renders se bacha ja sake.
            setOriginalCustomers(response.data || []); 
        } catch (err) {
            // ... (Error handling same)
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


    // --- 1. Data Fetching AUR Polling Logic ---
    useEffect(() => {
        
        // Pehle baar data load karein jab component mount ho
        fetchCustomers();
        
        // Polling interval set karein: Har 10 seconds (10000 milliseconds) mein
        const intervalId = setInterval(() => {
            console.log("Polling for new customer data...");
            fetchCustomers();
        }, 30000); // 30 seconds

        // Cleanup Function: Component hatne par interval band karna zaroori hai!
        // Yeh professional practice hai memory leak rokne ke liye.
        return () => {
            console.log("Cleaning up interval...");
            clearInterval(intervalId);
        };
        
    }, [logout , refreshTrigger]); // logout par hi dependency rakhte hain, refreshTrigger ki zarurat nahi ab.


    // --- 2. Filtering Logic (useMemo se performance behtar hogi) ---
    const filteredCustomers = useMemo(() => {
        if (!searchTerm) {
            return originalCustomers;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        
        return originalCustomers.filter(customer => {
            // Hum customer_name, contact, area, aur type mein search karenge
            return (
                customer.customer_name.toLowerCase().includes(lowerCaseSearch) ||
                customer.contact.toLowerCase().includes(lowerCaseSearch) ||
                customer.area.toLowerCase().includes(lowerCaseSearch) ||
                customer.type.toLowerCase().includes(lowerCaseSearch)
            );
        });
    }, [originalCustomers, searchTerm]); // Jab originalCustomers ya searchTerm badlega, tabhi filter hoga



  //  // ---. MODAL & FORM HANDLERS ---
    
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'bags_potential' ? parseInt(value) || 0 : value 
        }));
    };



   // Modal open karne ke liye (Edit mode)
    const handleOpenEditModal = (customer) => {
        setEditingCustomer(customer); // Customer data set
        setFormData({ // Form mein existing data load
            customer_name: customer.customer_name, 
            contact: customer.contact, 
            area: customer.area, 
            tehsil: customer.tehsil, 
            bags_potential: customer.bags_potential, 
            type: customer.type 
        });
        setIsModalOpen(true);
    };



    // Modal band karne ke liye
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null); // Editing state clear
        setError(null); // Error clear
    };


    // function to handle  update (Patch method) submission
    
    const handleFormUpdate = async (e) => {
      e.preventDefault();
      setError(null);

        console.log("editingCustomer :::::" , editingCustomer.id)
      // Ensure we are in edit 
      if (!editingCustomer || !editingCustomer.id) return;

       try {
             const response = await API.patch(`/customers/${editingCustomer.id}`,formData);
              const updatedCustomer = response.data;
              console.log("......... updatedCustomer :  " , updatedCustomer)

             // --- FIX Applied Here ---
         setOriginalCustomers(prevCustomers => {
             // Hum previous array ko map kar rahe hain.
             return prevCustomers.map(customer => {
                  // Agar ID match ho jaye, toh naye (updated) customer object se replace kar do.
                 if (customer.id === editingCustomer.id) {
                     return updatedCustomer;
                }
                // Warna, original customer object return karo.
                return customer;
            });
        });



            handleCloseModal(); // Modal band karein
            console.log("Customer updated successfully:", updatedCustomer);

            setRefreshTrigger(prev => prev + 1);


       } catch (error) {

        console.error("Failed to update customer:", err);
            setError("Error updating customer. Please check the data.");
        
       }

    }




    // --- 3. Conditional Rendering (Same as before) ---
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>Loading Customer Data...</Typography>
            </Box>
        );
    }
    if (error) {
        return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
    }


  // 4 - handle Add Customer Later


  // 5 - handle delete a single customer by id 

  // Customers component ke andar add karein
const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm(`Are you sure you want to delete customer ID ${customerId}?`)) {
        return; // User cancelled
    }
    
    setError(null);

    try {
        await API.delete(`/customers/${customerId}`); 

        // State update: Deleted customer ko list se remove karein
        setOriginalCustomers(prev => prev.filter(c => c.id !== customerId));
        
        console.log(`Customer ID ${customerId} deleted successfully.`);
        // Success Notification
        
    } catch (err) {
        console.error("Failed to delete customer:", err);
        setError(`Error deleting customer ID ${customerId}.`);
    }
};

// Error screen
    if (error && !isModalOpen) { // Agar error ho aur modal open na ho tabhi dikhayein
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                {error}
            </Alert>
        );
    }





  // --- . Main Component Render ---
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Customers Management
            </Typography>

            {/* --- Search Bar and Add Button --- */}
            <Box display="flex" justifyContent="space-between" mb={2} alignItems="center">
                {/* 👈 Search Bar */}
                <TextField
                    label="Search Customers (Name, Contact, Area)"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: '40%' }}
                />

                {/* + Button: Add Customer */}
                <Button 
                    variant="contained" 
                    color="success" 
                    startIcon={<AddIcon />}
                    onClick={() => console.log('Add Customer clicked')} // 👈 Yahan POST API logic aayegi
                >
                    Add New Customer
                </Button>
            </Box>
            
            {/* --- Customer Table (Ab filteredCustomers ko use karega) --- */}
            <TableContainer component={Paper} elevation={3}>
                <Table sx={{ minWidth: 800 }} aria-label="customer table">
                    
                    {/* ... Table Header (Same) ... */}
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
                    
                    {/* Table Body */}
                    <TableBody>
                        {filteredCustomers.map((customer) => ( // 👈 Ab filteredCustomers use ho raha hai
                            <TableRow
                                key={customer.id}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell>{customer.id}</TableCell>
                                <TableCell>{customer.customer_name}</TableCell>
                                <TableCell>{customer.contact}</TableCell>
                                <TableCell>{customer.area}</TableCell>
                                <TableCell>{customer.tehsil}</TableCell>
                                <TableCell align="right">{customer.bags_potential || 0}</TableCell>
                                <TableCell>{customer.type}</TableCell>
                                <TableCell align="center">
                                    <Button size="small" color="primary" startIcon={<EditIcon />} sx={{ minWidth: 0, p: '4px', mr: 1 }}
                                        onClick={() => handleOpenEditModal(customer)} // 👈 Yahan PUT API logic aayegi
                                    />
                                    <Button size="small" color="error" startIcon={<DeleteIcon />} sx={{ minWidth: 0, p: '4px' }}
                                        onClick={() => handleDeleteCustomer(customer.id)} // 👈 Yahan DELETE API logic aayegi
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {/* No Results found */}
                        {filteredCustomers.length === 0 && originalCustomers.length > 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <Typography variant="subtitle1" color="textSecondary">
                                        No customers found matching "{searchTerm}"
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>


            {/* --- MODAL FOR EDIT --- */}
            <Dialog open={isModalOpen} onClose={handleCloseModal}>
                <DialogTitle>
                    Edit Customer ID: {editingCustomer?.id}
                </DialogTitle>
                <form onSubmit={handleFormUpdate}> {/* 👈 Update function call */}
                    <DialogContent dividers>
                        <TextField
                            label="Customer Name"
                            name="customer_name"
                            value={formData.customer_name}
                            onChange={handleFormChange}
                            fullWidth margin="normal" required
                        />
                        <TextField
                            label="Contact"
                            name="contact"
                            value={formData.contact}
                            onChange={handleFormChange}
                            fullWidth margin="normal" required
                        />
                        <TextField
                            label="Area"
                            name="area"
                            value={formData.area}
                            onChange={handleFormChange}
                            fullWidth margin="normal" required
                        />
                        <TextField
                            label="Tehsil"
                            name="tehsil"
                            value={formData.tehsil}
                            onChange={handleFormChange}
                            fullWidth margin="normal" required
                        />
                        <TextField
                            label="Potential Bags"
                            name="bags_potential"
                            type="number"
                            value={formData.bags_potential}
                            onChange={handleFormChange}
                            fullWidth margin="normal"
                        />
                        <TextField
                            label="Type (Dealer/Farmer)"
                            name="type"
                            value={formData.type}
                            onChange={handleFormChange}
                            fullWidth margin="normal" required
                        />
                        {/* Modal ke andar ka error yahan dikhega */}
                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>} 
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseModal} color="error">
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" color="primary">
                            Save Changes
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
            {/* --- END MODAL --- */}
        </Box>
    );




};

export default Customers;