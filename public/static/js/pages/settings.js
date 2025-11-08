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
  }
};
