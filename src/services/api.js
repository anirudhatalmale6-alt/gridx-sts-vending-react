/**
 * GRIDx STS Vending System - API Service Layer
 *
 * PLACEHOLDER: Replace these mock implementations with actual API calls
 * when connecting to the backend server.
 *
 * Base URL should be configured via environment variable:
 * VITE_API_BASE_URL=https://api.gridx-vending.pulsar.com.na/v1
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Helper for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
      ...options.headers,
    },
    ...options,
  };

  // TODO: Replace with actual fetch call when backend is ready
  // const response = await fetch(url, config);
  // if (!response.ok) throw new Error(`API Error: ${response.status}`);
  // return response.json();

  console.log(`[API] ${options.method || 'GET'} ${url}`, options.body || '');
  return null;
}

function getAuthToken() {
  return localStorage.getItem('gridx_auth_token') || '';
}

// ==================== AUTH ====================
export const authService = {
  /** POST /auth/login */
  async login(username, password) {
    // TODO: return apiCall('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    // Mock: always succeed
    const token = 'mock-jwt-token-' + Date.now();
    localStorage.setItem('gridx_auth_token', token);
    return { token, user: { username, name: 'System Admin', role: 'ADMIN' } };
  },

  /** POST /auth/logout */
  async logout() {
    localStorage.removeItem('gridx_auth_token');
    return { success: true };
  },

  isAuthenticated() {
    return !!localStorage.getItem('gridx_auth_token');
  }
};

// ==================== VENDING ====================
export const vendingService = {
  /** POST /vending/generate-token */
  async generateToken(meterNo, amount) {
    // TODO: return apiCall('/vending/generate-token', { method: 'POST', body: JSON.stringify({ meterNo, amount }) });
    // Mock: generate random 20-digit token
    await new Promise(r => setTimeout(r, 2000)); // Simulate STS gateway latency
    const token = Array.from({length: 20}, () => Math.floor(Math.random() * 10)).join('');
    const formatted = token.match(/.{4}/g).join('-');
    return {
      success: true,
      token: formatted,
      reference: `TXN-${Date.now()}`,
      kwh: (amount * 0.623).toFixed(1),
      breakdown: { amountTendered: amount, vat: amount * 0.1304, fixedCharge: 8.50, relLevy: 2.40 }
    };
  },

  /** POST /vending/reverse/{transactionId} */
  async reverseTransaction(transactionId, reason) {
    // TODO: return apiCall(`/vending/reverse/${transactionId}`, { method: 'POST', body: JSON.stringify({ reason }) });
    return { success: true, reversalRef: `REV-${Date.now()}` };
  },

  /** GET /vending/reprint/{transactionId} */
  async reprintToken(transactionId) {
    // TODO: return apiCall(`/vending/reprint/${transactionId}`);
    return { success: true };
  }
};

// ==================== CUSTOMERS ====================
export const customerService = {
  /** GET /customers */
  async getAll(filters = {}) {
    // TODO: return apiCall('/customers?' + new URLSearchParams(filters));
    const { customers } = await import('../data/mockData');
    return { data: customers, total: customers.length };
  },

  /** GET /customers/{id} */
  async getById(id) {
    // TODO: return apiCall(`/customers/${id}`);
    const { customers } = await import('../data/mockData');
    return customers.find(c => c.id === id || c.meterNo === id);
  },

  /** GET /customers/search?q={query} */
  async search(query) {
    // TODO: return apiCall(`/customers/search?q=${encodeURIComponent(query)}`);
    const { customers } = await import('../data/mockData');
    const q = query.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.meterNo.includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  },

  /** POST /customers */
  async create(data) {
    // TODO: return apiCall('/customers', { method: 'POST', body: JSON.stringify(data) });
    return { success: true, id: 'ACC-' + Date.now() };
  },

  /** PUT /customers/{id} */
  async update(id, data) {
    // TODO: return apiCall(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return { success: true };
  }
};

// ==================== TRANSACTIONS ====================
export const transactionService = {
  /** GET /transactions */
  async getAll(filters = {}) {
    // TODO: return apiCall('/transactions?' + new URLSearchParams(filters));
    const { recentTransactions } = await import('../data/mockData');
    return { data: recentTransactions, total: recentTransactions.length };
  },

  /** GET /transactions/{id} */
  async getById(id) {
    // TODO: return apiCall(`/transactions/${id}`);
    const { recentTransactions } = await import('../data/mockData');
    return recentTransactions.find(t => t.id === id);
  },

  /** GET /transactions/export?format={csv|pdf} */
  async export(format, filters = {}) {
    // TODO: return apiCall(`/transactions/export?format=${format}&` + new URLSearchParams(filters));
    return { success: true, downloadUrl: '#' };
  }
};

// ==================== VENDORS ====================
export const vendorService = {
  /** GET /vendors */
  async getAll() {
    // TODO: return apiCall('/vendors');
    const { vendors } = await import('../data/mockData');
    return { data: vendors };
  },

  /** POST /vendors/{id}/batch/open */
  async openBatch(vendorId) {
    // TODO: return apiCall(`/vendors/${vendorId}/batch/open`, { method: 'POST' });
    return { success: true, batchId: `BATCH-${Date.now()}` };
  },

  /** POST /vendors/{id}/batch/close */
  async closeBatch(vendorId) {
    // TODO: return apiCall(`/vendors/${vendorId}/batch/close`, { method: 'POST' });
    return { success: true };
  }
};

// ==================== TARIFFS ====================
export const tariffService = {
  /** GET /tariffs */
  async getAll() {
    // TODO: return apiCall('/tariffs');
    const { tariffGroups } = await import('../data/mockData');
    return { data: tariffGroups };
  },

  /** PUT /tariffs/{id} */
  async update(id, data) {
    // TODO: return apiCall(`/tariffs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return { success: true };
  },

  /** GET /tariffs/config */
  async getConfig() {
    // TODO: return apiCall('/tariffs/config');
    const { systemConfig } = await import('../data/mockData');
    return systemConfig;
  }
};

// ==================== REPORTS ====================
export const reportService = {
  /** GET /reports/{type} */
  async generate(type, filters = {}) {
    // TODO: return apiCall(`/reports/${type}?` + new URLSearchParams(filters));
    const { vendorReportData, dashboardKPIs } = await import('../data/mockData');
    return { summary: dashboardKPIs, breakdown: vendorReportData };
  },

  /** GET /reports/export?format={pdf|csv} */
  async export(type, format, filters = {}) {
    // TODO: return apiCall(`/reports/${type}/export?format=${format}&` + new URLSearchParams(filters));
    return { success: true, downloadUrl: '#' };
  }
};

// ==================== ADMIN ====================
export const adminService = {
  /** GET /admin/operators */
  async getOperators() {
    // TODO: return apiCall('/admin/operators');
    const { operators } = await import('../data/mockData');
    return { data: operators };
  },

  /** POST /admin/operators */
  async createOperator(data) {
    // TODO: return apiCall('/admin/operators', { method: 'POST', body: JSON.stringify(data) });
    return { success: true };
  },

  /** GET /admin/audit-log */
  async getAuditLog(filters = {}) {
    // TODO: return apiCall('/admin/audit-log?' + new URLSearchParams(filters));
    const { auditLog } = await import('../data/mockData');
    return { data: auditLog };
  },

  /** GET /admin/system-status */
  async getSystemStatus() {
    // TODO: return apiCall('/admin/system-status');
    return {
      appServer: 'Online',
      stsGateway: 'Connected',
      database: 'Healthy',
      smsGateway: 'Active',
      lastBackup: '2026-03-12 04:00:00',
      uptime: '99.97%'
    };
  }
};

// ==================== DASHBOARD ====================
export const dashboardService = {
  /** GET /dashboard/kpis */
  async getKPIs() {
    // TODO: return apiCall('/dashboard/kpis');
    const { dashboardKPIs } = await import('../data/mockData');
    return dashboardKPIs;
  },

  /** GET /dashboard/recent-transactions */
  async getRecentTransactions(limit = 10) {
    // TODO: return apiCall(`/dashboard/recent-transactions?limit=${limit}`);
    const { recentTransactions } = await import('../data/mockData');
    return recentTransactions.slice(0, limit);
  },

  /** GET /dashboard/sales-trend */
  async getSalesTrend() {
    // TODO: return apiCall('/dashboard/sales-trend');
    return [
      { day: 'Thu', amount: 14200 },
      { day: 'Fri', amount: 16800 },
      { day: 'Sat', amount: 9400 },
      { day: 'Sun', amount: 7200 },
      { day: 'Mon', amount: 15600 },
      { day: 'Tue', amount: 17400 },
      { day: 'Today', amount: 18742 }
    ];
  }
};
