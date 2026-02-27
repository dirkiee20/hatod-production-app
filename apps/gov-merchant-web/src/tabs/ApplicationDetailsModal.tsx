import React, { useState } from 'react';
import type { Application, ApplicationStatus } from '../types';

interface ApplicationDetailsModalProps {
  application: Application;
  onClose: () => void;
  onUpdateStatus: (status: ApplicationStatus) => void;
  isUpdating?: boolean;
}

const getGovFieldValue = (app: Application, label: string): string => {
  if (!app.rawItems || app.rawItems.length === 0) return '—';
  const line = app.rawItems.find((l) => l.startsWith(label + ':'));
  if (!line) return '—';
  return line.split(':').slice(1).join(':').trim() || '—';
};

export const ApplicationDetailsModal: React.FC<ApplicationDetailsModalProps> = ({
  application,
  onClose,
  onUpdateStatus,
  isUpdating = false,
}) => {
  const [statusDraft, setStatusDraft] = useState<ApplicationStatus>(application.status);

  // Keep draft in sync if the parent swaps to a different application
  React.useEffect(() => {
    setStatusDraft(application.status);
  }, [application.requestId, application.status]);

  const handleSubmitStatus = () => {
    if (statusDraft === application.status) return;
    onUpdateStatus(statusDraft);
  };

  return (
    <div className="details-modal-backdrop" onClick={onClose}>
      <div className="details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="details-header">
          <div className="details-header-left">
            <div className="details-title-row">
              <h2>Application Details</h2>
              <span className={`status-pill ${application.status.toLowerCase().replace('_', '-')}`}>
                {application.status.replace('_', ' ')}
              </span>
              <span className={`badge-pill ${application.priority.toLowerCase()}`}>
                {application.priority}
              </span>
            </div>
            <div className="details-subtitle">
              <span>{application.type}</span>
              <span className="details-dot">•</span>
              <span>ID {application.id}</span>
              <span className="details-dot">•</span>
              <span>Submitted {application.date}</span>
            </div>
          </div>
          <button className="details-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="details-body">
          <div className="details-section">
            <div className="details-section-title">Applicant</div>
            <div className="details-grid">
              <div className="details-field">
                <div className="details-label">Applicant Name</div>
                <div className="details-value">{application.applicant}</div>
              </div>
            </div>
          </div>

          {application.isGov && (
            <div className="details-section">
              <div className="details-section-title">Business Permit Information</div>
              <div className="details-grid">
                <div className="details-field">
                  <div className="details-label">Company Name</div>
                  <div className="details-value">{getGovFieldValue(application, 'Company Name')}</div>
                </div>
                <div className="details-field">
                  <div className="details-label">BIN Permit No.</div>
                  <div className="details-value">{getGovFieldValue(application, 'BIN Permit No.')}</div>
                </div>
                <div className="details-field details-field-span2">
                  <div className="details-label">Renewal / New (DTI or Business Name)</div>
                  <div className="details-value">{getGovFieldValue(application, 'Renewal/New (DTI/Business Name)')}</div>
                </div>
                <div className="details-field">
                  <div className="details-label">Government LGU</div>
                  <div className="details-value">{getGovFieldValue(application, 'LGU')}</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="details-footer">
          <div className="details-footer-left">
            <label className="details-status-label">
              Status
              <select
                className="details-status-select"
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value as ApplicationStatus)}
                disabled={isUpdating}
              >
                {application.source === 'order' ? (
                  // Orders go through the gov order status endpoint
                  // Backend accepts: CONFIRMED, PREPARING, READY_FOR_PICKUP, CANCELLED
                  // We display user-friendly labels mapped from our ApplicationStatus
                  <>
                    <option value="PENDING_REVIEW">PENDING REVIEW</option>
                    <option value="ACCEPTED">ACCEPTED (Confirm)</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="READY">READY FOR PICKUP</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="REJECTED">REJECTED / CANCEL</option>
                  </>
                ) : (
                  // Pabili requests — backend accepts: PENDING_REVIEW, ACCEPTED, REJECTED, COMPLETED
                  <>
                    <option value="PENDING_REVIEW">PENDING REVIEW</option>
                    <option value="ACCEPTED">ACCEPTED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="READY">READY</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="REJECTED">REJECTED</option>
                  </>
                )}
              </select>
            </label>
          </div>
          <div className="details-footer-right">
            <button className="btn-secondary" onClick={onClose}>
            Close
            </button>
            <button
              className="btn-primary"
              onClick={handleSubmitStatus}
              disabled={isUpdating || statusDraft === application.status}
            >
              {isUpdating ? 'Updating…' : 'Update Status'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

