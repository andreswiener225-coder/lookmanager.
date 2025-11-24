/**
 * CinetPay Routes
 * Payment processing with CinetPay API
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse, ERROR_CODES } from '../utils/response';
import CinetPayService from '../services/cinetpay.service';

type Bindings = {
  DB: D1Database;
  CINETPAY_API_KEY: string;
  CINETPAY_SITE_ID: string;
  CINETPAY_SECRET_KEY?: string;
}

const app = new Hono<{ Bindings: Bindings }>();

// Apply auth middleware to tenant routes
app.use('/tenant/*', authMiddleware);

// ==================== TENANT PAYMENT INITIATION ====================

/**
 * POST /api/cinetpay/tenant/init-payment
 * Initialize a payment for a tenant
 */
app.post('/tenant/init-payment', async (c: Context) => {
  try {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();

    // Validate request
    if (!body.payment_id || !body.amount) {
      return errorResponse(c, ERROR_CODES.VALIDATION_ERROR, 'payment_id et amount requis', 400);
    }

    // Get payment details
    const payment = await c.env.DB
      .prepare(`
        SELECT p.*, t.full_name as tenant_name, t.phone as tenant_phone, t.email as tenant_email,
               prop.name as property_name, prop.address as property_address,
               o.full_name as owner_name
        FROM payments p
        JOIN tenants t ON p.tenant_id = t.id
        JOIN properties prop ON p.property_id = prop.id
        JOIN owners o ON p.owner_id = o.id
        WHERE p.id = ? AND p.tenant_id = ?
      `)
      .bind(body.payment_id, tenantId)
      .first();

    if (!payment) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Paiement introuvable', 404);
    }

    // Initialize CinetPay service
    const cinetpay = new CinetPayService({
      apiKey: c.env.CINETPAY_API_KEY,
      siteId: c.env.CINETPAY_SITE_ID,
      secretKey: c.env.CINETPAY_SECRET_KEY,
      mode: 'sandbox' // Change to 'production' when ready
    });

    // Generate transaction ID
    const transactionId = CinetPayService.generateTransactionId('LOKO');

    // Get base URL for callbacks
    const baseUrl = new URL(c.req.url).origin;
    const notifyUrl = `${baseUrl}/api/cinetpay/webhook`;
    const returnUrl = `${baseUrl}/static/tenant-dashboard.html?payment_status=success`;

    // Initialize payment
    const paymentInit = await cinetpay.initPayment({
      transaction_id: transactionId,
      amount: CinetPayService.formatAmount(body.amount),
      currency: 'XOF',
      customer_name: payment.tenant_name,
      customer_phone_number: payment.tenant_phone,
      customer_email: payment.tenant_email || '',
      description: `Loyer ${payment.property_name} - ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
      notify_url: notifyUrl,
      return_url: returnUrl,
      channels: 'ALL',
      lang: 'fr'
    });

    // Save transaction to database
    await c.env.DB
      .prepare(`
        INSERT INTO cinetpay_transactions (
          payment_id, tenant_id, owner_id, property_id,
          transaction_id, amount, currency, status,
          payment_token, description, customer_name, customer_phone, customer_email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        body.payment_id,
        tenantId,
        payment.owner_id,
        payment.property_id,
        transactionId,
        body.amount,
        'XOF',
        'pending',
        paymentInit.data.payment_token,
        `Loyer ${payment.property_name}`,
        payment.tenant_name,
        payment.tenant_phone,
        payment.tenant_email || ''
      )
      .run();

    return successResponse(c, {
      payment_url: paymentInit.data.payment_url,
      payment_token: paymentInit.data.payment_token,
      transaction_id: transactionId,
      amount: body.amount,
      message: 'Paiement initialisé avec succès'
    }, 201);
  } catch (error: any) {
    console.error('[cinetpay.init-payment]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, `Erreur lors de l'initialisation du paiement: ${error.message}`, 500);
  }
});

/**
 * GET /api/cinetpay/tenant/check-payment/:transaction_id
 * Check payment status
 */
app.get('/tenant/check-payment/:transaction_id', async (c: Context) => {
  try {
    const tenantId = c.get('tenantId');
    const transactionId = c.req.param('transaction_id');

    // Get transaction from database
    const transaction = await c.env.DB
      .prepare('SELECT * FROM cinetpay_transactions WHERE transaction_id = ? AND tenant_id = ?')
      .bind(transactionId, tenantId)
      .first();

    if (!transaction) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Transaction introuvable', 404);
    }

    // Initialize CinetPay service
    const cinetpay = new CinetPayService({
      apiKey: c.env.CINETPAY_API_KEY,
      siteId: c.env.CINETPAY_SITE_ID,
      mode: 'sandbox'
    });

    // Check payment status with CinetPay
    const paymentCheck = await cinetpay.checkPayment({
      transaction_id: transactionId
    });

    // Update transaction status
    let status = 'pending';
    if (paymentCheck.data.cpm_result === '00') {
      status = 'completed';
    } else if (paymentCheck.data.cpm_result === '01') {
      status = 'failed';
    }

    await c.env.DB
      .prepare(`
        UPDATE cinetpay_transactions 
        SET status = ?, cpm_trans_id = ?, payment_method = ?, updated_at = CURRENT_TIMESTAMP,
            completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE transaction_id = ?
      `)
      .bind(status, paymentCheck.data.cpm_trans_id, paymentCheck.data.payment_method, status, transactionId)
      .run();

    // If completed, update payment status
    if (status === 'completed') {
      await c.env.DB
        .prepare('UPDATE payments SET status = ?, payment_date = CURRENT_TIMESTAMP WHERE id = ?')
        .bind('paid', transaction.payment_id)
        .run();
    }

    return successResponse(c, {
      status,
      payment_method: CinetPayService.getPaymentMethodName(paymentCheck.data.payment_method),
      amount: paymentCheck.data.cpm_amount,
      transaction_id: transactionId,
      cpm_trans_id: paymentCheck.data.cpm_trans_id,
      payment_date: paymentCheck.data.cpm_payment_date,
      payment_time: paymentCheck.data.cpm_payment_time
    });
  } catch (error: any) {
    console.error('[cinetpay.check-payment]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, `Erreur lors de la vérification: ${error.message}`, 500);
  }
});

// ==================== WEBHOOK ====================

/**
 * POST /api/cinetpay/webhook
 * CinetPay webhook callback
 */
app.post('/webhook', async (c: Context) => {
  try {
    const body = await c.req.json();
    
    console.log('[cinetpay.webhook] Received:', body);

    // Verify webhook (basic validation)
    if (!body.cpm_trans_id || !body.cpm_custom) {
      return c.json({ error: 'Invalid webhook data' }, 400);
    }

    const transactionId = body.cpm_custom;

    // Get transaction
    const transaction = await c.env.DB
      .prepare('SELECT * FROM cinetpay_transactions WHERE transaction_id = ?')
      .bind(transactionId)
      .first();

    if (!transaction) {
      console.error('[cinetpay.webhook] Transaction not found:', transactionId);
      return c.json({ error: 'Transaction not found' }, 404);
    }

    // Determine status
    let status = 'processing';
    if (body.cpm_result === '00') {
      status = 'completed';
    } else if (body.cpm_result === '01') {
      status = 'failed';
    }

    // Update transaction
    await c.env.DB
      .prepare(`
        UPDATE cinetpay_transactions 
        SET status = ?, cpm_trans_id = ?, payment_method = ?, webhook_data = ?,
            updated_at = CURRENT_TIMESTAMP,
            completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE transaction_id = ?
      `)
      .bind(
        status,
        body.cpm_trans_id,
        body.payment_method,
        JSON.stringify(body),
        status,
        transactionId
      )
      .run();

    // If completed, update payment and generate receipt
    if (status === 'completed') {
      // Update payment
      await c.env.DB
        .prepare('UPDATE payments SET status = ?, payment_date = CURRENT_TIMESTAMP WHERE id = ?')
        .bind('paid', transaction.payment_id)
        .run();

      // TODO: Generate PDF receipt (will be implemented in next step)
      console.log('[cinetpay.webhook] Payment completed, should generate PDF for payment:', transaction.payment_id);
    }

    return c.json({ message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('[cinetpay.webhook]', error);
    return c.json({ error: error.message }, 500);
  }
});

// ==================== OWNER TRANSACTION HISTORY ====================

/**
 * GET /api/cinetpay/owner/transactions
 * Get all transactions for owner
 */
app.get('/owner/transactions', authMiddleware, async (c: Context) => {
  try {
    const ownerId = c.get('ownerId');

    const { results } = await c.env.DB
      .prepare(`
        SELECT 
          ct.*,
          p.due_date, p.payment_month,
          t.full_name as tenant_name,
          prop.name as property_name
        FROM cinetpay_transactions ct
        JOIN payments p ON ct.payment_id = p.id
        JOIN tenants t ON ct.tenant_id = t.id
        JOIN properties prop ON ct.property_id = prop.id
        WHERE ct.owner_id = ?
        ORDER BY ct.created_at DESC
      `)
      .bind(ownerId)
      .all();

    return successResponse(c, results);
  } catch (error: any) {
    console.error('[cinetpay.owner.transactions]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération des transactions', 500);
  }
});

export default app;
