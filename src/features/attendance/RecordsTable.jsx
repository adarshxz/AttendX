import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RecordsTable = ({ records, month, year, onSelectDate }) => {
  const [filter, setFilter] = useState('all');

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const filteredRecords = Object.entries(records)
    .filter(([dateStr, r]) => {
      if (!dateStr.startsWith(monthPrefix)) return false;
      if (filter === 'all') return true;
      if (filter === 'present') return r.status === 'present';
      if (filter === 'absent') return r.status === 'absent';
      if (filter === 'holiday') return r.status === 'holiday';
      if (filter === 'overtime') return !!r.otHours;
      if (filter === 'leave') return ['cl', 'pl', 'halfday', 'absent'].includes(r.status);
      return true;
    })
    .sort((a, b) => b[0].localeCompare(a[0]));

  const statusLabels = {
    present: 'Present',
    absent: 'Absent',
    holiday: 'Holiday',
    cl: 'CL',
    pl: 'PL',
    halfday: 'Half Day'
  };

  return (
    <div className="records-container">
      <div className="filter-bar">
        {['all', 'present', 'absent', 'leave', 'holiday', 'overtime'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        <table className="records-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>OT Hours</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filteredRecords.length > 0 ? (
                filteredRecords.map(([dateStr, rec]) => (
                  <motion.tr
                    key={dateStr}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onSelectDate(dateStr)}
                  >
                    <td className="date-cell">
                      {new Date(dateStr).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </td>
                    <td>
                      <span className={`badge ${rec.status}`}>{statusLabels[rec.status] || rec.status}</span>
                    </td>
                    <td className="ot-cell">
                      {rec.otHours ? `⏱ ${rec.otHours}` : '—'}
                    </td>
                    <td className="note-cell">{rec.note || '—'}</td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">
                    <div className="empty-state">
                      <div className="icon">📅</div>
                      <span>No records found for this view.</span>
                    </div>
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .records-container { padding-bottom: 12px; }
        .filter-bar {
          padding: 12px 16px;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--border);
        }
        .filter-btn {
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          border-radius: 20px;
          border: 1.5px solid var(--border);
          color: var(--text2);
          transition: all 0.2s;
        }
        .filter-btn:hover { border-color: var(--accent); color: var(--accent); }
        .filter-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
        
        .table-wrapper { overflow-x: auto; }
        .records-table { width: 100%; border-collapse: collapse; }
        .records-table th {
          padding: 10px 16px;
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text3);
          background: var(--surface2);
          border-bottom: 1px solid var(--border);
        }
        .records-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
        }
        .records-table tbody tr { cursor: pointer; transition: background 0.2s; }
        .records-table tbody tr:hover { background: var(--surface2); }
        
        .date-cell { font-family: 'DM Mono', monospace; font-weight: 500; font-size: 13px; }
        .ot-cell { color: var(--overtime); font-weight: 500; font-family: 'DM Mono', monospace; font-size: 13px; }
        .note-cell { color: var(--text3); font-size: 13px; font-style: italic; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          border: 1px solid transparent;
        }
        .badge.present { background: var(--present-bg); color: var(--present); border-color: var(--present-border); }
        .badge.absent { background: var(--absent-bg); color: var(--absent); border-color: var(--absent-border); }
        .badge.holiday { background: var(--holiday-bg); color: var(--holiday); border-color: var(--holiday-border); }
        .badge.cl { background: var(--cl-bg); color: var(--cl); border-color: var(--cl-border); }
        .badge.pl { background: var(--pl-bg); color: var(--pl); border-color: var(--pl-border); }
        .badge.halfday { background: var(--halfday-bg); color: var(--halfday); border-color: var(--halfday-border); }
        
        .empty-state {
          padding: 40px;
          text-align: center;
          color: var(--text3);
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }
        .empty-state .icon { font-size: 32px; }
      `}</style>
    </div>
  );
};

export default RecordsTable;
