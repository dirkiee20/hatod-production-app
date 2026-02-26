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
  const [authState, setAuthState] = useState<'checking' | 'unauthenticated' | 'authenticated'>('checking');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'history' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // Configurable API base URL (env first, fallback to localhost for dev)
  const API_URL =
    (import.meta as any).env?.VITE_API_URL ||
    (import.meta as any).env?.REACT_APP_API_URL ||
    'http://localhost:3000/api';

  // Auth check on mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setAuthState('unauthenticated');
      return;
    }
    getProfile()
      .then(() => setAuthState('authenticated'))
      .catch(() => {
        clearAuthToken();
        setAuthState('unauthenticated');
      });
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    setAuthState('unauthenticated');
  };

  React.useEffect(() => {
    if (authState !== 'authenticated') return;
    const api = API_URL;
    Promise.all([
      fetch(`${api}/pabili-requests/gov`).then((r) => r.json()),
      fetch(`${api}/orders/gov`).then((r) => r.json()),
    ])
      .then(([pabiliData, ordersData]) => {
        const pabiliApps: (Application & { _sortTs: number })[] = (pabiliData || []).map((req: any) => {
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
            source: 'pabili' as const,
            _sortTs: new Date(req.createdAt).getTime(),
          };
        });

        const orderStatusToAppStatus: Record<string, ApplicationStatus> = {
          PENDING: 'PENDING_REVIEW',
          CONFIRMED: 'ACCEPTED',
          PREPARING: 'PROCESSING',
          READY_FOR_PICKUP: 'READY',
          PICKED_UP: 'READY',
          DELIVERING: 'READY',
          DELIVERED: 'COMPLETED',
          CANCELLED: 'CANCELLED',
        };

        const orderApps: (Application & { _sortTs: number })[] = (ordersData || []).map((order: any) => {
          const applicantName = order.customer?.firstName
            ? `${order.customer.firstName} ${order.customer.lastName}`
            : 'Customer App User';
          const firstItem = order.items?.[0];
          const menuName = firstItem?.menuItem?.name || 'Government Service';
          const typeText = menuName;
          const options = firstItem?.options;
          const rawItems: string[] = [];
          if (options && typeof options === 'object') {
            for (const [k, v] of Object.entries(options)) {
              rawItems.push(`${k}: ${v}`);
              if (k === 'Renewal/New') rawItems.push(`Renewal/New (DTI/Business Name): ${v}`);
            }
          }
          return {
            id: order.id.substring(0, 8).toUpperCase(),
            requestId: order.id,
            applicant: applicantName,
            type: typeText,
            status: orderStatusToAppStatus[order.status] || 'PENDING_REVIEW',
            date: new Date(order.createdAt).toLocaleDateString(),
            priority: 'URGENT',
            rawItems,
            isGov: true,
            source: 'order' as const,
            _sortTs: new Date(order.createdAt).getTime(),
          };
        });

        const merged: Application[] = [...pabiliApps, ...orderApps]
          .sort((a, b) => b._sortTs - a._sortTs)
          .map(({ _sortTs, ...app }) => app);
        setApplications(merged);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setApplications([]);
        setLoading(false);
      });
  }, [authState, API_URL]);

  const searchedApps = applications.filter(app =>
    app.applicant.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeApps = searchedApps.filter(app => !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(app.status));
  const historyApps = searchedApps.filter(app => ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(app.status));

  const handleUpdateStatus = async (app: Application, newStatus: ApplicationStatus) => {
    try {
      let url: string;
      let bodyStatus: string;
      if (app.source === 'order') {
        const appToOrderStatus: Record<string, string> = {
          PENDING_REVIEW: 'CONFIRMED',
          ACCEPTED: 'CONFIRMED',
          PROCESSING: 'PREPARING',
          READY: 'READY_FOR_PICKUP',
          REJECTED: 'CANCELLED',
          CANCELLED: 'CANCELLED',
        };
        bodyStatus = appToOrderStatus[newStatus] || newStatus;
        url = `${API_URL}/orders/gov/${app.requestId}/status`;
      } else {
        bodyStatus = newStatus;
        url = `${API_URL}/pabili-requests/gov/${app.requestId}/status`;
      }
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: bodyStatus }),
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

  if (authState === 'checking') {
    return (
      <div className="dashboard-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Loading...</div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <AuthPage onLoginSuccess={() => setAuthState('authenticated')} />;
  }

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
                <span className="name">City Hall Clerk</span>
                <span className="role">Admin</span>
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
