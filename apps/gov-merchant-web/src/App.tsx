import { useState, useEffect } from 'react';
import { Home, FileText, CheckCircle, Settings, LogOut, Bell, Search, User } from 'lucide-react';
import './Dashboard.css';
import type { Application, ApplicationStatus } from './types';
import { DashboardTab } from './tabs/DashboardTab';
import { ApplicationsTab } from './tabs/ApplicationsTab';
import { HistoryTab } from './tabs/HistoryTab';
import { SettingsTab } from './tabs/SettingsTab';
import { ApplicationDetailsModal } from './tabs/ApplicationDetailsModal';
import { AuthPage } from './tabs/AuthPage';
import { getAuthToken, clearAuthToken, getProfile, authenticatedFetch } from './api/client';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'history' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [userInfo, setUserInfo] = useState<{ merchant?: { name: string }; firstName?: string } | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  // Configurable API base URL (env first, fallback to localhost for dev)
  const API_URL =
    (import.meta.env?.VITE_API_URL as string | undefined) ||
    (import.meta.env?.REACT_APP_API_URL as string | undefined) ||
    'http://localhost:3000/api';

  // Fetch user profile on mount if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    
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
      .catch((err: Error) => {
        console.error('[App] Failed to fetch profile:', err);
        setAppError(`Failed to load profile: ${err.message}`);
      });
  }, [isAuthenticated]);

  // If authenticated and merchant profile exists, fetch merchant orders (so gov merchants receive orders)
  useEffect(() => {
    const fetchMerchantOrders = async () => {
      if (!isAuthenticated) return;
      if (!userInfo?.merchant) return;

      try {
        const res = await authenticatedFetch('/orders');
        if (!res.ok) {
          console.warn('[App] Failed to fetch merchant orders:', res.status);
          return;
        }
        const orders = await res.json();
        // Map orders to Application shape expected by the dashboard
        const mappedFromOrders: Application[] = (orders as any[]).map((ord) => {
          const items: string[] = Array.isArray(ord.items) ? ord.items.map((it: any) => it.menuItem?.name || it.name || '') : [];
          const isGov = ord.merchant?.type === 'GOVERNMENT' || (items[0] || '').includes('Permit');
          return {
            id: (ord.id as string).substring(0,8).toUpperCase(),
            requestId: ord.id,
            applicant: ord.customer?.firstName ? `${ord.customer.firstName} ${ord.customer.lastName}` : ord.customer?.name || 'Customer',
            type: items[0] ? items[0].replace('Service: ', '') : 'Order',
            status: ord.status,
            date: new Date(ord.createdAt).toLocaleDateString(),
            priority: isGov ? 'URGENT' : 'NORMAL',
            rawItems: items,
            isGov,
          };
        });

        // Prepend merchant orders so they show on top
        setApplications(prev => [...mappedFromOrders, ...prev]);
      } catch (err) {
        console.error('[App] Error fetching merchant orders:', err);
      }
    };

    fetchMerchantOrders();
  }, [isAuthenticated, userInfo]);

  const handleLogout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
    setUserInfo(null);
    setAppError(null);
  };

  // Fetch pabili requests
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      console.log('[App] Fetching pabili requests from:', `${API_URL}/pabili-requests/gov`);
      try {
        const res = await fetch(`${API_URL}/pabili-requests/gov`);
        console.log('[App] Pabili response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        console.log('[App] Pabili requests fetched:', data.length, 'items');
        const mapped: Application[] = (data as Record<string, unknown>[]).map((req: Record<string, unknown>) => {
          const items: string[] = Array.isArray(req.items) ? (req.items as string[]) : [];
          const isGov = items[0]?.includes('Permit');
          const typeText = isGov ? items[0].replace('Service: ', '') : 'Pabili Request';
          const customer = req.customer as Record<string, string> | undefined;
          const applicantName = customer?.firstName
            ? `${customer.firstName} ${customer.lastName}`
            : 'Customer App User';

          return {
            id: (req.id as string).substring(0, 8).toUpperCase(),
            requestId: req.id as string,
            applicant: applicantName,
            type: typeText,
            status: req.status as ApplicationStatus,
            date: new Date(req.createdAt as string).toLocaleDateString(),
            priority: isGov ? 'URGENT' : 'NORMAL',
            rawItems: items,
            isGov,
          };
        });
        setApplications(mapped);
      } catch (err) {
        console.error('[App] Failed to fetch pabili requests:', err);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [API_URL]);

  const searchedApps = applications.filter(app =>
    app.applicant.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeApps = searchedApps.filter(app => !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(app.status));
  const historyApps = searchedApps.filter(app => ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(app.status));

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
