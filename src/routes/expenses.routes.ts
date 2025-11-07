/**
 * Expenses Routes
 * Handles expenses and charges management (dépenses/charges)
 */

import { Hono } from 'hono';
import type { Env, CreateExpenseRequest, Expense } from '../types';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse, ERROR_CODES, SUCCESS_MESSAGES } from '../utils/response';
import { validateRequiredFields, isValidDate, isValidAmount, sanitizeString, isValidEnum } from '../utils/validation';

const expenses = new Hono<{ Bindings: Env }>();

// All routes require authentication
expenses.use('/*', authMiddleware);

const EXPENSE_CATEGORIES = ['maintenance', 'taxes', 'insurance', 'utilities', 'repairs', 'other'] as const;

/**
 * GET /api/expenses
 * List all expenses with filters
 */
expenses.get('/', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const category = c.req.query('category');
    const propertyId = c.req.query('property_id');
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    let query = `
      SELECT e.*, p.name as property_name 
      FROM expenses e 
      LEFT JOIN properties p ON e.property_id = p.id 
      WHERE e.owner_id = ?
    `;
    const params: any[] = [ownerId];

    if (category) {
      query += ' AND e.category = ?';
      params.push(category);
    }

    if (propertyId) {
      query += ' AND e.property_id = ?';
      params.push(propertyId);
    }

    if (startDate) {
      query += ' AND e.expense_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND e.expense_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY e.expense_date DESC';

    const results = await c.env.DB
      .prepare(query)
      .bind(...params)
      .all();

    return successResponse(c, results.results || []);
  } catch (error) {
    console.error('[expenses.list]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération des dépenses', 500);
  }
});

/**
 * GET /api/expenses/:id
 * Get single expense details
 */
expenses.get('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const id = c.req.param('id');

    const expense = await c.env.DB
      .prepare(`
        SELECT e.*, p.name as property_name, p.address as property_address
        FROM expenses e
        LEFT JOIN properties p ON e.property_id = p.id
        WHERE e.id = ? AND e.owner_id = ?
      `)
      .bind(id, ownerId)
      .first();

    if (!expense) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Dépense introuvable', 404);
    }

    return successResponse(c, expense);
  } catch (error) {
    console.error('[expenses.get]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération de la dépense', 500);
  }
});

/**
 * POST /api/expenses
 * Create new expense
 */
expenses.post('/', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const body = await c.req.json<CreateExpenseRequest>();

    // Validate required fields
    const { valid, missing } = validateRequiredFields(body, ['category', 'amount', 'expense_date', 'description']);
    if (!valid) {
      return errorResponse(c, ERROR_CODES.MISSING_FIELDS, `Champs manquants: ${missing.join(', ')}`, 400);
    }

    // Validate category
    if (!isValidEnum(body.category, EXPENSE_CATEGORIES)) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Catégorie invalide', 400);
    }

    // Validate date
    if (!isValidDate(body.expense_date)) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Format date invalide (YYYY-MM-DD)', 400);
    }

    // Validate amount
    if (!isValidAmount(body.amount)) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Montant invalide', 400);
    }

    // Check if property exists (if provided)
    if (body.property_id) {
      const property = await c.env.DB
        .prepare('SELECT id FROM properties WHERE id = ? AND owner_id = ?')
        .bind(body.property_id, ownerId)
        .first();

      if (!property) {
        return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Bien immobilier introuvable', 404);
      }
    }

    const result = await c.env.DB
      .prepare(`
        INSERT INTO expenses (owner_id, property_id, category, amount, expense_date, description, receipt_url, paid_to)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        ownerId,
        body.property_id || null,
        body.category,
        body.amount,
        body.expense_date,
        sanitizeString(body.description),
        body.receipt_url || null,
        body.paid_to ? sanitizeString(body.paid_to) : null
      )
      .first<Expense>();

    return successResponse(c, result, SUCCESS_MESSAGES.CREATED, 201);
  } catch (error) {
    console.error('[expenses.create]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la création de la dépense', 500);
  }
});

/**
 * PUT /api/expenses/:id
 * Update expense
 */
expenses.put('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const id = c.req.param('id');
    const body = await c.req.json<Partial<CreateExpenseRequest>>();

    // Check if expense exists and belongs to owner
    const existing = await c.env.DB
      .prepare('SELECT id FROM expenses WHERE id = ? AND owner_id = ?')
      .bind(id, ownerId)
      .first();

    if (!existing) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Dépense introuvable', 404);
    }

    // Build dynamic UPDATE query
    const updates: string[] = [];
    const values: any[] = [];

    if (body.property_id !== undefined) { updates.push('property_id = ?'); values.push(body.property_id); }
    if (body.category !== undefined) { updates.push('category = ?'); values.push(body.category); }
    if (body.amount !== undefined) { updates.push('amount = ?'); values.push(body.amount); }
    if (body.expense_date !== undefined) { updates.push('expense_date = ?'); values.push(body.expense_date); }
    if (body.description !== undefined) { updates.push('description = ?'); values.push(sanitizeString(body.description)); }
    if (body.receipt_url !== undefined) { updates.push('receipt_url = ?'); values.push(body.receipt_url); }
    if (body.paid_to !== undefined) { updates.push('paid_to = ?'); values.push(sanitizeString(body.paid_to)); }

    if (updates.length === 0) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Aucune donnée à mettre à jour', 400);
    }

    values.push(id, ownerId);

    const result = await c.env.DB
      .prepare(`UPDATE expenses SET ${updates.join(', ')} WHERE id = ? AND owner_id = ? RETURNING *`)
      .bind(...values)
      .first<Expense>();

    return successResponse(c, result, SUCCESS_MESSAGES.UPDATED);
  } catch (error) {
    console.error('[expenses.update]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la mise à jour de la dépense', 500);
  }
});

/**
 * DELETE /api/expenses/:id
 * Delete expense
 */
expenses.delete('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const id = c.req.param('id');

    const result = await c.env.DB
      .prepare('DELETE FROM expenses WHERE id = ? AND owner_id = ?')
      .bind(id, ownerId)
      .run();

    if (result.meta.changes === 0) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Dépense introuvable', 404);
    }

    return successResponse(c, null, SUCCESS_MESSAGES.DELETED);
  } catch (error) {
    console.error('[expenses.delete]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la suppression de la dépense', 500);
  }
});

export default expenses;
