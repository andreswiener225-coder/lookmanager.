/**
 * PDF Service
 * Generate payment receipts using jsPDF
 * Note: This service generates PDF data that will be sent to frontend
 * The actual PDF generation happens in the browser with jsPDF library
 */

export interface ReceiptData {
  receipt_number: string;
  payment_date: string;
  tenant_name: string;
  tenant_phone: string;
  tenant_email?: string;
  property_name: string;
  property_address: string;
  owner_name: string;
  owner_phone?: string;
  amount: number;
  payment_method: string;
  payment_month: string;
  transaction_id?: string;
  notes?: string;
}

export interface OwnerInfo {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  logo_url?: string;
}

export class PDFService {
  /**
   * Generate receipt number
   */
  static generateReceiptNumber(prefix: string = 'REC'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Format currency (XOF)
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format date
   */
  static formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Get payment method display name
   */
  static getPaymentMethodName(method: string): string {
    const methods: Record<string, string> = {
      'cash': 'Espèces',
      'orange_money': 'Orange Money',
      'mtn_money': 'MTN Money',
      'moov_money': 'Moov Money',
      'wave': 'Wave',
      'bank_transfer': 'Virement Bancaire',
      'check': 'Chèque',
      'ORANGE_MONEY_CI': 'Orange Money',
      'MTN_MONEY_CI': 'MTN Money',
      'MOOV_MONEY_CI': 'Moov Money',
      'WAVE_CI': 'Wave'
    };
    return methods[method] || method;
  }

  /**
   * Prepare receipt data for PDF generation
   * This will be sent to frontend where jsPDF will generate the actual PDF
   */
  static prepareReceiptData(receipt: ReceiptData, owner?: OwnerInfo): any {
    return {
      // Receipt info
      receipt_number: receipt.receipt_number,
      payment_date: this.formatDate(receipt.payment_date),
      
      // Owner info
      owner: {
        name: owner?.name || receipt.owner_name,
        phone: owner?.phone || receipt.owner_phone || '',
        email: owner?.email || '',
        address: owner?.address || '',
        logo_url: owner?.logo_url || ''
      },
      
      // Tenant info
      tenant: {
        name: receipt.tenant_name,
        phone: receipt.tenant_phone,
        email: receipt.tenant_email || ''
      },
      
      // Property info
      property: {
        name: receipt.property_name,
        address: receipt.property_address
      },
      
      // Payment details
      payment: {
        amount: receipt.amount,
        amount_formatted: this.formatCurrency(receipt.amount),
        method: this.getPaymentMethodName(receipt.payment_method),
        month: receipt.payment_month,
        transaction_id: receipt.transaction_id || '',
        notes: receipt.notes || ''
      },
      
      // PDF metadata
      metadata: {
        title: `Reçu de paiement ${receipt.receipt_number}`,
        subject: `Paiement loyer ${receipt.property_name}`,
        author: receipt.owner_name,
        creator: 'LokoManager',
        generated_at: new Date().toISOString()
      }
    };
  }

  /**
   * Generate HTML template for receipt (can be used for preview)
   */
  static generateReceiptHTML(data: any): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reçu ${data.receipt_number}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .receipt-number { font-size: 24px; font-weight: bold; color: #2563eb; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; color: #374151; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        .info-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .label { color: #6b7280; }
        .value { font-weight: 500; }
        .amount-box { background: #dbeafe; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; }
        .amount { font-size: 32px; font-weight: bold; color: #1e40af; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>REÇU DE PAIEMENT</h1>
        <div class="receipt-number">${data.receipt_number}</div>
        <p>Date: ${data.payment_date}</p>
    </div>

    <div class="section">
        <div class="section-title">Propriétaire</div>
        <div class="info-row"><span class="label">Nom:</span><span class="value">${data.owner.name}</span></div>
        ${data.owner.phone ? `<div class="info-row"><span class="label">Téléphone:</span><span class="value">${data.owner.phone}</span></div>` : ''}
        ${data.owner.email ? `<div class="info-row"><span class="label">Email:</span><span class="value">${data.owner.email}</span></div>` : ''}
    </div>

    <div class="section">
        <div class="section-title">Locataire</div>
        <div class="info-row"><span class="label">Nom:</span><span class="value">${data.tenant.name}</span></div>
        <div class="info-row"><span class="label">Téléphone:</span><span class="value">${data.tenant.phone}</span></div>
        ${data.tenant.email ? `<div class="info-row"><span class="label">Email:</span><span class="value">${data.tenant.email}</span></div>` : ''}
    </div>

    <div class="section">
        <div class="section-title">Propriété</div>
        <div class="info-row"><span class="label">Bien:</span><span class="value">${data.property.name}</span></div>
        <div class="info-row"><span class="label">Adresse:</span><span class="value">${data.property.address}</span></div>
    </div>

    <div class="amount-box">
        <p style="margin: 0; color: #6b7280;">Montant payé</p>
        <div class="amount">${data.payment.amount_formatted}</div>
    </div>

    <div class="section">
        <div class="section-title">Détails du paiement</div>
        <div class="info-row"><span class="label">Méthode:</span><span class="value">${data.payment.method}</span></div>
        <div class="info-row"><span class="label">Période:</span><span class="value">${data.payment.month}</span></div>
        ${data.payment.transaction_id ? `<div class="info-row"><span class="label">Transaction ID:</span><span class="value">${data.payment.transaction_id}</span></div>` : ''}
        ${data.payment.notes ? `<div class="info-row"><span class="label">Notes:</span><span class="value">${data.payment.notes}</span></div>` : ''}
    </div>

    <div class="footer">
        <p>Ce reçu a été généré automatiquement par LokoManager</p>
        <p>${data.metadata.generated_at}</p>
    </div>
</body>
</html>
    `;
  }
}

export default PDFService;
