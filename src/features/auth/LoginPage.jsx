import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Eye, EyeOff, LayoutPanelLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="auth-left"
      >
        <div className="auth-logo">
          Attend<span>X</span>
        </div>

        <div className="auth-tabs">
          <button className="auth-tab active">Log In</button>
          <Link to="/register" className="auth-tab">Sign Up</Link>
        </div>

        {error && <div className="auth-error visible">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="auth-divider">SECURE & PRIVATE</div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="auth-right"
      >
        <div className="auth-right-content">
          <h2>Your Attendance, Simplified.</h2>
          <p>Track attendance, overtime, and leaves — all in one beautifully designed planner.</p>
          
          <div className="feature-list">
            {[
              { icon: '📅', text: 'Interactive calendar with day-by-day tracking' },
              { icon: '⏱', text: 'Overtime logging with automatic calculations' },
              { icon: '📊', text: 'Monthly dashboard with real-time stats' },
              { icon: '🔒', text: 'Secure, per-user data stored in the cloud' },
            ].map((f, i) => (
              <div key={i} className="feature-item">
                <div className="feature-icon">{f.icon}</div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        .auth-container {
          display: flex;
          min-height: 100vh;
          background: var(--bg);
        }
        .auth-left {
          width: 420px;
          flex-shrink: 0;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 48px 44px;
          justify-content: center;
        }
        .auth-logo {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
          margin-bottom: 36px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .auth-logo span { color: var(--accent); }
        
        .auth-tabs {
          display: flex;
          background: var(--surface2);
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 28px;
          border: 1px solid var(--border);
        }
        .auth-tab {
          flex: 1;
          padding: 9px;
          text-align: center;
          border-radius: 7px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          color: var(--text2);
          text-decoration: none;
          transition: all 0.2s;
        }
        .auth-tab.active {
          background: var(--surface);
          color: var(--text);
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }
        
        .auth-form { display: flex; flex-direction: column; gap: 14px; }
        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .field-group label { font-size: 13px; font-weight: 600; color: var(--text2); }
        .field-group input {
          padding: 11px 14px;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          font-size: 14px;
          background: var(--surface2);
          outline: none;
          transition: all 0.2s;
        }
        .field-group input:focus { border-color: var(--accent); background: #fff; }
        
        .password-wrap { position: relative; }
        .toggle-pw {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text3);
        }
        
        .btn-primary {
          margin-top: 10px;
          padding: 13px;
          background: var(--accent);
          color: #fff;
          border-radius: var(--radius);
          font-size: 15px;
          font-weight: 600;
        }
        .btn-primary:disabled { opacity: 0.7; }
        
        .auth-divider {
          text-align: center;
          font-size: 12px;
          color: var(--text3);
          margin-top: 24px;
          position: relative;
        }
        .auth-divider::before, .auth-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 30%;
          height: 1px;
          background: var(--border);
        }
        .auth-divider::before { left: 0; }
        .auth-divider::after { right: 0; }
        
        .auth-right {
          flex: 1;
          background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          color: #fff;
        }
        .auth-right-content { max-width: 360px; text-align: center; }
        .auth-right h2 { font-size: 32px; font-weight: 700; margin-bottom: 16px; }
        .auth-right p { opacity: 0.9; line-height: 1.6; margin-bottom: 40px; }
        
        .feature-list { text-align: left; display: flex; flex-direction: column; gap: 16px; }
        .feature-item { display: flex; align-items: center; gap: 12px; }
        .feature-icon {
          width: 40px; height: 40px;
          background: rgba(255,255,255,0.2);
          border-radius: 12px;
          display: grid;
          place-items: center;
          font-size: 20px;
        }

        @media (max-width: 800px) {
          .auth-right { display: none; }
          .auth-left { width: 100%; border: none; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
