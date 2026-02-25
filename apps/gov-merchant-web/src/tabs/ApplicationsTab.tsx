import React from 'react';
import { Filter } from 'lucide-react';
import type { Application } from '../types';

interface ApplicationsTabProps {
  applications: Application[];
  loading: boolean;
  onSelect: (app: Application) => void;
}

export const ApplicationsTab: React.FC<ApplicationsTabProps> = ({
  applications,
  loading,
  onSelect,
}) => {
  return (
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
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
            Loading applications...
          </div>
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
              {applications.map((app) => (
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
                    <button className="btn-sm" onClick={() => onSelect(app)}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    No applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

