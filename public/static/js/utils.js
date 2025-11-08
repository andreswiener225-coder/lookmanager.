/**
 * LokoManager - Utility Functions
 * Common helpers for formatting, validation, and UI operations
 */

const Utils = {
  /**
   * Format number as FCFA currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' FCFA';
  },

  /**
   * Format date for display
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  },

  /**
   * Format date for input fields (YYYY-MM-DD)
   */
  formatDateInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  },

  /**
   * Format phone number for Côte d'Ivoire
   */
  formatPhone(phone) {
    if (!phone) return 'N/A';
    // Normalize to +225XXXXXXXX format
    let normalized = phone.replace(/\s+/g, '');
    if (normalized.startsWith('00225')) {
      normalized = '+' + normalized.substring(2);
    } else if (normalized.startsWith('225')) {
      normalized = '+' + normalized;
    } else if (!normalized.startsWith('+')) {
      normalized = '+225' + normalized;
    }
    return normalized;
  },

  /**
   * Get status badge HTML
   */
  getStatusBadge(status) {
    const badges = {
      'vacant': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Vacant</span>',
      'occupied': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Occupé</span>',
      'maintenance': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Maintenance</span>',
      'pending': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">En attente</span>',
      'late': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">En retard</span>',
      'completed': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Complété</span>',
      'active': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Actif</span>',
      'inactive': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Inactif</span>'
    };
    return badges[status] || `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">${status}</span>`;
  },

  /**
   * Get property type label
   */
  getPropertyTypeLabel(type) {
    const labels = {
      'house': 'Maison',
      'apartment': 'Appartement',
      'villa': 'Villa',
      'studio': 'Studio',
      'office': 'Bureau',
      'shop': 'Commerce',
      'warehouse': 'Entrepôt'
    };
    return labels[type] || type;
  },

  /**
   * Get expense category label
   */
  getCategoryLabel(category) {
    const labels = {
      'maintenance': 'Maintenance',
      'taxes': 'Taxes',
      'insurance': 'Assurance',
      'utilities': 'Utilités',
      'repairs': 'Réparations',
      'other': 'Autre'
    };
    return labels[category] || category;
  },

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
      'success': 'bg-green-500',
      'error': 'bg-red-500',
      'warning': 'bg-yellow-500',
      'info': 'bg-blue-500'
    };
    
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('animate-slide-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  /**
   * Show loading spinner
   */
  showLoading(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    `;
  },

  /**
   * Show error message
   */
  showError(container, message) {
    container.innerHTML = `
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-2"></i>
        <p class="text-red-700 font-medium">${message}</p>
      </div>
    `;
  },

  /**
   * Show empty state
   */
  showEmpty(container, message, icon = 'inbox') {
    container.innerHTML = `
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <i class="fas fa-${icon} text-gray-400 text-5xl mb-4"></i>
        <p class="text-gray-600 font-medium">${message}</p>
      </div>
    `;
  },

  /**
   * Validate email format
   */
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Validate phone number (Côte d'Ivoire format)
   */
  validatePhone(phone) {
    // Accept formats: +225XXXXXXXX, 00225XXXXXXXX, XXXXXXXX
    const re = /^(\+?225|00225)?[0-9]{8,10}$/;
    return re.test(phone.replace(/\s+/g, ''));
  },

  /**
   * Validate password strength
   */
  validatePassword(password) {
    return password.length >= 8;
  },

  /**
   * Debounce function for search inputs
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Confirm dialog
   */
  async confirm(message) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      overlay.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
          <p class="text-gray-800 mb-6">${message}</p>
          <div class="flex justify-end space-x-3">
            <button id="confirm-cancel" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Annuler
            </button>
            <button id="confirm-ok" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Confirmer
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      document.getElementById('confirm-ok').onclick = () => {
        overlay.remove();
        resolve(true);
      };
      
      document.getElementById('confirm-cancel').onclick = () => {
        overlay.remove();
        resolve(false);
      };
    });
  },

  /**
   * Calculate days difference
   */
  daysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Get month name in French
   */
  getMonthName(monthNumber) {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthNumber - 1] || '';
  },

  /**
   * Truncate text
   */
  truncate(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  /**
   * Generate random color for charts
   */
  getRandomColor() {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
};

// Export globally
window.Utils = Utils;
