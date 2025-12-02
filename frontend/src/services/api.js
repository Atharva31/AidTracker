import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = `${API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Distribution Centers
export const distributionCentersAPI = {
  getAll: () => api.get('/centers'),
  getById: (id) => api.get(`/centers/${id}`),
  create: (data) => api.post('/centers', data),
  update: (id, data) => api.put(`/centers/${id}`, data),
  delete: (id) => api.delete(`/centers/${id}`),
};

// Aid Packages
export const aidPackagesAPI = {
  getAll: (params = {}) => api.get('/packages', { params }),
  getById: (id) => api.get(`/packages/${id}`),
  create: (data) => api.post('/packages', data),
  update: (id, data) => api.put(`/packages/${id}`, data),
  delete: (id) => api.delete(`/packages/${id}`),
};

// Households
export const householdsAPI = {
  getAll: (params = {}) => api.get('/households', { params }),
  getById: (id) => api.get(`/households/${id}`),
  create: (data) => api.post('/households', data),
  update: (id, data) => api.put(`/households/${id}`, data),
  delete: (id) => api.delete(`/households/${id}`),
};

// Inventory
export const inventoryAPI = {
  getAll: (params = {}) => api.get('/inventory', { params }),
  getStatus: () => api.get('/inventory/status'),
  getLowStock: () => api.get('/inventory/low-stock'),
  restock: (data) => api.post('/inventory/restock', data),
};

// Distribution
export const distributionAPI = {
  distribute: (data) => api.post('/distribution/distribute', data),
  checkEligibility: (data) => api.post('/distribution/check-eligibility', data),
  getLogs: (params = {}) => api.get('/distribution/logs', { params }),
  getHouseholdHistory: (householdId) => api.get(`/distribution/logs/household/${householdId}`),
  resetTest: () => api.delete('/distribution/test/reset'),
};

// Reports
export const reportsAPI = {
  getMonthlySummary: () => api.get('/reports/monthly-summary'),
  getPendingHouseholds: () => api.get('/reports/pending-households'),
  getStatistics: () => api.get('/reports/distribution-statistics'),
  getDashboard: () => api.get('/reports/dashboard'),
};

export default api;
