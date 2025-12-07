/**
 * Twilio SMS/WhatsApp Service
 * Handles notifications via SMS and WhatsApp using Twilio API
 * 
 * Twilio API Documentation: https://www.twilio.com/docs/sms/api
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a Twilio account at https://www.twilio.com
 * 2. Get your Account SID and Auth Token from the Twilio Console
 * 3. Purchase a phone number or use the trial number
 * 4. For WhatsApp, enable the WhatsApp sandbox in the console
 * 
 * Set these as Cloudflare secrets:
 * - TWILIO_ACCOUNT_SID: Your Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
 * - TWILIO_PHONE_NUMBER: Your Twilio phone number (format: +1234567890)
 * - TWILIO_WHATSAPP_NUMBER: WhatsApp sandbox number (format: whatsapp:+14155238886)
 */

import type { D1Database, Notification } from '../types';

// Twilio API base URL
const TWILIO_API_URL = 'https://api.twilio.com/2010-04-01';

/**
 * Twilio configuration interface
 */
interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  whatsappNumber?: string;
}

/**
 * SMS/WhatsApp message result
 */
interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
}

/**
 * Notification template types
 */
type NotificationTemplate = 
  | 'rent_reminder'
  | 'late_payment'
  | 'payment_received'
  | 'welcome_tenant'
  | 'maintenance_alert'
  | 'general';

/**
 * Template data for notifications
 */
interface TemplateData {
  tenant_name?: string;
  property_name?: string;
  amount?: number;
  due_date?: string;
  payment_date?: string;
  days_late?: number;
  owner_name?: string;
  message?: string;
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS(
  config: TwilioConfig,
  to: string,
  message: string
): Promise<MessageResult> {
  try {
    if (!config.accountSid || !config.authToken || !config.phoneNumber) {
      return {
        success: false,
        error: 'Twilio configuration manquante. Veuillez configurer TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_PHONE_NUMBER.'
      };
    }

    // Normalize phone number
    const normalizedTo = normalizePhone(to);

    // Prepare request body
    const body = new URLSearchParams({
      To: normalizedTo,
      From: config.phoneNumber,
      Body: message
    });

    // Make API request
    const response = await fetch(
      `${TWILIO_API_URL}/Accounts/${config.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${config.accountSid}:${config.authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      console.error('[Twilio SMS Error]', data);
      return {
        success: false,
        error: data.message || 'Erreur lors de l\'envoi du SMS',
        status: data.status
      };
    }

    return {
      success: true,
      messageId: data.sid,
      status: data.status
    };
  } catch (error: any) {
    console.error('[Twilio SMS Exception]', error);
    return {
      success: false,
      error: error.message || 'Erreur inattendue lors de l\'envoi du SMS'
    };
  }
}

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsApp(
  config: TwilioConfig,
  to: string,
  message: string
): Promise<MessageResult> {
  try {
    if (!config.accountSid || !config.authToken) {
      return {
        success: false,
        error: 'Twilio configuration manquante.'
      };
    }

    // Use WhatsApp sandbox number or configured number
    const fromNumber = config.whatsappNumber || 'whatsapp:+14155238886';
    const normalizedTo = `whatsapp:${normalizePhone(to)}`;

    const body = new URLSearchParams({
      To: normalizedTo,
      From: fromNumber,
      Body: message
    });

    const response = await fetch(
      `${TWILIO_API_URL}/Accounts/${config.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${config.accountSid}:${config.authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      console.error('[Twilio WhatsApp Error]', data);
      return {
        success: false,
        error: data.message || 'Erreur lors de l\'envoi WhatsApp',
        status: data.status
      };
    }

    return {
      success: true,
      messageId: data.sid,
      status: data.status
    };
  } catch (error: any) {
    console.error('[Twilio WhatsApp Exception]', error);
    return {
      success: false,
      error: error.message || 'Erreur inattendue lors de l\'envoi WhatsApp'
    };
  }
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhone(phone: string): string {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // Handle Côte d'Ivoire numbers
  if (normalized.startsWith('225')) {
    normalized = '+' + normalized;
  } else if (normalized.startsWith('00225')) {
    normalized = '+' + normalized.substring(2);
  } else if (!normalized.startsWith('+')) {
    // Assume Côte d'Ivoire number
    normalized = '+225' + normalized;
  }
  
  return normalized;
}

/**
 * Generate notification message from template
 */
export function generateMessage(template: NotificationTemplate, data: TemplateData): string {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

  switch (template) {
    case 'rent_reminder':
      return `📋 Rappel de loyer\n\nBonjour ${data.tenant_name},\n\nVotre loyer de ${formatCurrency(data.amount || 0)} pour ${data.property_name} est dû le ${data.due_date}.\n\nMerci de procéder au paiement.\n\nLookManager`;

    case 'late_payment':
      return `⚠️ Loyer en retard\n\nBonjour ${data.tenant_name},\n\nVotre loyer de ${formatCurrency(data.amount || 0)} est en retard de ${data.days_late} jour(s).\n\nVeuillez régulariser votre situation.\n\nLookManager`;

    case 'payment_received':
      return `✅ Paiement reçu\n\nBonjour ${data.tenant_name},\n\nNous confirmons la réception de votre paiement de ${formatCurrency(data.amount || 0)} le ${data.payment_date}.\n\nMerci !\n\nLookManager`;

    case 'welcome_tenant':
      return `🏠 Bienvenue !\n\nBonjour ${data.tenant_name},\n\nBienvenue dans votre nouveau logement : ${data.property_name}.\n\nVotre propriétaire ${data.owner_name} vous souhaite une bonne installation.\n\nLookManager`;

    case 'maintenance_alert':
      return `🔧 Maintenance\n\nBonjour ${data.tenant_name},\n\nUne intervention de maintenance est prévue pour ${data.property_name}.\n\n${data.message || ''}\n\nLookManager`;

    case 'general':
    default:
      return data.message || 'Message de votre propriétaire via LookManager.';
  }
}

/**
 * Save notification to database
 */
export async function saveNotification(
  db: D1Database,
  ownerId: number,
  notification: {
    tenant_id?: number;
    type: Notification['type'];
    channel: Notification['channel'];
    recipient_phone?: string;
    recipient_email?: string;
    message: string;
    scheduled_at?: string;
    status: Notification['status'];
    external_id?: string;
    error_message?: string;
  }
): Promise<number> {
  const result = await db.prepare(`
    INSERT INTO notifications (
      owner_id, tenant_id, type, channel, recipient_phone, recipient_email,
      message, scheduled_at, sent_at, status, external_id, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    ownerId,
    notification.tenant_id || null,
    notification.type,
    notification.channel,
    notification.recipient_phone || null,
    notification.recipient_email || null,
    notification.message,
    notification.scheduled_at || new Date().toISOString(),
    notification.status === 'sent' ? new Date().toISOString() : null,
    notification.status,
    notification.external_id || null,
    notification.error_message || null
  ).run();

  return result.meta.last_row_id as number;
}

/**
 * Update notification status
 */
export async function updateNotificationStatus(
  db: D1Database,
  notificationId: number,
  status: Notification['status'],
  externalId?: string,
  errorMessage?: string
): Promise<void> {
  await db.prepare(`
    UPDATE notifications
    SET status = ?, external_id = ?, error_message = ?, sent_at = ?
    WHERE id = ?
  `).bind(
    status,
    externalId || null,
    errorMessage || null,
    status === 'sent' ? new Date().toISOString() : null,
    notificationId
  ).run();
}

/**
 * Get notification statistics for an owner
 */
export async function getNotificationStats(
  db: D1Database,
  ownerId: number
): Promise<{ total: number; sent: number; failed: number; pending: number }> {
  const result = await db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM notifications
    WHERE owner_id = ?
  `).bind(ownerId).first<{ total: number; sent: number; failed: number; pending: number }>();

  return {
    total: result?.total || 0,
    sent: result?.sent || 0,
    failed: result?.failed || 0,
    pending: result?.pending || 0
  };
}

/**
 * Get recent notifications for an owner
 */
export async function getRecentNotifications(
  db: D1Database,
  ownerId: number,
  limit: number = 20
): Promise<Notification[]> {
  const { results } = await db.prepare(`
    SELECT n.*, t.full_name as tenant_name
    FROM notifications n
    LEFT JOIN tenants t ON n.tenant_id = t.id
    WHERE n.owner_id = ?
    ORDER BY n.created_at DESC
    LIMIT ?
  `).bind(ownerId, limit).all<Notification & { tenant_name: string }>();

  return results;
}

/**
 * Check if owner has reached notification limit
 */
export async function hasReachedNotificationLimit(
  db: D1Database,
  ownerId: number,
  tier: string
): Promise<boolean> {
  // Get limit for tier
  const limits: Record<string, number> = {
    free: 10,
    starter: 50,
    pro: 200,
    enterprise: 99999
  };

  const limit = limits[tier] || 10;

  // Count notifications this month
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const result = await db.prepare(`
    SELECT COUNT(*) as count
    FROM notifications
    WHERE owner_id = ? AND created_at >= ?
  `).bind(ownerId, firstOfMonth.toISOString()).first<{ count: number }>();

  return (result?.count || 0) >= limit;
}

/**
 * Send rent reminders for all tenants with upcoming due dates
 * This function should be called by a scheduled task/cron job
 */
export async function sendRentReminders(
  db: D1Database,
  config: TwilioConfig,
  ownerId?: number,
  daysBeforeDue: number = 3
): Promise<{ sent: number; failed: number }> {
  let query = `
    SELECT 
      t.id as tenant_id, t.full_name as tenant_name, t.phone as tenant_phone,
      p.name as property_name, rp.amount, rp.due_date, o.id as owner_id
    FROM rent_payments rp
    JOIN tenants t ON rp.tenant_id = t.id
    JOIN properties p ON rp.property_id = p.id
    JOIN owners o ON rp.owner_id = o.id
    WHERE rp.status = 'pending'
      AND t.status = 'active'
      AND DATE(rp.due_date) = DATE('now', '+${daysBeforeDue} days')
  `;

  if (ownerId) {
    query += ` AND rp.owner_id = ${ownerId}`;
  }

  const { results } = await db.prepare(query).all<{
    tenant_id: number;
    tenant_name: string;
    tenant_phone: string;
    property_name: string;
    amount: number;
    due_date: string;
    owner_id: number;
  }>();

  let sent = 0;
  let failed = 0;

  for (const payment of results) {
    const message = generateMessage('rent_reminder', {
      tenant_name: payment.tenant_name,
      property_name: payment.property_name,
      amount: payment.amount,
      due_date: new Date(payment.due_date).toLocaleDateString('fr-FR')
    });

    const smsResult = await sendSMS(config, payment.tenant_phone, message);

    await saveNotification(db, payment.owner_id, {
      tenant_id: payment.tenant_id,
      type: 'rent_reminder',
      channel: 'sms',
      recipient_phone: payment.tenant_phone,
      message,
      status: smsResult.success ? 'sent' : 'failed',
      external_id: smsResult.messageId,
      error_message: smsResult.error
    });

    if (smsResult.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Send late payment notifications
 */
export async function sendLatePaymentAlerts(
  db: D1Database,
  config: TwilioConfig,
  ownerId?: number
): Promise<{ sent: number; failed: number }> {
  let query = `
    SELECT 
      t.id as tenant_id, t.full_name as tenant_name, t.phone as tenant_phone,
      p.name as property_name, rp.amount, rp.due_date, o.id as owner_id,
      JULIANDAY('now') - JULIANDAY(rp.due_date) as days_late
    FROM rent_payments rp
    JOIN tenants t ON rp.tenant_id = t.id
    JOIN properties p ON rp.property_id = p.id
    JOIN owners o ON rp.owner_id = o.id
    WHERE rp.status = 'late'
      AND t.status = 'active'
      AND DATE(rp.due_date) < DATE('now')
  `;

  if (ownerId) {
    query += ` AND rp.owner_id = ${ownerId}`;
  }

  const { results } = await db.prepare(query).all<{
    tenant_id: number;
    tenant_name: string;
    tenant_phone: string;
    property_name: string;
    amount: number;
    due_date: string;
    owner_id: number;
    days_late: number;
  }>();

  let sent = 0;
  let failed = 0;

  for (const payment of results) {
    const message = generateMessage('late_payment', {
      tenant_name: payment.tenant_name,
      property_name: payment.property_name,
      amount: payment.amount,
      days_late: Math.floor(payment.days_late)
    });

    const smsResult = await sendSMS(config, payment.tenant_phone, message);

    await saveNotification(db, payment.owner_id, {
      tenant_id: payment.tenant_id,
      type: 'late_payment',
      channel: 'sms',
      recipient_phone: payment.tenant_phone,
      message,
      status: smsResult.success ? 'sent' : 'failed',
      external_id: smsResult.messageId,
      error_message: smsResult.error
    });

    if (smsResult.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}
