/**
 * LokoManager - Onboarding & Tour Guide System
 * Interactive tutorial for new users
 */

class OnboardingTour {
  constructor() {
    this.currentStep = 0;
    this.steps = [
      {
        target: '.sidebar-header',
        title: 'Bienvenue sur LokoManager ! 🎉',
        content: 'Commençons par découvrir les fonctionnalités principales de votre plateforme de gestion locative.',
        position: 'right',
        showSkip: true
      },
      {
        target: '.nav-item[data-page="dashboard"]',
        title: 'Tableau de Bord 📊',
        content: 'Votre tableau de bord affiche un aperçu complet : statistiques, revenus, paiements en retard et graphiques.',
        position: 'right'
      },
      {
        target: '.nav-item[data-page="properties"]',
        title: 'Mes Propriétés 🏢',
        content: 'Gérez toutes vos propriétés ici : ajoutez, modifiez ou supprimez des biens immobiliers.',
        position: 'right',
        action: () => {
          Utils.showToast('Astuce : Commencez par ajouter votre première propriété !', 'info');
        }
      },
      {
        target: '.nav-item[data-page="tenants"]',
        title: 'Mes Locataires 👥',
        content: 'Gérez vos locataires : coordonnées, historique de paiements, contrats et communications.',
        position: 'right'
      },
      {
        target: '.nav-item[data-page="payments"]',
        title: 'Paiements 💰',
        content: 'Suivez tous les paiements : en attente, en retard ou complétés. Filtrez par locataire ou propriété.',
        position: 'right'
      },
      {
        target: '.nav-item[data-page="expenses"]',
        title: 'Dépenses 📝',
        content: 'Enregistrez toutes vos dépenses : maintenance, taxes, assurances et réparations.',
        position: 'right'
      },
      {
        target: '.header-actions',
        title: 'Notifications et Profil 🔔',
        content: 'Consultez vos notifications et accédez à vos paramètres de compte ici.',
        position: 'bottom'
      },
      {
        target: '.subscription-badge, .px-4.py-3.mx-3.mb-4',
        title: 'Votre Forfait 👑',
        content: `Vous êtes actuellement sur le forfait ${window.auth?.user?.subscription_tier || 'Gratuit'}. Mettez à niveau pour débloquer plus de fonctionnalités !`,
        position: 'top'
      }
    ];
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
    this.showStep(0);
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
