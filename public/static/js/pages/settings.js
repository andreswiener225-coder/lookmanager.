/**
 * LokoManager - Settings Page
 */
window.SettingsPage = {
  async render(container) {
    const user = window.auth.user;
    container.innerHTML = `
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-gray-800">Paramètres du compte</h2>
        
        <!-- User Profile -->
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">Profil</h3>
          <div class="space-y-3">
            <div><label class="text-sm text-gray-600">Nom complet</label>
              <p class="font-medium">${user.full_name}</p></div>
            <div><label class="text-sm text-gray-600">Email</label>
              <p class="font-medium">${user.email}</p></div>
            <div><label class="text-sm text-gray-600">Téléphone</label>
              <p class="font-medium">${user.phone}</p></div>
            <div><label class="text-sm text-gray-600">Forfait</label>
              <p class="font-medium capitalize">${user.subscription_tier || 'free'}</p></div>
          </div>
        </div>

        <!-- Bank Accounts Section -->
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">
              <i class="fas fa-wallet mr-2 text-green-600"></i>
              Mes comptes de réception
            </h3>
            <button id="addBankAccountBtn" class="btn btn-primary btn-sm">
              <i class="fas fa-plus mr-2"></i>
              Ajouter un compte
            </button>
          </div>
          
          <!-- Educational Notice -->
          <div class="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
            <div class="flex items-start">
              <i class="fas fa-info-circle text-blue-600 text-xl mr-3 mt-1"></i>
              <div>
                <h4 class="font-semibold text-blue-900 mb-1">Facilitez les paiements</h4>
                <p class="text-sm text-blue-800">
                  Enregistrez vos comptes Mobile Money (Orange, MTN, Moov, Wave) ou bancaires. 
                  Vos locataires verront ces informations pour effectuer leurs paiements directement.
                </p>
              </div>
            </div>
          </div>

          <div id="bankAccountsList">
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-wallet text-4xl mb-3"></i>
              <p>Chargement...</p>
            </div>
          </div>
        </div>

        <!-- Change Password -->
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">Changer le mot de passe</h3>
          <form id="changePasswordForm" class="space-y-4 max-w-md">
            <div class="form-group">
              <label class="form-label">Mot de passe actuel</label>
              <input type="password" id="oldPassword" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">Nouveau mot de passe</label>
              <input type="password" id="newPassword" class="form-input" required minlength="8">
            </div>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save mr-2"></i>Mettre à jour
            </button>
          </form>
        </div>

        <!-- Tutorial & Help -->
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-semibold mb-4">Aide & Tutoriel</h3>
          <div class="space-y-3">
            <button id="restartTour" class="btn btn-outline w-full md:w-auto">
              <i class="fas fa-play-circle mr-2"></i>
              Relancer le tutoriel guidé
            </button>
            <p class="text-sm text-gray-500">
              Besoin d'aide ? Le tutoriel vous guidera à travers toutes les fonctionnalités de LokoManager.
            </p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById('oldPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      
      const result = await window.auth.changePassword(oldPassword, newPassword);
      if (result.success) {
        Utils.showToast('Mot de passe modifié avec succès', 'success');
        document.getElementById('changePasswordForm').reset();
      } else {
        Utils.showToast(result.error || 'Erreur lors du changement de mot de passe', 'error');
      }
    });

    // Restart tour button
    document.getElementById('restartTour').addEventListener('click', () => {
      if (window.onboardingTour) {
        window.onboardingTour.forceStart();
      }
    });

    // ==================== BANK ACCOUNTS MANAGEMENT ====================
    
    let bankAccounts = [];

    // Load bank accounts
    async function loadBankAccounts() {
      try {
        // For now, use localStorage until backend is ready
        const stored = localStorage.getItem('lokomanager_owner_bank_accounts');
        bankAccounts = stored ? JSON.parse(stored) : [];
        
        renderBankAccounts();
      } catch (error) {
        console.error('Error loading bank accounts:', error);
        Utils.showToast('Erreur lors du chargement', 'error');
      }
    }

    // Render bank accounts list
    function renderBankAccounts() {
      const container = document.getElementById('bankAccountsList');
      
      if (bankAccounts.length === 0) {
        container.innerHTML = `
          <div class="text-center py-8 text-gray-500">
            <i class="fas fa-wallet text-4xl mb-3"></i>
            <p class="mb-2">Aucun compte enregistré</p>
            <p class="text-sm">Ajoutez votre premier compte pour recevoir les paiements</p>
          </div>
        `;
        return;
      }

      container.innerHTML = bankAccounts.map(account => {
        const icon = getPaymentMethodIcon(account.type);
        const label = getPaymentMethodLabel(account.type);
        const details = getAccountDetails(account);
        
        return `
          <div class="bg-gray-50 rounded-lg p-4 mb-3 flex items-center justify-between hover:bg-gray-100 transition ${account.is_default ? 'border-2 border-green-500' : 'border border-gray-200'}">
            <div class="flex-1">
              <div class="flex items-center mb-2">
                <span class="text-2xl mr-3">${icon}</span>
                <div>
                  <h4 class="font-semibold text-gray-800">${label}</h4>
                  <p class="text-sm text-gray-600">${details}</p>
                </div>
              </div>
              ${account.is_default ? '<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Compte principal</span>' : ''}
            </div>
            <div class="flex space-x-2">
              <button onclick="window.SettingsPage.editBankAccount('${account.id}')" class="text-blue-600 hover:text-blue-800 p-2">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="window.SettingsPage.deleteBankAccount('${account.id}')" class="text-red-600 hover:text-red-800 p-2">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Helper functions
    function getPaymentMethodIcon(type) {
      const icons = {
        'orange_money': '🟠',
        'mtn_money': '🟡',
        'moov_money': '🔵',
        'wave': '🌊',
        'bank_transfer': '🏦'
      };
      return icons[type] || '💳';
    }

    function getPaymentMethodLabel(type) {
      const labels = {
        'orange_money': 'Orange Money',
        'mtn_money': 'MTN Money',
        'moov_money': 'Moov Money',
        'wave': 'Wave',
        'bank_transfer': 'Compte Bancaire'
      };
      return labels[type] || type;
    }

    function getAccountDetails(account) {
      if (account.type === 'bank_transfer') {
        return `${account.bank_name} - ${account.account_number}`;
      } else {
        return account.phone_number + (account.account_name ? ` (${account.account_name})` : '');
      }
    }

    // Add bank account button
    document.getElementById('addBankAccountBtn').addEventListener('click', () => {
      openBankAccountModal();
    });

    // Open modal
    function openBankAccountModal(accountId = null) {
      const modal = Utils.createModal({
        title: accountId ? 'Modifier le compte' : 'Ajouter un compte',
        size: 'md',
        content: `
          <form id="bankAccountForm" class="space-y-4">
            <input type="hidden" id="bankAccountId">
            
            <div class="form-group">
              <label for="accountType" class="form-label">Type de compte *</label>
              <select id="accountType" class="form-select" required>
                <option value="">Sélectionnez...</option>
                <option value="orange_money">🟠 Orange Money</option>
                <option value="mtn_money">🟡 MTN Money</option>
                <option value="moov_money">🔵 Moov Money</option>
                <option value="wave">🌊 Wave</option>
                <option value="bank_transfer">🏦 Compte Bancaire</option>
              </select>
            </div>

            <div id="mobileMoneyFields" class="space-y-4 hidden">
              <div class="form-group">
                <label for="accountPhone" class="form-label">Numéro de téléphone *</label>
                <input type="tel" id="accountPhone" class="form-input" placeholder="+225 XX XX XX XX">
                <small class="text-xs text-gray-500">Le numéro associé à votre compte Mobile Money</small>
              </div>
              <div class="form-group">
                <label for="accountName" class="form-label">Nom du titulaire</label>
                <input type="text" id="accountName" class="form-input" placeholder="Ex: Jean Kouadio">
              </div>
            </div>

            <div id="bankFields" class="space-y-4 hidden">
              <div class="form-group">
                <label for="bankName" class="form-label">Nom de la banque *</label>
                <input type="text" id="bankName" class="form-input" placeholder="Ex: Ecobank, SGCI, UBA...">
              </div>
              <div class="form-group">
                <label for="accountNumber" class="form-label">Numéro de compte / IBAN *</label>
                <input type="text" id="accountNumber" class="form-input" placeholder="Ex: CI93 CI...">
              </div>
              <div class="form-group">
                <label for="accountHolderName" class="form-label">Titulaire du compte *</label>
                <input type="text" id="accountHolderName" class="form-input">
              </div>
            </div>

            <div class="form-group">
              <label class="flex items-center">
                <input type="checkbox" id="accountDefault" class="form-checkbox mr-2">
                <span class="text-sm text-gray-700">Définir comme compte principal</span>
              </label>
              <small class="text-xs text-gray-500 ml-6">Le compte principal sera affiché en premier aux locataires</small>
            </div>

            <div class="flex space-x-3">
              <button type="button" onclick="Utils.closeModal()" class="btn btn-secondary flex-1">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary flex-1">
                <i class="fas fa-save mr-2"></i>
                Enregistrer
              </button>
            </div>
          </form>
        `
      });

      // Type change handler
      document.getElementById('accountType').addEventListener('change', function(e) {
        const type = e.target.value;
        const mobileFields = document.getElementById('mobileMoneyFields');
        const bankFields = document.getElementById('bankFields');
        
        mobileFields.classList.add('hidden');
        bankFields.classList.add('hidden');
        
        if (type === 'bank_transfer') {
          bankFields.classList.remove('hidden');
        } else if (type) {
          mobileFields.classList.remove('hidden');
        }
      });

      // Form submit handler
      document.getElementById('bankAccountForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const type = document.getElementById('accountType').value;
        const isDefault = document.getElementById('accountDefault').checked;
        let formData = { type };
        
        if (type === 'bank_transfer') {
          formData.bank_name = document.getElementById('bankName').value.trim();
          formData.account_number = document.getElementById('accountNumber').value.trim();
          formData.account_name = document.getElementById('accountHolderName').value.trim();
        } else {
          formData.phone_number = document.getElementById('accountPhone').value.trim();
          formData.account_name = document.getElementById('accountName').value.trim();
        }
        
        try {
          await saveBankAccount(formData, isDefault, accountId);
          Utils.showToast('Compte enregistré avec succès', 'success');
          Utils.closeModal();
        } catch (error) {
          Utils.showToast('Erreur lors de l\'enregistrement', 'error');
        }
      });

      // Load account data if editing
      if (accountId) {
        const account = bankAccounts.find(a => a.id === accountId);
        if (account) {
          document.getElementById('bankAccountId').value = account.id;
          document.getElementById('accountType').value = account.type;
          document.getElementById('accountDefault').checked = account.is_default;
          
          // Trigger type change
          const event = new Event('change');
          document.getElementById('accountType').dispatchEvent(event);
          
          if (account.type === 'bank_transfer') {
            document.getElementById('bankName').value = account.bank_name;
            document.getElementById('accountNumber').value = account.account_number;
            document.getElementById('accountHolderName').value = account.account_name;
          } else {
            document.getElementById('accountPhone').value = account.phone_number;
            document.getElementById('accountName').value = account.account_name || '';
          }
        }
      }
    }

    // Save bank account
    async function saveBankAccount(formData, isDefault, accountId) {
      // If setting as default, remove default from others
      if (isDefault) {
        bankAccounts.forEach(a => a.is_default = false);
      }
      
      if (accountId) {
        // Update existing
        const index = bankAccounts.findIndex(a => a.id === accountId);
        if (index !== -1) {
          bankAccounts[index] = { ...bankAccounts[index], ...formData, is_default: isDefault };
        }
      } else {
        // Create new
        bankAccounts.push({
          id: Date.now().toString(),
          ...formData,
          is_default: isDefault,
          created_at: new Date().toISOString()
        });
      }
      
      localStorage.setItem('lokomanager_owner_bank_accounts', JSON.stringify(bankAccounts));
      renderBankAccounts();
    }

    // Edit bank account
    window.SettingsPage.editBankAccount = function(accountId) {
      openBankAccountModal(accountId);
    };

    // Delete bank account
    window.SettingsPage.deleteBankAccount = async function(accountId) {
      if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
        return;
      }
      
      try {
        bankAccounts = bankAccounts.filter(a => a.id !== accountId);
        localStorage.setItem('lokomanager_owner_bank_accounts', JSON.stringify(bankAccounts));
        
        renderBankAccounts();
        Utils.showToast('Compte supprimé', 'success');
      } catch (error) {
        Utils.showToast('Erreur lors de la suppression', 'error');
      }
    };

    // Initialize
    loadBankAccounts();
  }
};
