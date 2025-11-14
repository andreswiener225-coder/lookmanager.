/**
 * Properties Routes
 * Handles CRUD operations for properties (biens immobiliers)
 */

import { Hono } from 'hono';
import type { Env, CreatePropertyRequest, UpdatePropertyRequest, Property } from '../types';
import { authMiddleware } from '../middleware/auth';
import { checkPropertyLimit } from '../middleware/subscription';
import { successResponse, errorResponse, ERROR_CODES, SUCCESS_MESSAGES } from '../utils/response';
import { validateRequiredFields, sanitizeString, isValidPropertyType } from '../utils/validation';

const properties = new Hono<{ Bindings: Env }>();

// All routes require authentication
properties.use('/*', authMiddleware);

/**
 * GET /api/properties
 * List all properties for authenticated owner
 */
properties.get('/', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    
    const results = await c.env.DB
      .prepare('SELECT * FROM properties WHERE owner_id = ? ORDER BY created_at DESC')
      .bind(ownerId)
      .all<Property>();

    return successResponse(c, results.results || []);
  } catch (error) {
    console.error('[properties.list]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération des biens', 500);
  }
});

/**
 * GET /api/properties/:id
 * Get single property details
 */
properties.get('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const id = c.req.param('id');

    const property = await c.env.DB
      .prepare('SELECT * FROM properties WHERE id = ? AND owner_id = ?')
      .bind(id, ownerId)
      .first<Property>();

    if (!property) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Bien immobilier introuvable', 404);
    }

    return successResponse(c, property);
  } catch (error) {
    console.error('[properties.get]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération du bien', 500);
  }
});

/**
 * POST /api/properties
 * Create new property
 */
properties.post('/', checkPropertyLimit, async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const body = await c.req.json<CreatePropertyRequest>();

    // Validate required fields
    const { valid, missing } = validateRequiredFields(body, ['name', 'address', 'city', 'property_type']);
    if (!valid) {
      return errorResponse(c, ERROR_CODES.MISSING_FIELDS, `Champs manquants: ${missing.join(', ')}`, 400);
    }

    // Validate property type
    if (!isValidPropertyType(body.property_type)) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Type de bien invalide', 400);
    }

    // Sanitize input
    const data = {
      name: sanitizeString(body.name),
      address: sanitizeString(body.address),
      city: sanitizeString(body.city),
      neighborhood: body.neighborhood ? sanitizeString(body.neighborhood) : null,
      property_type: body.property_type,
      total_units: body.total_units || 1,
      monthly_rent: body.monthly_rent || null,
      description: body.description ? sanitizeString(body.description) : null,
      photos: body.photos ? JSON.stringify(body.photos) : null,
      // Property groups fields
      parent_property_id: body.parent_property_id || null,
      unit_number: body.unit_number ? sanitizeString(body.unit_number) : null,
      is_group: body.is_group || 0,
      floor_number: body.floor_number || null
    };

    const result = await c.env.DB
      .prepare(`
        INSERT INTO properties (
          owner_id, name, address, city, neighborhood, property_type, total_units, monthly_rent, 
          description, photos, parent_property_id, unit_number, is_group, floor_number
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        ownerId,
        data.name,
        data.address,
        data.city,
        data.neighborhood,
        data.property_type,
        data.total_units,
        data.monthly_rent,
        data.description,
        data.photos,
        data.parent_property_id,
        data.unit_number,
        data.is_group,
        data.floor_number
      )
      .first<Property>();

    return successResponse(c, result, SUCCESS_MESSAGES.CREATED, 201);
  } catch (error) {
    console.error('[properties.create]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la création du bien', 500);
  }
});

/**
 * PUT /api/properties/:id
 * Update property
 */
properties.put('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const id = c.req.param('id');
    const body = await c.req.json<UpdatePropertyRequest>();

    // Check if property exists and belongs to owner
    const existing = await c.env.DB
      .prepare('SELECT id FROM properties WHERE id = ? AND owner_id = ?')
      .bind(id, ownerId)
      .first();

    if (!existing) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Bien immobilier introuvable', 404);
    }

    // Build dynamic UPDATE query
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) { updates.push('name = ?'); values.push(sanitizeString(body.name)); }
    if (body.address !== undefined) { updates.push('address = ?'); values.push(sanitizeString(body.address)); }
    if (body.city !== undefined) { updates.push('city = ?'); values.push(sanitizeString(body.city)); }
    if (body.neighborhood !== undefined) { updates.push('neighborhood = ?'); values.push(sanitizeString(body.neighborhood)); }
    if (body.property_type !== undefined) { updates.push('property_type = ?'); values.push(body.property_type); }
    if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }
    if (body.total_units !== undefined) { updates.push('total_units = ?'); values.push(body.total_units); }
    if (body.monthly_rent !== undefined) { updates.push('monthly_rent = ?'); values.push(body.monthly_rent); }
    if (body.description !== undefined) { updates.push('description = ?'); values.push(sanitizeString(body.description)); }
    if (body.photos !== undefined) { updates.push('photos = ?'); values.push(JSON.stringify(body.photos)); }
    // Property groups fields
    if (body.parent_property_id !== undefined) { updates.push('parent_property_id = ?'); values.push(body.parent_property_id); }
    if (body.unit_number !== undefined) { updates.push('unit_number = ?'); values.push(body.unit_number ? sanitizeString(body.unit_number) : null); }
    if (body.is_group !== undefined) { updates.push('is_group = ?'); values.push(body.is_group); }
    if (body.floor_number !== undefined) { updates.push('floor_number = ?'); values.push(body.floor_number); }

    if (updates.length === 0) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Aucune donnée à mettre à jour', 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, ownerId);

    const result = await c.env.DB
      .prepare(`UPDATE properties SET ${updates.join(', ')} WHERE id = ? AND owner_id = ? RETURNING *`)
      .bind(...values)
      .first<Property>();

    return successResponse(c, result, SUCCESS_MESSAGES.UPDATED);
  } catch (error) {
    console.error('[properties.update]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la mise à jour du bien', 500);
  }
});

/**
 * DELETE /api/properties/:id
 * Delete property
 */
properties.delete('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const id = c.req.param('id');

    // Check if there are active tenants
    const tenantCheck = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM tenants WHERE property_id = ? AND status = ?')
      .bind(id, 'active')
      .first<{ count: number }>();

    if (tenantCheck && tenantCheck.count > 0) {
      return errorResponse(c, ERROR_CODES.FORBIDDEN, 'Impossible de supprimer un bien avec des locataires actifs', 403);
    }

    const result = await c.env.DB
      .prepare('DELETE FROM properties WHERE id = ? AND owner_id = ?')
      .bind(id, ownerId)
      .run();

    if (result.meta.changes === 0) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Bien immobilier introuvable', 404);
    }

    return successResponse(c, null, SUCCESS_MESSAGES.DELETED);
  } catch (error) {
    console.error('[properties.delete]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la suppression du bien', 500);
  }
});

export default properties;
