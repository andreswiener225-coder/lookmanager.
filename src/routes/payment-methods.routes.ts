import { Hono } from 'hono'
import type { Context } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { successResponse, errorResponse } from '../utils/response'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Apply auth middleware to all routes
app.use('/*', authMiddleware)

// ==================== OWNER PAYMENT METHODS ====================

// GET /api/owner-payment-methods - List owner payment methods
app.get('/owner-payment-methods', async (c: Context) => {
  try {
    const userId = c.get('userId')
    
    const { results } = await c.env.DB
      .prepare('SELECT * FROM owner_payment_methods WHERE owner_id = ? ORDER BY is_default DESC, created_at DESC')
      .bind(userId)
      .all()
    
    return successResponse(c, results)
  } catch (error: any) {
    console.error('[owner-payment-methods.list] Error:', error)
    return errorResponse(c, 'Erreur lors de la récupération des moyens de paiement', 500)
  }
})

// POST /api/owner-payment-methods - Create owner payment method
app.post('/owner-payment-methods', async (c: Context) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()
    
    // Validation
    if (!body.type || !['orange_money', 'mtn_money', 'moov_money', 'wave', 'bank_transfer'].includes(body.type)) {
      return errorResponse(c, 'Type de paiement invalide', 400)
    }
    
    // Validate required fields based on type
    if (body.type === 'bank_transfer') {
      if (!body.bank_name || !body.account_number || !body.account_name) {
        return errorResponse(c, 'Informations bancaires incomplètes', 400)
      }
    } else {
      if (!body.phone_number) {
        return errorResponse(c, 'Numéro de téléphone requis', 400)
      }
    }
    
    // If setting as default, unset other defaults
    if (body.is_default) {
      await c.env.DB
        .prepare('UPDATE owner_payment_methods SET is_default = 0 WHERE owner_id = ?')
        .bind(userId)
        .run()
    }
    
    // Insert new payment method
    const result = await c.env.DB
      .prepare(`
        INSERT INTO owner_payment_methods (
          owner_id, type, phone_number, account_name, bank_name, account_number, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        userId,
        body.type,
        body.phone_number || null,
        body.account_name || null,
        body.bank_name || null,
        body.account_number || null,
        body.is_default ? 1 : 0
      )
      .first()
    
    return successResponse(c, result, 201)
  } catch (error: any) {
    console.error('[owner-payment-methods.create] Error:', error)
    return errorResponse(c, 'Erreur lors de la création du moyen de paiement', 500)
  }
})

// PUT /api/owner-payment-methods/:id - Update owner payment method
app.put('/owner-payment-methods/:id', async (c: Context) => {
  try {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const body = await c.req.json()
    
    // Check ownership
    const existing = await c.env.DB
      .prepare('SELECT * FROM owner_payment_methods WHERE id = ? AND owner_id = ?')
      .bind(id, userId)
      .first()
    
    if (!existing) {
      return errorResponse(c, 'Moyen de paiement introuvable', 404)
    }
    
    // If setting as default, unset other defaults
    if (body.is_default) {
      await c.env.DB
        .prepare('UPDATE owner_payment_methods SET is_default = 0 WHERE owner_id = ? AND id != ?')
        .bind(userId, id)
        .run()
    }
    
    // Update
    const updates = []
    const values = []
    
    if (body.type !== undefined) {
      updates.push('type = ?')
      values.push(body.type)
    }
    if (body.phone_number !== undefined) {
      updates.push('phone_number = ?')
      values.push(body.phone_number || null)
    }
    if (body.account_name !== undefined) {
      updates.push('account_name = ?')
      values.push(body.account_name || null)
    }
    if (body.bank_name !== undefined) {
      updates.push('bank_name = ?')
      values.push(body.bank_name || null)
    }
    if (body.account_number !== undefined) {
      updates.push('account_number = ?')
      values.push(body.account_number || null)
    }
    if (body.is_default !== undefined) {
      updates.push('is_default = ?')
      values.push(body.is_default ? 1 : 0)
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id, userId)
    
    const result = await c.env.DB
      .prepare(`UPDATE owner_payment_methods SET ${updates.join(', ')} WHERE id = ? AND owner_id = ? RETURNING *`)
      .bind(...values)
      .first()
    
    return successResponse(c, result)
  } catch (error: any) {
    console.error('[owner-payment-methods.update] Error:', error)
    return errorResponse(c, 'Erreur lors de la mise à jour', 500)
  }
})

// DELETE /api/owner-payment-methods/:id - Delete owner payment method
app.delete('/owner-payment-methods/:id', async (c: Context) => {
  try {
    const userId = c.get('userId')
    const id = c.req.param('id')
    
    const result = await c.env.DB
      .prepare('DELETE FROM owner_payment_methods WHERE id = ? AND owner_id = ?')
      .bind(id, userId)
      .run()
    
    if (result.meta.changes === 0) {
      return errorResponse(c, 'Moyen de paiement introuvable', 404)
    }
    
    return successResponse(c, { message: 'Moyen de paiement supprimé' })
  } catch (error: any) {
    console.error('[owner-payment-methods.delete] Error:', error)
    return errorResponse(c, 'Erreur lors de la suppression', 500)
  }
})

// ==================== TENANT PAYMENT METHODS ====================
// Note: These are mounted under /api/tenant/ in tenant.routes.ts

// GET /api/tenant/payment-methods - List tenant payment methods
app.get('/tenant/payment-methods', async (c: Context) => {
  try {
    const userId = c.get('userId')
    const userType = c.get('userType')
    
    if (userType !== 'tenant') {
      return errorResponse(c, 'Accès réservé aux locataires', 403)
    }
    
    const { results } = await c.env.DB
      .prepare('SELECT * FROM tenant_payment_methods WHERE tenant_id = ? ORDER BY is_default DESC, created_at DESC')
      .bind(userId)
      .all()
    
    return successResponse(c, results)
  } catch (error: any) {
    console.error('[tenant-payment-methods.list] Error:', error)
    return errorResponse(c, 'Erreur lors de la récupération des moyens de paiement', 500)
  }
})

// POST /api/tenant-payment-methods - Create tenant payment method
app.post('/tenant-payment-methods', async (c: Context) => {
  try {
    const userId = c.get('userId')
    const userType = c.get('userType')
    const body = await c.req.json()
    
    if (userType !== 'tenant') {
      return errorResponse(c, 'Accès réservé aux locataires', 403)
    }
    
    // Validation
    if (!body.type || !['orange_money', 'mtn_money', 'moov_money', 'wave', 'bank_transfer'].includes(body.type)) {
      return errorResponse(c, 'Type de paiement invalide', 400)
    }
    
    // If setting as default, unset other defaults
    if (body.is_default) {
      await c.env.DB
        .prepare('UPDATE tenant_payment_methods SET is_default = 0 WHERE tenant_id = ?')
        .bind(userId)
        .run()
    }
    
    // Insert new payment method
    const result = await c.env.DB
      .prepare(`
        INSERT INTO tenant_payment_methods (
          tenant_id, type, phone_number, account_name, bank_name, account_number, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        userId,
        body.type,
        body.phone_number || null,
        body.account_name || null,
        body.bank_name || null,
        body.account_number || null,
        body.is_default ? 1 : 0
      )
      .first()
    
    return successResponse(c, result, 201)
  } catch (error: any) {
    console.error('[tenant-payment-methods.create] Error:', error)
    return errorResponse(c, 'Erreur lors de la création du moyen de paiement', 500)
  }
})

// PUT /api/tenant-payment-methods/:id - Update tenant payment method
app.put('/tenant-payment-methods/:id', async (c: Context) => {
  try {
    const userId = c.get('userId')
    const userType = c.get('userType')
    const id = c.req.param('id')
    const body = await c.req.json()
    
    if (userType !== 'tenant') {
      return errorResponse(c, 'Accès réservé aux locataires', 403)
    }
    
    // Check ownership
    const existing = await c.env.DB
      .prepare('SELECT * FROM tenant_payment_methods WHERE id = ? AND tenant_id = ?')
      .bind(id, userId)
      .first()
    
    if (!existing) {
      return errorResponse(c, 'Moyen de paiement introuvable', 404)
    }
    
    // If setting as default, unset other defaults
    if (body.is_default) {
      await c.env.DB
        .prepare('UPDATE tenant_payment_methods SET is_default = 0 WHERE tenant_id = ? AND id != ?')
        .bind(userId, id)
        .run()
    }
    
    // Update
    const updates = []
    const values = []
    
    if (body.type !== undefined) {
      updates.push('type = ?')
      values.push(body.type)
    }
    if (body.phone_number !== undefined) {
      updates.push('phone_number = ?')
      values.push(body.phone_number || null)
    }
    if (body.account_name !== undefined) {
      updates.push('account_name = ?')
      values.push(body.account_name || null)
    }
    if (body.bank_name !== undefined) {
      updates.push('bank_name = ?')
      values.push(body.bank_name || null)
    }
    if (body.account_number !== undefined) {
      updates.push('account_number = ?')
      values.push(body.account_number || null)
    }
    if (body.is_default !== undefined) {
      updates.push('is_default = ?')
      values.push(body.is_default ? 1 : 0)
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id, userId)
    
    const result = await c.env.DB
      .prepare(`UPDATE tenant_payment_methods SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ? RETURNING *`)
      .bind(...values)
      .first()
    
    return successResponse(c, result)
  } catch (error: any) {
    console.error('[tenant-payment-methods.update] Error:', error)
    return errorResponse(c, 'Erreur lors de la mise à jour', 500)
  }
})

// DELETE /api/tenant-payment-methods/:id - Delete tenant payment method
app.delete('/tenant-payment-methods/:id', async (c: Context) => {
  try {
    const userId = c.get('userId')
    const userType = c.get('userType')
    const id = c.req.param('id')
    
    if (userType !== 'tenant') {
      return errorResponse(c, 'Accès réservé aux locataires', 403)
    }
    
    const result = await c.env.DB
      .prepare('DELETE FROM tenant_payment_methods WHERE id = ? AND tenant_id = ?')
      .bind(id, userId)
      .run()
    
    if (result.meta.changes === 0) {
      return errorResponse(c, 'Moyen de paiement introuvable', 404)
    }
    
    return successResponse(c, { message: 'Moyen de paiement supprimé' })
  } catch (error: any) {
    console.error('[tenant-payment-methods.delete] Error:', error)
    return errorResponse(c, 'Erreur lors de la suppression', 500)
  }
})

export default app
