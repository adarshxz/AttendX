import React from 'react';
import { motion } from 'framer-motion';

const StatsGrid = ({ records, month, year }) => {
  const calculateStats = () => {
    let present = 0;
    let leaves = 0;
    let holidays = 0;
    let otMins = 0;

    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    Object.entries(records).forEach(([dateStr, r]) => {
      if (!dateStr.startsWith(monthPrefix)) return;

      if (r.status === 'present' || r.status === 'halfday') present++;
      if (['absent', 'cl', 'pl'].includes(r.status)) leaves++;
      if (r.status === 'holiday') holidays++;
      
      if (r.otHours) {
        const m = r.otHours.match(/(\d+)h (\d+)m/);
        if (m) {
          otMins += parseInt(m[1]) * 60 + parseInt(m[2]);
        }
      }
    });

    const h = Math.floor(otMins / 60);
    const m = otMins % 60;
    const otDisplay = otMins > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}` : '0h';

    return { present, leaves, holidays, otDisplay };
  };

  const stats = calculateStats();

  const cards = [
    { label: 'Present', value: stats.present, color: 'var(--present)', bg: 's-present' },
    { label: 'Leaves', value: stats.leaves, color: 'var(--cl)', bg: 's-leave' },
    { label: 'Holidays', value: stats.holidays, color: 'var(--holiday)', bg: 's-holiday' },
    { label: 'OT Hours', value: stats.otDisplay, color: 'var(--overtime)', bg: 's-ot' },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card, idx) => (
        <motion.div 
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={`stat-card ${card.bg}`}
        >
          <div className="stat-num">{card.value}</div>
          <div className="stat-label">{card.label}</div>
        </motion.div>
      ))}

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 16px;
          padding-top: 0;
        }
        .stat-card {
          background: var(--surface2);
          padding: 16px 12px;
          border-radius: 12px;
          text-align: center;
          border: 1px solid var(--border);
        }
        .stat-num {
          font-size: 24px;
          font-weight: 700;
          font-family: 'DM Mono', monospace;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .s-present .stat-num { color: var(--present); }
        .s-leave .stat-num { color: var(--cl); }
        .s-holiday .stat-num { color: var(--holiday); }
        .s-ot .stat-num { color: var(--overtime); }

        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
};

export default StatsGrid;
