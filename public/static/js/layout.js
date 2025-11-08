/**
 * LokoManager - Layout Manager
 * Handles sidebar navigation, header, and page routing
 */

class LayoutManager {
  constructor() {
    this.currentPage = 'dashboard';
    this.sidebarOpen = true;
    this.pages = {
      'dashboard': {
        title: 'Tableau de bord',
        icon: 'fa-chart-line',
        render: this.renderDashboard
      },
      'properties': {
        title: 'Propriétés',
        icon: 'fa-building',
        render: this.renderProperties
      },
      'tenants': {
        title: 'Locataires',
        icon: 'fa-users',
        render: this.renderTenants
      },
      'payments': {
        title: 'Paiements',
        icon: 'fa-money-bill-wave',
        render: this.renderPayments
      },
      'expenses': {
        title: 'Dépenses',
        icon: 'fa-receipt',
        render: this.renderExpenses
      },
      'providers': {
        title: 'Prestataires',
        icon: 'fa-tools',
        render: this.renderProviders
      },
      'settings': {
        title: 'Paramètres',
        icon: 'fa-cog',
        render: this.renderSettings
      }
    };
  }

  /**
   * Initialize layout
   */
  init() {
    if (!window.auth || !window.auth.isAuthenticated()) {
      window.location.href = '/static/auth.html';
      return;
    }

    this.render();
    this.attachEventListeners();
    this.loadPage('dashboard');
  }

  /**
   * Render complete layout
   */
  render() {
    const container = document.getElementById('app');
    const user = window.auth.user;

    container.innerHTML = `
      <div class="app-container">
        <!-- Sidebar -->
        <aside id="sidebar" class="sidebar">
          <!-- Sidebar Header -->
          <div class="sidebar-header">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-building text-white text-lg"></i>
              </div>
              <div>
                <h1 class="text-lg font-bold text-gray-800">LokoManager</h1>
                <p class="text-xs text-gray-500">v1.0.0</p>
              </div>
            </div>
          </div>

          <!-- Sidebar Navigation -->
          <nav class="sidebar-nav">
            <a href="#" class="nav-item active" data-page="dashboard">
              <i class="fas fa-chart-line"></i>
              <span>Tableau de bord</span>
            </a>
            <a href="#" class="nav-item" data-page="properties">
              <i class="fas fa-building"></i>
              <span>Propriétés</span>
            </a>
            <a href="#" class="nav-item" data-page="tenants">
              <i class="fas fa-users"></i>
              <span>Locataires</span>
            </a>
            <a href="#" class="nav-item" data-page="payments">
              <i class="fas fa-money-bill-wave"></i>
              <span>Paiements</span>
            </a>
            <a href="#" class="nav-item" data-page="expenses">
              <i class="fas fa-receipt"></i>
              <span>Dépenses</span>
            </a>
            <a href="#" class="nav-item" data-page="providers">
              <i class="fas fa-tools"></i>
              <span>Prestataires</span>
            </a>
            
            <div class="border-t border-gray-200 my-2"></div>
            
            <a href="#" class="nav-item" data-page="settings">
              <i class="fas fa-cog"></i>
              <span>Paramètres</span>
            </a>
            <a href="#" class="nav-item" id="logoutBtn">
              <i class="fas fa-sign-out-alt"></i>
              <span>Déconnexion</span>
            </a>
          </nav>

          <!-- Subscription Badge -->
          <div class="px-4 py-3 mx-3 mb-4 bg-blue-50 rounded-lg border border-blue-200">
            <p class="text-xs font-semibold text-blue-800 uppercase">${user.subscription_tier || 'free'}</p>
            <p class="text-xs text-blue-600 mt-1">
              ${this.getSubscriptionLimitText(user.subscription_tier)}
            </p>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <!-- Header -->
          <header class="app-header">
            <div class="flex items-center">
              <button id="menuToggle" class="text-gray-600 hover:text-gray-800 mr-4">
                <i class="fas fa-bars text-xl"></i>
              </button>
              <h2 id="pageTitle" class="text-xl font-bold text-gray-800">Tableau de bord</h2>
            </div>

            <div class="header-actions">
              <!-- Notifications -->
              <button class="relative text-gray-600 hover:text-gray-800">
                <i class="fas fa-bell text-xl"></i>
                <span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              <!-- User Menu -->
              <div class="flex items-center space-x-3 border-l border-gray-200 pl-4">
                <div class="text-right">
                  <p class="text-sm font-semibold text-gray-800">${user.full_name}</p>
                  <p class="text-xs text-gray-500">${user.email}</p>
                </div>
                <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span class="text-white font-semibold">${this.getInitials(user.full_name)}</span>
                </div>
              </div>
            </div>
          </header>

          <!-- Page Content -->
          <div id="pageContent" class="p-6">
            <div class="flex items-center justify-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </main>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Navigation items
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.loadPage(page);
      });
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
      e.preventDefault();
      this.logout();
    });

    // Menu toggle
    document.getElementById('menuToggle').addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Close sidebar on mobile when clicking outside
    document.getElementById('pageContent').addEventListener('click', () => {
      if (window.innerWidth < 768 && this.sidebarOpen) {
        this.toggleSidebar();
      }
    });
  }

  /**
   * Load a specific page
   */
  async loadPage(pageName) {
    if (!this.pages[pageName]) {
      console.error(`Page ${pageName} not found`);
      return;
    }

    this.currentPage = pageName;
    const page = this.pages[pageName];

    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    const activeItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }

    // Update page title
    document.getElementById('pageTitle').textContent = page.title;

    // Show loading
    const content = document.getElementById('pageContent');
    Utils.showLoading(content);

    // Render page content
    try {
      await page.render.call(this, content);
    } catch (error) {
      console.error(`Error loading page ${pageName}:`, error);
      Utils.showError(content, 'Erreur lors du chargement de la page');
    }
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    this.sidebarOpen = !this.sidebarOpen;
    
    if (this.sidebarOpen) {
      sidebar.classList.remove('hidden');
      if (window.innerWidth >= 768) {
        mainContent.classList.remove('full-width');
      } else {
        sidebar.classList.add('mobile-open');
      }
    } else {
      if (window.innerWidth >= 768) {
        sidebar.classList.add('hidden');
        mainContent.classList.add('full-width');
      } else {
        sidebar.classList.remove('mobile-open');
      }
    }
  }

  /**
   * Logout user
   */
  async logout() {
    const confirmed = await Utils.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
    if (confirmed) {
      window.auth.logout();
    }
  }

  /**
   * Get user initials
   */
  getInitials(fullName) {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Get subscription limit text
   */
  getSubscriptionLimitText(tier) {
    const limits = {
      'free': '1 propriété, 1 locataire',
      'starter': '10 propriétés, 50 locataires',
      'pro': '50 propriétés, 200 locataires',
      'enterprise': 'Illimité'
    };
    return limits[tier] || limits['free'];
  }

  /**
   * Page render functions - placeholders, will be implemented in separate files
   */
  async renderDashboard(content) {
    if (window.DashboardPage) {
      await window.DashboardPage.render(content);
    } else {
      content.innerHTML = '<p>Dashboard page loading...</p>';
    }
  }

  async renderProperties(content) {
    if (window.PropertiesPage) {
      await window.PropertiesPage.render(content);
    } else {
      content.innerHTML = '<p>Properties page loading...</p>';
    }
  }

  async renderTenants(content) {
    if (window.TenantsPage) {
      await window.TenantsPage.render(content);
    } else {
      content.innerHTML = '<p>Tenants page loading...</p>';
    }
  }

  async renderPayments(content) {
    if (window.PaymentsPage) {
      await window.PaymentsPage.render(content);
    } else {
      content.innerHTML = '<p>Payments page loading...</p>';
    }
  }

  async renderExpenses(content) {
    if (window.ExpensesPage) {
      await window.ExpensesPage.render(content);
    } else {
      content.innerHTML = '<p>Expenses page loading...</p>';
    }
  }

  async renderProviders(content) {
    if (window.ProvidersPage) {
      await window.ProvidersPage.render(content);
    } else {
      content.innerHTML = '<p>Providers page loading...</p>';
    }
  }

  async renderSettings(content) {
    if (window.SettingsPage) {
      await window.SettingsPage.render(content);
    } else {
      content.innerHTML = '<p>Settings page loading...</p>';
    }
  }
}

// Export layout manager globally
window.LayoutManager = LayoutManager;
