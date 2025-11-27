/**
 * LokoManager - Payments Page (Full Version)
 * Gestion complète des paiements de loyer
 */
window.PaymentsPage = {
  data: {
    payments: [],
    tenants: [],
    properties: []
  },

  async init() {
    await this.fetchData();
  },

  async fetchData() {
    try {
      const [paymentsRes, tenantsRes, propertiesRes] = await Promise.all([
        api.getPayments(),
        api.getTenants(),
        api.getProperties()
      ]);
      
      this.data.payments = paymentsRes.data || [];
      this.data.tenants = tenantsRes.data || [];
      this.data.properties = propertiesRes.data || [];
    } catch (error) {
      console.error('Error fetching data:', error);
      Utils.showToast('Erreur lors du chargement des données', 'error');
    }
  },

  async render(container) {
    await this.init();
    
    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-money-bill-wave mr-2"></i>
              Gestion des Paiements
            </h2>
            <p class="text-sm text-gray-600 mt-1">Suivez les loyers et enregistrez les paiements</p>
          </div>
          <button class="btn btn-primary" data-action="create-payment">
            <i class="fas fa-plus mr-2"></i>
            Enregistrer un paiement
          </button>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="form-group">
              <label class="form-label">Statut</label>
              <select id="filterStatus" class="form-select">
                <option value="">Tous</option>
                <option value="pending">En attente</option>
                <option value="paid">Payé</option>
                <option value="late">En retard</option>
                <option value="partial">Partiel</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Locataire</label>
              <select id="filterTenant" class="form-select">
                <option value="">Tous</option>
                ${this.data.tenants.map(t => `
                  <option value="${t.id}">${t.full_name}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Mois</label>
              <input type="month" id="filterMonth" class="form-input">
            </div>
            <div class="form-group flex items-end">
              <button class="btn btn-secondary w-full" onclick="PaymentsPage.applyFilters()">
                <i class="fas fa-filter mr-2"></i>Filtrer
              </button>
            </div>
          </div>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          ${this.getStatisticsHTML()}
        </div>

        <!-- Payments Table -->
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div class="p-4 border-b border-gray-200 bg-gray-50">
            <h3 class="font-semibold text-gray-800">
              <i class="fas fa-list mr-2"></i>
              Liste des paiements (${this.data.payments.length})
            </h3>
          </div>
          ${this.getPaymentsTableHTML()}
        </div>
      </div>

      <!-- Create/Edit Modal -->
      ${this.getModalHTML()}
    `;

    this.attachEventListeners();
  },

  getStatisticsHTML() {
    const total = this.data.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const paid = this.data.payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const pending = this.data.payments.filter(p => p.status === 'pending' || p.status === 'late').reduce((sum, p) => sum + p.amount, 0);
    const late = this.data.payments.filter(p => p.status === 'late').length;

    return `
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total attendu</p>
            <p class="text-2xl font-bold text-gray-800">${Utils.formatCurrency(total)}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-coins text-blue-600 text-xl"></i>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Payé</p>
            <p class="text-2xl font-bold text-green-600">${Utils.formatCurrency(paid)}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <i class="fas fa-check-circle text-green-600 text-xl"></i>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">En attente</p>
            <p class="text-2xl font-bold text-orange-600">${Utils.formatCurrency(pending)}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <i class="fas fa-clock text-orange-600 text-xl"></i>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">En retard</p>
            <p class="text-2xl font-bold text-red-600">${late} paiement${late > 1 ? 's' : ''}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
          </div>
        </div>
      </div>
    `;
  },

  getPaymentsTableHTML() {
    if (this.data.payments.length === 0) {
      return `
        <div class="p-12 text-center text-gray-500">
          <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
          <p class="text-lg">Aucun paiement enregistré</p>
          <p class="text-sm mt-2">Cliquez sur "Enregistrer un paiement" pour commencer</p>
        </div>
      `;
    }

    return `
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date d'échéance</th>
              <th>Locataire</th>
              <th>Propriété</th>
              <th>Mois</th>
              <th>Montant</th>
              <th>Payé le</th>
              <th>Méthode</th>
              <th>Statut</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.data.payments.map(payment => this.getPaymentRowHTML(payment)).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  getPaymentRowHTML(payment) {
    const tenant = this.data.tenants.find(t => t.id === payment.tenant_id);
    const property = this.data.properties.find(p => p.id === payment.property_id);
    
    return `
      <tr>
        <td>${Utils.formatDate(payment.due_date)}</td>
        <td>${tenant ? tenant.full_name : 'N/A'}</td>
        <td class="text-sm text-gray-600">${property ? property.name : 'N/A'}</td>
        <td>${payment.payment_month || 'N/A'}</td>
        <td class="font-semibold">${Utils.formatCurrency(payment.amount)}</td>
        <td>${payment.paid_date ? Utils.formatDate(payment.paid_date) : '-'}</td>
        <td>${this.getPaymentMethodLabel(payment.payment_method)}</td>
        <td>${this.getPaymentStatusBadge(payment.status)}</td>
        <td class="text-center">
          <div class="flex items-center justify-center space-x-2">
            ${payment.status !== 'paid' ? `
              <button class="btn btn-sm btn-success" data-action="record-payment" data-id="${payment.id}" title="Enregistrer paiement">
                <i class="fas fa-check"></i>
              </button>
            ` : `
              <button class="btn btn-sm btn-primary" data-action="download-receipt" data-id="${payment.id}" title="Télécharger reçu">
                <i class="fas fa-file-pdf"></i>
              </button>
            `}
            <button class="btn btn-sm btn-outline" data-action="edit-payment" data-id="${payment.id}" title="Modifier">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" data-action="delete-payment" data-id="${payment.id}" title="Supprimer">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  getPaymentMethodLabel(method) {
    const labels = {
      'orange_money': 'Orange Money',
      'mtn_money': 'MTN Money',
      'moov_money': 'Moov Money',
      'wave': 'Wave',
      'cash': 'Espèces',
      'bank_transfer': 'Virement bancaire',
      'check': 'Chèque'
    };
    return method ? `<span class="text-xs bg-gray-100 px-2 py-1 rounded">${labels[method] || method}</span>` : '-';
  },

  getPaymentStatusBadge(status) {
    const badges = {
      'pending': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">En attente</span>',
      'paid': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Payé</span>',
      'late': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">En retard</span>',
      'partial': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Partiel</span>'
    };
    return badges[status] || status;
  },

  getModalHTML() {
    return `
      <div id="paymentModal" class="modal-overlay hidden">
        <div class="modal-content max-w-3xl">
          <div class="modal-header">
            <h3 class="modal-title" id="modalTitle">Enregistrer un paiement</h3>
            <button class="text-gray-400 hover:text-gray-600" data-action="close-modal">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="paymentForm" class="space-y-4">
              <input type="hidden" id="paymentId">
              
              <!-- Payment Information -->
              <div class="border-b pb-4">
                <h4 class="font-semibold text-gray-700 mb-3">
                  <i class="fas fa-info-circle mr-2"></i>
                  Informations du paiement
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="form-group">
                    <label for="paymentTenant" class="form-label">Locataire *</label>
                    <select id="paymentTenant" class="form-select" required>
                      <option value="">Sélectionnez un locataire...</option>
                      ${this.data.tenants.filter(t => t.status === 'active').map(tenant => `
                        <option value="${tenant.id}" data-rent="${tenant.monthly_rent}" data-property="${tenant.property_id}">
                          ${tenant.full_name} - ${Utils.formatCurrency(tenant.monthly_rent)}/mois
                        </option>
                      `).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="paymentMonth" class="form-label">Mois concerné *</label>
                    <input type="month" id="paymentMonth" class="form-input" required>
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="form-group">
                    <label for="paymentAmount" class="form-label">Montant (FCFA) *</label>
                    <input type="number" id="paymentAmount" class="form-input" required min="0" step="1">
                  </div>
                  <div class="form-group">
                    <label for="paymentDueDate" class="form-label">Date d'échéance *</label>
                    <input type="date" id="paymentDueDate" class="form-input" required>
                  </div>
                </div>
              </div>

              <!-- Payment Status -->
              <div class="border-b pb-4">
                <h4 class="font-semibold text-gray-700 mb-3">
                  <i class="fas fa-check-circle mr-2"></i>
                  Statut et enregistrement
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="form-group">
                    <label for="paymentStatus" class="form-label">Statut *</label>
                    <select id="paymentStatus" class="form-select" required>
                      <option value="pending">En attente</option>
                      <option value="paid">Payé</option>
                      <option value="partial">Partiel</option>
                      <option value="late">En retard</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="paymentPaidDate" class="form-label">Date de paiement</label>
                    <input type="date" id="paymentPaidDate" class="form-input">
                    <small class="text-xs text-gray-500">Laisser vide si non payé</small>
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="form-group">
                    <label for="paymentMethod" class="form-label">Méthode de paiement</label>
                    <select id="paymentMethod" class="form-select">
                      <option value="">Sélectionnez...</option>
                      <option value="cash">💵 Espèces</option>
                      <option value="orange_money">🟠 Orange Money</option>
                      <option value="mtn_money">🟡 MTN Money</option>
                      <option value="moov_money">🔵 Moov Money</option>
                      <option value="wave">🌊 Wave</option>
                      <option value="bank_transfer">🏦 Virement bancaire</option>
                      <option value="check">📋 Chèque</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="paymentReference" class="form-label">Référence transaction</label>
                    <input type="text" id="paymentReference" class="form-input" placeholder="Ex: TXN123456789">
                  </div>
                </div>
              </div>

              <!-- Notes -->
              <div class="form-group">
                <label for="paymentNotes" class="form-label">Notes</label>
                <textarea id="paymentNotes" class="form-textarea" rows="2" placeholder="Informations complémentaires..."></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-action="close-modal">
              Annuler
            </button>
            <button type="submit" form="paymentForm" class="btn btn-primary" id="savePaymentBtn">
              <i class="fas fa-save mr-2"></i>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    `;
  },

  attachEventListeners() {
    // Create payment button
    document.querySelectorAll('[data-action="create-payment"]').forEach(btn => {
      btn.addEventListener('click', () => this.openModal());
    });

    // Edit payment buttons
    document.querySelectorAll('[data-action="edit-payment"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.openModal(id);
      });
    });

    // Record payment buttons
    document.querySelectorAll('[data-action="record-payment"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.recordPayment(id);
      });
    });

    // Download receipt buttons
    document.querySelectorAll('[data-action="download-receipt"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.downloadReceipt(id);
      });
    });

    // Delete payment buttons
    document.querySelectorAll('[data-action="delete-payment"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        await this.deletePayment(id);
      });
    });

    // Close modal buttons
    document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });

    // Form submission
    document.getElementById('paymentForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.savePayment();
    });

    // Auto-fill amount when tenant is selected
    document.getElementById('paymentTenant').addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const rent = selectedOption.dataset.rent;
      if (rent) {
        document.getElementById('paymentAmount').value = rent;
      }
    });

    // Auto-set due date to 5th of selected month
    document.getElementById('paymentMonth').addEventListener('change', (e) => {
      const month = e.target.value; // Format: YYYY-MM
      if (month) {
        const dueDate = `${month}-05`; // 5th of the month
        document.getElementById('paymentDueDate').value = dueDate;
      }
    });

    // Auto-enable paid date when status is "paid"
    document.getElementById('paymentStatus').addEventListener('change', (e) => {
      const paidDateInput = document.getElementById('paymentPaidDate');
      if (e.target.value === 'paid' && !paidDateInput.value) {
        paidDateInput.value = new Date().toISOString().split('T')[0]; // Today
      }
    });
  },

  async openModal(id = null) {
    const modal = document.getElementById('paymentModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('paymentForm');

    form.reset();
    document.getElementById('paymentId').value = '';

    if (id) {
      title.textContent = 'Modifier le paiement';
      try {
        const response = await api.getPayment(id);
        const payment = response.data;
        this.fillForm(payment);
      } catch (error) {
        Utils.showToast('Erreur lors du chargement du paiement', 'error');
        return;
      }
    } else {
      title.textContent = 'Enregistrer un paiement';
      // Set default month to current month
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      document.getElementById('paymentMonth').value = currentMonth;
    }

    modal.classList.remove('hidden');
  },

  closeModal() {
    document.getElementById('paymentModal').classList.add('hidden');
  },

  fillForm(payment) {
    document.getElementById('paymentId').value = payment.id;
    document.getElementById('paymentTenant').value = payment.tenant_id;
    document.getElementById('paymentMonth').value = payment.payment_month || '';
    document.getElementById('paymentAmount').value = payment.amount;
    document.getElementById('paymentDueDate').value = Utils.formatDateInput(payment.due_date);
    document.getElementById('paymentStatus').value = payment.status;
    document.getElementById('paymentPaidDate').value = payment.paid_date ? Utils.formatDateInput(payment.paid_date) : '';
    document.getElementById('paymentMethod').value = payment.payment_method || '';
    document.getElementById('paymentReference').value = payment.transaction_reference || '';
    document.getElementById('paymentNotes').value = payment.notes || '';
  },

  async savePayment() {
    const id = document.getElementById('paymentId').value;
    const tenantSelect = document.getElementById('paymentTenant');
    const selectedOption = tenantSelect.options[tenantSelect.selectedIndex];
    
    const data = {
      tenant_id: parseInt(tenantSelect.value),
      property_id: parseInt(selectedOption.dataset.property),
      payment_month: document.getElementById('paymentMonth').value,
      amount: parseFloat(document.getElementById('paymentAmount').value),
      due_date: document.getElementById('paymentDueDate').value,
      status: document.getElementById('paymentStatus').value,
      paid_date: document.getElementById('paymentPaidDate').value || null,
      payment_method: document.getElementById('paymentMethod').value || null,
      transaction_reference: document.getElementById('paymentReference').value.trim() || null,
      notes: document.getElementById('paymentNotes').value.trim() || null
    };

    const saveBtn = document.getElementById('savePaymentBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Enregistrement...';

    try {
      if (id) {
        await api.updatePayment(id, data);
        Utils.showToast('Paiement modifié avec succès', 'success');
      } else {
        await api.createPayment(data);
        Utils.showToast('Paiement enregistré avec succès', 'success');
      }

      this.closeModal();
      await this.fetchData();
      
      const container = document.getElementById('app-content');
      await this.render(container);
    } catch (error) {
      console.error('Error saving payment:', error);
      const errorMsg = error.message || error.toString() || 'Erreur lors de l\'enregistrement';
      Utils.showToast(errorMsg, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Enregistrer';
    }
  },

  async recordPayment(id) {
    // Quick action to mark as paid
    const payment = this.data.payments.find(p => p.id === parseInt(id));
    if (!payment) return;

    const confirmed = await Utils.confirm(`Enregistrer le paiement de ${Utils.formatCurrency(payment.amount)} ?`);
    if (!confirmed) return;

    try {
      await api.recordPayment(id, {
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash', // Default
        status: 'paid'
      });

      Utils.showToast('Paiement enregistré avec succès', 'success');
      await this.fetchData();
      
      const container = document.getElementById('app-content');
      await this.render(container);
    } catch (error) {
      Utils.showToast('Erreur lors de l\'enregistrement du paiement', 'error');
    }
  },

  async downloadReceipt(id) {
    try {
      Utils.showToast('Génération du reçu en cours...', 'info');
      
      // Use PDF Generator module
      if (window.PDFGenerator) {
        await window.PDFGenerator.downloadReceiptForPayment(id);
      } else {
        Utils.showToast('Module PDF non chargé. Rechargez la page.', 'error');
      }
    } catch (error) {
      console.error('[Download Receipt Error]', error);
      Utils.showToast('Erreur lors de la génération du reçu', 'error');
    }
  },

  async deletePayment(id) {
    const confirmed = await Utils.confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?');
    if (!confirmed) return;

    try {
      await api.deletePayment(id);
      Utils.showToast('Paiement supprimé avec succès', 'success');
      
      await this.fetchData();
      const container = document.getElementById('app-content');
      await this.render(container);
    } catch (error) {
      Utils.showToast('Erreur lors de la suppression', 'error');
    }
  },

  async applyFilters() {
    const status = document.getElementById('filterStatus').value;
    const tenantId = document.getElementById('filterTenant').value;
    const month = document.getElementById('filterMonth').value;

    const filters = {};
    if (status) filters.status = status;
    if (tenantId) filters.tenant_id = tenantId;
    if (month) filters.month = month;

    try {
      const response = await api.getPayments(filters);
      this.data.payments = response.data || [];
      
      const container = document.getElementById('app-content');
      await this.render(container);
    } catch (error) {
      Utils.showToast('Erreur lors du filtrage', 'error');
    }
  }
};
