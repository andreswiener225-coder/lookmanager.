/**
 * LokoManager - Payments Page (Minimal Version)
 */
window.PaymentsPage = {
  data: { payments: [] },
  async render(container) {
    try {
      const response = await api.getPayments();
      this.data.payments = response.data || [];
      container.innerHTML = `
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-800">Paiements</h2>
            <button class="btn btn-primary" onclick="Utils.showToast('Fonctionnalité en cours de développement', 'info')">
              <i class="fas fa-plus mr-2"></i>Enregistrer un paiement
            </button>
          </div>
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            ${this.data.payments.length > 0 ? `
              <table class="data-table">
                <thead><tr>
                  <th>Date d'échéance</th><th>Locataire</th><th>Montant</th><th>Statut</th>
                </tr></thead>
                <tbody>
                  ${this.data.payments.map(p => `
                    <tr>
                      <td>${Utils.formatDate(p.due_date)}</td>
                      <td>${p.tenant_id}</td>
                      <td>${Utils.formatCurrency(p.amount)}</td>
                      <td>${Utils.getStatusBadge(p.status)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<div class="p-12 text-center text-gray-500">Aucun paiement</div>'}
          </div>
        </div>
      `;
    } catch (error) {
      Utils.showError(container, error.message);
    }
  }
};
