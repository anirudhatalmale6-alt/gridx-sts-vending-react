/**
 * GRIDx STS Vending System - API Service Layer
 *
 * Connected to Node.js backend at /api/v1
 * Base URL configured via VITE_API_BASE_URL environment variable.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// ==================== HTTP Helper ====================
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('gridx_auth_token') || '';

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  // Remove headers from spread to avoid duplication
  delete config.headers;
  const finalConfig = {
    ...config,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  const response = await fetch(url, finalConfig);

  // Handle 401 - token expired
  if (response.status === 401) {
    // Try refresh
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry with new token
      finalConfig.headers['Authorization'] = `Bearer ${localStorage.getItem('gridx_auth_token')}`;
      const retryResponse = await fetch(url, finalConfig);
      if (!retryResponse.ok) {
        const err = await retryResponse.json().catch(() => ({ message: retryResponse.statusText }));
        throw new Error(err.message || `API Error: ${retryResponse.status}`);
      }
      return retryResponse.json();
    }
    // Refresh failed - redirect to login
    localStorage.removeItem('gridx_auth_token');
    localStorage.removeItem('gridx_refresh_token');
    localStorage.removeItem('gridx_user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  // Handle CSV/file downloads
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    const blob = await response.blob();
    return { blob, filename: getFilenameFromResponse(response) };
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(err.message || `API Error: ${response.status}`);
  }

  return response.json();
}

async function tryRefreshToken() {
  const refreshToken = localStorage.getItem('gridx_refresh_token');
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    localStorage.setItem('gridx_auth_token', data.token);
    return true;
  } catch {
    return false;
  }
}

function getFilenameFromResponse(response) {
  const disposition = response.headers.get('content-disposition');
  if (disposition && disposition.includes('filename=')) {
    return disposition.split('filename=')[1].replace(/"/g, '');
  }
  return 'export.csv';
}

// ==================== AUTH ====================
export const authService = {
  async login(username, password) {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('gridx_auth_token', data.token);
    localStorage.setItem('gridx_refresh_token', data.refreshToken);
    localStorage.setItem('gridx_user', JSON.stringify(data.user));
    return data;
  },

  async logout() {
    try {
      await apiCall('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem('gridx_auth_token');
    localStorage.removeItem('gridx_refresh_token');
    localStorage.removeItem('gridx_user');
    return { success: true };
  },

  async getProfile() {
    return apiCall('/auth/me');
  },

  isAuthenticated() {
    return !!localStorage.getItem('gridx_auth_token');
  },
};

// ==================== VENDING ====================
export const vendingService = {
  async generateToken(meterNo, amount) {
    return apiCall('/vending/generate-token', {
      method: 'POST',
      body: JSON.stringify({ meterNo, amount: Number(amount) }),
    });
  },

  async reverseTransaction(transactionId, reason) {
    return apiCall(`/vending/reverse/${encodeURIComponent(transactionId)}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async reprintToken(transactionId) {
    return apiCall(`/vending/reprint/${encodeURIComponent(transactionId)}`);
  },
};

// ==================== CUSTOMERS ====================
export const customerService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiCall(`/customers${params ? '?' + params : ''}`);
  },

  async getById(id) {
    return apiCall(`/customers/${encodeURIComponent(id)}`);
  },

  async search(query) {
    return apiCall(`/customers/search?q=${encodeURIComponent(query)}`);
  },

  async create(data) {
    return apiCall('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return apiCall(`/customers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ==================== TRANSACTIONS ====================
export const transactionService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiCall(`/transactions${params ? '?' + params : ''}`);
  },

  async getById(id) {
    return apiCall(`/transactions/${encodeURIComponent(id)}`);
  },

  async export(format, filters = {}) {
    const params = new URLSearchParams({ format, ...filters }).toString();
    const result = await apiCall(`/transactions/export?${params}`);
    if (result.blob) {
      // Trigger download
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    }
    return result;
  },
};

// ==================== VENDORS ====================
export const vendorService = {
  async getAll() {
    return apiCall('/vendors');
  },

  async getById(id) {
    return apiCall(`/vendors/${id}`);
  },

  async create(data) {
    return apiCall('/vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return apiCall(`/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async openBatch(vendorId) {
    return apiCall(`/vendors/${vendorId}/batch/open`, { method: 'POST' });
  },

  async closeBatch(vendorId) {
    return apiCall(`/vendors/${vendorId}/batch/close`, { method: 'POST' });
  },
};

// ==================== TARIFFS ====================
export const tariffService = {
  async getAll() {
    return apiCall('/tariffs');
  },

  async update(id, data) {
    return apiCall(`/tariffs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getConfig() {
    return apiCall('/tariffs/config');
  },
};

// ==================== REPORTS ====================
export const reportService = {
  async generate(type, filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiCall(`/reports/${type}${params ? '?' + params : ''}`);
  },

  async export(type, format, filters = {}) {
    const params = new URLSearchParams({ format, ...filters }).toString();
    const result = await apiCall(`/reports/${type}/export?${params}`);
    if (result.blob) {
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    }
    return result;
  },
};

// ==================== ADMIN ====================
export const adminService = {
  async getOperators() {
    return apiCall('/admin/operators');
  },

  async createOperator(data) {
    return apiCall('/admin/operators', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateOperator(id, data) {
    return apiCall(`/admin/operators/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getAuditLog(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiCall(`/admin/audit-log${params ? '?' + params : ''}`);
  },

  async getSystemStatus() {
    return apiCall('/admin/system-status');
  },
};

// ==================== DASHBOARD ====================
export const dashboardService = {
  async getKPIs() {
    return apiCall('/dashboard/kpis');
  },

  async getRecentTransactions(limit = 10) {
    return apiCall(`/dashboard/recent-transactions?limit=${limit}`);
  },

  async getSalesTrend() {
    return apiCall('/dashboard/sales-trend');
  },
};

// ==================== ENGINEERING ====================
export const engineeringService = {
  async generateEngineeringToken(meterNo, tokenType, parameters = {}) {
    return apiCall('/engineering/engineering-token', {
      method: 'POST',
      body: JSON.stringify({ meterNo, tokenType, parameters }),
    });
  },
  async generateFreeUnits(meterNo, kwh, reason) {
    return apiCall('/engineering/free-units', {
      method: 'POST',
      body: JSON.stringify({ meterNo, kwh, reason }),
    });
  },
  async generateKeyChangeToken(meterNo, newKeyRevision) {
    return apiCall('/engineering/key-change', {
      method: 'POST',
      body: JSON.stringify({ meterNo, newKeyRevision }),
    });
  },
  async generateReplacementToken(originalReference) {
    return apiCall('/engineering/replacement-token', {
      method: 'POST',
      body: JSON.stringify({ originalReference }),
    });
  },
};

// ==================== BATCHES ====================
export const batchService = {
  async openSalesBatch(vendorId, notes) {
    return apiCall('/batches/sales', { method: 'POST', body: JSON.stringify({ vendorId, notes }) });
  },
  async closeSalesBatch(batchId) {
    return apiCall(`/batches/sales/${batchId}/close`, { method: 'PUT' });
  },
  async getSalesBatches(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiCall(`/batches/sales${params ? '?' + params : ''}`);
  },
  async getSalesBatchDetail(batchId) {
    return apiCall(`/batches/sales/${batchId}`);
  },
  async openBankingBatch(salesBatchId, bankReference) {
    return apiCall('/batches/banking', { method: 'POST', body: JSON.stringify({ salesBatchId, bankReference }) });
  },
  async getBankingBatches(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiCall(`/batches/banking${params ? '?' + params : ''}`);
  },
};

// ==================== COMMISSIONS ====================
export const commissionService = {
  async calculate(vendorId, dateFrom, dateTo) {
    return apiCall('/commissions/calculate', { method: 'POST', body: JSON.stringify({ vendorId, dateFrom, dateTo }) });
  },
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiCall(`/commissions${params ? '?' + params : ''}`);
  },
  async getSummary() {
    return apiCall('/commissions/summary');
  },
  async approve(id) {
    return apiCall(`/commissions/${id}/approve`, { method: 'PUT' });
  },
  async markPaid(id) {
    return apiCall(`/commissions/${id}/paid`, { method: 'PUT' });
  },
};

// ==================== MAP ====================
export const mapService = {
  async getMeterLocations(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiCall(`/map/meters${params ? '?' + params : ''}`);
  },
  async getMeterDetail(meterNo) {
    return apiCall(`/map/meters/${meterNo}`);
  },
  async getAreaSummary() {
    return apiCall('/map/areas');
  },
};

// ==================== NOTIFICATIONS ====================
export const notificationService = {
  async getHistory(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiCall(`/notifications${params ? '?' + params : ''}`);
  },
  async sendSMS(phone, message) {
    return apiCall('/notifications/sms', { method: 'POST', body: JSON.stringify({ phone, message }) });
  },
  async sendTokenSMS(transactionId) {
    return apiCall(`/notifications/token-sms/${transactionId}`, { method: 'POST' });
  },
};

// ==================== RECEIPTS ====================
export const receiptService = {
  async viewReceipt(transactionRef) {
    window.open(`${API_BASE}/receipts/${transactionRef}`, '_blank');
  },
  async downloadReceipt(transactionRef) {
    window.open(`${API_BASE}/receipts/${transactionRef}/download`, '_blank');
  },
};
