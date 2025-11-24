/**
 * PDF Generator Module
 * Generate payment receipts using jsPDF
 * Requires: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
 */

window.PDFGenerator = {
  /**
   * Generate payment receipt PDF
   * @param {Object} receiptData - Receipt data from API
   * @param {string} action - 'download' or 'open' (default: 'download')
   */
  generateReceipt(receiptData, action = 'download') {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Colors
      const primaryColor = [37, 99, 235]; // Blue
      const secondaryColor = [107, 114, 128]; // Gray
      const accentColor = [16, 185, 129]; // Green

      // Margins
      const margin = 20;
      let yPos = margin;

      // ==================== HEADER ====================
      
      // Title
      doc.setFontSize(24);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text('REÇU DE PAIEMENT', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
      yPos += 10;

      // Receipt Number
      doc.setFontSize(16);
      doc.setTextColor(...accentColor);
      doc.text(receiptData.receipt_number, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
      yPos += 8;

      // Date
      doc.setFontSize(11);
      doc.setTextColor(...secondaryColor);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${receiptData.payment_date}`, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
      yPos += 10;

      // Horizontal line
      doc.setDrawColor(...secondaryColor);
      doc.line(margin, yPos, doc.internal.pageSize.getWidth() - margin, yPos);
      yPos += 15;

      // ==================== OWNER INFO ====================
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Propriétaire', margin, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Nom: ${receiptData.owner.name}`, margin + 5, yPos);
      yPos += 5;
      
      if (receiptData.owner.phone) {
        doc.text(`Téléphone: ${receiptData.owner.phone}`, margin + 5, yPos);
        yPos += 5;
      }
      
      if (receiptData.owner.email) {
        doc.text(`Email: ${receiptData.owner.email}`, margin + 5, yPos);
        yPos += 5;
      }
      
      yPos += 5;

      // ==================== TENANT INFO ====================
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Locataire', margin, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Nom: ${receiptData.tenant.name}`, margin + 5, yPos);
      yPos += 5;
      doc.text(`Téléphone: ${receiptData.tenant.phone}`, margin + 5, yPos);
      yPos += 5;
      
      if (receiptData.tenant.email) {
        doc.text(`Email: ${receiptData.tenant.email}`, margin + 5, yPos);
        yPos += 5;
      }
      
      yPos += 5;

      // ==================== PROPERTY INFO ====================
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Propriété', margin, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Bien: ${receiptData.property.name}`, margin + 5, yPos);
      yPos += 5;
      doc.text(`Adresse: ${receiptData.property.address}`, margin + 5, yPos);
      yPos += 10;

      // ==================== AMOUNT BOX ====================
      
      const boxY = yPos;
      const boxHeight = 25;
      
      // Background
      doc.setFillColor(219, 234, 254); // Light blue
      doc.rect(margin, boxY, doc.internal.pageSize.getWidth() - 2 * margin, boxHeight, 'F');
      
      // Amount text
      doc.setFontSize(10);
      doc.setTextColor(...secondaryColor);
      doc.text('Montant payé', doc.internal.pageSize.getWidth() / 2, boxY + 8, { align: 'center' });
      
      doc.setFontSize(22);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(receiptData.payment.amount_formatted, doc.internal.pageSize.getWidth() / 2, boxY + 18, { align: 'center' });
      
      yPos = boxY + boxHeight + 10;

      // ==================== PAYMENT DETAILS ====================
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Détails du paiement', margin, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Méthode: ${receiptData.payment.method}`, margin + 5, yPos);
      yPos += 5;
      doc.text(`Période: ${receiptData.payment.month}`, margin + 5, yPos);
      yPos += 5;
      
      if (receiptData.payment.transaction_id) {
        doc.text(`Transaction ID: ${receiptData.payment.transaction_id}`, margin + 5, yPos);
        yPos += 5;
      }
      
      if (receiptData.payment.notes) {
        doc.text(`Notes: ${receiptData.payment.notes}`, margin + 5, yPos);
        yPos += 5;
      }

      // ==================== FOOTER ====================
      
      yPos = doc.internal.pageSize.getHeight() - 30;
      
      // Horizontal line
      doc.setDrawColor(...secondaryColor);
      doc.line(margin, yPos, doc.internal.pageSize.getWidth() - margin, yPos);
      yPos += 5;

      doc.setFontSize(9);
      doc.setTextColor(...secondaryColor);
      doc.setFont('helvetica', 'italic');
      doc.text('Ce reçu a été généré automatiquement par LokoManager', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });

      // ==================== OUTPUT ====================
      
      const filename = `Recu_${receiptData.receipt_number}.pdf`;
      
      if (action === 'open') {
        // Open in new window
        doc.output('dataurlnewwindow');
      } else {
        // Download
        doc.save(filename);
      }

      return { success: true, filename };
    } catch (error) {
      console.error('[PDF Generator]', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Generate and download receipt for a payment
   * @param {number} paymentId - Payment ID
   */
  async downloadReceiptForPayment(paymentId) {
    try {
      // Get receipt data from API
      const response = await window.api.post('/receipts/generate', { payment_id: paymentId });
      
      if (response.success && response.data.receipt_data) {
        const result = this.generateReceipt(response.data.receipt_data, 'download');
        
        if (result.success) {
          Utils.showToast('Reçu téléchargé avec succès', 'success');
        } else {
          Utils.showToast('Erreur lors de la génération du PDF', 'error');
        }
        
        return result;
      } else {
        Utils.showToast('Erreur lors de la récupération des données', 'error');
        return { success: false };
      }
    } catch (error) {
      console.error('[Download Receipt]', error);
      Utils.showToast('Erreur lors du téléchargement', 'error');
      return { success: false, error: error.message };
    }
  },

  /**
   * Preview receipt in new window
   * @param {number} paymentId - Payment ID
   */
  async previewReceipt(paymentId) {
    try {
      const response = await window.api.get(`/receipts/payment/${paymentId}`);
      
      if (response.success && response.data.receipt_data) {
        this.generateReceipt(response.data.receipt_data, 'open');
      } else {
        Utils.showToast('Reçu non disponible', 'error');
      }
    } catch (error) {
      console.error('[Preview Receipt]', error);
      Utils.showToast('Erreur lors de la prévisualisation', 'error');
    }
  }
};
