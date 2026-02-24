import React, { useState } from 'react';
import { Home, FileText, CheckCircle, Settings, LogOut, Bell, Search, User, Filter } from 'lucide-react';
import './Dashboard.css';

interface Application {
  id: string;
  applicant: string;
  type: string;
  status: 'PENDING' | 'PENDING_REVIEW' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'QUOTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  date: string;
  priority: 'NORMAL' | 'URGENT';
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('http://localhost:3000/api/pabili-requests/gov')
      .then(res => res.json())
      .then(data => {
         const mapped = data.map((req: any) => {
            const isGov = req.items && Array.isArray(req.items) && req.items[0]?.includes('Permit');
            const typeText = isGov ? req.items[0].replace('Service: ', '') : 'Pabili Request';
            const applicantName = req.customer?.firstName 
               ? `${req.customer.firstName} ${req.customer.lastName}`
               : 'Customer App User';

            return {
               id: req.id.substring(0, 8).toUpperCase(),
               applicant: applicantName,
               type: typeText,
               status: req.status,
               date: new Date(req.createdAt).toLocaleDateString(),
               priority: isGov ? 'URGENT' : 'NORMAL'
            };
         });
         setApplications(mapped);
         setLoading(false);
      })
      .catch((err) => {
         console.error(err);
         setApplications([]);
         setLoading(false);
      });
  }, []);

  const searchedApps = applications.filter(app => 
    app.applicant.toLowerCase().includes(searchQuery.toLowerCase()) || 
    app.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeApps = searchedApps.filter(app => !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(app.status));
  const historyApps = searchedApps.filter(app => ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(app.status));

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
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <>
              <div className="page-header">
                <h1>Dashboard Overview</h1>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Pending / Needs Review</h3>
                  <div className="value">{applications.filter(a => a.status.includes('PENDING')).length}</div>
                  <div className="trend flat">Awaiting quotation</div>
                </div>
                <div className="stat-card">
                  <h3>Quoted / Processing</h3>
                  <div className="value">{applications.filter(a => a.status === 'QUOTED' || a.status === 'ACCEPTED').length}</div>
                  <div className="trend flat">Waiting for user</div>
                </div>
                <div className="stat-card success">
                  <h3>Completed</h3>
                  <div className="value">{applications.filter(a => a.status === 'COMPLETED').length}</div>
                  <div className="trend up">+Recent</div>
                </div>
              </div>

              <div className="page-header" style={{ marginTop: '40px' }}>
                <h2>Recent Applications</h2>
              </div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Application ID</th>
                      <th>Applicant</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.slice(0, 3).map((app) => (
                      <tr key={app.id}>
                        <td className="fw-bold">{app.id}</td>
                        <td>
                          <div className="applicant-cell">
                            <div className="avatar-sm">{app.applicant.charAt(0)}</div>
                            <span>{app.applicant}</span>
                          </div>
                        </td>
                        <td>{app.type}</td>
                        <td>
                          <span className={`status-pill ${app.status.toLowerCase().replace('_', '-')}`}>
                            {app.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {applications.length === 0 && !loading && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '30px' }}>No recent applications</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* APPLICATIONS TAB */}
          {activeTab === 'applications' && (
            <>
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

              <div className="data-table-container">
                {loading ? (
                   <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading applications...</div>
                ) : (
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
                      {activeApps.map((app) => (
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
                            <span className={`status-pill ${app.status.toLowerCase().replace('_', '-')}`}>
                              {app.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <button className="btn-sm">View Details</button>
                          </td>
                        </tr>
                      ))}
                      {activeApps.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>No applications found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <>
              <div className="page-header">
                <h1>Application History</h1>
                <div className="header-actions">
                  <button className="btn-secondary">
                    <Filter size={16} /> Filter
                  </button>
                </div>
              </div>

              <div className="data-table-container">
                {loading ? (
                   <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading history...</div>
                ) : (
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
                      {historyApps.map((app) => (
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
                            <span className={`status-pill ${app.status.toLowerCase().replace('_', '-')}`}>
                              {app.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <button className="btn-sm">View Record</button>
                          </td>
                        </tr>
                      ))}
                      {historyApps.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>No completed or rejected applications found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <>
              <div className="page-header">
                <h1>Settings</h1>
                <div className="header-actions">
                  <button className="btn-primary">
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="settings-grid">
                
                {/* Profile Settings */}
                <div className="settings-section">
                  <h3>Profile Information</h3>
                  <div className="settings-form">
                    <div className="form-group">
                      <label>Department Name</label>
                      <input type="text" defaultValue="City Hall Desk" readOnly className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Admin User</label>
                      <input type="text" defaultValue="City Hall Clerk" readOnly className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" defaultValue="admin@hatodgov.ph" readOnly className="input-field" />
                    </div>
                  </div>
                </div>

                {/* Notifications Settings */}
                <div className="settings-section">
                  <h3>Preferences</h3>
                  <div className="settings-form">
                    <div className="toggle-row">
                      <div className="toggle-info">
                        <strong>Email Notifications</strong>
                        <p>Receive emails when new applications are submitted</p>
                      </div>
                      <label className="switch">
                        <input type="checkbox" defaultChecked />
                        <span className="slider round"></span>
                      </label>
                    </div>
                    
                    <div className="toggle-row">
                      <div className="toggle-info">
                        <strong>SMS Alerts</strong>
                        <p>Receive text alerts for URGENT priority docs</p>
                      </div>
                      <label className="switch">
                        <input type="checkbox" defaultChecked />
                        <span className="slider round"></span>
                      </label>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
