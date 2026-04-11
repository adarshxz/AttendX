// ══════════════════════════════════════════════
// AttendX – script.js (with MongoDB auth)
// ══════════════════════════════════════════════

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

// ── Auth Helpers ──
const TOKEN_KEY = 'attendx_token';
const USER_KEY = 'attendx_user';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  currentUser = user;
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  currentUser = null;
}

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch { return null; }
}

// ── API Call (real fetch to server) ──
async function apiCall(url, method = 'GET', body = null) {
  const token = getToken();
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

// ══════════════════════════════════════════════
// AUTH UI
// ══════════════════════════════════════════════

function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const authError = document.getElementById('auth-error');

  authError.classList.remove('visible');
  authError.textContent = '';

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabSignup.classList.add('active');
  }
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.add('visible');
}

function togglePassword(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.textContent = '🙈';
  } else {
    inp.type = 'password';
    btn.textContent = '👁';
  }
}

function updateStrength(val) {
  const fill = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  let score = 0;
  if (val.length >= 6) score++;
  if (val.length >= 10) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { w: '0%', c: 'var(--border)', t: '' },
    { w: '20%', c: 'var(--absent)', t: 'Weak' },
    { w: '40%', c: 'var(--cl)', t: 'Fair' },
    { w: '60%', c: 'var(--halfday)', t: 'Good' },
    { w: '80%', c: 'var(--present)', t: 'Strong' },
    { w: '100%', c: 'var(--present)', t: 'Very Strong' }
  ];
  const lv = levels[score];
  fill.style.width = lv.w;
  fill.style.background = lv.c;
  label.textContent = lv.t;
  label.style.color = lv.c;
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  btn.disabled = true;
  btn.textContent = 'Logging in…';

  try {
    const data = await apiCall('/api/auth/login', 'POST', { email, password });
    setAuth(data.token, data.user);
    showApp();
  } catch (err) {
    showAuthError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Log In';
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('signup-btn');
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  btn.disabled = true;
  btn.textContent = 'Creating account…';

  try {
    const data = await apiCall('/api/auth/register', 'POST', { name, email, password });
    setAuth(data.token, data.user);
    showApp();
  } catch (err) {
    showAuthError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}

function logout() {
  clearAuth();
  records = {};
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  // Reset forms
  document.getElementById('login-form').reset();
  document.getElementById('signup-form').reset();
  document.getElementById('auth-error').classList.remove('visible');
  switchAuthTab('login');
  closeUserMenu();
  showToast('Logged out');
}

// ── User Menu ──
function toggleUserMenu() {
  document.getElementById('user-menu-dropdown').classList.toggle('open');
}

function closeUserMenu() {
  document.getElementById('user-menu-dropdown').classList.remove('open');
}

// Close menu on click outside
document.addEventListener('click', (e) => {
  const wrap = document.getElementById('user-menu-btn');
  const dropdown = document.getElementById('user-menu-dropdown');
  if (wrap && dropdown && !wrap.contains(e.target) && !dropdown.contains(e.target)) {
    closeUserMenu();
  }
});

// ══════════════════════════════════════════════
// APP FLOW
// ══════════════════════════════════════════════

function showAuthScreen() {
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

async function showApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';

  // Set user info in header
  const user = currentUser || getSavedUser();
  if (user) {
    currentUser = user;
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    document.getElementById('header-avatar').textContent = initial;
    document.getElementById('header-username').textContent = user.name || 'User';
    document.getElementById('menu-user-name').textContent = user.name || '—';
    document.getElementById('menu-user-email').textContent = user.email || '—';
  }

  await startApp();
}

// ── Start App ──
async function startApp() {
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

// ── Init ──
function init() {
  calYear = today.getFullYear();
  calMonth = today.getMonth();

  const token = getToken();
  const user = getSavedUser();

  if (token && user) {
    currentUser = user;
    showApp();
  } else {
    showAuthScreen();
  }
}

// ══════════════════════════════════════════════
// CALENDAR
// ══════════════════════════════════════════════

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
    if (err.message.includes('token') || err.message.includes('Access denied')) {
      showToast('Session expired. Please log in again.');
      logout();
      return;
    }
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
    if (err.message.includes('token') || err.message.includes('Access denied')) {
      showToast('Session expired. Please log in again.');
      logout();
      return;
    }
    showToast('Failed to delete: ' + err.message);
  }
}

// ══════════════════════════════════════════════
// STATS
// ══════════════════════════════════════════════

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

// ══════════════════════════════════════════════
// RECORDS TABLE
// ══════════════════════════════════════════════

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

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ── Boot ──
init();
