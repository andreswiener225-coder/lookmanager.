/**
 * LokoManager - Dashboard Page
 * Main overview with statistics, charts, and recent activities
 */

window.DashboardPage = {
  data: {
    stats: null,
    revenue: null,
    recentPayments: null
  },

  /**
   * Render dashboard page
   */
  async render(container) {
    try {
      // Fetch all dashboard data
      await this.fetchData();

      container.innerHTML = this.getHTML();
      
      // Initialize charts
      this.initializeCharts();
      
      // Attach event listeners
      this.attachEventListeners();
    } catch (error) {
      console.error('Dashboard render error:', error);
      Utils.showError(container, error.message || 'Erreur lors du chargement du dashboard');
    }
  },

  /**
   * Fetch all dashboard data
   */
  async fetchData() {
    try {
      // Fetch dashboard stats
      const dashboardResponse = await api.getDashboard();
      this.data.stats = dashboardResponse.data;

      // Fetch revenue data
      const revenueResponse = await api.getRevenue();
      this.data.revenue = revenueResponse.data;

      // Fetch recent pending payments
      const paymentsResponse = await api.getPendingPayments();
      this.data.recentPayments = (paymentsResponse.data || []).slice(0, 5);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  /**
   * Get dashboard HTML
   */
  getHTML() {
    const stats = this.data.stats;

    return `
      <div class="space-y-6">
        <!-- Welcome Banner -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 text-white">
          <h1 class="text-2xl font-bold mb-2">Bienvenue, ${window.auth.user.full_name} ! 👋</h1>
          <p class="text-blue-100">Voici un aperçu de votre portefeuille immobilier aujourd'hui.</p>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Properties Card -->
          <div class="stat-card">
            <div class="stat-card-icon bg-blue-100 text-blue-600">
              <i class="fas fa-building"></i>
            </div>
            <div class="stat-card-value">${stats.properties.total || 0}</div>
            <div class="stat-card-label">Propriétés totales</div>
            <div class="mt-3 flex justify-between text-sm">
              <span class="text-green-600">
                <i class="fas fa-check-circle"></i> ${stats.properties.occupied || 0} occupées
              </span>
              <span class="text-yellow-600">
                <i class="fas fa-door-open"></i> ${stats.properties.vacant || 0} vacantes
              </span>
            </div>
          </div>

          <!-- Tenants Card -->
          <div class="stat-card">
            <div class="stat-card-icon bg-green-100 text-green-600">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-card-value">${stats.tenants.active || 0}</div>
            <div class="stat-card-label">Locataires actifs</div>
            <div class="mt-3 text-sm text-gray-600">
              <i class="fas fa-info-circle"></i> ${stats.tenants.total || 0} au total
            </div>
          </div>

          <!-- Revenue Card -->
          <div class="stat-card">
            <div class="stat-card-icon bg-indigo-100 text-indigo-600">
              <i class="fas fa-coins"></i>
            </div>
            <div class="stat-card-value text-2xl">${Utils.formatCurrency(stats.revenue.this_month?.received || 0)}</div>
            <div class="stat-card-label">Revenus ce mois</div>
            <div class="mt-3 flex justify-between text-sm">
              <span class="text-green-600">
                <i class="fas fa-check"></i> Reçus
              </span>
              <span class="text-red-600">
                ${Utils.formatCurrency(stats.revenue.this_month?.late_amount || 0)} en retard
              </span>
            </div>
          </div>

          <!-- Expenses Card -->
          <div class="stat-card">
            <div class="stat-card-icon bg-red-100 text-red-600">
              <i class="fas fa-receipt"></i>
            </div>
            <div class="stat-card-value text-2xl">${Utils.formatCurrency(stats.expenses.this_month || 0)}</div>
            <div class="stat-card-label">Dépenses ce mois</div>
            <div class="mt-3 text-sm text-gray-600">
              <i class="fas fa-chart-line"></i> ${stats.expenses.total_count || 0} transactions
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Revenue Chart -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">
              <i class="fas fa-chart-bar text-blue-600 mr-2"></i>
              Revenus des 12 derniers mois
            </h3>
            <canvas id="revenueChart" height="250"></canvas>
          </div>

          <!-- Occupancy Chart -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">
              <i class="fas fa-chart-pie text-green-600 mr-2"></i>
              Taux d'occupation
            </h3>
            <canvas id="occupancyChart" height="250"></canvas>
          </div>
        </div>

        <!-- Recent Payments & Quick Actions -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Recent Pending Payments -->
          <div class="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-800">
                <i class="fas fa-exclamation-triangle text-red-600 mr-2"></i>
                Paiements en retard
              </h3>
              <a href="#" class="text-blue-600 hover:text-blue-700 text-sm font-medium" data-navigate="payments">
                Voir tout <i class="fas fa-arrow-right ml-1"></i>
              </a>
            </div>

            ${this.getRecentPaymentsHTML()}
          </div>

          <!-- Quick Actions -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">
              <i class="fas fa-bolt text-yellow-600 mr-2"></i>
              Actions rapides
            </h3>
            <div class="space-y-3">
              <button class="w-full btn btn-primary text-left" data-action="add-property">
                <i class="fas fa-plus-circle mr-2"></i>
                Ajouter une propriété
              </button>
              <button class="w-full btn btn-success text-left" data-action="add-tenant">
                <i class="fas fa-user-plus mr-2"></i>
                Ajouter un locataire
              </button>
              <button class="w-full btn btn-outline text-left" data-action="record-payment">
                <i class="fas fa-money-bill-wave mr-2"></i>
                Enregistrer un paiement
              </button>
              <button class="w-full btn btn-outline text-left" data-action="add-expense">
                <i class="fas fa-receipt mr-2"></i>
                Ajouter une dépense
              </button>
            </div>

            <!-- Subscription Info -->
            <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p class="text-xs font-semibold text-blue-800 uppercase mb-2">
                Forfait ${window.auth.user.subscription_tier || 'Gratuit'}
              </p>
              <p class="text-xs text-blue-600 mb-3">
                ${this.getSubscriptionInfo()}
              </p>
              ${this.getUpgradeButton()}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Get recent payments HTML
   */
  getRecentPaymentsHTML() {
    const payments = this.data.recentPayments;

    if (!payments || payments.length === 0) {
      return `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-check-circle text-4xl mb-2"></i>
          <p>Aucun paiement en retard ! 🎉</p>
        </div>
      `;
    }

    return `
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="text-xs text-gray-600 uppercase bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left">Locataire</th>
              <th class="px-4 py-2 text-left">Propriété</th>
              <th class="px-4 py-2 text-right">Montant</th>
              <th class="px-4 py-2 text-center">Retard</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${payments.map(payment => `
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm">
                  <i class="fas fa-user text-gray-400 mr-2"></i>
                  ${payment.tenant_name || 'N/A'}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  ${Utils.truncate(payment.property_name || 'N/A', 30)}
                </td>
                <td class="px-4 py-3 text-sm font-semibold text-right text-red-600">
                  ${Utils.formatCurrency(payment.amount)}
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    ${payment.days_late || 0} jours
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  /**
   * Get subscription info text
   */
  getSubscriptionInfo() {
    const tier = window.auth.user.subscription_tier || 'free';
    const limits = {
      'free': 'Limité à 1 propriété et 1 locataire',
      'starter': 'Jusqu\'à 10 propriétés et 50 locataires',
      'pro': 'Jusqu\'à 50 propriétés et 200 locataires',
      'enterprise': 'Propriétés et locataires illimités'
    };
    return limits[tier] || limits['free'];
  },

  /**
   * Get upgrade button if needed
   */
  getUpgradeButton() {
    const tier = window.auth.user.subscription_tier || 'free';
    if (tier === 'enterprise') {
      return '';
    }
    return `
      <button class="w-full btn btn-primary text-sm py-2" data-action="upgrade">
        <i class="fas fa-crown mr-2"></i>
        Mettre à niveau
      </button>
    `;
  },

  /**
   * Initialize charts
   */
  initializeCharts() {
    this.initRevenueChart();
    this.initOccupancyChart();
  },

  /**
   * Initialize revenue chart
   */
  initRevenueChart() {
    const revenue = this.data.revenue || [];
    const ctx = document.getElementById('revenueChart');
    
    if (!ctx) return;

    // Prepare data for last 12 months
    const labels = revenue.map(item => Utils.getMonthName(item.month) + ' ' + item.year);
    const receivedData = revenue.map(item => item.received || 0);
    const lateData = revenue.map(item => item.late || 0);

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Reçus',
            data: receivedData,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1
          },
          {
            label: 'En retard',
            data: lateData,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + Utils.formatCurrency(context.parsed.y);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toLocaleString('fr-FR') + ' FCFA';
              }
            }
          }
        }
      }
    });
  },

  /**
   * Initialize occupancy chart
   */
  initOccupancyChart() {
    const stats = this.data.stats;
    const ctx = document.getElementById('occupancyChart');
    
    if (!ctx) return;

    const occupied = stats.properties.occupied || 0;
    const vacant = stats.properties.vacant || 0;
    const maintenance = stats.properties.maintenance || 0;

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Occupées', 'Vacantes', 'Maintenance'],
        datasets: [{
          data: [occupied, vacant, maintenance],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
              }
            }
          }
        }
      }
    });
  },

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Navigation links
    document.querySelectorAll('[data-navigate]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.navigate;
        if (window.layout) {
          window.layout.loadPage(page);
        }
      });
    });

    // Quick action buttons
    document.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const action = button.dataset.action;
        this.handleQuickAction(action);
      });
    });
  },

  /**
   * Handle quick actions
   */
  async handleQuickAction(action) {
    switch (action) {
      case 'add-property':
        if (window.layout) {
          await window.layout.loadPage('properties');
          // Trigger add property modal if exists
          setTimeout(() => {
            const addBtn = document.querySelector('[data-action="create-property"]');
            if (addBtn) addBtn.click();
          }, 100);
        }
        break;
      case 'add-tenant':
        if (window.layout) {
          await window.layout.loadPage('tenants');
          setTimeout(() => {
            const addBtn = document.querySelector('[data-action="create-tenant"]');
            if (addBtn) addBtn.click();
          }, 100);
        }
        break;
      case 'record-payment':
        if (window.layout) {
          window.layout.loadPage('payments');
        }
        break;
      case 'add-expense':
        if (window.layout) {
          await window.layout.loadPage('expenses');
          setTimeout(() => {
            const addBtn = document.querySelector('[data-action="create-expense"]');
            if (addBtn) addBtn.click();
          }, 100);
        }
        break;
      case 'upgrade':
        Utils.showToast('Fonctionnalité de mise à niveau disponible prochainement !', 'info');
        break;
    }
  }
};
