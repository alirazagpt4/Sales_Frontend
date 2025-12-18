import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, CircularProgress, Alert , } from '@mui/material';
import API from '../api/axiosClient'; // 👈 Axios client import kiya
// console.log("Login page loaded" , API);
import { useAuth } from '../context/authContext.jsx'; // 👈 Context hook import kiya
import { useNavigate } from 'react-router-dom';



const Login = () => {
  // --- Context Hooks ---
  const { login } = useAuth(); // Auth Context se login function liya
  const navigate = useNavigate();
  const farmSolution = '/farmsolution.png';

  // --- State Management ---
  const [name, setName] = useState(''); // Username ki jagah email use karenge for API login
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- API Handling Function ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. 🌐 Login API Call
      const response = await API.post('/users/admin/login', { 
        name, 
        password 
      });
      
      // Assuming backend se { token: "...", userDetails: { name: "..." } } mil raha hai
      const { token: receivedToken , username:username } = response.data; 

      // 2. ✅ Auth Context Update (Token aur User details save honge)
      login(receivedToken , username);
      
      // 3. Redirect to Dashboard
      navigate('/'); 

    } catch (err) {
      // 4. ❌ Error Handling
      console.error("Login failed:", err);
      const errorMessage = err.response?.data?.message || 'Login failed. Please check credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f4f6f8'
      }}
    >
      <Paper elevation={3} sx={{ padding: 4, width: 350 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
        
        {/* 💡 FIX: sx prop ko style prop se replace kiya aur size/fit set kiya */}
        <img 
            // Agar aapki image ka naam farmSolution hai aur woh import ho chuki hai
            src={farmSolution} 
            alt="farmlogo" 
            style={{
                height: '170px',  // Height fixed
                width: '170px',   // Width fixed
                objectFit: 'contain', // Yeh sabse zaruri hai taaki image scale na ho
                marginBottom: '12px' // Thoda space diya
            }} 
        />
        
        {/* Typography ko Box ke andar rakha taaki center mein aaye */}
        <Typography variant="h5" component="h1" align="center" mt={1}>
           Login
        </Typography>
    </Box>

        {/* Error Alert */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Name"
            variant="outlined"
            fullWidth
            margin="normal"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ mt: 2 }}
            disabled={loading} // Loading hone par button disable ho jayega
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null} // Spinner
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;