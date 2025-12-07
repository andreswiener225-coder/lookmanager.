/**
 * Notifications Routes
 * Handles SMS and WhatsApp notifications via Twilio
 */

import { Hono } from 'hono';
import type { Env, Notification } from '../types';
import { authMiddleware } from '../middleware/auth';
import { 
  successResponse, 
  errorResponse, 
  ERROR_CODES 
} from '../utils/response';
import {
  sendSMS,
  sendWhatsApp,
  generateMessage,
  saveNotification,
  getNotificationStats,
  getRecentNotifications,
  hasReachedNotificationLimit,
  sendRentReminders,
  sendLatePaymentAlerts
} from '../services/twilio.service';
import { validateRequiredFields } from '../utils/validation';

const notifications = new Hono<{ Bindings: Env }>();

// All routes require authentication
notifications.use('/*', authMiddleware);

/**
 * GET /api/notifications
 * List all notifications for authenticated owner
 */
notifications.get('/', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const status = c.req.query('status') as Notification['status'] | undefined;
    const channel = c.req.query('channel') as Notification['channel'] | undefined;

    let query = `
      SELECT n.*, t.full_name as tenant_name
      FROM notifications n
      LEFT JOIN tenants t ON n.tenant_id = t.id
      WHERE n.owner_id = ?
    `;
    const params: any[] = [ownerId];

    if (status) {
      query += ' AND n.status = ?';
      params.push(status);
    }

    if (channel) {
      query += ' AND n.channel = ?';
      params.push(channel);
    }

    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await c.env.DB.prepare(query).bind(...params).all<Notification & { tenant_name: string }>();

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM notifications WHERE owner_id = ?`;
    const countResult = await c.env.DB.prepare(countQuery).bind(ownerId).first<{ count: number }>();

    return successResponse(c, {
      notifications: results,
      pagination: {
        total: countResult?.count || 0,
        limit,
        offset
      }
    });
  } catch (error: any) {
    console.error('[notifications.list]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération des notifications', 500);
  }
});

/**
 * GET /api/notifications/stats
 * Get notification statistics
 */
notifications.get('/stats', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const stats = await getNotificationStats(c.env.DB, ownerId);

    return successResponse(c, stats);
  } catch (error: any) {
    console.error('[notifications.stats]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération des statistiques', 500);
  }
});

/**
 * POST /api/notifications/send
 * Send a notification to a tenant or custom phone number
 */
notifications.post('/send', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const owner = c.get('owner');
    const body = await c.req.json<{
      tenant_id?: number;
      phone?: string;
      channel: 'sms' | 'whatsapp';
      template?: 'rent_reminder' | 'late_payment' | 'payment_received' | 'welcome_tenant' | 'maintenance_alert' | 'general';
      message?: string;
      amount?: number;
      due_date?: string;
    }>();

    // Validate required fields
    if (!body.channel) {
      return errorResponse(c, ERROR_CODES.MISSING_FIELDS, 'Le canal de notification est requis (sms ou whatsapp)', 400);
    }

    if (!body.tenant_id && !body.phone) {
      return errorResponse(c, ERROR_CODES.MISSING_FIELDS, 'Veuillez spécifier un locataire ou un numéro de téléphone', 400);
    }

    if (!body.template && !body.message) {
      return errorResponse(c, ERROR_CODES.MISSING_FIELDS, 'Veuillez spécifier un modèle ou un message personnalisé', 400);
    }

    // Check notification limit
    const limitReached = await hasReachedNotificationLimit(c.env.DB, ownerId, owner.subscription_tier);
    if (limitReached) {
      return errorResponse(c, ERROR_CODES.LIMIT_REACHED, 'Limite de notifications atteinte pour ce mois. Passez à un forfait supérieur.', 403);
    }

    // Get recipient phone number
    let recipientPhone = body.phone;
    let tenantInfo = null;

    if (body.tenant_id) {
      const tenant = await c.env.DB.prepare(`
        SELECT t.*, p.name as property_name
        FROM tenants t
        JOIN properties p ON t.property_id = p.id
        WHERE t.id = ? AND t.owner_id = ?
      `).bind(body.tenant_id, ownerId).first<any>();

      if (!tenant) {
        return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Locataire non trouvé', 404);
      }

      recipientPhone = tenant.phone;
      tenantInfo = tenant;
    }

    // Generate message
    let message = body.message || '';
    if (body.template && tenantInfo) {
      message = generateMessage(body.template, {
        tenant_name: tenantInfo.full_name,
        property_name: tenantInfo.property_name,
        amount: body.amount || tenantInfo.monthly_rent,
        due_date: body.due_date,
        owner_name: owner.full_name,
        message: body.message
      });
    } else if (body.template && body.message) {
      message = body.message;
    }

    // Twilio configuration
    const twilioConfig = {
      accountSid: c.env.TWILIO_ACCOUNT_SID || '',
      authToken: c.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: c.env.TWILIO_PHONE_NUMBER || '',
      whatsappNumber: c.env.TWILIO_WHATSAPP_NUMBER
    };

    // Check if Twilio is configured
    if (!twilioConfig.accountSid || !twilioConfig.authToken) {
      // Save as pending for later manual processing
      const notificationId = await saveNotification(c.env.DB, ownerId, {
        tenant_id: body.tenant_id,
        type: body.template || 'general',
        channel: body.channel,
        recipient_phone: recipientPhone,
        message,
        status: 'pending',
        error_message: 'Twilio non configuré - notification en attente'
      });

      return successResponse(c, {
        notification_id: notificationId,
        status: 'pending',
        message: 'Notification enregistrée. Twilio n\'est pas encore configuré. Configurez les secrets TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_PHONE_NUMBER pour activer l\'envoi automatique.'
      }, 'Notification enregistrée en attente de configuration Twilio', 202);
    }

    // Send notification
    let result;
    if (body.channel === 'whatsapp') {
      result = await sendWhatsApp(twilioConfig, recipientPhone!, message);
    } else {
      result = await sendSMS(twilioConfig, recipientPhone!, message);
    }

    // Save notification record
    const notificationId = await saveNotification(c.env.DB, ownerId, {
      tenant_id: body.tenant_id,
      type: body.template || 'general',
      channel: body.channel,
      recipient_phone: recipientPhone,
      message,
      status: result.success ? 'sent' : 'failed',
      external_id: result.messageId,
      error_message: result.error
    });

    if (result.success) {
      return successResponse(c, {
        notification_id: notificationId,
        message_id: result.messageId,
        status: result.status
      }, 'Notification envoyée avec succès');
    } else {
      return errorResponse(c, ERROR_CODES.EXTERNAL_API_ERROR, result.error || 'Erreur lors de l\'envoi de la notification', 500);
    }
  } catch (error: any) {
    console.error('[notifications.send]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de l\'envoi de la notification', 500);
  }
});

/**
 * POST /api/notifications/send-reminders
 * Send rent reminders to all tenants with upcoming due dates
 */
notifications.post('/send-reminders', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const body = await c.req.json<{ days_before_due?: number }>();

    const twilioConfig = {
      accountSid: c.env.TWILIO_ACCOUNT_SID || '',
      authToken: c.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: c.env.TWILIO_PHONE_NUMBER || ''
    };

    if (!twilioConfig.accountSid || !twilioConfig.authToken) {
      return errorResponse(c, ERROR_CODES.EXTERNAL_API_ERROR, 'Twilio non configuré. Configurez les secrets TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN.', 400);
    }

    const result = await sendRentReminders(
      c.env.DB,
      twilioConfig,
      ownerId,
      body.days_before_due || 3
    );

    return successResponse(c, result, `Rappels envoyés: ${result.sent} succès, ${result.failed} échecs`);
  } catch (error: any) {
    console.error('[notifications.send-reminders]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de l\'envoi des rappels', 500);
  }
});

/**
 * POST /api/notifications/send-late-alerts
 * Send late payment alerts to all tenants with overdue payments
 */
notifications.post('/send-late-alerts', async (c) => {
  try {
    const ownerId = c.get('ownerId');

    const twilioConfig = {
      accountSid: c.env.TWILIO_ACCOUNT_SID || '',
      authToken: c.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: c.env.TWILIO_PHONE_NUMBER || ''
    };

    if (!twilioConfig.accountSid || !twilioConfig.authToken) {
      return errorResponse(c, ERROR_CODES.EXTERNAL_API_ERROR, 'Twilio non configuré. Configurez les secrets TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN.', 400);
    }

    const result = await sendLatePaymentAlerts(c.env.DB, twilioConfig, ownerId);

    return successResponse(c, result, `Alertes de retard envoyées: ${result.sent} succès, ${result.failed} échecs`);
  } catch (error: any) {
    console.error('[notifications.send-late-alerts]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de l\'envoi des alertes de retard', 500);
  }
});

/**
 * GET /api/notifications/:id
 * Get a specific notification
 */
notifications.get('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const notificationId = c.req.param('id');

    const notification = await c.env.DB.prepare(`
      SELECT n.*, t.full_name as tenant_name
      FROM notifications n
      LEFT JOIN tenants t ON n.tenant_id = t.id
      WHERE n.id = ? AND n.owner_id = ?
    `).bind(notificationId, ownerId).first<Notification & { tenant_name: string }>();

    if (!notification) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Notification non trouvée', 404);
    }

    return successResponse(c, notification);
  } catch (error: any) {
    console.error('[notifications.get]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération de la notification', 500);
  }
});

/**
 * POST /api/notifications/retry/:id
 * Retry sending a failed notification
 */
notifications.post('/retry/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const notificationId = c.req.param('id');

    // Get the original notification
    const notification = await c.env.DB.prepare(`
      SELECT * FROM notifications WHERE id = ? AND owner_id = ?
    `).bind(notificationId, ownerId).first<Notification>();

    if (!notification) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Notification non trouvée', 404);
    }

    if (notification.status === 'sent') {
      return errorResponse(c, ERROR_CODES.VALIDATION_ERROR, 'Cette notification a déjà été envoyée', 400);
    }

    const twilioConfig = {
      accountSid: c.env.TWILIO_ACCOUNT_SID || '',
      authToken: c.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: c.env.TWILIO_PHONE_NUMBER || ''
    };

    if (!twilioConfig.accountSid || !twilioConfig.authToken) {
      return errorResponse(c, ERROR_CODES.EXTERNAL_API_ERROR, 'Twilio non configuré', 400);
    }

    // Retry sending
    let result;
    if (notification.channel === 'whatsapp') {
      result = await sendWhatsApp(twilioConfig, notification.recipient_phone!, notification.message);
    } else {
      result = await sendSMS(twilioConfig, notification.recipient_phone!, notification.message);
    }

    // Update notification status
    await c.env.DB.prepare(`
      UPDATE notifications
      SET status = ?, external_id = ?, error_message = ?, sent_at = ?
      WHERE id = ?
    `).bind(
      result.success ? 'sent' : 'failed',
      result.messageId || null,
      result.error || null,
      result.success ? new Date().toISOString() : null,
      notificationId
    ).run();

    if (result.success) {
      return successResponse(c, {
        message_id: result.messageId,
        status: 'sent'
      }, 'Notification renvoyée avec succès');
    } else {
      return errorResponse(c, ERROR_CODES.EXTERNAL_API_ERROR, result.error || 'Échec du renvoi', 500);
    }
  } catch (error: any) {
    console.error('[notifications.retry]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors du renvoi de la notification', 500);
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification record
 */
notifications.delete('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const notificationId = c.req.param('id');

    const result = await c.env.DB.prepare(`
      DELETE FROM notifications WHERE id = ? AND owner_id = ?
    `).bind(notificationId, ownerId).run();

    if (!result.meta.changes) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Notification non trouvée', 404);
    }

    return successResponse(c, null, 'Notification supprimée');
  } catch (error: any) {
    console.error('[notifications.delete]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la suppression', 500);
  }
});

/**
 * GET /api/notifications/templates
 * Get available notification templates
 */
notifications.get('/templates/list', async (c) => {
  const templates = [
    {
      id: 'rent_reminder',
      name: 'Rappel de loyer',
      description: 'Envoyé quelques jours avant la date d\'échéance',
      variables: ['tenant_name', 'property_name', 'amount', 'due_date']
    },
    {
      id: 'late_payment',
      name: 'Paiement en retard',
      description: 'Alerte pour les paiements en retard',
      variables: ['tenant_name', 'property_name', 'amount', 'days_late']
    },
    {
      id: 'payment_received',
      name: 'Paiement reçu',
      description: 'Confirmation de réception de paiement',
      variables: ['tenant_name', 'property_name', 'amount', 'payment_date']
    },
    {
      id: 'welcome_tenant',
      name: 'Bienvenue au locataire',
      description: 'Message de bienvenue pour un nouveau locataire',
      variables: ['tenant_name', 'property_name', 'owner_name']
    },
    {
      id: 'maintenance_alert',
      name: 'Alerte maintenance',
      description: 'Notification de travaux ou maintenance',
      variables: ['tenant_name', 'property_name', 'message']
    },
    {
      id: 'general',
      name: 'Message personnalisé',
      description: 'Message libre à personnaliser',
      variables: ['message']
    }
  ];

  return successResponse(c, templates);
});

export default notifications;
