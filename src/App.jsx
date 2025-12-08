import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout & Components
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Users from './pages/Users';
import Reports from './pages/Reports';

function App() {
  // Authentication State ko manage karna
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => setIsAuthenticated(false);

  return (
    <Router>
      <Routes>
        {/* 1. Login Route (Public) */}
        <Route 
            path="/login" 
            element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
        />

        {/* 2. Protected Routes (Portal) */}
        {isAuthenticated ? (
          // Jab user logged in ho, toh Layout render karo aur uske andar nested routes
          <Route path="/" element={<Layout onLogout={handleLogout} />}>
            {/* Index Route (Default: /) */}
            <Route index element={<Dashboard />} /> 
            
            {/* Other Content Routes */}
            <Route path="customers" element={<Customers />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        ) : (
          // Agar user logged in nahi hai aur kisi protected route par jane ki koshish kare, toh Login par redirect kar do
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;