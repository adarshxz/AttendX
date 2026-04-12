import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { LogOut, User, Calendar as CalIcon, Settings, Plus, LayoutDashboard, History } from 'lucide-react';
import Calendar from './Calendar';
import AttendanceForm from './AttendanceForm';
import StatsGrid from './StatsGrid';
import RecordsTable from './RecordsTable';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchRecords = async () => {
    try {
      const { data } = await api.get('/records');
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSaveEntry = async (entry) => {
    try {
      await api.post('/records', entry);
      setRecords(prev => ({ ...prev, [entry.date]: entry }));
    } catch (err) {
      alert('Failed to save entry');
    }
  };

  const handleDeleteEntry = async (date) => {
    try {
      await api.delete(`/records/${date}`);
      setRecords(prev => {
        const next = { ...prev };
        delete next[date];
        return next;
      });
    } catch (err) {
      alert('Failed to delete entry');
    }
  };

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">Attend<span>X</span></div>
          
          <div className="user-section">
            <button 
              className="user-menu-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="avatar">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="username">{user?.name}</span>
            </button>
            
            <AnimatePresence>
              {showUserMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="user-dropdown"
                >
                  <div className="dropdown-info">
                    <strong>{user?.name}</strong>
                    <span>{user?.email}</span>
                  </div>
                  <button className="dropdown-item danger" onClick={logout}>
                    <LogOut size={16} /> Log Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-grid">
          {/* Left: Planning Section */}
          <div className="planning-col">
            <div className="card">
              <div className="card-header">
                <CalIcon size={16} /> <span>Planner</span>
              </div>
              <Calendar 
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                records={records}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
              />
            </div>

            <div className="card">
              <div className="card-header">
                <Plus size={16} /> <span>Mark Attendance</span>
              </div>
              <AttendanceForm 
                selectedDate={selectedDate}
                record={records[selectedDate]}
                onSave={handleSaveEntry}
                onDelete={handleDeleteEntry}
              />
            </div>
          </div>

          {/* Right: Insights Section */}
          <div className="insights-col">
            <div className="card">
              <div className="card-header border-none">
                <LayoutDashboard size={16} /> <span>Monthly Stats</span>
              </div>
              <StatsGrid 
                records={records} 
                month={currentMonth.getMonth()} 
                year={currentMonth.getFullYear()} 
              />
            </div>

            <div className="card">
              <div className="card-header">
                <History size={16} /> <span>Activity History</span>
              </div>
              <RecordsTable 
                records={records}
                month={currentMonth.getMonth()} 
                year={currentMonth.getFullYear()}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  // Scroll to form?
                }}
              />
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .dashboard-layout {
          min-height: 100vh;
          background: var(--bg);
        }
        .dashboard-header {
          height: 64px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
        }
        .logo { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
        .logo span { color: var(--accent); }
        
        .user-section { position: relative; }
        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px;
          border-radius: 12px;
          transition: background 0.2s;
        }
        .user-menu-trigger:hover { background: var(--surface2); }
        .avatar {
          width: 32px; height: 32px;
          background: var(--accent);
          color: #fff;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-weight: 600;
          font-size: 14px;
        }
        .username { font-size: 14px; font-weight: 500; color: var(--text); }
        
        .user-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: var(--shadow-md);
          min-width: 200px;
          overflow: hidden;
        }
        .dropdown-info {
          padding: 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .dropdown-info strong { font-size: 14px; }
        .dropdown-info span { font-size: 12px; color: var(--text3); }
        .dropdown-item {
          width: 100%;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text2);
          transition: background 0.2s;
        }
        .dropdown-item:hover { background: var(--surface2); }
        .dropdown-item.danger { color: var(--absent); }
        .dropdown-item.danger:hover { background: var(--absent-bg); }
        
        .dashboard-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 24px;
          align-items: start;
        }
        .planning-col, .insights-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .card-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--surface2);
          color: var(--text2);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .card-header.border-none { border-bottom: none; }

        @media (max-width: 1000px) {
          .dashboard-grid { grid-template-columns: 1fr; }
          .dashboard-main { padding: 16px; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
