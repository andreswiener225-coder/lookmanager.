/**
 * LokoManager - Expenses Page (Complete Version)
 * Gestion complète des dépenses et charges
 */
window.ExpensesPage = {
  data: { 
    expenses: [],
    properties: [],
    filters: {
      category: '',
      property_id: '',
      start_date: '',
      end_date: ''
    },
    editingId: null
  },

  categories: {
    maintenance: { label: 'Maintenance', icon: 'fa-tools', color: 'blue' },
    taxes: { label: 'Taxes', icon: 'fa-file-invoice', color: 'red' },
    insurance: { label: 'Assurance', icon: 'fa-shield-alt', color: 'green' },
    utilities: { label: 'Services publics', icon: 'fa-bolt', color: 'yellow' },
    repairs: { label: 'Réparations', icon: 'fa-wrench', color: 'purple' },
    other: { label: 'Autres', icon: 'fa-ellipsis-h', color: 'gray' }
  },

  async loadData() {
    const [expensesRes, propertiesRes] = await Promise.all([
      api.getExpenses(this.data.filters),
      api.getProperties()
    ]);
    this.data.expenses = expensesRes.data || [];
    this.data.properties = propertiesRes.data || [];
  },

  calculateStats() {
    const total = this.data.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const byCategory = {};
    this.data.expenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });
    const thisMonth = this.data.expenses.filter(e => {
      const date = new Date(e.expense_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + e.amount, 0);
    return { total, byCategory, thisMonth };
  },

  async render(container) {
    try {
      await this.loadData();
      const stats = this.calculateStats();
      
      container.innerHTML = `
        <div class="space-y-6">
          <!-- Header -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 class="text-2xl font-bold text-gray-800">
                <i class="fas fa-receipt mr-2 text-blue-600"></i>
                Gestion des Dépenses
              </h2>
              <p class="text-gray-500">Suivez toutes vos charges et dépenses immobilières</p>
            </div>
            <button class="btn btn-primary" onclick="ExpensesPage.showModal()">
              <i class="fas fa-plus mr-2"></i>Nouvelle dépense
            </button>
          </div>

          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white rounded-xl p-4 border border-gray-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Total Dépenses</p>
                  <p class="text-2xl font-bold text-gray-800">${Utils.formatCurrency(stats.total)}</p>
                </div>
                <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-calculator text-red-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-xl p-4 border border-gray-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Ce mois</p>
                  <p class="text-2xl font-bold text-orange-600">${Utils.formatCurrency(stats.thisMonth)}</p>
                </div>
                <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-calendar-alt text-orange-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-xl p-4 border border-gray-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Nombre de dépenses</p>
                  <p class="text-2xl font-bold text-blue-600">${this.data.expenses.length}</p>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-list text-blue-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-xl p-4 border border-gray-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Moyenne/dépense</p>
                  <p class="text-2xl font-bold text-green-600">${Utils.formatCurrency(this.data.expenses.length > 0 ? stats.total / this.data.expenses.length : 0)}</p>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-chart-bar text-green-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Filters -->
          <div class="bg-white rounded-xl p-4 border border-gray-200">
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <select id="filterCategory" class="form-input" onchange="ExpensesPage.applyFilters()">
                  <option value="">Toutes</option>
                  ${Object.entries(this.categories).map(([key, cat]) => 
                    `<option value="${key}">${cat.label}</option>`
                  ).join('')}
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Propriété</label>
                <select id="filterProperty" class="form-input" onchange="ExpensesPage.applyFilters()">
                  <option value="">Toutes</option>
                  ${this.data.properties.map(p => 
                    `<option value="${p.id}">${p.name}</option>`
                  ).join('')}
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                <input type="date" id="filterStartDate" class="form-input" onchange="ExpensesPage.applyFilters()">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                <input type="date" id="filterEndDate" class="form-input" onchange="ExpensesPage.applyFilters()">
              </div>
              <div class="flex items-end">
                <button class="btn btn-outline w-full" onclick="ExpensesPage.resetFilters()">
                  <i class="fas fa-undo mr-2"></i>Réinitialiser
                </button>
              </div>
            </div>
          </div>

          <!-- Expenses Table -->
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            ${this.data.expenses.length > 0 ? `
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propriété</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                      <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    ${this.data.expenses.map(expense => {
                      const cat = this.categories[expense.category] || this.categories.other;
                      return `
                        <tr class="hover:bg-gray-50">
                          <td class="px-4 py-3 text-sm text-gray-900">${Utils.formatDate(expense.expense_date)}</td>
                          <td class="px-4 py-3">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${cat.color}-100 text-${cat.color}-800">
                              <i class="fas ${cat.icon} mr-1"></i>
                              ${cat.label}
                            </span>
                          </td>
                          <td class="px-4 py-3 text-sm text-gray-900">${expense.description}</td>
                          <td class="px-4 py-3 text-sm text-gray-500">${expense.property_name || '-'}</td>
                          <td class="px-4 py-3 text-sm font-semibold text-red-600 text-right">${Utils.formatCurrency(expense.amount)}</td>
                          <td class="px-4 py-3 text-center">
                            <button class="text-blue-600 hover:text-blue-800 mx-1" onclick="ExpensesPage.editExpense(${expense.id})" title="Modifier">
                              <i class="fas fa-edit"></i>
                            </button>
                            <button class="text-red-600 hover:text-red-800 mx-1" onclick="ExpensesPage.deleteExpense(${expense.id})" title="Supprimer">
                              <i class="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div class="p-12 text-center">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="fas fa-receipt text-gray-400 text-2xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-1">Aucune dépense</h3>
                <p class="text-gray-500 mb-4">Commencez à enregistrer vos dépenses pour suivre vos charges</p>
                <button class="btn btn-primary" onclick="ExpensesPage.showModal()">
                  <i class="fas fa-plus mr-2"></i>Ajouter une dépense
                </button>
              </div>
            `}
          </div>
        </div>

        <!-- Modal -->
        <div id="expenseModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4">
          <div class="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
              <div class="flex justify-between items-center mb-6">
                <h3 id="modalTitle" class="text-xl font-bold text-gray-800">Nouvelle dépense</h3>
                <button onclick="ExpensesPage.hideModal()" class="text-gray-400 hover:text-gray-600">
                  <i class="fas fa-times text-xl"></i>
                </button>
              </div>
              <form id="expenseForm" onsubmit="ExpensesPage.saveExpense(event)">
                <input type="hidden" id="expenseId">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                    <select id="expenseCategory" class="form-input" required>
                      ${Object.entries(this.categories).map(([key, cat]) => 
                        `<option value="${key}">${cat.label}</option>`
                      ).join('')}
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA) *</label>
                    <input type="number" id="expenseAmount" class="form-input" required min="1" placeholder="Ex: 50000">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input type="date" id="expenseDate" class="form-input" required>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea id="expenseDescription" class="form-input" required rows="3" placeholder="Décrivez la dépense..."></textarea>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Propriété (optionnel)</label>
                    <select id="expenseProperty" class="form-input">
                      <option value="">Aucune propriété spécifique</option>
                      ${this.data.properties.map(p => 
                        `<option value="${p.id}">${p.name}</option>`
                      ).join('')}
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Payé à (optionnel)</label>
                    <input type="text" id="expensePaidTo" class="form-input" placeholder="Nom du bénéficiaire">
                  </div>
                </div>
                <div class="flex gap-3 mt-6">
                  <button type="button" onclick="ExpensesPage.hideModal()" class="btn btn-outline flex-1">
                    Annuler
                  </button>
                  <button type="submit" class="btn btn-primary flex-1">
                    <i class="fas fa-save mr-2"></i>Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('ExpensesPage error:', error);
      Utils.showError(container, error.message);
    }
  },

  showModal(expense = null) {
    this.data.editingId = expense ? expense.id : null;
    document.getElementById('modalTitle').textContent = expense ? 'Modifier la dépense' : 'Nouvelle dépense';
    document.getElementById('expenseId').value = expense ? expense.id : '';
    document.getElementById('expenseCategory').value = expense ? expense.category : 'maintenance';
    document.getElementById('expenseAmount').value = expense ? expense.amount : '';
    document.getElementById('expenseDate').value = expense ? expense.expense_date : new Date().toISOString().split('T')[0];
    document.getElementById('expenseDescription').value = expense ? expense.description : '';
    document.getElementById('expenseProperty').value = expense ? expense.property_id || '' : '';
    document.getElementById('expensePaidTo').value = expense ? expense.paid_to || '' : '';
    document.getElementById('expenseModal').classList.remove('hidden');
  },

  hideModal() {
    document.getElementById('expenseModal').classList.add('hidden');
    document.getElementById('expenseForm').reset();
    this.data.editingId = null;
  },

  async saveExpense(event) {
    event.preventDefault();
    try {
      const data = {
        category: document.getElementById('expenseCategory').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        expense_date: document.getElementById('expenseDate').value,
        description: document.getElementById('expenseDescription').value,
        property_id: document.getElementById('expenseProperty').value || null,
        paid_to: document.getElementById('expensePaidTo').value || null
      };

      if (this.data.editingId) {
        await api.updateExpense(this.data.editingId, data);
        Utils.showToast('Dépense modifiée avec succès', 'success');
      } else {
        await api.createExpense(data);
        Utils.showToast('Dépense enregistrée avec succès', 'success');
      }
      
      this.hideModal();
      await this.render(document.getElementById('page-content'));
    } catch (error) {
      Utils.showToast(error.message, 'error');
    }
  },

  async editExpense(id) {
    const expense = this.data.expenses.find(e => e.id === id);
    if (expense) this.showModal(expense);
  },

  async deleteExpense(id) {
    if (!confirm('Voulez-vous vraiment supprimer cette dépense ?')) return;
    try {
      await api.deleteExpense(id);
      Utils.showToast('Dépense supprimée', 'success');
      await this.render(document.getElementById('page-content'));
    } catch (error) {
      Utils.showToast(error.message, 'error');
    }
  },

  async applyFilters() {
    this.data.filters = {
      category: document.getElementById('filterCategory').value,
      property_id: document.getElementById('filterProperty').value,
      start_date: document.getElementById('filterStartDate').value,
      end_date: document.getElementById('filterEndDate').value
    };
    await this.render(document.getElementById('page-content'));
  },

  async resetFilters() {
    this.data.filters = { category: '', property_id: '', start_date: '', end_date: '' };
    await this.render(document.getElementById('page-content'));
  }
};
