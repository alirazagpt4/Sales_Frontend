import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Auth Context ko import karein
import { useAuth } from './context/authContext'; 

// Layout & Components
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Users from './pages/Users';
import Reports from './pages/Reports';
import SummaryReports from './pages/SummaryReports';
import Items from './pages/Items';

function App() {
  // useAuth Hook se values lein. Aapke AuthProvider mein loading state hai.
  const { token, user, loading, logout } = useAuth(); 
  
  // isAuthenticated state ke bajaye, hum token ki maujoodgi check karenge
  const isAuthenticated = !!token;

  // 1. Initial Loading Screen
  // Agar AuthProvider loading mein hai, toh App bhi loading screen dikhata hai.
  // Note: Aapka AuthProvider khud loading screen dikha raha hai. Yahan bas null return karna safe hai.
  if (loading) {
    return null; 
  }

  return (
    <Router>
      <Routes>
        {/* 1. Login Route (Public) */}
        <Route 
            path="/login" 
            // Agar authenticated hai, toh Dashboard par redirect
            element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} 
        />

        {/* 2. Protected Routes (Portal) */}
        {isAuthenticated ? (
          // Jab user logged in ho, toh Layout render karo aur uske andar nested routes
          // Layout mein ab koi 'onLogout' prop ki zaroorat nahi.
          <Route path="/" element={<Layout />}> 
            {/* Index Route (Default: /) */}
            <Route index element={<Dashboard />} /> 
            
            {/* Other Content Routes */}
            <Route path="customers" element={<Customers />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
            <Route path="summary-reports" element={<SummaryReports />} />
            <Route path="items" element={<Items />} />
          </Route>
        ) : (
          // Agar user logged in nahi hai aur kisi protected route par jane ki koshish kare, toh Login par redirect kar do
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;