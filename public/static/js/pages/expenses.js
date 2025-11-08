/**
 * LokoManager - Expenses Page (Minimal Version)
 */
window.ExpensesPage = {
  data: { expenses: [] },
  async render(container) {
    try {
      const response = await api.getExpenses();
      this.data.expenses = response.data || [];
      container.innerHTML = `
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-800">Dépenses</h2>
            <button class="btn btn-primary" data-action="create-expense">
              <i class="fas fa-plus mr-2"></i>Ajouter une dépense
            </button>
          </div>
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            ${this.data.expenses.length > 0 ? `
              <table class="data-table">
                <thead><tr>
                  <th>Date</th><th>Catégorie</th><th>Description</th><th>Montant</th>
                </tr></thead>
                <tbody>
                  ${this.data.expenses.map(e => `
                    <tr>
                      <td>${Utils.formatDate(e.date)}</td>
                      <td>${Utils.getCategoryLabel(e.category)}</td>
                      <td>${Utils.truncate(e.description, 50)}</td>
                      <td class="font-semibold text-red-600">${Utils.formatCurrency(e.amount)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<div class="p-12 text-center text-gray-500">Aucune dépense</div>'}
          </div>
        </div>
      `;
    } catch (error) {
      Utils.showError(container, error.message);
    }
  }
};
