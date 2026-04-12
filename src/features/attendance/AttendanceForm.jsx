import React, { useState, useEffect } from 'react';
import { Check, X, Plane, FileText, Briefcase, Moon, Clock, Plus, Trash2 } from 'lucide-react';

const AttendanceForm = ({ selectedDate, record, onSave, onDelete }) => {
  const [status, setStatus] = useState(record?.status || '');
  const [otStart, setOtStart] = useState(record?.otStart || '');
  const [otEnd, setOtEnd] = useState(record?.otEnd || '');
  const [note, setNote] = useState(record?.note || '');
  const [otVisible, setOtVisible] = useState(!!record?.otStart);

  useEffect(() => {
    setStatus(record?.status || '');
    setOtStart(record?.otStart || '');
    setOtEnd(record?.otEnd || '');
    setNote(record?.note || '');
    setOtVisible(!!record?.otStart);
  }, [record, selectedDate]);

  const calcOT = () => {
    if (!otStart || !otEnd) return null;
    const [sh, sm] = otStart.split(':').map(Number);
    const [eh, em] = otEnd.split(':').map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const handleSave = () => {
    if (!status) return alert('Select a status');
    onSave({
      date: selectedDate,
      status,
      otStart: otVisible ? otStart : '',
      otEnd: otVisible ? otEnd : '',
      otHours: otVisible ? calcOT() : '',
      note
    });
  };

  const statusOptions = [
    { id: 'present', label: 'Present', icon: <Check size={14} />, color: 'var(--present)' },
    { id: 'absent', label: 'Absent', icon: <X size={14} />, color: 'var(--absent)' },
    { id: 'holiday', label: 'Holiday', icon: <Plane size={14} />, color: 'var(--holiday)' },
    { id: 'cl', label: 'CL', icon: <FileText size={14} />, color: 'var(--cl)' },
    { id: 'pl', label: 'PL', icon: <Briefcase size={14} />, color: 'var(--pl)' },
    { id: 'halfday', label: 'Half Day', icon: <Moon size={14} />, color: 'var(--halfday)' },
  ];

  const otHoursDisplay = calcOT();

  return (
    <div className="attendance-form">
      <div className="selected-date">
        {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>

      <div className="status-grid">
        {statusOptions.map(opt => (
          <button
            key={opt.id}
            className={`status-btn ${opt.id} ${status === opt.id ? 'active' : ''}`}
            onClick={() => setStatus(opt.id)}
            style={{ '--opt-color': opt.color }}
          >
            {opt.icon} <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {(status === 'present' || status === 'halfday' || otVisible) && (
        <div className="ot-wrapper">
          {!otVisible ? (
            <button className="add-ot-btn" onClick={() => setOtVisible(true)}>
              <Plus size={14} /> Add Overtime
            </button>
          ) : (
            <div className="ot-section fade-in">
              <div className="ot-header">
                <Clock size={14} /> <span>Overtime</span>
                <button className="remove-ot" onClick={() => setOtVisible(false)}><X size={14} /></button>
              </div>
              <div className="ot-inputs">
                <input type="time" value={otStart} onChange={e => setOtStart(e.target.value)} />
                <span>→</span>
                <input type="time" value={otEnd} onChange={e => setOtEnd(e.target.value)} />
              </div>
              {otHoursDisplay && <div className="ot-total">Total: {otHoursDisplay}</div>}
            </div>
          )}
        </div>
      )}

      <textarea 
        className="note-input"
        placeholder="Add a note (optional)..."
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={2}
      />

      <div className="form-actions">
        <button className="save-btn" onClick={handleSave}>Save Entry</button>
        {record && (
          <button className="delete-btn" onClick={() => onDelete(selectedDate)}>
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <style jsx>{`
        .attendance-form { padding: 20px; }
        .selected-date {
          font-size: 13px;
          font-weight: 500;
          color: var(--text2);
          background: var(--surface2);
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-family: 'DM Mono', monospace;
        }
        
        .status-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 20px;
        }
        .status-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 10px;
          border-radius: 12px;
          border: 1.5px solid var(--border);
          font-size: 13px;
          font-weight: 600;
          color: var(--text2);
          background: var(--surface);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .status-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          border-color: var(--opt-color);
          color: var(--opt-color);
          background: color-mix(in srgb, var(--opt-color), transparent 95%);
        }

        /* Themed buttons based on classes */
        .status-btn.present { border-color: var(--present-border); background: var(--present-bg); color: var(--present); }
        .status-btn.absent { border-color: var(--absent-border); background: var(--absent-bg); color: var(--absent); }
        .status-btn.holiday { border-color: var(--holiday-border); background: var(--holiday-bg); color: var(--holiday); }
        .status-btn.cl { border-color: var(--cl-border); background: var(--cl-bg); color: var(--cl); }
        .status-btn.pl { border-color: var(--pl-border); background: var(--pl-bg); color: var(--pl); }
        .status-btn.halfday { border-color: var(--halfday-border); background: var(--halfday-bg); color: var(--halfday); }
        
        .status-btn.active {
          border-color: var(--opt-color) !important;
          background: var(--opt-color) !important;
          color: #fff !important;
          transform: translateY(0);
          box-shadow: 0 4px 12px color-mix(in srgb, var(--opt-color), transparent 70%);
        }
        
        .status-btn.active :global(svg) { stroke: #fff; }
        
        .ot-wrapper { margin-bottom: 20px; }
        .add-ot-btn {
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          border: 1.5px dashed var(--overtime-border);
          color: var(--overtime);
          background: var(--overtime-bg);
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        
        .ot-section {
          background: var(--overtime-bg);
          border: 1.5px solid var(--overtime-border);
          border-radius: 10px;
          padding: 12px;
        }
        .ot-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--overtime);
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .remove-ot { margin-left: auto; color: var(--text3); }
        .ot-inputs { display: flex; align-items: center; gap: 8px; }
        .ot-inputs input {
          flex: 1;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid var(--overtime-border);
          font-size: 14px;
        }
        .ot-total {
          margin-top: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--overtime);
          text-align: right;
          font-family: 'DM Mono', monospace;
        }
        
        .note-input {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: 1.5px solid var(--border);
          background: var(--surface2);
          margin-bottom: 20px;
          outline: none;
          transition: border-color 0.2s;
        }
        .note-input:focus { border-color: var(--accent); background: #fff; }
        
        .form-actions { display: flex; gap: 8px; }
        .save-btn {
          flex: 1;
          padding: 12px;
          background: var(--accent);
          color: #fff;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
        }
        .delete-btn {
          width: 44px;
          display: grid;
          place-items: center;
          background: var(--absent-bg);
          color: var(--absent);
          border: 1.5px solid var(--absent-border);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default AttendanceForm;
