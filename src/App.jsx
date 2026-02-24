import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './App.css';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import Watch from './pages/Watch';
import AdminDashboard from './pages/AdminDashboard';
import AdminUpload from './pages/AdminUpload';
import AdminUserMgmt from './pages/AdminUserMgmt';
import AdminVideoMgmt from './pages/AdminVideoMgmt';

// Layout
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

const ProtectedRoute = ({ children, adminOnly }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

const AppLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="flex-column" style={{ minHeight: '100vh' }}>
      <Navbar />
      <div className="app-main-wrapper">
        <Sidebar />
        <main key={location.pathname} className="app-main-content animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

        {/* Protected Regular Routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>} />
        <Route path="/watch/:id" element={<ProtectedRoute><AppLayout><Watch /></AppLayout></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute adminOnly><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/upload" element={<ProtectedRoute adminOnly><AppLayout><AdminUpload /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><AppLayout><AdminUserMgmt /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/videos" element={<ProtectedRoute adminOnly><AppLayout><AdminVideoMgmt /></AppLayout></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

export default App;
