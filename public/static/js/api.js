/**
 * LokoManager - API Client Module
 * Centralized API communication with error handling and response formatting
 */

class APIClient {
  constructor() {
    this.baseURL = window.location.origin + '/api';
  }

  /**
   * Generic API request handler
   */
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Add auth token if available
      if (window.auth && window.auth.token) {
        headers['Authorization'] = `Bearer ${window.auth.token}`;
      }

      const config = {
        ...options,
        headers
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle 401 Unauthorized - session expired
        if (response.status === 401 && window.auth) {
          window.auth.logout();
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        // Extract error message from standardized API response
        // Backend format: { success: false, error: { code: "...", message: "..." } }
        let errorMessage = `Erreur HTTP ${response.status}`;
        if (data.error) {
          if (typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (data.error.message) {
            errorMessage = data.error.message;
          } else if (data.error.details) {
            errorMessage = data.error.details;
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ==================== Properties API ====================
  
  async getProperties(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.city) params.append('city', filters.city);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/properties${query}`, { method: 'GET' });
  }

  async getProperty(id) {
    return this.request(`/properties/${id}`, { method: 'GET' });
  }

  async createProperty(propertyData) {
    return this.request('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData)
    });
  }

  async updateProperty(id, propertyData) {
    return this.request(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData)
    });
  }

  async deleteProperty(id) {
    return this.request(`/properties/${id}`, { method: 'DELETE' });
  }

  // ==================== Tenants API ====================
  
  async getTenants(filters = {}) {
    const params = new URLSearchParams();
    if (filters.property_id) params.append('property_id', filters.property_id);
    if (filters.status) params.append('status', filters.status);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/tenants${query}`, { method: 'GET' });
  }

  async getTenant(id) {
    return this.request(`/tenants/${id}`, { method: 'GET' });
  }

  async createTenant(tenantData) {
    return this.request('/tenants', {
      method: 'POST',
      body: JSON.stringify(tenantData)
    });
  }

  async updateTenant(id, tenantData) {
    return this.request(`/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tenantData)
    });
  }

  async deleteTenant(id) {
    return this.request(`/tenants/${id}`, { method: 'DELETE' });
  }

  // ==================== Payments API ====================
  
  async getPayments(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.tenant_id) params.append('tenant_id', filters.tenant_id);
    if (filters.property_id) params.append('property_id', filters.property_id);
    if (filters.month) params.append('month', filters.month);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/payments${query}`, { method: 'GET' });
  }

  async getPendingPayments() {
    return this.request('/payments/pending', { method: 'GET' });
  }

  async getUpcomingPayments() {
    return this.request('/payments/upcoming', { method: 'GET' });
  }

  async getPayment(id) {
    return this.request(`/payments/${id}`, { method: 'GET' });
  }

  async createPayment(paymentData) {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async updatePayment(id, paymentData) {
    return this.request(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData)
    });
  }

  async deletePayment(id) {
    return this.request(`/payments/${id}`, { method: 'DELETE' });
  }

  async recordPayment(id, paymentDetails) {
    return this.request(`/payments/${id}/record`, {
      method: 'POST',
      body: JSON.stringify(paymentDetails)
    });
  }

  // ==================== Dashboard API ====================
  
  async getDashboard() {
    return this.request('/dashboard', { method: 'GET' });
  }

  async getRevenue() {
    return this.request('/dashboard/revenue', { method: 'GET' });
  }

  async getOccupancy() {
    return this.request('/dashboard/occupancy', { method: 'GET' });
  }

  async getExpensesSummary() {
    return this.request('/dashboard/expenses', { method: 'GET' });
  }

  // ==================== Expenses API ====================
  
  async getExpenses(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.property_id) params.append('property_id', filters.property_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/expenses${query}`, { method: 'GET' });
  }

  async getExpense(id) {
    return this.request(`/expenses/${id}`, { method: 'GET' });
  }

  async createExpense(expenseData) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData)
    });
  }

  async updateExpense(id, expenseData) {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData)
    });
  }

  async deleteExpense(id) {
    return this.request(`/expenses/${id}`, { method: 'DELETE' });
  }

  // ==================== Service Providers API ====================
  
  async getServiceProviders(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/service-providers${query}`, { method: 'GET' });
  }

  async getServiceProvider(id) {
    return this.request(`/service-providers/${id}`, { method: 'GET' });
  }

  async createServiceProvider(providerData) {
    return this.request('/service-providers', {
      method: 'POST',
      body: JSON.stringify(providerData)
    });
  }

  async updateServiceProvider(id, providerData) {
    return this.request(`/service-providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(providerData)
    });
  }

  async deleteServiceProvider(id) {
    return this.request(`/service-providers/${id}`, { method: 'DELETE' });
  }
}

// Create global API instance
const api = new APIClient();

// Export for use in other modules
window.api = api;
