/**
 * LokoManager - Service Providers Page (Complete Version)
 * Gestion complète des prestataires de services (artisans)
 */
window.ProvidersPage = {
  data: { 
    providers: [],
    filters: { specialty: '' },
    editingId: null
  },

  specialties: {
    plomberie: { label: 'Plomberie', icon: 'fa-faucet', color: 'blue' },
    electricite: { label: 'Électricité', icon: 'fa-bolt', color: 'yellow' },
    peinture: { label: 'Peinture', icon: 'fa-paint-roller', color: 'green' },
    menuiserie: { label: 'Menuiserie', icon: 'fa-hammer', color: 'orange' },
    maconnerie: { label: 'Maçonnerie', icon: 'fa-hard-hat', color: 'gray' },
    jardinage: { label: 'Jardinage', icon: 'fa-leaf', color: 'green' },
    climatisation: { label: 'Climatisation', icon: 'fa-snowflake', color: 'cyan' },
    serrurerie: { label: 'Serrurerie', icon: 'fa-key', color: 'purple' },
    nettoyage: { label: 'Nettoyage', icon: 'fa-broom', color: 'teal' },
    autre: { label: 'Autre', icon: 'fa-tools', color: 'gray' }
  },

  async loadData() {
    const response = await api.getServiceProviders(this.data.filters);
    this.data.providers = response.data || [];
  },

  async render(container) {
    try {
      await this.loadData();
      
      // Stats
      const totalProviders = this.data.providers.length;
      const avgRating = totalProviders > 0 
        ? (this.data.providers.reduce((sum, p) => sum + (p.rating || 0), 0) / totalProviders).toFixed(1)
        : 0;
      const topRated = this.data.providers.filter(p => p.rating >= 4).length;
      
      container.innerHTML = `
        <div class="space-y-6">
          <!-- Header -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 class="text-2xl font-bold text-gray-800">
                <i class="fas fa-users-cog mr-2 text-purple-600"></i>
                Prestataires de Services
              </h2>
              <p class="text-gray-500">Gérez votre carnet d'adresses d'artisans et prestataires</p>
            </div>
            <button class="btn btn-primary" onclick="ProvidersPage.showModal()">
              <i class="fas fa-plus mr-2"></i>Nouveau prestataire
            </button>
          </div>

          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white rounded-xl p-4 border border-gray-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Total Prestataires</p>
                  <p class="text-2xl font-bold text-gray-800">${totalProviders}</p>
                </div>
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-users text-purple-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-xl p-4 border border-gray-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Note moyenne</p>
                  <p class="text-2xl font-bold text-yellow-600">${avgRating} ⭐</p>
                </div>
                <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-star text-yellow-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-xl p-4 border border-gray-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Top Rated (4+)</p>
                  <p class="text-2xl font-bold text-green-600">${topRated}</p>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-award text-green-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Filters -->
          <div class="bg-white rounded-xl p-4 border border-gray-200">
            <div class="flex flex-wrap gap-4 items-center">
              <div class="flex-1 min-w-[200px]">
                <label class="block text-sm font-medium text-gray-700 mb-1">Filtrer par spécialité</label>
                <select id="filterSpecialty" class="form-input" onchange="ProvidersPage.applyFilters()">
                  <option value="">Toutes les spécialités</option>
                  ${Object.entries(this.specialties).map(([key, spec]) => 
                    `<option value="${key}">${spec.label}</option>`
                  ).join('')}
                </select>
              </div>
              <div class="flex items-end">
                <button class="btn btn-outline" onclick="ProvidersPage.resetFilters()">
                  <i class="fas fa-undo mr-2"></i>Réinitialiser
                </button>
              </div>
            </div>
          </div>

          <!-- Providers Grid -->
          ${this.data.providers.length > 0 ? `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              ${this.data.providers.map(provider => {
                const spec = this.specialties[provider.specialty] || this.specialties.autre;
                return `
                  <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition">
                    <div class="flex items-start justify-between mb-4">
                      <div class="flex items-center">
                        <div class="w-12 h-12 bg-${spec.color}-100 rounded-full flex items-center justify-center mr-3">
                          <i class="fas ${spec.icon} text-${spec.color}-600 text-xl"></i>
                        </div>
                        <div>
                          <h3 class="font-bold text-gray-800">${provider.name}</h3>
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${spec.color}-100 text-${spec.color}-800">
                            ${spec.label}
                          </span>
                        </div>
                      </div>
                      <div class="flex space-x-1">
                        <button class="p-1 text-gray-400 hover:text-blue-600" onclick="ProvidersPage.editProvider(${provider.id})" title="Modifier">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="p-1 text-gray-400 hover:text-red-600" onclick="ProvidersPage.deleteProvider(${provider.id})" title="Supprimer">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    
                    <div class="space-y-2 text-sm">
                      <div class="flex items-center text-gray-600">
                        <i class="fas fa-phone mr-2 text-gray-400 w-5"></i>
                        <a href="tel:${provider.phone}" class="hover:text-blue-600">${Utils.formatPhone(provider.phone)}</a>
                      </div>
                      ${provider.notes ? `
                        <div class="flex items-start text-gray-600">
                          <i class="fas fa-sticky-note mr-2 text-gray-400 w-5 mt-0.5"></i>
                          <span class="text-gray-500">${provider.notes}</span>
                        </div>
                      ` : ''}
                    </div>
                    
                    <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div class="flex items-center">
                        <span class="text-yellow-500">${'★'.repeat(provider.rating || 0)}</span>
                        <span class="text-gray-300">${'★'.repeat(5 - (provider.rating || 0))}</span>
                        <span class="ml-2 text-sm text-gray-500">(${provider.rating || 0}/5)</span>
                      </div>
                      <a href="tel:${provider.phone}" class="btn btn-sm bg-green-600 hover:bg-green-700 text-white">
                        <i class="fas fa-phone mr-1"></i>Appeler
                      </a>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-users-cog text-gray-400 text-2xl"></i>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-1">Aucun prestataire</h3>
              <p class="text-gray-500 mb-4">Ajoutez vos artisans et prestataires de confiance</p>
              <button class="btn btn-primary" onclick="ProvidersPage.showModal()">
                <i class="fas fa-plus mr-2"></i>Ajouter un prestataire
              </button>
            </div>
          `}
        </div>

        <!-- Modal -->
        <div id="providerModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4">
          <div class="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
              <div class="flex justify-between items-center mb-6">
                <h3 id="providerModalTitle" class="text-xl font-bold text-gray-800">Nouveau prestataire</h3>
                <button onclick="ProvidersPage.hideModal()" class="text-gray-400 hover:text-gray-600">
                  <i class="fas fa-times text-xl"></i>
                </button>
              </div>
              <form id="providerForm" onsubmit="ProvidersPage.saveProvider(event)">
                <input type="hidden" id="providerId">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                    <input type="text" id="providerName" class="form-input" required placeholder="Ex: Jean Kouassi">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                    <input type="tel" id="providerPhone" class="form-input" required placeholder="Ex: +225 07 00 00 00 00">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Spécialité *</label>
                    <select id="providerSpecialty" class="form-input" required>
                      ${Object.entries(this.specialties).map(([key, spec]) => 
                        `<option value="${key}">${spec.label}</option>`
                      ).join('')}
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Note (1-5)</label>
                    <div class="flex items-center space-x-2">
                      ${[1,2,3,4,5].map(n => `
                        <button type="button" onclick="ProvidersPage.setRating(${n})" class="rating-star text-2xl text-gray-300 hover:text-yellow-500 transition" data-rating="${n}">
                          ★
                        </button>
                      `).join('')}
                      <input type="hidden" id="providerRating" value="0">
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                    <textarea id="providerNotes" class="form-input" rows="3" placeholder="Informations complémentaires..."></textarea>
                  </div>
                </div>
                <div class="flex gap-3 mt-6">
                  <button type="button" onclick="ProvidersPage.hideModal()" class="btn btn-outline flex-1">
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
      console.error('ProvidersPage error:', error);
      Utils.showError(container, error.message);
    }
  },

  setRating(rating) {
    document.getElementById('providerRating').value = rating;
    document.querySelectorAll('.rating-star').forEach((star, index) => {
      star.classList.toggle('text-yellow-500', index < rating);
      star.classList.toggle('text-gray-300', index >= rating);
    });
  },

  showModal(provider = null) {
    this.data.editingId = provider ? provider.id : null;
    document.getElementById('providerModalTitle').textContent = provider ? 'Modifier le prestataire' : 'Nouveau prestataire';
    document.getElementById('providerId').value = provider ? provider.id : '';
    document.getElementById('providerName').value = provider ? provider.name : '';
    document.getElementById('providerPhone').value = provider ? provider.phone : '';
    document.getElementById('providerSpecialty').value = provider ? provider.specialty : 'plomberie';
    document.getElementById('providerNotes').value = provider ? provider.notes || '' : '';
    this.setRating(provider ? provider.rating || 0 : 0);
    document.getElementById('providerModal').classList.remove('hidden');
  },

  hideModal() {
    document.getElementById('providerModal').classList.add('hidden');
    document.getElementById('providerForm').reset();
    this.setRating(0);
    this.data.editingId = null;
  },

  async saveProvider(event) {
    event.preventDefault();
    try {
      const data = {
        name: document.getElementById('providerName').value,
        phone: document.getElementById('providerPhone').value,
        specialty: document.getElementById('providerSpecialty').value,
        rating: parseInt(document.getElementById('providerRating').value) || 0,
        notes: document.getElementById('providerNotes').value || null
      };

      if (this.data.editingId) {
        await api.updateServiceProvider(this.data.editingId, data);
        Utils.showToast('Prestataire modifié avec succès', 'success');
      } else {
        await api.createServiceProvider(data);
        Utils.showToast('Prestataire ajouté avec succès', 'success');
      }
      
      this.hideModal();
      await this.render(document.getElementById('page-content'));
    } catch (error) {
      Utils.showToast(error.message, 'error');
    }
  },

  async editProvider(id) {
    const provider = this.data.providers.find(p => p.id === id);
    if (provider) this.showModal(provider);
  },

  async deleteProvider(id) {
    if (!confirm('Voulez-vous vraiment supprimer ce prestataire ?')) return;
    try {
      await api.deleteServiceProvider(id);
      Utils.showToast('Prestataire supprimé', 'success');
      await this.render(document.getElementById('page-content'));
    } catch (error) {
      Utils.showToast(error.message, 'error');
    }
  },

  async applyFilters() {
    this.data.filters.specialty = document.getElementById('filterSpecialty').value;
    await this.render(document.getElementById('page-content'));
  },

  async resetFilters() {
    this.data.filters = { specialty: '' };
    await this.render(document.getElementById('page-content'));
  }
};
