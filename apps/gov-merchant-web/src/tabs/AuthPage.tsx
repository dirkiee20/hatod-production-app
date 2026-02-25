import React, { useState } from 'react';
import { Mail, Lock, Phone, User, AlertCircle } from 'lucide-react';
import { login, register, setAuthToken } from '../api/client';
import './AuthPage.css';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

export function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [merchantName, setMerchantName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!loginPhone || !loginPassword) {
        throw new Error('Phone and password are required');
      }

      const data = await login(loginPhone, loginPassword);
      setAuthToken(data.access_token);
      onLoginSuccess();
    } catch (err: Error | unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!signupEmail || !signupPhone || !signupPassword || !firstName || !lastName || !merchantName) {
        throw new Error('All fields are required');
      }

      if (signupPassword !== signupConfirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (signupPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      await register(signupEmail, signupPassword, firstName, lastName, signupPhone, merchantName);
      
      // Auto-login after signup
      const data = await login(signupPhone, signupPassword);
      setAuthToken(data.access_token);
      onLoginSuccess();
    } catch (err: Error | unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">H</div>
          <h1>Hatod Gov Portal</h1>
          <p>Government Services Management</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="auth-tabs">
          <button
            className={`tab ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
          >
            Login
          </button>
          <button
            className={`tab ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
          >
            Sign Up
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label>Phone Number</label>
              <div className="input-wrapper">
                <Phone size={18} />
                <input
                  type="tel"
                  placeholder="+63 9XX XXXX XXXX"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={18} />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="auth-form">
            <div className="form-group">
              <label>Business/Organization Name</label>
              <div className="input-wrapper">
                <User size={18} />
                <input
                  type="text"
                  placeholder="e.g. City Hall Permits Office"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <div className="input-wrapper">
                  <User size={18} />
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <div className="input-wrapper">
                  <User size={18} />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <div className="input-wrapper">
                <Phone size={18} />
                <input
                  type="tel"
                  placeholder="+63 9XX XXXX XXXX"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={18} />
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={18} />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>After sign up, you can manage permits and government services from the dashboard.</p>
        </div>
      </div>
    </div>
  );
}
