import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Calendar = ({ selectedDate, onSelectDate, records, currentMonth, setCurrentMonth }) => {
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const days = [];
    
    // Empty cells for days of previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="cal-day empty" />);
    }
    
    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const record = records[dateStr];
      const isToday = new Date().toISOString().split('T')[0] === dateStr;
      
      days.push(
        <div 
          key={d} 
          className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${record ? 'has-record' : ''} status-${record?.status}`}
          onClick={() => onSelectDate(dateStr)}
        >
          {d}
        </div>
      );
    }
    
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="calendar-container">
      <div className="calendar-nav">
        <button className="nav-btn" onClick={handlePrevMonth}><ChevronLeft size={18} /></button>
        <div className="month-display">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</div>
        <button className="nav-btn" onClick={handleNextMonth}><ChevronRight size={18} /></button>
      </div>

      <div className="calendar-grid">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="day-label">{day}</div>
        ))}
        {renderDays()}
      </div>

      <style jsx>{`
        .calendar-container { padding: 12px; }
        .calendar-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding: 0 8px;
        }
        .month-display { font-weight: 700; font-size: 16px; color: var(--text); }
        .nav-btn {
          width: 32px; height: 32px;
          display: grid;
          place-items: center;
          background: var(--surface2);
          border-radius: 8px;
          color: var(--text2);
          transition: background 0.2s;
        }
        .nav-btn:hover { background: var(--border); }
        
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .day-label {
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: var(--text3);
          text-transform: uppercase;
          padding: 8px 0;
        }
        .cal-day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s;
          position: relative;
        }
        .cal-day:hover:not(.empty):not(.selected) { background: var(--surface2); }
        .cal-day.today { color: var(--accent); font-weight: 800; }
        .cal-day.selected { background: var(--accent); color: #fff; font-weight: 600; }
        
        .cal-day.has-record::after {
          content: '';
          position: absolute;
          bottom: 4px;
          width: 4px; height: 4px;
          border-radius: 50%;
          background: currentColor;
        }
        
        .cal-day.status-present { color: var(--present); }
        .cal-day.status-absent { color: var(--absent); }
        .cal-day.status-holiday { color: var(--holiday); }
        .cal-day.status-cl { color: var(--cl); }
        .cal-day.status-pl { color: var(--pl); }
        .cal-day.status-halfday { color: var(--halfday); }
        
        .cal-day.selected.status-present,
        .cal-day.selected.status-absent,
        .cal-day.selected.status-holiday,
        .cal-day.selected.status-cl,
        .cal-day.selected.status-pl,
        .cal-day.selected.status-halfday { color: #fff; }

        .cal-day.empty { cursor: default; }
      `}</style>
    </div>
  );
};

export default Calendar;
