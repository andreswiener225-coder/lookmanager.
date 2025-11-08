/**
 * LokoManager - Service Providers Page (Minimal Version)
 */
window.ProvidersPage = {
  data: { providers: [] },
  async render(container) {
    try {
      const response = await api.getServiceProviders();
      this.data.providers = response.data || [];
      container.innerHTML = `
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-800">Prestataires de Services</h2>
            <button class="btn btn-primary" onclick="Utils.showToast('Fonctionnalité en cours de développement', 'info')">
              <i class="fas fa-plus mr-2"></i>Ajouter un prestataire
            </button>
          </div>
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            ${this.data.providers.length > 0 ? `
              <table class="data-table">
                <thead><tr>
                  <th>Nom</th><th>Catégorie</th><th>Téléphone</th><th>Note</th>
                </tr></thead>
                <tbody>
                  ${this.data.providers.map(p => `
                    <tr>
                      <td>${p.name}</td>
                      <td>${Utils.getCategoryLabel(p.category)}</td>
                      <td>${Utils.formatPhone(p.phone)}</td>
                      <td>${'⭐'.repeat(p.rating || 0)} (${p.rating || 0}/5)</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<div class="p-12 text-center text-gray-500">Aucun prestataire</div>'}
          </div>
        </div>
      `;
    } catch (error) {
      Utils.showError(container, error.message);
    }
  }
};
