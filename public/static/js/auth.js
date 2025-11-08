/**
 * LokoManager - Authentication Module
 * Handles login, registration, token management, and session persistence
 */

const AUTH_CONFIG = {
  API_BASE_URL: window.location.origin + '/api',
  TOKEN_KEY: 'lokomanager_token',
  USER_KEY: 'lokomanager_user',
  TOKEN_EXPIRY_KEY: 'lokomanager_token_expiry'
};

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
      this.logout();
    }
    return null;
  }

  /**
   * Get stored user information
   */
  getUser() {
    const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
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
   * Clear authentication data
   */
  logout() {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    localStorage.removeItem(AUTH_CONFIG.TOKEN_EXPIRY_KEY);
    this.token = null;
    this.user = null;
    window.location.href = '/';
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
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      if (data.success) {
        this.setAuth(data.data.token, data.data.owner);
        return { success: true, user: data.data.owner };
      }

      throw new Error('Réponse invalide du serveur');
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
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
        throw new Error(data.error || 'Erreur lors de la connexion');
      }

      if (data.success) {
        this.setAuth(data.data.token, data.data.owner);
        return { success: true, user: data.data.owner };
      }

      throw new Error('Réponse invalide du serveur');
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current user profile from API
   */
  async getCurrentUser() {
    try {
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
          this.logout();
          return { success: false, error: 'Session expirée' };
        }
        throw new Error(data.error || 'Erreur lors de la récupération du profil');
      }

      if (data.success) {
        // Update stored user info
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(data.data));
        this.user = data.data;
        return { success: true, user: data.data };
      }

      throw new Error('Réponse invalide du serveur');
    } catch (error) {
      console.error('Get current user error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Change password
   */
  async changePassword(oldPassword, newPassword) {
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
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
        throw new Error(data.error || 'Erreur lors du changement de mot de passe');
      }

      if (data.success) {
        return { success: true, message: data.message };
      }

      throw new Error('Réponse invalide du serveur');
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: error.message };
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
