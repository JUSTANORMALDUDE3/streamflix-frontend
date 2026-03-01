import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './App.css';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Watch from './pages/Watch';
import History from './pages/History';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminUpload from './pages/AdminUpload';
import AdminUserMgmt from './pages/AdminUserMgmt';
import AdminVideoMgmt from './pages/AdminVideoMgmt';
import AdminTokenMgmt from './pages/AdminTokenMgmt';
import AdminDriveScanner from './pages/AdminDriveScanner';
import AdminHealthDashboard from './pages/AdminHealthDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

// Layout
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import TransitionWrapper from './components/TransitionWrapper';

const ProtectedRoute = ({ children, adminOnly }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

const AppLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && isSidebarOpen === false) {
        setIsSidebarOpen(true);
      } else if (mobile && isSidebarOpen === true) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  return (
    <div className="flex-column" style={{ minHeight: '100vh' }}>
      <Navbar toggleMobileMenu={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="app-main-wrapper">
        <Sidebar isOpen={isSidebarOpen} closeMenu={() => setIsSidebarOpen(false)} />
        <main className="app-main-content">
          <TransitionWrapper>
            {children}
          </TransitionWrapper>
        </main>
        {isSidebarOpen && isMobile && (
          <div
            className="mobile-sidebar-overlay animate-fade-in"
            onClick={() => setIsSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 90 }}
          />
        )}
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
        <Route path="/explore" element={<ProtectedRoute><AppLayout><Explore /></AppLayout></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><AppLayout><History /></AppLayout></ProtectedRoute>} />
        <Route path="/playlists" element={<ProtectedRoute><AppLayout><Playlists /></AppLayout></ProtectedRoute>} />
        <Route path="/playlists/:id" element={<ProtectedRoute><AppLayout><PlaylistDetail /></AppLayout></ProtectedRoute>} />
        <Route path="/watch/:id" element={<ProtectedRoute><AppLayout><Watch /></AppLayout></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute adminOnly><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/upload" element={<ProtectedRoute adminOnly><AppLayout><AdminUpload /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><AppLayout><AdminUserMgmt /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/videos" element={<ProtectedRoute adminOnly><AppLayout><AdminVideoMgmt /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/tokens" element={<ProtectedRoute adminOnly><AppLayout><AdminTokenMgmt /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/drive-scanner" element={<ProtectedRoute adminOnly><AppLayout><AdminDriveScanner /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/health" element={<ProtectedRoute adminOnly><AppLayout><AdminHealthDashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><AppLayout><AnalyticsDashboard /></AppLayout></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

export default App;
