import React from 'react';
import type { Application } from '../types';

interface DashboardTabProps {
  applications: Application[];
  loading: boolean;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ applications, loading }) => {
  return (
    <>
      <div className="page-header">
        <h1>Dashboard Overview</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Pending / Needs Review</h3>
          <div className="value">
            {applications.filter(a => a.status.includes('PENDING')).length}
          </div>
          <div className="trend flat">Awaiting quotation</div>
        </div>
        <div className="stat-card">
          <h3>Quoted / Processing</h3>
          <div className="value">
            {applications.filter(a => a.status === 'QUOTED' || a.status === 'ACCEPTED').length}
          </div>
          <div className="trend flat">Waiting for user</div>
        </div>
        <div className="stat-card success">
          <h3>Completed</h3>
          <div className="value">
            {applications.filter(a => a.status === 'COMPLETED').length}
          </div>
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
                <td colSpan={4} style={{ textAlign: 'center', padding: '30px' }}>
                  No recent applications
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

