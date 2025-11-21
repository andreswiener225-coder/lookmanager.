/**
 * LokoManager - Tenants Page (Full CRUD Version)
 * Complete tenant management with create, read, update, delete
 */

window.TenantsPage = {
  data: {
    tenants: [],
    properties: [],
    currentTenant: null
  },

  /**
   * Render tenants page
   */
  async render(container) {
    try {
      await this.fetchData();
      container.innerHTML = this.getHTML();
      this.attachEventListeners();
    } catch (error) {
      console.error('Tenants render error:', error);
      Utils.showError(container, error.message || 'Erreur lors du chargement des locataires');
    }
  },

  /**
   * Fetch tenants and properties
   */
  async fetchData() {
    try {
      const [tenantsResponse, propertiesResponse] = await Promise.all([
        api.getTenants(),
        api.getProperties()
      ]);
      
      this.data.tenants = tenantsResponse.data || [];
      this.data.properties = propertiesResponse.data || [];
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  },

  /**
   * Get tenants page HTML
   */
  getHTML() {
    return `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-bold text-gray-800">Mes Locataires</h2>
            <p class="text-gray-600 mt-1">Gérez vos locataires et leurs contrats</p>
          </div>
          <button class="btn btn-primary" data-action="create-tenant">
            <i class="fas fa-user-plus mr-2"></i>
            Ajouter un locataire
          </button>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Propriété</label>
              <select id="filterProperty" class="form-select">
                <option value="">Toutes les propriétés</option>
                ${this.data.properties.map(p => `
                  <option value="${p.id}">${p.name} - ${p.city}</option>
                `).join('')}
              </select>
            </div>
            <div>
              <label class="form-label">Statut</label>
              <select id="filterStatus" class="form-select">
                <option value="">Tous</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Tenants List -->
        <div id="tenantsList">
          ${this.getTenantsListHTML()}
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div id="tenantModal" class="modal-overlay hidden">
        <div class="modal-content max-w-2xl">
          <div class="modal-header">
            <h3 class="modal-title" id="modalTitle">Ajouter un locataire</h3>
            <button class="text-gray-400 hover:text-gray-600" data-action="close-modal">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="tenantForm" class="space-y-4">
              <input type="hidden" id="tenantId">
              
              <!-- Personal Information -->
              <div class="border-b pb-4">
                <h4 class="font-semibold text-gray-700 mb-3">Informations personnelles</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="form-group">
                    <label for="tenantFullName" class="form-label">Nom complet *</label>
                    <input type="text" id="tenantFullName" class="form-input" required>
                  </div>
                  <div class="form-group">
                    <label for="tenantPhone" class="form-label">Téléphone *</label>
                    <input type="tel" id="tenantPhone" class="form-input" placeholder="+225 XX XX XX XX" required>
                    <small class="text-xs text-gray-500">Utilisé pour la connexion locataire</small>
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="form-group">
                    <label for="tenantEmail" class="form-label">Email</label>
                    <input type="email" id="tenantEmail" class="form-input">
                  </div>
                  <div class="form-group">
                    <label for="tenantIdCard" class="form-label">N° Pièce d'identité</label>
                    <input type="text" id="tenantIdCard" class="form-input">
                  </div>
                </div>
              </div>

              <!-- Rental Information -->
              <div class="border-b pb-4">
                <h4 class="font-semibold text-gray-700 mb-3">Informations de location</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="form-group">
                    <label for="tenantProperty" class="form-label">Propriété *</label>
                    <select id="tenantProperty" class="form-select" required>
                      <option value="">Sélectionnez...</option>
                      ${this.data.properties.filter(p => p.status === 'vacant').map(p => `
                        <option value="${p.id}" data-rent="${p.monthly_rent}">
                          ${p.name} - ${p.city} (${Utils.formatCurrency(p.monthly_rent)})
                        </option>
                      `).join('')}
                    </select>
                    <small class="text-xs text-gray-500">Seules les propriétés vacantes sont affichées</small>
                  </div>
                  <div class="form-group">
                    <label for="tenantMoveInDate" class="form-label">Date d'entrée *</label>
                    <input type="date" id="tenantMoveInDate" class="form-input" required>
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="form-group">
                    <label for="tenantStatus" class="form-label">Statut *</label>
                    <select id="tenantStatus" class="form-select" required>
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="terminated">Résilié</option>
                    </select>
                    <small class="text-xs text-gray-500">Changez le statut pour mettre fin au bail</small>
                  </div>
                  <div class="form-group"></div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="form-group">
                    <label for="tenantMonthlyRent" class="form-label">Loyer mensuel (FCFA) *</label>
                    <input type="number" id="tenantMonthlyRent" class="form-input" required min="0">
                  </div>
                  <div class="form-group">
                    <label for="tenantDeposit" class="form-label">Caution (FCFA) *</label>
                    <input type="number" id="tenantDeposit" class="form-input" required min="0">
                  </div>
                </div>
              </div>

              <!-- Emergency Contact -->
              <div class="border-b pb-4">
                <h4 class="font-semibold text-gray-700 mb-3">Contact d'urgence</h4>
                <div class="form-group">
                  <label for="tenantEmergency" class="form-label">Nom et téléphone</label>
                  <input type="text" id="tenantEmergency" class="form-input" placeholder="Ex: Papa Kofi +225 XX XX XX XX">
                </div>
              </div>

              <!-- Notes -->
              <div class="form-group">
                <label for="tenantNotes" class="form-label">Notes</label>
                <textarea id="tenantNotes" class="form-textarea" rows="3" placeholder="Informations complémentaires..."></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-action="close-modal">
              Annuler
            </button>
            <button type="submit" form="tenantForm" class="btn btn-primary" id="saveTenantBtn">
              <i class="fas fa-save mr-2"></i>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Get tenants list HTML
   */
  getTenantsListHTML() {
    const tenants = this.data.tenants;

    if (!tenants || tenants.length === 0) {
      return `
        <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <i class="fas fa-users text-gray-300 text-6xl mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">Aucun locataire</h3>
          <p class="text-gray-500 mb-6">Commencez par ajouter votre premier locataire</p>
          <button class="btn btn-primary" data-action="create-tenant">
            <i class="fas fa-user-plus mr-2"></i>
            Ajouter un locataire
          </button>
        </div>
      `;
    }

    return `
      <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>Locataire</th>
              <th>Contact</th>
              <th>Propriété</th>
              <th>Loyer</th>
              <th>Entrée</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${tenants.map(tenant => this.getTenantRowHTML(tenant)).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  /**
   * Get tenant table row HTML
   */
  getTenantRowHTML(tenant) {
    const property = this.data.properties.find(p => p.id === tenant.property_id);
    
    return `
      <tr class="hover:bg-gray-50">
        <td>
          <div class="flex items-center">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span class="text-blue-600 font-semibold">${this.getInitials(tenant.full_name)}</span>
            </div>
            <div>
              <div class="font-medium text-gray-900">${tenant.full_name}</div>
              ${tenant.email ? `<div class="text-sm text-gray-500">${tenant.email}</div>` : ''}
            </div>
          </div>
        </td>
        <td>
          <div class="text-sm">
            <div><i class="fas fa-phone text-gray-400 mr-2"></i>${Utils.formatPhone(tenant.phone)}</div>
          </div>
        </td>
        <td>
          <div class="text-sm">
            <div class="font-medium">${property ? property.name : 'N/A'}</div>
            <div class="text-gray-500">${property ? property.city : ''}</div>
          </div>
        </td>
        <td class="font-semibold text-green-600">
          ${Utils.formatCurrency(tenant.monthly_rent)}
        </td>
        <td class="text-sm text-gray-600">
          ${Utils.formatDate(tenant.move_in_date)}
        </td>
        <td>${Utils.getStatusBadge(tenant.status)}</td>
        <td>
          <div class="flex space-x-2">
            <button class="text-blue-600 hover:text-blue-800" data-action="edit-tenant" data-id="${tenant.id}" title="Modifier">
              <i class="fas fa-edit"></i>
            </button>
            <button class="text-red-600 hover:text-red-800" data-action="delete-tenant" data-id="${tenant.id}" title="Supprimer">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  /**
   * Get initials from full name
   */
  getInitials(fullName) {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  },

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Create tenant button
    document.querySelectorAll('[data-action="create-tenant"]').forEach(btn => {
      btn.addEventListener('click', () => this.openModal());
    });

    // Edit tenant buttons
    document.querySelectorAll('[data-action="edit-tenant"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.openModal(id);
      });
    });

    // Delete tenant buttons
    document.querySelectorAll('[data-action="delete-tenant"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        await this.deleteTenant(id);
      });
    });

    // Close modal buttons
    document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });

    // Form submission
    document.getElementById('tenantForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveTenant();
    });

    // Property selection - auto-fill rent
    document.getElementById('tenantProperty').addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const rent = selectedOption.dataset.rent;
      if (rent) {
        document.getElementById('tenantMonthlyRent').value = rent;
        document.getElementById('tenantDeposit').value = rent; // Default deposit = 1 month rent
      }
    });

    // Filters
    ['filterProperty', 'filterStatus'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => this.applyFilters());
    });
  },

  /**
   * Open modal for create/edit
   */
  async openModal(id = null) {
    const modal = document.getElementById('tenantModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('tenantForm');

    form.reset();
    document.getElementById('tenantId').value = '';
    document.getElementById('tenantMoveInDate').value = new Date().toISOString().split('T')[0];

    if (id) {
      title.textContent = 'Modifier le locataire';
      try {
        const response = await api.getTenant(id);
        const tenant = response.data;
        
        // Add current property to dropdown if not already present
        const propertySelect = document.getElementById('tenantProperty');
        const currentPropertyExists = Array.from(propertySelect.options).some(
          opt => opt.value === String(tenant.property_id)
        );
        
        if (!currentPropertyExists && tenant.property_id) {
          // Find current property details
          const currentProperty = this.data.properties.find(p => p.id === tenant.property_id);
          if (currentProperty) {
            const option = document.createElement('option');
            option.value = currentProperty.id;
            option.setAttribute('data-rent', currentProperty.monthly_rent);
            option.textContent = `${currentProperty.name} - ${currentProperty.city} (${Utils.formatCurrency(currentProperty.monthly_rent)}) [Actuelle]`;
            propertySelect.insertBefore(option, propertySelect.options[1]);
          }
        }
        
        this.fillForm(tenant);
      } catch (error) {
        Utils.showToast('Erreur lors du chargement du locataire', 'error');
        return;
      }
    } else {
      title.textContent = 'Ajouter un locataire';
    }

    modal.classList.remove('hidden');
  },

  /**
   * Close modal
   */
  closeModal() {
    document.getElementById('tenantModal').classList.add('hidden');
  },

  /**
   * Fill form with tenant data
   */
  fillForm(tenant) {
    document.getElementById('tenantId').value = tenant.id;
    document.getElementById('tenantFullName').value = tenant.full_name;
    document.getElementById('tenantPhone').value = tenant.phone;
    document.getElementById('tenantEmail').value = tenant.email || '';
    document.getElementById('tenantIdCard').value = tenant.id_card_number || '';
    document.getElementById('tenantProperty').value = tenant.property_id;
    document.getElementById('tenantMoveInDate').value = Utils.formatDateInput(tenant.move_in_date);
    document.getElementById('tenantMonthlyRent').value = tenant.monthly_rent;
    document.getElementById('tenantDeposit').value = tenant.deposit_amount;
    document.getElementById('tenantStatus').value = tenant.status || 'active';  // ✅ Added status field
    document.getElementById('tenantEmergency').value = tenant.emergency_contact || '';
    document.getElementById('tenantNotes').value = tenant.notes || '';
  },

  /**
   * Save tenant (create or update)
   */
  async saveTenant() {
    const id = document.getElementById('tenantId').value;
    const data = {
      full_name: document.getElementById('tenantFullName').value.trim(),
      phone: document.getElementById('tenantPhone').value.trim(),
      email: document.getElementById('tenantEmail').value.trim() || null,
      id_card_number: document.getElementById('tenantIdCard').value.trim() || null,
      property_id: parseInt(document.getElementById('tenantProperty').value),
      move_in_date: document.getElementById('tenantMoveInDate').value,
      monthly_rent: parseFloat(document.getElementById('tenantMonthlyRent').value),
      deposit_amount: parseFloat(document.getElementById('tenantDeposit').value),
      emergency_contact: document.getElementById('tenantEmergency').value.trim() || null,
      notes: document.getElementById('tenantNotes').value.trim() || null,
      status: document.getElementById('tenantStatus').value  // ✅ Read from form instead of hardcoded
    };

    const saveBtn = document.getElementById('saveTenantBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Enregistrement...';

    try {
      if (id) {
        await api.updateTenant(id, data);
        Utils.showToast('Locataire modifié avec succès', 'success');
      } else {
        await api.createTenant(data);
        Utils.showToast('Locataire ajouté avec succès ! Il peut se connecter avec son numéro de téléphone.', 'success');
      }

      this.closeModal();
      await this.fetchData();
      
      const container = document.getElementById('tenantsList');
      container.innerHTML = this.getTenantsListHTML();
      this.attachEventListeners();
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Enregistrer';
    }
  },

  /**
   * Delete tenant
   */
  async deleteTenant(id) {
    const confirmed = await Utils.confirm('Êtes-vous sûr de vouloir supprimer ce locataire ? Cela ne supprimera pas l\'historique des paiements.');
    if (!confirmed) return;

    try {
      await api.deleteTenant(id);
      Utils.showToast('Locataire supprimé avec succès', 'success');
      
      await this.fetchData();
      const container = document.getElementById('tenantsList');
      container.innerHTML = this.getTenantsListHTML();
      this.attachEventListeners();
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors de la suppression', 'error');
    }
  },

  /**
   * Apply filters
   */
  async applyFilters() {
    const filters = {
      property_id: document.getElementById('filterProperty').value,
      status: document.getElementById('filterStatus').value
    };

    try {
      const response = await api.getTenants(filters);
      this.data.tenants = response.data || [];
      
      const container = document.getElementById('tenantsList');
      container.innerHTML = this.getTenantsListHTML();
      this.attachEventListeners();
    } catch (error) {
      Utils.showToast('Erreur lors du filtrage', 'error');
    }
  }
};
