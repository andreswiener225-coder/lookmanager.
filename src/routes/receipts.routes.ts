/**
 * Payment Receipts Routes
 * Generate and manage PDF receipts
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse, ERROR_CODES } from '../utils/response';
import PDFService from '../services/pdf.service';

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>();

// Apply auth middleware
app.use('/*', authMiddleware);

// ==================== GENERATE RECEIPT ====================

/**
 * POST /api/receipts/generate
 * Generate a PDF receipt for a payment
 */
app.post('/generate', async (c: Context) => {
  try {
    const ownerId = c.get('ownerId');
    const body = await c.req.json();

    if (!body.payment_id) {
      return errorResponse(c, ERROR_CODES.VALIDATION_ERROR, 'payment_id requis', 400);
    }

    // Get payment details with joins
    const payment = await c.env.DB
      .prepare(`
        SELECT 
          p.*,
          t.full_name as tenant_name, t.phone as tenant_phone, t.email as tenant_email,
          prop.name as property_name, prop.address as property_address,
          o.full_name as owner_name, o.phone as owner_phone, o.email as owner_email
        FROM payments p
        JOIN tenants t ON p.tenant_id = t.id
        JOIN properties prop ON p.property_id = prop.id
        JOIN owners o ON p.owner_id = o.id
        WHERE p.id = ? AND p.owner_id = ?
      `)
      .bind(body.payment_id, ownerId)
      .first();

    if (!payment) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Paiement introuvable', 404);
    }

    // Check if receipt already exists
    let receipt = await c.env.DB
      .prepare('SELECT * FROM payment_receipts WHERE payment_id = ?')
      .bind(body.payment_id)
      .first();

    // Generate receipt number if new
    let receiptNumber;
    if (!receipt) {
      receiptNumber = PDFService.generateReceiptNumber('REC');
      
      // Get transaction ID if exists
      const transaction = await c.env.DB
        .prepare('SELECT transaction_id FROM cinetpay_transactions WHERE payment_id = ? AND status = ?')
        .bind(body.payment_id, 'completed')
        .first();

      // Create receipt record
      await c.env.DB
        .prepare(`
          INSERT INTO payment_receipts (
            payment_id, transaction_id, receipt_number, status
          ) VALUES (?, ?, ?, ?)
        `)
        .bind(body.payment_id, transaction?.id || null, receiptNumber, 'generated')
        .run();
    } else {
      receiptNumber = receipt.receipt_number;
    }

    // Prepare receipt data for PDF generation
    const receiptData = PDFService.prepareReceiptData({
      receipt_number: receiptNumber,
      payment_date: payment.payment_date || payment.created_at,
      tenant_name: payment.tenant_name,
      tenant_phone: payment.tenant_phone,
      tenant_email: payment.tenant_email,
      property_name: payment.property_name,
      property_address: payment.property_address,
      owner_name: payment.owner_name,
      owner_phone: payment.owner_phone,
      amount: payment.amount,
      payment_method: payment.payment_method || 'cash',
      payment_month: payment.payment_month || '',
      transaction_id: payment.reference || '',
      notes: payment.notes || ''
    }, {
      name: payment.owner_name,
      phone: payment.owner_phone,
      email: payment.owner_email
    });

    // Update receipt status
    await c.env.DB
      .prepare('UPDATE payment_receipts SET generated_at = CURRENT_TIMESTAMP, status = ? WHERE receipt_number = ?')
      .bind('generated', receiptNumber)
      .run();

    return successResponse(c, {
      receipt_data: receiptData,
      receipt_number: receiptNumber,
      message: 'Données de reçu générées avec succès. Utilisez jsPDF côté client pour créer le PDF.'
    }, 201);
  } catch (error: any) {
    console.error('[receipts.generate]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, `Erreur lors de la génération: ${error.message}`, 500);
  }
});

/**
 * GET /api/receipts/payment/:payment_id
 * Get receipt data for a payment
 */
app.get('/payment/:payment_id', async (c: Context) => {
  try {
    const ownerId = c.get('ownerId');
    const paymentId = c.req.param('payment_id');

    // Get payment details
    const payment = await c.env.DB
      .prepare(`
        SELECT 
          p.*,
          t.full_name as tenant_name, t.phone as tenant_phone, t.email as tenant_email,
          prop.name as property_name, prop.address as property_address,
          o.full_name as owner_name, o.phone as owner_phone, o.email as owner_email,
          r.receipt_number, r.status as receipt_status, r.generated_at
        FROM payments p
        JOIN tenants t ON p.tenant_id = t.id
        JOIN properties prop ON p.property_id = prop.id
        JOIN owners o ON p.owner_id = o.id
        LEFT JOIN payment_receipts r ON p.id = r.payment_id
        WHERE p.id = ? AND p.owner_id = ?
      `)
      .bind(paymentId, ownerId)
      .first();

    if (!payment) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Paiement introuvable', 404);
    }

    // If receipt exists, return data
    if (payment.receipt_number) {
      const receiptData = PDFService.prepareReceiptData({
        receipt_number: payment.receipt_number,
        payment_date: payment.payment_date || payment.created_at,
        tenant_name: payment.tenant_name,
        tenant_phone: payment.tenant_phone,
        tenant_email: payment.tenant_email,
        property_name: payment.property_name,
        property_address: payment.property_address,
        owner_name: payment.owner_name,
        owner_phone: payment.owner_phone,
        amount: payment.amount,
        payment_method: payment.payment_method || 'cash',
        payment_month: payment.payment_month || '',
        transaction_id: payment.reference || '',
        notes: payment.notes || ''
      }, {
        name: payment.owner_name,
        phone: payment.owner_phone,
        email: payment.owner_email
      });

      return successResponse(c, {
        receipt_data: receiptData,
        receipt_number: payment.receipt_number,
        receipt_status: payment.receipt_status,
        generated_at: payment.generated_at
      });
    }

    return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Reçu non généré pour ce paiement', 404);
  } catch (error: any) {
    console.error('[receipts.get]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
  }
});

/**
 * GET /api/receipts/list
 * List all receipts for owner
 */
app.get('/list', async (c: Context) => {
  try {
    const ownerId = c.get('ownerId');

    const { results } = await c.env.DB
      .prepare(`
        SELECT 
          r.*,
          p.amount, p.payment_date, p.payment_month,
          t.full_name as tenant_name,
          prop.name as property_name
        FROM payment_receipts r
        JOIN payments p ON r.payment_id = p.id
        JOIN tenants t ON p.tenant_id = t.id
        JOIN properties prop ON p.property_id = prop.id
        WHERE p.owner_id = ?
        ORDER BY r.created_at DESC
      `)
      .bind(ownerId)
      .all();

    return successResponse(c, results);
  } catch (error: any) {
    console.error('[receipts.list]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
  }
});

/**
 * GET /api/receipts/tenant/list
 * List receipts for a tenant
 */
app.get('/tenant/list', async (c: Context) => {
  try {
    // This endpoint should use tenant auth, but for now using owner auth
    // TODO: Create separate tenant endpoint
    const ownerId = c.get('ownerId');

    const { results } = await c.env.DB
      .prepare(`
        SELECT 
          r.*,
          p.amount, p.payment_date, p.payment_month,
          prop.name as property_name
        FROM payment_receipts r
        JOIN payments p ON r.payment_id = p.id
        JOIN properties prop ON p.property_id = prop.id
        WHERE p.owner_id = ?
        ORDER BY r.created_at DESC
      `)
      .bind(ownerId)
      .all();

    return successResponse(c, results);
  } catch (error: any) {
    console.error('[receipts.tenant.list]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
  }
});

export default app;
