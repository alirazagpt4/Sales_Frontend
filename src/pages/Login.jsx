import React from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';

const Login = ({ onLogin }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Normally, yahan API call karke username/password verify karte hain.
    // Abhi hum seedha login karwa denge demo ke liye.
    onLogin();
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
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Admin Login
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            required
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ mt: 2 }}
          >
            Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;