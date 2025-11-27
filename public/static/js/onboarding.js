/**
 * LokoManager - Onboarding & Tour Guide System
 * Interactive tutorial for new users
 */

class OnboardingTour {
  constructor() {
    this.currentStep = 0;
    this.tourType = 'general'; // 'general', 'properties', 'tenants', 'payments', 'settings'
    
    // Define multiple tour types
    this.tours = {
      general: [
        {
          target: '.sidebar-header',
          title: 'Bienvenue sur LokoManager ! 🎉',
          content: 'Commençons par découvrir les fonctionnalités principales de votre plateforme de gestion locative intelligente.',
          position: 'right',
          showSkip: true
        },
        {
          target: '.nav-item[data-page="dashboard"]',
          title: 'Tableau de Bord 📊',
          content: 'Votre tableau de bord affiche un aperçu complet : statistiques, revenus, paiements en retard et graphiques interactifs.',
          position: 'right'
        },
        {
          target: '.nav-item[data-page="properties"]',
          title: 'Mes Propriétés 🏢',
          content: 'Gérez toutes vos propriétés : immeubles, villas, studios. Structurez en bâtiments > appartements.',
          position: 'right',
          action: () => {
            Utils.showToast('Astuce : Commencez par ajouter votre première propriété !', 'info');
          }
        },
        {
          target: '.nav-item[data-page="tenants"]',
          title: 'Mes Locataires 👥',
          content: 'Gérez vos locataires : coordonnées, historique de paiements, contrats et communications SMS/WhatsApp.',
          position: 'right'
        },
        {
          target: '.nav-item[data-page="payments"]',
          title: 'Paiements 💰',
          content: 'Suivez tous les paiements : Orange Money, MTN, Moov, Wave. Téléchargez des reçus PDF automatiquement.',
          position: 'right'
        },
        {
          target: '#notificationsBtn',
          title: 'Notifications 🔔',
          content: 'Recevez des alertes pour les retards de paiement, nouveaux locataires et échéances importantes.',
          position: 'bottom'
        },
        {
          target: '.nav-item[data-page="settings"]',
          title: 'Mes Comptes de Réception 💳',
          content: 'Dans les Paramètres, configurez vos comptes Mobile Money ou bancaires pour recevoir les loyers.',
          position: 'right'
        }
      ],

      properties: [
        {
          target: '#addPropertyBtn',
          title: 'Ajouter une Propriété 🏡',
          content: 'Cliquez ici pour créer une nouvelle propriété. Vous pouvez créer des immeubles avec plusieurs appartements.',
          position: 'bottom',
          showSkip: true
        },
        {
          target: '.property-list, #propertiesTable',
          title: 'Liste des Propriétés 📋',
          content: 'Toutes vos propriétés s\'affichent ici. Utilisez les icônes pour modifier, supprimer ou voir les détails.',
          position: 'top'
        },
        {
          target: '.filter-buttons, .property-filters',
          title: 'Filtres Rapides 🔍',
          content: 'Filtrez vos propriétés par statut : Occupées, Vacantes ou en Maintenance pour une vue ciblée.',
          position: 'bottom'
        },
        {
          target: '.property-card, tr',
          title: 'Groupement Hiérarchique 🏢➡️🏠',
          content: 'Astuce : Créez un "Immeuble" parent, puis ajoutez des "Appartements" liés pour une gestion organisée.',
          position: 'left'
        }
      ],

      tenants: [
        {
          target: '#addTenantBtn',
          title: 'Ajouter un Locataire 👤',
          content: 'Créez un nouveau locataire en renseignant ses coordonnées, la propriété louée et le code PIN à 4 chiffres.',
          position: 'bottom',
          showSkip: true
        },
        {
          target: '.tenant-list, #tenantsTable',
          title: 'Liste des Locataires 📇',
          content: 'Consultez tous vos locataires avec leur statut (Actif, Inactif, Résilié) et leurs informations de contact.',
          position: 'top'
        },
        {
          target: '.tenant-card, tr',
          title: 'Authentification Locataire 🔑',
          content: 'Chaque locataire reçoit un code PIN unique pour accéder à son tableau de bord personnel et payer en ligne.',
          position: 'left'
        },
        {
          target: '.btn-edit',
          title: 'Modification Locataire ✏️',
          content: 'Modifiez les informations du locataire : la propriété actuelle s\'affiche avec le tag [Actuelle] dans la liste.',
          position: 'left'
        }
      ],

      payments: [
        {
          target: '#addPaymentBtn',
          title: 'Enregistrer un Paiement 💸',
          content: 'Enregistrez un paiement reçu : montant exact (accepte 12345 FCFA), méthode de paiement et référence.',
          position: 'bottom',
          showSkip: true
        },
        {
          target: '.payment-list, #paymentsTable',
          title: 'Historique des Paiements 📜',
          content: 'Visualisez tous les paiements : En attente, Payés, Partiels ou En retard. Filtrez par locataire ou propriété.',
          position: 'top'
        },
        {
          target: '.btn-download-receipt, [data-action="download-receipt"]',
          title: 'Télécharger Reçus PDF 📄',
          content: 'Téléchargez des reçus PDF professionnels pour chaque paiement avec logo, QR code et informations complètes.',
          position: 'left'
        },
        {
          target: '.payment-method-select',
          title: 'Méthodes de Paiement 📱💳',
          content: 'Enregistrez les paiements Mobile Money (Orange, MTN, Moov, Wave), Espèces, Virement ou Chèque.',
          position: 'top'
        },
        {
          target: '.payment-stats, .dashboard-stats',
          title: 'Statistiques de Paiements 📊',
          content: 'Suivez vos revenus mensuels, taux de collecte et identifiez rapidement les retards de paiement.',
          position: 'bottom'
        }
      ],

      settings: [
        {
          target: '#bankAccountsSection',
          title: 'Mes Comptes de Réception 🏦',
          content: 'Configurez vos comptes Mobile Money (Orange, MTN, Moov, Wave) ou bancaires pour recevoir les loyers.',
          position: 'top',
          showSkip: true
        },
        {
          target: '#addBankAccountBtn',
          title: 'Ajouter un Compte ➕',
          content: 'Ajoutez plusieurs comptes de réception. Définissez un compte principal pour vos encaissements prioritaires.',
          position: 'left'
        },
        {
          target: '#restartTutorialBtn',
          title: 'Relancer le Tutoriel 🔄',
          content: 'Vous pouvez relancer les tutoriels à tout moment depuis cette section pour revoir les fonctionnalités.',
          position: 'left'
        },
        {
          target: '#changePasswordBtn',
          title: 'Changer le Mot de Passe 🔒',
          content: 'Sécurisez votre compte en changeant régulièrement votre mot de passe.',
          position: 'left'
        }
      ]
    };

    this.steps = this.tours.general;
  }

  /**
   * Start the onboarding tour
   */
  start() {
    // Check if user has seen the tour before
    const hasSeenTour = localStorage.getItem('lokomanager_tour_completed');
    
    if (hasSeenTour) {
      return; // Don't show tour again
    }

    this.currentStep = 0;
    this.showStep(0);
  }

  /**
   * Force start tour (for manual restart)
   */
  forceStart() {
    this.currentStep = 0;
    this.tourType = 'general';
    this.steps = this.tours.general;
    this.showStep(0);
  }

  /**
   * Start specific tour type
   */
  startTour(tourType = 'general') {
    if (!this.tours[tourType]) {
      console.warn(`Tour type "${tourType}" not found`);
      return;
    }

    this.tourType = tourType;
    this.steps = this.tours[tourType];
    this.currentStep = 0;
    this.showStep(0);
  }

  /**
   * Get available tour types
   */
  getAvailableTours() {
    return Object.keys(this.tours);
  }

  /**
   * Show specific step
   */
  showStep(stepIndex) {
    // Remove existing overlay
    this.removeOverlay();

    if (stepIndex >= this.steps.length) {
      this.complete();
      return;
    }

    const step = this.steps[stepIndex];
    this.currentStep = stepIndex;

    // Execute step action if exists
    if (step.action) {
      step.action();
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.className = 'fixed inset-0 bg-black bg-opacity-60 z-40';
    document.body.appendChild(overlay);

    // Find target element
    const targetElement = document.querySelector(step.target);
    
    if (!targetElement) {
      console.warn(`Onboarding target not found: ${step.target}`);
      this.next();
      return;
    }

    // Highlight target
    targetElement.style.position = 'relative';
    targetElement.style.zIndex = '50';
    targetElement.classList.add('onboarding-highlight');

    // Create tooltip
    const tooltip = this.createTooltip(step, stepIndex);
    document.body.appendChild(tooltip);

    // Position tooltip
    this.positionTooltip(tooltip, targetElement, step.position);

    // Close overlay on click outside
    overlay.addEventListener('click', () => this.skip());
  }

  /**
   * Create tooltip element
   */
  createTooltip(step, stepIndex) {
    const tooltip = document.createElement('div');
    tooltip.id = 'onboarding-tooltip';
    tooltip.className = 'fixed bg-white rounded-lg shadow-2xl p-6 z-50 max-w-md animate-fade-in';
    
    tooltip.innerHTML = `
      <div class="mb-4">
        <h3 class="text-xl font-bold text-gray-800 mb-2">${step.title}</h3>
        <p class="text-gray-600 leading-relaxed">${step.content}</p>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex space-x-1">
          ${this.steps.map((_, i) => `
            <div class="w-2 h-2 rounded-full ${i === stepIndex ? 'bg-blue-600' : 'bg-gray-300'}"></div>
          `).join('')}
        </div>

        <div class="flex space-x-2">
          ${step.showSkip || stepIndex > 0 ? `
            <button id="onboarding-skip" class="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium">
              Passer
            </button>
          ` : ''}
          <button id="onboarding-next" class="btn btn-primary text-sm px-6 py-2">
            ${stepIndex === this.steps.length - 1 ? 'Terminer' : 'Suivant'} 
            <i class="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      <div class="mt-3 text-center text-xs text-gray-500">
        Étape ${stepIndex + 1} sur ${this.steps.length}
      </div>
    `;

    // Attach event listeners
    const nextBtn = tooltip.querySelector('#onboarding-next');
    nextBtn.addEventListener('click', () => this.next());

    const skipBtn = tooltip.querySelector('#onboarding-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skip());
    }

    return tooltip;
  }

  /**
   * Position tooltip relative to target
   */
  positionTooltip(tooltip, target, position = 'right') {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let top, left;

    switch (position) {
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.right + 20;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left - tooltipRect.width - 20;
        break;
      case 'top':
        top = targetRect.top - tooltipRect.height - 20;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + 20;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      default:
        top = targetRect.top;
        left = targetRect.right + 20;
    }

    // Ensure tooltip stays within viewport
    const padding = 20;
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  /**
   * Go to next step
   */
  next() {
    this.showStep(this.currentStep + 1);
  }

  /**
   * Skip tour
   */
  skip() {
    this.removeOverlay();
    localStorage.setItem('lokomanager_tour_completed', 'true');
    Utils.showToast('Vous pouvez relancer le tutoriel depuis les paramètres', 'info');
  }

  /**
   * Complete tour
   */
  complete() {
    this.removeOverlay();
    localStorage.setItem('lokomanager_tour_completed', 'true');
    
    // Show completion message
    const completionOverlay = document.createElement('div');
    completionOverlay.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center';
    completionOverlay.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md text-center animate-fade-in">
        <div class="mb-6">
          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-check text-green-600 text-4xl"></i>
          </div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Félicitations ! 🎉</h2>
          <p class="text-gray-600">
            Vous êtes maintenant prêt à utiliser LokoManager. Commencez par ajouter votre première propriété !
          </p>
        </div>
        <button id="completion-done" class="btn btn-primary w-full py-3">
          <i class="fas fa-rocket mr-2"></i>
          Commencer à gérer
        </button>
      </div>
    `;
    
    document.body.appendChild(completionOverlay);
    
    document.getElementById('completion-done').addEventListener('click', () => {
      completionOverlay.remove();
      Utils.showToast('Bienvenue sur LokoManager ! 🏠', 'success');
    });
  }

  /**
   * Remove overlay and tooltip
   */
  removeOverlay() {
    const overlay = document.getElementById('onboarding-overlay');
    const tooltip = document.getElementById('onboarding-tooltip');
    
    if (overlay) overlay.remove();
    if (tooltip) tooltip.remove();

    // Remove highlights
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.style.position = '';
      el.style.zIndex = '';
      el.classList.remove('onboarding-highlight');
    });
  }

  /**
   * Reset tour (for settings)
   */
  reset() {
    localStorage.removeItem('lokomanager_tour_completed');
    Utils.showToast('Le tutoriel sera affiché lors de votre prochaine connexion', 'success');
  }
}

// Add CSS for onboarding
const style = document.createElement('style');
style.textContent = `
  .onboarding-highlight {
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.5), 0 0 0 8px rgba(37, 99, 235, 0.2);
    border-radius: 0.5rem;
    transition: all 0.3s ease;
  }
`;
document.head.appendChild(style);

// Export globally
window.OnboardingTour = OnboardingTour;
