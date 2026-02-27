import React, { useState, useEffect } from 'react';
import { MapPin, Save, Navigation, CheckCircle, AlertCircle, ExternalLink, Loader } from 'lucide-react';
import { authenticatedFetch } from '../api/client';

interface MerchantProfile {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email?: string;
}

export const SettingsTab: React.FC = () => {
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Location fields
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [locationError, setLocationError] = useState('');

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        // Get the logged-in user to find the merchant profile
        const userRes = await authenticatedFetch('/users/me');
        const user = await userRes.json();

        if (user?.merchant) {
          const merchant = user.merchant;
          setProfile(merchant);
          setLatitude(String(merchant.latitude ?? ''));
          setLongitude(String(merchant.longitude ?? ''));
        }
      } catch (err) {
        console.error('Failed to load merchant profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, []);

  const handleSaveLocation = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setLocationStatus('error');
      setLocationError('Please enter valid numeric coordinates.');
      return;
    }

    if (lat < -90 || lat > 90) {
      setLocationStatus('error');
      setLocationError('Latitude must be between -90 and 90.');
      return;
    }

    if (lng < -180 || lng > 180) {
      setLocationStatus('error');
      setLocationError('Longitude must be between -180 and 180.');
      return;
    }

    setSavingLocation(true);
    setLocationStatus('idle');
    setLocationError('');

    try {
      const res = await authenticatedFetch('/merchants/profile', {
        method: 'PATCH',
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(prev => prev ? { ...prev, latitude: updated.latitude, longitude: updated.longitude } : prev);
        setLatitude(String(updated.latitude));
        setLongitude(String(updated.longitude));
        setLocationStatus('success');
      } else {
        const err = await res.json().catch(() => ({}));
        setLocationStatus('error');
        setLocationError(err.message || 'Failed to save location. Please try again.');
      }
    } catch (err) {
      setLocationStatus('error');
      setLocationError('Network error. Please check your connection.');
    } finally {
      setSavingLocation(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(7));
        setLongitude(pos.coords.longitude.toFixed(7));
        setLocationStatus('idle');
        setLocationError('');
      },
      () => {
        setLocationStatus('error');
        setLocationError('Unable to retrieve your current location. Please enter coordinates manually.');
      }
    );
  };

  const mapsPickerUrl = `https://www.google.com/maps/search/?api=1&query=${latitude || '8.1948'},${longitude || '126.0678'}`;

  return (
    <>
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-grid">
        {/* Profile Information (read-only) */}
        <div className="settings-section">
          <h3>Profile Information</h3>
          <div className="settings-form">
            <div className="form-group">
              <label>Department Name</label>
              <input
                type="text"
                value={loadingProfile ? 'Loading...' : (profile?.name ?? 'City Hall Desk')}
                readOnly
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                value={loadingProfile ? 'Loading...' : (profile?.address ?? '—')}
                readOnly
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={loadingProfile ? 'Loading...' : (profile?.phone ?? '—')}
                readOnly
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
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

        {/* Location Pin */}
        <div className="settings-section" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} color="var(--primary, #1565C0)" />
            Office Location Pin
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>
            Set the exact GPS coordinates of your government office. This is used as the <strong>origin point</strong> to calculate the delivery fee when customers checkout government service requests.
          </p>

          {loadingProfile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Loading current location...
            </div>
          ) : (
            <>
              {/* Current coords summary */}
              {profile && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: profile.latitude === 0 && profile.longitude === 0 ? '#FFF3CD' : '#E3F2FD',
                  border: `1px solid ${profile.latitude === 0 && profile.longitude === 0 ? '#FFECB5' : '#BBDEFB'}`,
                  borderRadius: 8, padding: '8px 14px', marginBottom: 20, fontSize: '0.85rem',
                  color: profile.latitude === 0 && profile.longitude === 0 ? '#856404' : '#1565C0',
                }}>
                  <MapPin size={14} />
                  {profile.latitude === 0 && profile.longitude === 0
                    ? '⚠️ No location set yet — delivery fees cannot be calculated until you save a valid pin.'
                    : `Current pin: ${profile.latitude.toFixed(6)}, ${profile.longitude.toFixed(6)}`
                  }
                </div>
              )}

              {/* Input row */}
              <div className="settings-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="form-group">
                    <label>Latitude</label>
                    <input
                      type="number"
                      step="0.0000001"
                      className="input-field"
                      value={latitude}
                      onChange={e => { setLatitude(e.target.value); setLocationStatus('idle'); }}
                      placeholder="e.g. 9.0820"
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      Range: -90 to 90
                    </small>
                  </div>
                  <div className="form-group">
                    <label>Longitude</label>
                    <input
                      type="number"
                      step="0.0000001"
                      className="input-field"
                      value={longitude}
                      onChange={e => { setLongitude(e.target.value); setLocationStatus('idle'); }}
                      placeholder="e.g. 125.5981"
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      Range: -180 to 180
                    </small>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                  <button
                    className="btn-primary"
                    onClick={handleSaveLocation}
                    disabled={savingLocation}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    {savingLocation
                      ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                      : <><Save size={15} /> Save Location</>
                    }
                  </button>

                  <button
                    onClick={handleUseCurrentLocation}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 16px', borderRadius: 8, border: '1px solid #CCC',
                      background: '#FFF', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Navigation size={15} />
                    Use My Current Location
                  </button>

                  <a
                    href={mapsPickerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 16px', borderRadius: 8, border: '1px solid #1565C0',
                      background: '#E3F2FD', textDecoration: 'none',
                      fontSize: '0.875rem', fontWeight: 600, color: '#1565C0',
                    }}
                  >
                    <ExternalLink size={15} />
                    Pick on Google Maps
                  </a>
                </div>

                {/* How to pick on maps hint */}
                <div style={{
                  background: '#F5F7FA', borderRadius: 8, padding: '10px 14px',
                  fontSize: '0.80rem', color: '#555', marginBottom: 16, lineHeight: 1.6,
                }}>
                  💡 <strong>How to get coordinates from Google Maps:</strong> Open Google Maps → right-click your office location → the coordinates appear at the top of the context menu. Copy and paste them above.
                </div>

                {/* Status messages */}
                {locationStatus === 'success' && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, background: '#E8F5E9',
                    border: '1px solid #A5D6A7', borderRadius: 8, padding: '10px 14px',
                    color: '#2E7D32', fontSize: '0.875rem', marginBottom: 16,
                  }}>
                    <CheckCircle size={16} />
                    Location saved successfully! Delivery fees will now be calculated from this office pin.
                  </div>
                )}
                {locationStatus === 'error' && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, background: '#FFEBEE',
                    border: '1px solid #FFCDD2', borderRadius: 8, padding: '10px 14px',
                    color: '#C62828', fontSize: '0.875rem', marginBottom: 16,
                  }}>
                    <AlertCircle size={16} />
                    {locationError}
                  </div>
                )}
              </div>

              {/* Map preview */}
              {latitude && longitude && parseFloat(latitude) !== 0 && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
                    📍 Map Preview
                  </p>
                  <iframe
                    title="Office Location Preview"
                    width="100%"
                    height="260"
                    style={{ border: 0, borderRadius: 12, display: 'block' }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`}
                  />
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </>
  );
};
