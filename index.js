require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve a simple HTML UI for managing keys
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>License Manager | Multi-System Dashboard</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --primary: #8330ff;
          --secondary: #21d4fd;
          --bg-dark: #0f111a;
          --card-bg: rgba(255, 255, 255, 0.05);
          --glass-border: rgba(255, 255, 255, 0.1);
          --text-main: #e0e0e0;
          --text-muted: #8b949e;
          --danger: #ff4d4d;
          --success: #28a745;
          --warning: #ffaa00;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background-color: var(--bg-dark); color: var(--text-main); line-height: 1.6; overflow-x: hidden; }

        .app-container { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; }

        /* Sidebar */
        aside {
          background: rgba(15, 17, 26, 0.8);
          border-right: 1px solid var(--glass-border);
          backdrop-filter: blur(10px);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .logo { font-size: 1.5rem; font-weight: 700; background: linear-gradient(45deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 2rem; }
        
        .nav-section h4 { color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; margin-bottom: 1rem; }
        .nav-item { display: flex; align-items: center; padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer; transition: 0.3s; margin-bottom: 0.5rem; color: var(--text-muted); }
        .nav-item:hover, .nav-item.active { background: var(--card-bg); color: #fff; }
        .nav-item.active { border-left: 3px solid var(--primary); }

        /* Main Content */
        main { padding: 2rem; background: radial-gradient(circle at top right, rgba(131, 48, 255, 0.05), transparent 40%); width: 100%; overflow-y: auto; }

        header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; flex-wrap: wrap; gap: 1rem; }
        .btn-primary { 
          background: linear-gradient(135deg, var(--primary), #b000ff); 
          color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; 
          font-weight: 600; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 15px rgba(131, 48, 255, 0.3);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(131, 48, 255, 0.4); }

        /* Stats Grid */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
        .stat-card { 
          background: var(--card-bg); 
          padding: 1.5rem; 
          border-radius: 12px; 
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(5px);
        }
        .stat-card h3 { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem; }
        .stat-card p { font-size: 1.8rem; font-weight: 700; }

        /* Table Container */
        .table-container { 
          background: var(--card-bg); 
          border-radius: 16px; 
          border: 1px solid var(--glass-border); 
          overflow-x: auto;
          backdrop-filter: blur(5px);
        }
        table { width: 100%; border-collapse: collapse; min-width: 800px; }
        th { background: rgba(255,255,255,0.03); padding: 1.2rem; text-align: left; font-size: 0.85rem; color: var(--text-muted); border-bottom: 1px solid var(--glass-border); }
        td { padding: 1.2rem; border-bottom: 1px solid var(--glass-border); font-size: 0.9rem; }
        tr:hover td { background: rgba(255,255,255,0.02); }

        /* Badges */
        .badge { padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
        .badge-active { background: rgba(40, 167, 69, 0.1); color: #40c463; }
        .badge-expired { background: rgba(255, 77, 77, 0.1); color: #ff6e6e; }
        .badge-revoked { background: rgba(255, 255, 255, 0.1); color: var(--text-muted); }
        .badge-system { background: rgba(131, 48, 255, 0.1); color: #b785ff; }

        /* Modals */
        .modal { 
          display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
          background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 1000; 
          align-items: center; justify-content: center;
        }
        .modal-content { 
          background: #1c1e29; border: 1px solid var(--glass-border); 
          width: 90%; max-width: 500px; padding: 2.5rem; border-radius: 20px; 
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .modal h2 { margin-bottom: 1.5rem; font-size: 1.4rem; }
        
        /* Forms */
        .form-group { margin-bottom: 1.2rem; }
        label { display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem; }
        input, select, textarea { 
          width: 100%; padding: 0.8rem; background: rgba(255,255,255,0.05); 
          border: 1px solid var(--glass-border); border-radius: 8px; color: white; outline: none; transition: 0.3s;
        }
        input:focus, select:focus { border-color: var(--primary); background: rgba(255,255,255,0.08); }

        .btn-group { display: flex; gap: 1rem; margin-top: 1.5rem; }
        .btn-secondary { background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--glass-border); padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; flex: 1; }
        .btn-secondary:hover { background: rgba(255,255,255,0.1); }
        .btn-action { padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; font-size: 0.8rem; transition: 0.2s; }
        .btn-revoke { background: rgba(255, 77, 77, 0.15); color: #ff6e6e; }
        .btn-activate { background: rgba(40, 167, 69, 0.15); color: #40c463; }
        .btn-history { background: rgba(33, 212, 253, 0.15); color: #21d4fd; }

        code { background: rgba(0,0,0,0.3); padding: 0.2rem 0.5rem; border-radius: 4px; font-family: monospace; color: var(--secondary); }

        .search-container { position: relative; flex: 1; max-width: 400px; margin-right: 2rem; }
        .search-input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.8rem; background: var(--card-bg); border: 1px solid var(--glass-border); border-radius: 12px; color: white; font-size: 0.9rem; outline: none; transition: 0.3s; }
        .search-input:focus { border-color: var(--secondary); box-shadow: 0 0 15px rgba(131, 48, 255, 0.2); }
        .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .btn-delete { background: rgba(255, 71, 87, 0.15); color: #ff4757; }
        .btn-delete:hover { background: #ff4757; color: white; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: var(--bg-dark); }
        ::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

        /* Auth Overlay */
        #auth-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: var(--bg-dark); z-index: 2000;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(20px);
        }
        .auth-card {
          background: #1c1e29; padding: 3rem; border-radius: 24px;
          border: 1px solid var(--glass-border); width: 100%; max-width: 400px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        }
      </style>
    </head>
    <body class="is-loading">
      <!-- Login Overlay -->
      <div id="auth-overlay">
        <div class="auth-card">
          <div class="logo" style="text-align:center; font-size: 2rem; margin-bottom: 2rem;">LicenseCore</div>
          <h2 style="margin-bottom: 1.5rem; font-weight: 600; text-align: center;">Administrator Login</h2>
          <form onsubmit="handleLogin(event)">
            <div class="form-group">
              <label>Username</label>
              <input type="text" id="login-username" placeholder="admin" required>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="login-password" placeholder="••••••••" required>
            </div>
            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem;">Sign In</button>
            <p id="login-error" style="color: var(--danger); font-size: 0.85rem; margin-top: 1rem; text-align: center; display: none;"></p>
          </form>
        </div>
      </div>

      <div class="app-container" id="main-app" style="display: none;">
        <aside>
          <div class="logo">LicenseCore</div>
          
          <nav class="nav-section">
            <h4>Main Menu</h4>
            <div class="nav-item active" onclick="setFilter('All')">Dashboard</div>
            <div class="nav-item">Analytics</div>
            <div class="nav-item">Settings</div>
          </nav>

          <nav class="nav-section">
            <h4>Filter By System</h4>
            <div id="sidebar-systems">
              <!-- Dynamically populated -->
            </div>
          </nav>

          <nav class="nav-section" style="margin-top: auto;">
            <div class="nav-item" onclick="logout()" style="color: var(--danger);">
              <span style="margin-right: 0.5rem;">Logout</span>
              <small id="user-display" style="color: var(--text-muted);"></small>
            </div>
          </nav>
        </aside>

        <main>
          <header>
            <div class="search-container">
              <span class="search-icon">🔍</span>
              <input type="text" class="search-input" id="search-query" placeholder="Search by client, key, or system..." oninput="renderDashboard()">
            </div>
            <div class="header-actions" style="display: flex; align-items: center; gap: 1.5rem;">
              <div class="view-info">
                <h1 id="view-title" style="font-size: 1.2rem;">All Licenses</h1>
              </div>
              <button class="btn-primary" onclick="openModal('create-modal')">+ Issue License</button>
            </div>
          </header>

          <div class="stats-grid">
            <div class="stat-card">
              <h3>Total Licenses</h3>
              <p id="total-count">0</p>
            </div>
            <div class="stat-card">
              <h3>Active</h3>
              <p id="active-count" style="color: var(--success);">0</p>
            </div>
            <div class="stat-card">
              <h3>Expiring Soon</h3>
              <p id="expiring-count" style="color: var(--warning);">0</p>
            </div>
            <div class="stat-card">
              <h3>Revenue (Total)</h3>
              <p id="revenue-total">$0</p>
            </div>
          </div>

          <div class="table-container">
            <table id="keys-table">
              <thead>
                <tr>
                  <th>System / Client</th>
                  <th>License Key</th>
                  <th>Status</th>
                  <th>Payment Term</th>
                  <th>Next Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <!-- Data injected by JS -->
              </tbody>
            </table>
          </div>
        </main>
      </div>

      <!-- Create Modal -->
      <div id="create-modal" class="modal">
        <div class="modal-content">
          <h2>Issue New License</h2>
          <form id="create-form" onsubmit="createKey(event)">
            <div class="form-group">
              <label>Software System (e.g. LMS, SMS, ERP)</label>
              <input type="text" id="system_name_create" list="existing-systems" placeholder="Enter system name..." required>
              <datalist id="existing-systems">
                <!-- Dynamically populated -->
              </datalist>
            </div>
            <div class="form-group">
              <label>Client Name</label>
              <input type="text" id="client_name_create" placeholder="ABC Corporation" required>
            </div>
            <div style="display: flex; gap: 1rem;">
              <div class="form-group" style="flex: 1;">
                <label>Payment Terms</label>
                <select id="payment_terms_create">
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="One-time">One-time</option>
                </select>
              </div>
              <div class="form-group" style="flex: 1;">
                <label>Periodic Fee</label>
                <input type="text" id="payment_fee_create" placeholder="$500">
              </div>
            </div>
            <div style="display: flex; gap: 1rem;">
              <div class="form-group" style="flex: 1;">
                <label>Start Date</label>
                <input type="date" id="start_date_create" required>
              </div>
              <div class="form-group" style="flex: 1;">
                <label>Next Expiry/Renewal</label>
                <input type="date" id="payment_date_create" required>
              </div>
            </div>
            <div class="form-group">
              <label>Description / Notes</label>
              <textarea id="description_create" rows="2" placeholder="Internal notes..."></textarea>
            </div>
            <div class="btn-group">
              <button type="button" class="btn-secondary" onclick="closeModal('create-modal')">Cancel</button>
              <button type="submit" class="btn-primary" style="flex: 1;">Generate License</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Renew Modal -->
      <div id="renew-modal" class="modal">
        <div class="modal-content">
          <h2>Renew License</h2>
          <p id="renew-client" style="color: var(--text-muted); margin-bottom: 1.5rem;"></p>
          <form id="renew-form" onsubmit="submitRenewal(event)">
            <div class="form-group">
              <label>New Expiry/Next Payment Date</label>
              <input type="date" id="renew-date" required>
            </div>
            <div class="form-group">
              <label>Amount Paid</label>
              <input type="text" id="renew-amount" placeholder="$">
            </div>
            <div class="btn-group">
              <button type="button" class="btn-secondary" onclick="closeModal('renew-modal')">Cancel</button>
              <button type="submit" class="btn-primary" style="flex: 1;">Confirm Renewal</button>
            </div>
          </form>
        </div>
      </div>

      <!-- History Modal -->
      <div id="history-modal" class="modal">
        <div class="modal-content" style="max-width: 600px;">
          <h2>Payment History</h2>
          <div style="max-height: 300px; overflow-y: auto; margin-bottom: 1.5rem;">
            <table id="history-table">
              <thead><tr><th>Date</th><th>Amount</th><th>Extended To</th></tr></thead>
              <tbody id="history-tbody"></tbody>
            </table>
          </div>
          <button type="button" class="btn-secondary" style="width: 100%;" onclick="closeModal('history-modal')">Close</button>
        </div>
      </div>

      <script>
        let currentFilter = 'All';
        let allLicenses = [];

        async function apiFetch(url, options = {}) {
          const token = localStorage.getItem('auth_token');
          const headers = {
            'Content-Type': 'application/json',
            ...options.headers
          };
          if (token) headers['Authorization'] = \`Bearer \${token}\`;

          const res = await fetch(url, { ...options, headers });
          if (res.status === 401 || res.status === 403) {
            logout();
            throw new Error('Unauthorized');
          }
          return res;
        }

        async function handleLogin(e) {
          e.preventDefault();
          const username = document.getElementById('login-username').value;
          const password = document.getElementById('login-password').value;
          const errorEl = document.getElementById('login-error');

          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok) {
              localStorage.setItem('auth_token', data.token);
              localStorage.setItem('auth_user', data.username);
              checkAuth();
            } else {
              errorEl.innerText = data.error || 'Login failed';
              errorEl.style.display = 'block';
            }
          } catch (err) {
            errorEl.innerText = 'Connection error';
            errorEl.style.display = 'block';
          }
        }

        function logout() {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          location.reload();
        }

        function checkAuth() {
          const token = localStorage.getItem('auth_token');
          if (token) {
            document.getElementById('auth-overlay').style.display = 'none';
            document.getElementById('main-app').style.display = 'grid';
            document.getElementById('user-display').innerText = '@' + localStorage.getItem('auth_user');
            loadData();
          } else {
            document.getElementById('auth-overlay').style.display = 'flex';
            document.getElementById('main-app').style.display = 'none';
          }
        }

        async function loadData() {
          try {
            const res = await apiFetch('/api/licenses');
            allLicenses = await res.json();
            await loadSystems();
            renderDashboard();
          } catch (e) {
            console.error('Error loading data:', e);
          }
        }

        async function loadSystems() {
          try {
            const res = await apiFetch('/api/systems');
            const systems = await res.json();
            
            // Update Sidebar
            const sidebar = document.getElementById('sidebar-systems');
            sidebar.innerHTML = '';
            systems.forEach(sys => {
              const activeClass = (currentFilter === sys) ? 'active' : '';
              sidebar.innerHTML += '<div class="nav-item ' + activeClass + '" onclick="setFilter(' + "'" + sys + "'" + ')">' + sys + ' Manager</div>';
            });

            // Update Modal Datalist
            const datalist = document.getElementById('existing-systems');
            let options = '';
            systems.forEach(sys => {
              options += '<option value="' + sys + '">';
            });
            datalist.innerHTML = options;
          } catch (e) {
            console.error('Error loading systems:', e);
          }
        }


        function setFilter(filter) {
          currentFilter = filter;
          document.getElementById('view-title').innerText = filter === 'All' ? 'All Licenses' : filter + ' Licenses';
          
          document.querySelectorAll('.nav-item').forEach(item => {
            if(item.innerText.includes(filter) || (filter === 'All' && item.innerText === 'Dashboard')) {
              item.classList.add('active');
            } else {
              item.classList.remove('active');
            }
          });

          renderDashboard();
        }

        function renderDashboard() {
          const tbody = document.querySelector('#keys-table tbody');
          const searchEl = document.getElementById('search-query');
          const searchQuery = searchEl ? searchEl.value.toLowerCase() : '';
          
          let filtered = currentFilter === 'All' 
            ? allLicenses 
            : allLicenses.filter(l => l.system_name === currentFilter);
          
          if (searchQuery) {
            filtered = filtered.filter(l => 
              (l.client_name || '').toLowerCase().includes(searchQuery) ||
              (l.key || '').toLowerCase().includes(searchQuery) ||
              (l.system_name || '').toLowerCase().includes(searchQuery)
            );
          }

          tbody.innerHTML = '';
          
          let activeCount = 0;
          let expiringCount = 0;

          filtered.forEach(key => {
            if(key.is_active) activeCount++;
            if(key.remaining_days < 7 && key.remaining_days >= 0 && key.is_active) expiringCount++;

            const statusBadge = !key.is_active 
              ? '<span class="badge badge-revoked">Revoked</span>' 
              : (key.remaining_days < 0 
                ? '<span class="badge badge-expired">Expired</span>' 
                : '<span class="badge badge-active">Active</span>');

            const row = document.createElement('tr');
            row.innerHTML = \`
                <td>
                  <div style="font-weight: 600;">\${key.client_name || 'Unnamed Client'}</div>
                  <span class="badge badge-system">\${key.system_name || 'Legacy'}</span>
                </td>
                <td><code>\${key.key}</code></td>
                <td>\${statusBadge}</td>
                <td>\${key.payment_terms || '-'} <br><small style="color:var(--text-muted)">\${key.payment_fee || 'N/A'}</small></td>
                <td>
                  \${key.next_payment_date}
                  <br><small style="\${key.remaining_days < 7 ? 'color:var(--danger)' : 'color:var(--text-muted)'}">
                    \${key.remaining_days < 0 ? Math.abs(key.remaining_days) + ' days overdue' : key.remaining_days + ' days left'}
                  </small>
                </td>
                <td>
                  <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-action \${key.is_active ? 'btn-revoke' : 'btn-activate'}" onclick="toggleKey(\${key.id}, \${key.is_active})">
                      \${key.is_active ? 'Revoke' : 'Activate'}
                    </button>
                    <button class="btn-action btn-history" onclick="viewHistory(\${key.id})">History</button>
                    <button class="btn-action btn-activate" style="background: rgba(131, 48, 255, 0.15); color: #b785ff;" onclick="openRenewModal(\${key.id}, '\${(key.client_name || '').replace(/'/g, "\\\\'")}')">Renew</button>
                    <button class="btn-action btn-delete" onclick="deleteLicense(\${key.id})">Delete</button>
                  </div>
                </td>
            \`;
            tbody.appendChild(row);
          });

          document.getElementById('total-count').innerText = filtered.length;
          document.getElementById('active-count').innerText = activeCount;
          document.getElementById('expiring-count').innerText = expiringCount;
          
          const totalRevenue = filtered.reduce((acc, curr) => {
             const feeStr = (curr.payment_fee || '0').toString().replace(/[^0-9.]/g, '');
             const fee = parseFloat(feeStr);
             return acc + (isNaN(fee) ? 0 : fee);
          }, 0);
          document.getElementById('revenue-total').innerText = '$' + totalRevenue.toLocaleString();
        }

        async function deleteLicense(id) {
          if (!confirm('Are you sure you want to delete this license? This action cannot be undone.')) return;
          
          try {
            await apiFetch('/api/licenses/' + id, { method: 'DELETE' });
            loadData();
          } catch (e) {
            console.error('Error deleting license:', e);
            alert('Failed to delete license');
          }
        }

        async function createKey(e) {
          e.preventDefault();
          
          const system_name = document.getElementById('system_name_create').value.trim();

          if (!system_name) {
            alert('Please enter a system name');
            return;
          }

          const data = {
            system_name: system_name,
            client_name: document.getElementById('client_name_create').value,
            payment_terms: document.getElementById('payment_terms_create').value,
            payment_fee: document.getElementById('payment_fee_create').value,
            start_date: document.getElementById('start_date_create').value,
            next_payment_date: document.getElementById('payment_date_create').value,
            description: document.getElementById('description_create').value
          };
          
          await apiFetch('/api/licenses', {
            method: 'POST',
            body: JSON.stringify(data)
          });
          
          document.getElementById('create-form').reset();
          closeModal('create-modal');
          loadData();
        }

        async function toggleKey(id, currentStatus) {
          const newStatus = currentStatus ? 0 : 1;
          await apiFetch('/api/licenses/' + id + '/status', {
            method: 'PUT',
            body: JSON.stringify({ is_active: newStatus })
          });
          loadData();
        }

        let currentRenewId = null;
        function openRenewModal(id, client) {
          currentRenewId = id;
          document.getElementById('renew-client').innerText = 'Client: ' + (client || 'Unknown');
          openModal('renew-modal');
        }

        async function submitRenewal(e) {
          e.preventDefault();
          const next_payment_date = document.getElementById('renew-date').value;
          const amount_paid = document.getElementById('renew-amount').value;

          await apiFetch('/api/licenses/' + currentRenewId + '/renew', {
            method: 'POST',
            body: JSON.stringify({ additional_days: 0, next_payment_date, amount_paid })
          });

          closeModal('renew-modal');
          loadData();
        }

        async function viewHistory(id) {
          const res = await apiFetch('/api/licenses/' + id + '/payments');
          const data = await res.json();
          const tbody = document.getElementById('history-tbody');
          tbody.innerHTML = '';
          if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 2rem; color:var(--text-muted)">No payment history found</td></tr>';
          } else {
            data.forEach(payment => {
              tbody.innerHTML += \`<tr>
                <td>\${new Date(payment.payment_date).toLocaleDateString()}</td>
                <td>\${payment.amount_paid || 'N/A'}</td>
                <td>\${payment.extended_date}</td>
              </tr>\`;
            });
          }
          openModal('history-modal');
        }

        function openModal(id) { document.getElementById(id).style.display = 'flex'; }
        function closeModal(id) { document.getElementById(id).style.display = 'none'; }

        // Initialize session
        window.onload = () => {
          document.getElementById('start_date_create').valueAsDate = new Date();
          checkAuth();
        };
      </script>
    </body>
    </html>
  `);
});

// Generate a random key
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result; // e.g., ABCD-1234-EFGH-5678
}

// API: Auth Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get all keys
app.get('/api/licenses', authenticateToken, async (req, res) => {
  try {
    const rows = await db.all("SELECT * FROM licenses ORDER BY id DESC", []);

    // Calculate remaining days dynamically for the UI
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enhancedRows = rows.map(row => {
      const nextPayment = new Date(row.next_payment_date);
      const diffTime = nextPayment - today;
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...row, remaining_days: remainingDays };
    });

    res.json(enhancedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: GSGet unique systems
app.get('/api/systems', authenticateToken, async (req, res) => {
  try {
    const rows = await db.all("SELECT DISTINCT system_name FROM licenses WHERE system_name IS NOT NULL", []);
    res.json(rows.map(r => r.system_name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Delete license
app.delete('/api/licenses/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.run("DELETE FROM licenses WHERE id = ?", [id]);
    await db.run("DELETE FROM payments WHERE license_id = ?", [id]);
    res.json({ message: 'License deleted', success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Create new key
app.post('/api/licenses', authenticateToken, async (req, res) => {
  const { duration_days, next_payment_date, client_name, description, payment_fee, system_name, start_date, payment_terms } = req.body;
  if (!next_payment_date) {
    return res.status(400).json({ error: 'Missing next payment date' });
  }

  const duration = duration_days || 0;
  const key = generateLicenseKey();

  try {
    const result = await db.run(
      "INSERT INTO licenses (key, duration_days, next_payment_date, client_name, description, payment_fee, system_name, start_date, payment_terms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [key, parseInt(duration), next_payment_date, client_name || null, description || null, payment_fee || null, system_name || null, start_date || null, payment_terms || null]
    );
    res.json({ id: result.lastID, key, duration_days, next_payment_date, is_active: 1, client_name, payment_fee, system_name, start_date, payment_terms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Toggle status
app.put('/api/licenses/:id/status', authenticateToken, async (req, res) => {
  const { is_active } = req.body;
  try {
    const result = await db.run("UPDATE licenses SET is_active = ? WHERE id = ?", [is_active, req.params.id]);
    res.json({ success: true, changes: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// API: Renew license
app.post('/api/licenses/:id/renew', authenticateToken, async (req, res) => {
  const { additional_days, next_payment_date, amount_paid } = req.body;
  const licenseId = req.params.id;

  if (additional_days === undefined || !next_payment_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await db.serialize(async () => {
      // 1. Update the license table
      await db.run(
        "UPDATE licenses SET duration_days = duration_days + ?, next_payment_date = ? WHERE id = ?",
        [parseInt(additional_days), next_payment_date, licenseId]
      );

      // 2. Insert into payments table
      await db.run(
        "INSERT INTO payments (license_id, amount_paid, extended_date) VALUES (?, ?, ?)",
        [licenseId, amount_paid || null, next_payment_date]
      );
    });
    res.json({ success: true, message: 'License renewed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get Payment History
app.get('/api/licenses/:id/payments', authenticateToken, async (req, res) => {
  try {
    const rows = await db.all(
      "SELECT * FROM payments WHERE license_id = ? ORDER BY payment_date DESC",
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Validate key (Called by LMS)
app.get('/api/validate', async (req, res) => {
  const { key } = req.query;
  if (!key) return res.status(400).json({ valid: false, reason: 'missing_key' });

  try {
    const row = await db.get("SELECT * FROM licenses WHERE key = ?", [key]);
    if (!row) return res.status(404).json({ valid: false, reason: 'invalid_key' });
    if (!row.is_active) return res.status(403).json({ valid: false, reason: 'revoked' });

    // Check payment date
    const nextPayment = new Date(row.next_payment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (nextPayment < today) {
      return res.json({ valid: false, reason: 'expired', details: 'Payment date has passed.' });
    }

    res.json({
      valid: true,
      duration_days: row.duration_days,
      next_payment_date: row.next_payment_date,
      client_name: row.client_name,
      description: row.description,
      payment_fee: row.payment_fee,
      system_name: row.system_name,
      start_date: row.start_date,
      payment_terms: row.payment_terms
    });
  } catch (err) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`License Manager running on http://localhost:${PORT}`);
  });
}

module.exports = app;
