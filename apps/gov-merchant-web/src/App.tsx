import React, { useState } from 'react';
import { Home, FileText, CheckCircle, Settings, LogOut, Bell, Search, User, Filter } from 'lucide-react';
import './Dashboard.css';

interface Application {
  id: string;
  applicant: string;
  type: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED';
  date: string;
  priority: 'NORMAL' | 'URGENT';
}

const MOCK_DATA: Application[] = [
  { id: 'APP-001', applicant: 'Juan Dela Cruz', type: 'Business Permit Renewal', status: 'PENDING', date: 'Oct 24, 2026', priority: 'URGENT' },
  { id: 'APP-002', applicant: 'Maria Clara', type: 'Cedula Request', status: 'PROCESSING', date: 'Oct 23, 2026', priority: 'NORMAL' },
  { id: 'APP-003', applicant: 'Jose Rizal', type: 'NBI Clearance', status: 'READY', date: 'Oct 22, 2026', priority: 'NORMAL' },
  { id: 'APP-004', applicant: 'Andres Bonifacio', type: 'Mayor\'s Permit', status: 'COMPLETED', date: 'Oct 20, 2026', priority: 'URGENT' },
  { id: 'APP-005', applicant: 'Gabriela Silang', type: 'Health Certificate', status: 'PENDING', date: 'Oct 24, 2026', priority: 'NORMAL' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApps = MOCK_DATA.filter(app => 
    app.applicant.toLowerCase().includes(searchQuery.toLowerCase()) || 
    app.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <span className="badge">12</span>
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
          <button className="nav-item logout">
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
          <div className="page-header">
            <h1>Application Queue</h1>
            <div className="header-actions">
              <button className="btn-secondary">
                <Filter size={16} /> Filter
              </button>
              <button className="btn-primary">
                + New Application
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>Pending</h3>
              <div className="value">24</div>
              <div className="trend up">+12% today</div>
            </div>
            <div className="stat-card">
              <h3>Processing</h3>
              <div className="value">8</div>
              <div className="trend flat">Steady</div>
            </div>
            <div className="stat-card success">
              <h3>Ready for Pickup</h3>
              <div className="value">15</div>
              <div className="trend up">+5% today</div>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Applicant</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr key={app.id}>
                    <td className="fw-bold">{app.id}</td>
                    <td>
                      <div className="applicant-cell">
                        <div className="avatar-sm">{app.applicant.charAt(0)}</div>
                        <span>{app.applicant}</span>
                      </div>
                    </td>
                    <td>{app.type}</td>
                    <td className="text-mute">{app.date}</td>
                    <td>
                      <span className={`badge-pill ${app.priority.toLowerCase()}`}>
                        {app.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${app.status.toLowerCase()}`}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-sm">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
