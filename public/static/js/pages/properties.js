/**
 * LokoManager - Properties Page
 * Complete CRUD management for properties
 */

window.PropertiesPage = {
  data: {
    properties: [],
    currentProperty: null
  },

  /**
   * Render properties page
   */
  async render(container) {
    try {
      await this.fetchProperties();
      container.innerHTML = this.getHTML();
      this.attachEventListeners();
    } catch (error) {
      console.error('Properties render error:', error);
      Utils.showError(container, error.message || 'Erreur lors du chargement des propriétés');
    }
  },

  /**
   * Fetch all properties
   */
  async fetchProperties(filters = {}) {
    try {
      const response = await api.getProperties(filters);
      this.data.properties = response.data || [];
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },

  /**
   * Get properties HTML
   */
  getHTML() {
    return `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-bold text-gray-800">Mes Propriétés</h2>
            <p class="text-gray-600 mt-1">Gérez votre portefeuille immobilier</p>
          </div>
          <button class="btn btn-primary" data-action="create-property">
            <i class="fas fa-plus mr-2"></i>
            Ajouter une propriété
          </button>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="form-label">Statut</label>
              <select id="filterStatus" class="form-select">
                <option value="">Tous</option>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupé</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label class="form-label">Type</label>
              <select id="filterType" class="form-select">
                <option value="">Tous</option>
                <option value="house">Maison</option>
                <option value="apartment">Appartement</option>
                <option value="villa">Villa</option>
                <option value="studio">Studio</option>
                <option value="office">Bureau</option>
                <option value="shop">Commerce</option>
                <option value="warehouse">Entrepôt</option>
              </select>
            </div>
            <div>
              <label class="form-label">Ville</label>
              <input type="text" id="filterCity" class="form-input" placeholder="Filtrer par ville">
            </div>
          </div>
        </div>

        <!-- Properties List -->
        <div id="propertiesList">
          ${this.getPropertiesListHTML()}
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div id="propertyModal" class="modal-overlay hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title" id="modalTitle">Ajouter une propriété</h3>
            <button class="text-gray-400 hover:text-gray-600" data-action="close-modal">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="propertyForm" class="space-y-4">
              <input type="hidden" id="propertyId">
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group">
                  <label for="propertyName" class="form-label">Nom *</label>
                  <input type="text" id="propertyName" class="form-input" required>
                </div>
                <div class="form-group">
                  <label for="propertyType" class="form-label">Type *</label>
                  <select id="propertyType" class="form-select" required>
                    <option value="">Sélectionnez...</option>
                    <option value="house">Maison</option>
                    <option value="apartment">Appartement</option>
                    <option value="villa">Villa</option>
                    <option value="studio">Studio</option>
                    <option value="office">Bureau</option>
                    <option value="shop">Commerce</option>
                    <option value="warehouse">Entrepôt</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="propertyAddress" class="form-label">Adresse *</label>
                <input type="text" id="propertyAddress" class="form-input" required>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group">
                  <label for="propertyCity" class="form-label">Ville *</label>
                  <input type="text" id="propertyCity" class="form-input" required>
                </div>
                <div class="form-group">
                  <label for="propertyNeighborhood" class="form-label">Quartier</label>
                  <input type="text" id="propertyNeighborhood" class="form-input">
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="form-group">
                  <label for="propertyBedrooms" class="form-label">Chambres</label>
                  <input type="number" id="propertyBedrooms" class="form-input" min="0">
                </div>
                <div class="form-group">
                  <label for="propertyBathrooms" class="form-label">Salles de bain</label>
                  <input type="number" id="propertyBathrooms" class="form-input" min="0">
                </div>
                <div class="form-group">
                  <label for="propertyArea" class="form-label">Surface (m²)</label>
                  <input type="number" id="propertyArea" class="form-input" min="0">
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group">
                  <label for="propertyRent" class="form-label">Loyer mensuel (FCFA) *</label>
                  <input type="number" id="propertyRent" class="form-input" required min="0">
                </div>
                <div class="form-group">
                  <label for="propertyStatus" class="form-label">Statut *</label>
                  <select id="propertyStatus" class="form-select" required>
                    <option value="vacant">Vacant</option>
                    <option value="occupied">Occupé</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="propertyDescription" class="form-label">Description</label>
                <textarea id="propertyDescription" class="form-textarea" rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-action="close-modal">
              Annuler
            </button>
            <button type="submit" form="propertyForm" class="btn btn-primary" id="savePropertyBtn">
              <i class="fas fa-save mr-2"></i>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Get properties list HTML
   */
  getPropertiesListHTML() {
    const properties = this.data.properties;

    if (!properties || properties.length === 0) {
      return `
        <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <i class="fas fa-building text-gray-300 text-6xl mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">Aucune propriété</h3>
          <p class="text-gray-500 mb-6">Commencez par ajouter votre première propriété</p>
          <button class="btn btn-primary" data-action="create-property">
            <i class="fas fa-plus mr-2"></i>
            Ajouter une propriété
          </button>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${properties.map(property => this.getPropertyCardHTML(property)).join('')}
      </div>
    `;
  },

  /**
   * Get property card HTML
   */
  getPropertyCardHTML(property) {
    return `
      <div class="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">${property.name}</h3>
              <p class="text-sm text-gray-500">${Utils.getPropertyTypeLabel(property.type)}</p>
            </div>
            ${Utils.getStatusBadge(property.status)}
          </div>

          <div class="space-y-2 mb-4 text-sm text-gray-600">
            <div class="flex items-center">
              <i class="fas fa-map-marker-alt w-5 text-gray-400"></i>
              <span>${property.city}, ${property.neighborhood || ''}</span>
            </div>
            <div class="flex items-center">
              <i class="fas fa-bed w-5 text-gray-400"></i>
              <span>${property.bedrooms || 0} chambres • ${property.bathrooms || 0} SDB</span>
            </div>
            ${property.area ? `
              <div class="flex items-center">
                <i class="fas fa-ruler-combined w-5 text-gray-400"></i>
                <span>${property.area} m²</span>
              </div>
            ` : ''}
          </div>

          <div class="border-t border-gray-200 pt-4 mb-4">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Loyer mensuel</span>
              <span class="text-lg font-bold text-blue-600">${Utils.formatCurrency(property.monthly_rent)}</span>
            </div>
          </div>

          <div class="flex gap-2">
            <button class="btn btn-outline flex-1 text-sm py-2" data-action="view-property" data-id="${property.id}">
              <i class="fas fa-eye mr-1"></i>
              Voir
            </button>
            <button class="btn btn-primary flex-1 text-sm py-2" data-action="edit-property" data-id="${property.id}">
              <i class="fas fa-edit mr-1"></i>
              Modifier
            </button>
            <button class="btn btn-danger text-sm py-2" data-action="delete-property" data-id="${property.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Create property button
    document.querySelectorAll('[data-action="create-property"]').forEach(btn => {
      btn.addEventListener('click', () => this.openModal());
    });

    // Edit property buttons
    document.querySelectorAll('[data-action="edit-property"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.openModal(id);
      });
    });

    // Delete property buttons
    document.querySelectorAll('[data-action="delete-property"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        await this.deleteProperty(id);
      });
    });

    // View property buttons
    document.querySelectorAll('[data-action="view-property"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.viewProperty(id);
      });
    });

    // Close modal buttons
    document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });

    // Form submission
    document.getElementById('propertyForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProperty();
    });

    // Filters
    ['filterStatus', 'filterType', 'filterCity'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => this.applyFilters());
    });
  },

  /**
   * Open modal for create/edit
   */
  async openModal(id = null) {
    const modal = document.getElementById('propertyModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('propertyForm');

    form.reset();
    document.getElementById('propertyId').value = '';

    if (id) {
      title.textContent = 'Modifier la propriété';
      try {
        const response = await api.getProperty(id);
        const property = response.data;
        this.fillForm(property);
      } catch (error) {
        Utils.showToast('Erreur lors du chargement de la propriété', 'error');
        return;
      }
    } else {
      title.textContent = 'Ajouter une propriété';
    }

    modal.classList.remove('hidden');
  },

  /**
   * Close modal
   */
  closeModal() {
    document.getElementById('propertyModal').classList.add('hidden');
  },

  /**
   * Fill form with property data
   */
  fillForm(property) {
    document.getElementById('propertyId').value = property.id;
    document.getElementById('propertyName').value = property.name;
    document.getElementById('propertyType').value = property.type;
    document.getElementById('propertyAddress').value = property.address;
    document.getElementById('propertyCity').value = property.city;
    document.getElementById('propertyNeighborhood').value = property.neighborhood || '';
    document.getElementById('propertyBedrooms').value = property.bedrooms || '';
    document.getElementById('propertyBathrooms').value = property.bathrooms || '';
    document.getElementById('propertyArea').value = property.area || '';
    document.getElementById('propertyRent').value = property.monthly_rent;
    document.getElementById('propertyStatus').value = property.status;
    document.getElementById('propertyDescription').value = property.description || '';
  },

  /**
   * Save property (create or update)
   */
  async saveProperty() {
    const id = document.getElementById('propertyId').value;
    const data = {
      name: document.getElementById('propertyName').value.trim(),
      type: document.getElementById('propertyType').value,
      address: document.getElementById('propertyAddress').value.trim(),
      city: document.getElementById('propertyCity').value.trim(),
      neighborhood: document.getElementById('propertyNeighborhood').value.trim(),
      bedrooms: parseInt(document.getElementById('propertyBedrooms').value) || null,
      bathrooms: parseInt(document.getElementById('propertyBathrooms').value) || null,
      area: parseFloat(document.getElementById('propertyArea').value) || null,
      monthly_rent: parseFloat(document.getElementById('propertyRent').value),
      status: document.getElementById('propertyStatus').value,
      description: document.getElementById('propertyDescription').value.trim()
    };

    const saveBtn = document.getElementById('savePropertyBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Enregistrement...';

    try {
      if (id) {
        await api.updateProperty(id, data);
        Utils.showToast('Propriété modifiée avec succès', 'success');
      } else {
        await api.createProperty(data);
        Utils.showToast('Propriété créée avec succès', 'success');
      }

      this.closeModal();
      await this.fetchProperties();
      
      const container = document.getElementById('propertiesList');
      container.innerHTML = this.getPropertiesListHTML();
      this.attachEventListeners();
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Enregistrer';
    }
  },

  /**
   * Delete property
   */
  async deleteProperty(id) {
    const confirmed = await Utils.confirm('Êtes-vous sûr de vouloir supprimer cette propriété ?');
    if (!confirmed) return;

    try {
      await api.deleteProperty(id);
      Utils.showToast('Propriété supprimée avec succès', 'success');
      
      await this.fetchProperties();
      const container = document.getElementById('propertiesList');
      container.innerHTML = this.getPropertiesListHTML();
      this.attachEventListeners();
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors de la suppression', 'error');
    }
  },

  /**
   * View property details
   */
  viewProperty(id) {
    Utils.showToast('Fonctionnalité de vue détaillée bientôt disponible', 'info');
  },

  /**
   * Apply filters
   */
  async applyFilters() {
    const filters = {
      status: document.getElementById('filterStatus').value,
      type: document.getElementById('filterType').value,
      city: document.getElementById('filterCity').value.trim()
    };

    await this.fetchProperties(filters);
    const container = document.getElementById('propertiesList');
    container.innerHTML = this.getPropertiesListHTML();
    this.attachEventListeners();
  }
};
