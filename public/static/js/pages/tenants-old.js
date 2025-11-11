/**
 * LokoManager - Tenants Page (Minimal Version)
 */
window.TenantsPage = {
  data: { tenants: [] },
  async render(container) {
    try {
      const response = await api.getTenants();
      this.data.tenants = response.data || [];
      container.innerHTML = `
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-800">Locataires</h2>
            <button class="btn btn-primary" onclick="Utils.showToast('Fonctionnalité en cours de développement', 'info')">
              <i class="fas fa-plus mr-2"></i>Ajouter un locataire
            </button>
          </div>
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            ${this.data.tenants.length > 0 ? `
              <table class="data-table">
                <thead><tr>
                  <th>Nom</th><th>Téléphone</th><th>Propriété</th><th>Loyer</th><th>Statut</th>
                </tr></thead>
                <tbody>
                  ${this.data.tenants.map(t => `
                    <tr>
                      <td>${t.full_name}</td>
                      <td>${Utils.formatPhone(t.phone)}</td>
                      <td>${t.property_id}</td>
                      <td>${Utils.formatCurrency(t.monthly_rent)}</td>
                      <td>${Utils.getStatusBadge(t.status)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<div class="p-12 text-center text-gray-500">Aucun locataire</div>'}
          </div>
        </div>
      `;
    } catch (error) {
      Utils.showError(container, error.message);
    }
  }
};
