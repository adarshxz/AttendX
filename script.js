// ── State ──
let selectedDate = null;
let selectedStatus = null;
let otVisible = false;
let currentFilter = 'all';
let calYear, calMonth;
let records = {};
let currentUser = null;

// ── Helpers ──
function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const today = new Date();
const todayStr = fmtDate(today);

async function apiCall(url, method = 'GET', body = null) {
  const token = localStorage.getItem('attendx_token');
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

// ── Tab switching ──
function switchTab(tab) {
  document.getElementById('form-signin').classList.toggle('hidden', tab !== 'signin');
  document.getElementById('form-signup').classList.toggle('hidden', tab !== 'signup');
  document.getElementById('tab-signin').classList.toggle('active', tab === 'signin');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  clearAuthErrors();
}

function clearAuthErrors() {
  ['signin-error','signup-error'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('visible');
    el.textContent = '';
  });
}

function showAuthError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('visible');
}

function togglePw(id, btn) {
  const inp = document.getElementById(id);
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁'; }
}

function checkStrength(pw) {
  const fill = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const pct = (score / 4) * 100;
  const colors = ['#dc2626','#ea580c','#ca8a04','#16a34a'];
  const labels = ['Weak','Fair','Good','Strong'];
  fill.style.width = pct + '%';
  fill.style.background = colors[score - 1] || '#e2e0d8';
  label.textContent = pw.length ? (labels[score - 1] || '') : '';
  label.style.color = colors[score - 1] || 'var(--text3)';
}

// ── Sign Up ──
async function doSignUp() {
  const btn = document.querySelector('#form-signup .btn-primary');
  btn.disabled = true;
  try {
    const name    = document.getElementById('su-name').value.trim();
    const email   = document.getElementById('su-email').value.trim().toLowerCase();
    const password = document.getElementById('su-password').value;
    const confirm = document.getElementById('su-confirm').value;

    if (password !== confirm) return showAuthError('signup-error', 'Passwords do not match.');

    const data = await apiCall('/api/signup', 'POST', { name, email, password });
    localStorage.setItem('attendx_token', data.token);
    startApp(data);
  } catch (err) {
    showAuthError('signup-error', err.message);
  } finally {
    btn.disabled = false;
  }
}

// ── Sign In ──
async function doSignIn() {
  const btn = document.querySelector('#form-signin .btn-primary');
  btn.disabled = true;
  try {
    const email = document.getElementById('si-email').value.trim().toLowerCase();
    const password = document.getElementById('si-password').value;

    const data = await apiCall('/api/signin', 'POST', { email, password });
    localStorage.setItem('attendx_token', data.token);
    startApp(data);
  } catch (err) {
    showAuthError('signin-error', err.message);
  } finally {
    btn.disabled = false;
  }
}

// ── Keyboard enter support ──
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (!document.getElementById('form-signin').classList.contains('hidden')) doSignIn();
  else doSignUp();
});

// ── Start App ──
async function startApp(user) {
  currentUser = user;
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('header-username').textContent = user.name.split(' ')[0];
  document.getElementById('avatar-initials').textContent = user.name[0].toUpperCase();
  document.getElementById('menu-name').textContent = user.name;
  document.getElementById('menu-email').textContent = user.email;

  // Load records from backend
  try {
    records = await apiCall('/api/records');
  } catch (e) {
    showToast('Failed to load records');
    records = {};
  }

  calYear = today.getFullYear();
  calMonth = today.getMonth();
  renderCalendar();
  renderRecords();
  updateStats();
  selectDate(todayStr);
}

async function doSignOut() {
  try { await apiCall('/api/signout', 'POST'); } catch(e) {}
  localStorage.removeItem('attendx_token');
  currentUser = null;
  records = {};
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('user-menu-dropdown').classList.remove('open');
  document.getElementById('si-email').value = '';
  document.getElementById('si-password').value = '';
  clearAuthErrors();
  switchTab('signin');
  showToast('Signed out successfully');
}

function toggleUserMenu() {
  document.getElementById('user-menu-dropdown').classList.toggle('open');
}
document.addEventListener('click', e => {
  if (!e.target.closest('.user-menu-wrap')) {
    document.getElementById('user-menu-dropdown')?.classList.remove('open');
  }
});

// ── Init ──
async function init() {
  const token = localStorage.getItem('attendx_token');
  if (token) {
    try {
      const user = await apiCall('/api/me');
      startApp(user);
      return;
    } catch(e) {
      localStorage.removeItem('attendx_token');
    }
  }
  document.getElementById('auth-screen').style.display = 'flex';
  calYear = today.getFullYear();
  calMonth = today.getMonth();
}

// ── Calendar ──
function changeMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  renderCalendar();
  updateStats();
  renderRecords();
}

function renderCalendar() {
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  document.getElementById('cal-month-label').textContent = months[calMonth] + ' ' + calYear;

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const container = document.getElementById('cal-days');
  container.innerHTML = '';

  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    container.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const el = document.createElement('div');
    el.className = 'cal-day';
    el.textContent = d;

    if (dateStr === todayStr) el.classList.add('today');
    if (dateStr === selectedDate) el.classList.add('selected');
    if (records[dateStr]) {
      el.classList.add('has-entry', 'status-' + records[dateStr].status);
    }

    el.onclick = () => selectDate(dateStr);
    container.appendChild(el);
  }
}

function selectDate(dateStr) {
  selectedDate = dateStr;
  selectedStatus = null;
  otVisible = false;

  // update calendar highlight
  document.querySelectorAll('.cal-day').forEach(el => el.classList.remove('selected'));
  renderCalendar();

  // display
  const d = new Date(dateStr + 'T00:00:00');
  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  document.getElementById('selected-date-display').textContent = d.toLocaleDateString(undefined, opts);
  document.getElementById('form-hint').textContent = '';

  // reset buttons
  document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));

  // load existing
  const rec = records[dateStr];
  if (rec) {
    selectedStatus = rec.status;
    document.querySelector('.status-btn.' + rec.status)?.classList.add('active');
    document.getElementById('note-input').value = rec.note || '';
    document.getElementById('btn-delete').style.display = 'block';

    // OT
    document.getElementById('ot-start').value = rec.otStart || '';
    document.getElementById('ot-end').value = rec.otEnd || '';
    document.getElementById('ot-total').textContent = rec.otHours ? `Total: ${rec.otHours}` : '';

    if (rec.otStart || rec.otEnd) {
      otVisible = true;
      document.getElementById('ot-section').classList.add('visible');
      document.getElementById('ot-toggle-btn').textContent = '− Remove Overtime';
    } else {
      document.getElementById('ot-section').classList.remove('visible');
    }

    showOTToggle(rec.status);
  } else {
    document.getElementById('note-input').value = '';
    document.getElementById('btn-delete').style.display = 'none';
    document.getElementById('ot-start').value = '';
    document.getElementById('ot-end').value = '';
    document.getElementById('ot-total').textContent = '';
    document.getElementById('ot-section').classList.remove('visible');
    document.getElementById('ot-toggle-btn').style.display = 'none';
  }
}

function showOTToggle(status) {
  const btn = document.getElementById('ot-toggle-btn');
  if (status === 'present' || status === 'halfday') {
    btn.style.display = 'block';
    btn.textContent = otVisible ? '− Remove Overtime' : '+ Add Overtime';
  } else {
    btn.style.display = 'none';
  }
}

function selectStatus(status) {
  selectedStatus = status;
  document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.status-btn.' + status)?.classList.add('active');

  // Only show OT toggle for present/halfday
  otVisible = false;
  document.getElementById('ot-section').classList.remove('visible');
  showOTToggle(status);
}

function toggleOT() {
  otVisible = !otVisible;
  const sec = document.getElementById('ot-section');
  const btn = document.getElementById('ot-toggle-btn');
  if (otVisible) {
    sec.classList.add('visible');
    btn.textContent = '− Remove Overtime';
  } else {
    sec.classList.remove('visible');
    btn.textContent = '+ Add Overtime';
    document.getElementById('ot-start').value = '';
    document.getElementById('ot-end').value = '';
    document.getElementById('ot-total').textContent = '';
  }
}

function calcOT() {
  const s = document.getElementById('ot-start').value;
  const e = document.getElementById('ot-end').value;
  if (!s || !e) { document.getElementById('ot-total').textContent = ''; return; }
  const [sh,sm] = s.split(':').map(Number);
  const [eh,em] = e.split(':').map(Number);
  let mins = (eh*60+em) - (sh*60+sm);
  if (mins < 0) mins += 24*60;
  const h = Math.floor(mins/60), m = mins%60;
  document.getElementById('ot-total').textContent = `Total: ${h}h ${m}m`;
}

function getOTHours() {
  const s = document.getElementById('ot-start').value;
  const e = document.getElementById('ot-end').value;
  if (!s || !e || !otVisible) return null;
  const [sh,sm] = s.split(':').map(Number);
  const [eh,em] = e.split(':').map(Number);
  let mins = (eh*60+em) - (sh*60+sm);
  if (mins < 0) mins += 24*60;
  const h = Math.floor(mins/60), m = mins%60;
  return `${h}h ${m}m`;
}

async function saveEntry() {
  if (!selectedDate) { showToast('Please select a date'); return; }
  if (!selectedStatus) { showToast('Please select a status'); return; }

  const otHours = getOTHours();
  const otStart = otVisible ? document.getElementById('ot-start').value : '';
  const otEnd   = otVisible ? document.getElementById('ot-end').value : '';
  const note = document.getElementById('note-input').value.trim();

  try {
    await apiCall('/api/records', 'POST', {
      date: selectedDate,
      status: selectedStatus,
      otStart,
      otEnd,
      otHours: otHours || '',
      note
    });

    records[selectedDate] = {
      status: selectedStatus,
      otStart, otEnd,
      otHours: otHours || '',
      note
    };

    renderCalendar();
    renderRecords();
    updateStats();
    document.getElementById('btn-delete').style.display = 'block';
    showToast('Saved ✓');
  } catch (err) {
    showToast('Failed to save: ' + err.message);
  }
}

async function deleteEntry() {
  if (!selectedDate || !records[selectedDate]) return;
  try {
    await apiCall(`/api/records/${selectedDate}`, 'DELETE');
    delete records[selectedDate];
    renderCalendar();
    renderRecords();
    updateStats();
    selectDate(selectedDate);
    showToast('Entry deleted');
  } catch (err) {
    showToast('Failed to delete: ' + err.message);
  }
}

// ── Stats ──
function updateStats() {
  let present=0, leave=0, holiday=0, otMins=0;
  
  // Filter for the current calYear and calMonth
  const yearPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;

  Object.entries(records).forEach(([dateStr, r]) => {
    if (!dateStr.startsWith(yearPrefix)) return;

    if (r.status === 'present' || r.status === 'halfday') present++;
    if (['absent','cl','pl'].includes(r.status)) leave++;
    if (r.status === 'holiday') holiday++;
    if (r.otHours) {
      const m = r.otHours.match(/(\d+)h (\d+)m/);
      if (m) otMins += parseInt(m[1])*60 + parseInt(m[2]);
    }
  });
  document.getElementById('stat-present').textContent = present;
  document.getElementById('stat-leave').textContent = leave;
  document.getElementById('stat-holiday').textContent = holiday;
  const h = Math.floor(otMins/60), m = otMins%60;
  document.getElementById('stat-ot').textContent = otMins > 0 ? `${h}h${m>0?m+'m':''}` : '0h';
}

// ── Records ──
function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderRecords();
}

const statusLabel = {
  present:'Present', absent:'Absent', holiday:'Holiday',
  cl:'CL', pl:'PL', halfday:'Half Day', overtime:'Overtime'
};

function renderRecords() {
  const body = document.getElementById('records-body');
  const empty = document.getElementById('empty-state');
  const tableTitle = document.getElementById('records-table-title');
  body.innerHTML = '';

  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  if (tableTitle) tableTitle.textContent = `RECORDS FOR ${months[calMonth].toUpperCase()} ${calYear}`;

  const yearMonthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  
  const sorted = Object.entries(records)
    .filter(([dateStr]) => dateStr.startsWith(yearMonthPrefix))
    .sort((a,b) => b[0].localeCompare(a[0]));

  const filtered = sorted.filter(([,r]) => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'present') return r.status === 'present';
    if (currentFilter === 'absent') return r.status === 'absent';
    if (currentFilter === 'holiday') return r.status === 'holiday';
    if (currentFilter === 'overtime') return !!r.otHours;
    if (currentFilter === 'leave') return ['cl','pl','halfday','absent'].includes(r.status);
    return true;
  });

  document.getElementById('record-count').textContent = `${filtered.length} record${filtered.length!==1?'s':''}`;

  if (filtered.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  filtered.forEach(([dateStr, rec]) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dateFormatted = d.toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' });
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:'DM Mono',monospace;font-size:13px">${dateFormatted}${dateStr===todayStr?' <span style="color:var(--accent);font-size:11px;font-family:DM Sans">Today</span>':''}</td>
      <td><span class="badge ${rec.status}">${statusLabel[rec.status]||rec.status}</span></td>
      <td>${rec.otHours ? `<span class="ot-hours">⏱ ${rec.otHours}</span>` : '<span style="color:var(--text3)">—</span>'}</td>
      <td style="color:var(--text2);font-size:13px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${rec.note || '—'}</td>
    `;
    tr.onclick = () => {
      // jump to month and select
      const dd = new Date(dateStr + 'T00:00:00');
      calYear = dd.getFullYear(); calMonth = dd.getMonth();
      renderCalendar();
      selectDate(dateStr);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    body.appendChild(tr);
  });
}

// ── Helpers ──
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

init();
