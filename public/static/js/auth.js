/**
 * LookManager - Authentication Module
 * Handles login, registration, token management, and session persistence
 */

const AUTH_CONFIG = {
  API_BASE_URL: window.location.origin + '/api',
  TOKEN_KEY: 'lookmanager_token',
  USER_KEY: 'lookmanager_user',
  TOKEN_EXPIRY_KEY: 'lookmanager_token_expiry'
};

/**
 * Extract error message from API response
 * Handles both string errors and object errors { code, message }
 */
function extractErrorMessage(data, defaultMessage = 'Une erreur est survenue') {
  if (!data) return defaultMessage;
  
  // If error is a string
  if (typeof data.error === 'string') {
    return data.error;
  }
  
  // If error is an object with message property
  if (data.error && typeof data.error === 'object') {
    return data.error.message || data.error.details || defaultMessage;
  }
  
  // If there's a direct message property
  if (data.message) {
    return data.message;
  }
  
  return defaultMessage;
}

class AuthManager {
  constructor() {
    this.token = this.getToken();
    this.user = this.getUser();
  }

  /**
   * Get stored authentication token
   */
  getToken() {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const expiry = localStorage.getItem(AUTH_CONFIG.TOKEN_EXPIRY_KEY);
    
    if (token && expiry) {
      const expiryDate = new Date(expiry);
      if (expiryDate > new Date()) {
        return token;
      }
      // Token expired, clear storage
      this.clearStorage();
    }
    return null;
  }

  /**
   * Get stored user information
   */
  getUser() {
    const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Store authentication token and user info
   */
  setAuth(token, user) {
    // Token expires in 7 days (same as backend JWT)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_CONFIG.TOKEN_EXPIRY_KEY, expiryDate.toISOString());
    
    this.token = token;
    this.user = user;
  }

  /**
   * Clear storage without redirect
   */
  clearStorage() {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    localStorage.removeItem(AUTH_CONFIG.TOKEN_EXPIRY_KEY);
    this.token = null;
    this.user = null;
  }

  /**
   * Clear authentication data and redirect
   */
  logout() {
    this.clearStorage();
    window.location.href = '/static/index.html';
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.token !== null && this.user !== null;
  }

  /**
   * Register new user
   */
  async register(email, password, fullName, phone) {
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          phone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = extractErrorMessage(data, 'Erreur lors de l\'inscription');
        throw new Error(errorMsg);
      }

      if (data.success && data.data && data.data.token) {
        this.setAuth(data.data.token, data.data.owner);
        return { success: true, user: data.data.owner };
      }

      throw new Error('Réponse invalide du serveur');
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || 'Erreur lors de l\'inscription' };
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = extractErrorMessage(data, 'Erreur lors de la connexion');
        throw new Error(errorMsg);
      }

      if (data.success && data.data && data.data.token) {
        this.setAuth(data.data.token, data.data.owner);
        return { success: true, user: data.data.owner };
      }

      throw new Error('Email ou mot de passe incorrect');
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Erreur lors de la connexion' };
    }
  }

  /**
   * Get current user profile from API
   */
  async getCurrentUser() {
    try {
      if (!this.token) {
        return { success: false, error: 'Non authentifié' };
      }

      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.clearStorage();
          return { success: false, error: 'Session expirée' };
        }
        const errorMsg = extractErrorMessage(data, 'Erreur lors de la récupération du profil');
        throw new Error(errorMsg);
      }

      if (data.success && data.data) {
        // Update stored user info
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(data.data));
        this.user = data.data;
        return { success: true, user: data.data };
      }

      throw new Error('Réponse invalide du serveur');
    } catch (error) {
      console.error('Get current user error:', error);
      return { success: false, error: error.message || 'Erreur de récupération du profil' };
    }
  }

  /**
   * Change password
   */
  async changePassword(oldPassword, newPassword) {
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = extractErrorMessage(data, 'Erreur lors du changement de mot de passe');
        throw new Error(errorMsg);
      }

      if (data.success) {
        return { success: true, message: data.message || 'Mot de passe modifié avec succès' };
      }

      throw new Error('Réponse invalide du serveur');
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: error.message || 'Erreur du changement de mot de passe' };
    }
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
}

// Create global auth instance
const auth = new AuthManager();

// Export for use in other modules
window.auth = auth;
window.AUTH_CONFIG = AUTH_CONFIG;
window.extractErrorMessage = extractErrorMessage;
