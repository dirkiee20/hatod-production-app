import React, { useState, useEffect } from 'react';
import { Home, FileText, CheckCircle, Settings, LogOut, Bell, Search, User } from 'lucide-react';
import './Dashboard.css';
import type { Application, ApplicationStatus } from './types';
import { DashboardTab } from './tabs/DashboardTab';
import { ApplicationsTab } from './tabs/ApplicationsTab';
import { HistoryTab } from './tabs/HistoryTab';
import { SettingsTab } from './tabs/SettingsTab';
import { ApplicationDetailsModal } from './tabs/ApplicationDetailsModal';
import { AuthPage } from './tabs/AuthPage';
import { getAuthToken, clearAuthToken, getProfile } from './api/client';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'history' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [appError, setAppError] = useState<string | null>(null);

  // Configurable API base URL (env first, fallback to localhost for dev)
  const API_URL =
    (import.meta as any).env?.VITE_API_URL ||
    (import.meta as any).env?.REACT_APP_API_URL ||
    'http://localhost:3000/api';

  // Fetch user profile on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      try {
        getProfile()
          .then(data => {
            console.log('[App] Profile fetched:', data);
            if (data?.merchant) {
              setUserInfo(data);
            } else {
              console.warn('[App] No merchant found in profile');
              setUserInfo({ merchant: { name: 'Government Services' }, firstName: 'Admin' });
            }
          })
          .catch(err => {
            console.error('[App] Failed to fetch profile:', err);
            setAppError(`Failed to load profile: ${err.message}`);
          });
      } catch (err: any) {
        console.error('[App] Profile fetch error:', err);
        setAppError(`Error: ${err.message}`);
      }
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
    setUserInfo(null);
    setAppError(null);
  };

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onLoginSuccess={() => {
      setIsAuthenticated(true);
      setAppError(null);
    }} />;
  }

  // Show error if app fails
  if (appError) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fee', color: '#c33' }}>
        <h2>Error</h2>
        <p>{appError}</p>
        <button onClick={() => {
          setAppError(null);
          handleLogout();
        }} style={{ padding: '10px 20px', marginTop: '10px', cursor: 'pointer' }}>
          Logout & Try Again
        </button>
      </div>
    );
  }

  const userName = userInfo?.merchant?.name || userInfo?.firstName || 'Merchant';
  const userRole = 'Government Services';

  React.useEffect(() => {
    setLoading(true);
    console.log('[App] Fetching pabili requests from:', `${API_URL}/pabili-requests/gov`);
    fetch(`${API_URL}/pabili-requests/gov`)
      .then(res => {
        console.log('[App] Pabili response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('[App] Pabili requests fetched:', data.length, 'items');
        const mapped: Application[] = data.map((req: any) => {
          const items: string[] = Array.isArray(req.items) ? req.items : [];
          const isGov = items[0]?.includes('Permit');
          const typeText = isGov ? items[0].replace('Service: ', '') : 'Pabili Request';
          const applicantName = req.customer?.firstName
            ? `${req.customer.firstName} ${req.customer.lastName}`
            : 'Customer App User';

          return {
            id: req.id.substring(0, 8).toUpperCase(),
            requestId: req.id,
            applicant: applicantName,
            type: typeText,
            status: req.status,
            date: new Date(req.createdAt).toLocaleDateString(),
            priority: isGov ? 'URGENT' : 'NORMAL',
            rawItems: items,
            isGov,
          };
        });
        setApplications(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[App] Failed to fetch pabili requests:', err);
        setApplications([]);
        setLoading(false);
      });
  }, [API_URL]);

  const searchedApps = applications.filter(app =>
    app.applicant.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeApps = searchedApps.filter(app => !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(app.status));
  const historyApps = searchedApps.filter(app => ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(app.status));

  const handleUpdateStatus = async (app: Application, newStatus: ApplicationStatus) => {
    try {
      const res = await fetch(`${API_URL}/pabili-requests/gov/${app.requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        console.error('Failed to update status', await res.text());
        return;
      }

      // Update local state
      setApplications(prev =>
        prev.map(a =>
          a.requestId === app.requestId ? { ...a, status: newStatus } : a
        )
      );
      setSelectedApplication(prev =>
        prev && prev.requestId === app.requestId ? { ...prev, status: newStatus } : prev
      );
    } catch (e) {
      console.error('Error updating status', e);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-circle">H</div>
          <div className="brand-text">
            <h2>Hatod Gov</h2>
            <span>Merchant Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Home size={20} />
            <span>Dashboard</span>
          </button>
          <button className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
            <FileText size={20} />
            <span>Applications</span>
            {activeApps.length > 0 && <span className="badge">{activeApps.length}</span>}
          </button>
          <button className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <CheckCircle size={20} />
            <span>History</span>
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="top-bar">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search applications (ID, Name)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="top-actions">
            <button className="icon-btn">
              <Bell size={20} />
              <span className="dot"></span>
            </button>
            <div className="user-profile">
              <div className="user-avatar">
                <User size={20} />
              </div>
              <div className="user-info">
                <span className="name">{userName}</span>
                <span className="role">{userRole}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="content-area">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <DashboardTab applications={applications} loading={loading} />
          )}

          {/* APPLICATIONS TAB */}
          {activeTab === 'applications' && (
            <ApplicationsTab
              applications={activeApps}
              loading={loading}
              onSelect={setSelectedApplication}
            />
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <HistoryTab
              applications={historyApps}
              loading={loading}
              onSelect={setSelectedApplication}
            />
          )}

          {/* APPLICATION DETAILS MODAL */}
          {selectedApplication && (
            <ApplicationDetailsModal
              application={selectedApplication}
              onUpdateStatus={(status) => handleUpdateStatus(selectedApplication, status)}
              onClose={() => setSelectedApplication(null)}
            />
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && <SettingsTab />}

        </div>
      </main>
    </div>
  );
}
