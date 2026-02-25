import React from 'react';

export const SettingsTab: React.FC = () => {
  return (
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
  );
};

