import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import Dashboard from './features/attendance/Dashboard';

const App = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <div style={{ color: 'var(--accent)', fontWeight: 600 }}>Loading AttendX...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={!token ? <LoginPage /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/register"
        element={!token ? <RegisterPage /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/dashboard"
        element={token ? <Dashboard /> : <Navigate to="/login" />}
      />
      <Route
        path="/"
        element={<Navigate to={token ? "/dashboard" : "/login"} />}
      />
    </Routes>
  );
};

export default App;
