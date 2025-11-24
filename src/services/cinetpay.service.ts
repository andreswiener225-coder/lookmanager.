/**
 * CinetPay Service
 * Integration with CinetPay payment gateway for Mobile Money payments
 * Documentation: https://docs.cinetpay.com/
 */

export interface CinetPayConfig {
  apiKey: string;
  siteId: string;
  secretKey?: string;
  mode?: 'sandbox' | 'production';
}

export interface PaymentInitRequest {
  transaction_id: string;
  amount: number;
  currency?: string;
  customer_name: string;
  customer_surname?: string;
  customer_email?: string;
  customer_phone_number: string;
  customer_address?: string;
  customer_city?: string;
  customer_country?: string;
  customer_state?: string;
  customer_zip_code?: string;
  description: string;
  notify_url: string;
  return_url: string;
  channels?: string;
  metadata?: string;
  lang?: 'fr' | 'en';
}

export interface PaymentInitResponse {
  code: string;
  message: string;
  data: {
    payment_url: string;
    payment_token: string;
  };
  api_response_id: string;
}

export interface PaymentCheckRequest {
  transaction_id: string;
}

export interface PaymentCheckResponse {
  code: string;
  message: string;
  data: {
    cpm_site_id: string;
    cpm_trans_id: string;
    cpm_custom: string;
    cpm_amount: string;
    cpm_currency: string;
    cpm_payid: string;
    cpm_payment_date: string;
    cpm_payment_time: string;
    cpm_error_message: string;
    payment_method: string;
    cpm_phone_prefixe: string;
    cel_phone_num: string;
    cpm_ipn_ack: string;
    created_at: string;
    updated_at: string;
    cpm_result: string;
    cpm_trans_status: string;
    cpm_designation: string;
    buyer_name: string;
  };
  api_response_id: string;
}

export class CinetPayService {
  private config: CinetPayConfig;
  private baseUrl: string;

  constructor(config: CinetPayConfig) {
    this.config = {
      mode: 'sandbox',
      currency: 'XOF',
      ...config
    };
    
    // Sandbox vs Production URLs
    this.baseUrl = this.config.mode === 'production'
      ? 'https://api-checkout.cinetpay.com/v2'
      : 'https://api-checkout.cinetpay.com/v2'; // Same URL for both (sandbox mode controlled by credentials)
  }

  /**
   * Initialize a payment
   */
  async initPayment(request: PaymentInitRequest): Promise<PaymentInitResponse> {
    const payload = {
      apikey: this.config.apiKey,
      site_id: this.config.siteId,
      transaction_id: request.transaction_id,
      amount: request.amount,
      currency: request.currency || 'XOF',
      customer_name: request.customer_name,
      customer_surname: request.customer_surname || '',
      customer_email: request.customer_email || '',
      customer_phone_number: request.customer_phone_number,
      customer_address: request.customer_address || '',
      customer_city: request.customer_city || 'Abidjan',
      customer_country: request.customer_country || 'CI',
      customer_state: request.customer_state || 'CI',
      customer_zip_code: request.customer_zip_code || '',
      description: request.description,
      notify_url: request.notify_url,
      return_url: request.return_url,
      channels: request.channels || 'ALL',
      metadata: request.metadata || '',
      lang: request.lang || 'fr'
    };

    const response = await fetch(`${this.baseUrl}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`CinetPay Init Error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Check payment status
   */
  async checkPayment(request: PaymentCheckRequest): Promise<PaymentCheckResponse> {
    const payload = {
      apikey: this.config.apiKey,
      site_id: this.config.siteId,
      transaction_id: request.transaction_id
    };

    const response = await fetch(`${this.baseUrl}/payment/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`CinetPay Check Error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(data: any, signature: string): boolean {
    // CinetPay uses HMAC SHA256 for webhook verification
    // This is a placeholder - implement actual signature verification
    return true; // TODO: Implement proper signature verification
  }

  /**
   * Generate unique transaction ID
   */
  static generateTransactionId(prefix: string = 'LOKO'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Format amount for CinetPay (must be integer)
   */
  static formatAmount(amount: number): number {
    return Math.round(amount);
  }

  /**
   * Get payment method display name
   */
  static getPaymentMethodName(method: string): string {
    const methods: Record<string, string> = {
      'ORANGE_MONEY_CI': 'Orange Money',
      'MTN_MONEY_CI': 'MTN Money',
      'MOOV_MONEY_CI': 'Moov Money',
      'WAVE_CI': 'Wave',
      'VISA': 'Carte Visa',
      'MASTERCARD': 'Carte Mastercard',
      'FLOOZ_BJ': 'Flooz Bénin',
      'TMONEY_TG': 'TMoney Togo'
    };
    return methods[method] || method;
  }
}

export default CinetPayService;
