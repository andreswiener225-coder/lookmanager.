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
      'villa': 'Villa',
      'appartement': 'Appartement',
      'studio': 'Studio',
      'bureau': 'Bureau',
      'commerce': 'Commerce',
      // Legacy English values (for backward compatibility)
      'house': 'Maison',
      'apartment': 'Appartement',
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
    // Remove any existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    const icons = {
      'success': 'fa-check-circle',
      'error': 'fa-exclamation-circle',
      'warning': 'fa-exclamation-triangle',
      'info': 'fa-info-circle'
    };
    const colors = {
      'success': 'border-l-green-500',
      'error': 'border-l-red-500',
      'warning': 'border-l-yellow-500',
      'info': 'border-l-blue-500'
    };
    const iconColors = {
      'success': 'text-green-500',
      'error': 'text-red-500',
      'warning': 'text-yellow-500',
      'info': 'text-blue-500'
    };

    toast.className = `toast-notification toast ${type} fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl px-5 py-4 z-50 flex items-center gap-3 max-w-md border-l-4 ${colors[type]} animate-slide-right`;
    toast.innerHTML = `
      <i class="fas ${icons[type]} ${iconColors[type]} text-xl"></i>
      <span class="text-gray-800 font-medium">${message}</span>
      <button onclick="this.parentElement.remove()" class="ml-auto text-gray-400 hover:text-gray-600 p-1">
        <i class="fas fa-times"></i>
      </button>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  /**
   * Show loading spinner
   */
  showLoading(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center py-16">
        <div class="spinner"></div>
      </div>
    `;
  },

  /**
   * Show error message
   */
  showError(container, message) {
    container.innerHTML = `
      <div class="bg-red-50/50 backdrop-blur border border-red-200 rounded-2xl p-8 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
        </div>
        <p class="text-red-700 font-semibold mb-2">Oops ! Une erreur est survenue</p>
        <p class="text-red-600 text-sm">${message}</p>
      </div>
    `;
  },

  /**
   * Show empty state
   */
  showEmpty(container, message, icon = 'inbox') {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i class="fas fa-${icon}"></i>
        </div>
        <h3>Aucun élément</h3>
        <p>${message}</p>
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
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center animate-scale-in">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-question text-red-500 text-2xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Confirmation</h3>
          <p class="text-gray-600 mb-6">${message}</p>
          <div class="flex justify-center gap-3">
            <button id="confirm-cancel" class="btn btn-secondary px-6">
              <i class="fas fa-times mr-2"></i>
              Annuler
            </button>
            <button id="confirm-ok" class="btn btn-danger px-6">
              <i class="fas fa-check mr-2"></i>
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

      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
          resolve(false);
        }
      });
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
