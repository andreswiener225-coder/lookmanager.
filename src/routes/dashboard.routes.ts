/**
 * Dashboard Routes
 * Provides statistics and overview data for the owner
 */

import { Hono } from 'hono';
import type { Env, DashboardStats } from '../types';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse, ERROR_CODES } from '../utils/response';

const dashboard = new Hono<{ Bindings: Env }>();

// All routes require authentication
dashboard.use('/*', authMiddleware);

/**
 * GET /api/dashboard
 * Get comprehensive dashboard statistics
 */
dashboard.get('/', async (c) => {
  try {
    const ownerId = c.get('ownerId');

    // 1. Properties statistics
    const propertiesStats = await c.env.DB
      .prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
          SUM(CASE WHEN status = 'vacant' THEN 1 ELSE 0 END) as vacant,
          SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
        FROM properties 
        WHERE owner_id = ?
      `)
      .bind(ownerId)
      .first<any>();

    // 2. Tenants statistics
    const tenantsStats = await c.env.DB
      .prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
        FROM tenants 
        WHERE owner_id = ?
      `)
      .bind(ownerId)
      .first<any>();

    // 3. Revenue this month
    const revenueThisMonth = await c.env.DB
      .prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as received,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as expected,
          COALESCE(SUM(CASE WHEN status = 'late' THEN amount ELSE 0 END), 0) as late_amount,
          COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count
        FROM rent_payments 
        WHERE owner_id = ? 
          AND strftime('%Y-%m', due_date) = strftime('%Y-%m', 'now')
      `)
      .bind(ownerId)
      .first<any>();

    // 4. Revenue last month
    const revenueLastMonth = await c.env.DB
      .prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as received
        FROM rent_payments 
        WHERE owner_id = ? 
          AND strftime('%Y-%m', due_date) = strftime('%Y-%m', 'now', '-1 month')
      `)
      .bind(ownerId)
      .first<any>();

    // 5. Pending payments
    const pendingPayments = await c.env.DB
      .prepare(`
        SELECT 
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as total_amount
        FROM rent_payments 
        WHERE owner_id = ? 
          AND status IN ('pending', 'late')
          AND due_date <= date('now')
      `)
      .bind(ownerId)
      .first<any>();

    // 6. Recent payments (last 10)
    const recentPayments = await c.env.DB
      .prepare(`
        SELECT 
          rp.*,
          t.full_name as tenant_name,
          p.name as property_name
        FROM rent_payments rp
        LEFT JOIN tenants t ON rp.tenant_id = t.id
        LEFT JOIN properties p ON rp.property_id = p.id
        WHERE rp.owner_id = ?
          AND rp.status = 'completed'
        ORDER BY rp.payment_date DESC
        LIMIT 10
      `)
      .bind(ownerId)
      .all();

    // 7. Upcoming payments (next 30 days)
    const upcomingPayments = await c.env.DB
      .prepare(`
        SELECT 
          rp.*,
          t.full_name as tenant_name,
          p.name as property_name,
          CAST((julianday(rp.due_date) - julianday('now')) AS INTEGER) as days_until_due
        FROM rent_payments rp
        LEFT JOIN tenants t ON rp.tenant_id = t.id
        LEFT JOIN properties p ON rp.property_id = p.id
        WHERE rp.owner_id = ?
          AND rp.status = 'pending'
          AND rp.due_date > date('now')
          AND rp.due_date <= date('now', '+30 days')
        ORDER BY rp.due_date ASC
        LIMIT 10
      `)
      .bind(ownerId)
      .all();

    // 8. Late payments details
    const latePayments = await c.env.DB
      .prepare(`
        SELECT 
          rp.*,
          t.full_name as tenant_name,
          t.phone as tenant_phone,
          p.name as property_name,
          CAST((julianday('now') - julianday(rp.due_date)) AS INTEGER) as days_late
        FROM rent_payments rp
        LEFT JOIN tenants t ON rp.tenant_id = t.id
        LEFT JOIN properties p ON rp.property_id = p.id
        WHERE rp.owner_id = ?
          AND rp.status = 'late'
        ORDER BY days_late DESC
      `)
      .bind(ownerId)
      .all();

    // Build dashboard response
    const stats: DashboardStats = {
      total_properties: propertiesStats?.total || 0,
      occupied_properties: propertiesStats?.occupied || 0,
      vacant_properties: propertiesStats?.vacant || 0,
      total_tenants: tenantsStats?.total || 0,
      active_tenants: tenantsStats?.active || 0,
      total_revenue_this_month: revenueThisMonth?.received || 0,
      total_revenue_last_month: revenueLastMonth?.received || 0,
      pending_payments_count: pendingPayments?.count || 0,
      pending_payments_amount: pendingPayments?.total_amount || 0,
      late_payments_count: revenueThisMonth?.late_count || 0,
      late_payments_amount: revenueThisMonth?.late_amount || 0,
      recent_payments: recentPayments.results || [],
      upcoming_payments: upcomingPayments.results || []
    };

    return successResponse(c, {
      ...stats,
      late_payments_details: latePayments.results || []
    });
  } catch (error) {
    console.error('[dashboard.get]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération des statistiques', 500);
  }
});

/**
 * GET /api/dashboard/revenue
 * Get detailed revenue statistics by month
 */
dashboard.get('/revenue', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const months = parseInt(c.req.query('months') || '12'); // Default 12 months

    const results = await c.env.DB
      .prepare(`
        SELECT 
          strftime('%Y-%m', due_date) as month,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as received,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as expected,
          COALESCE(SUM(CASE WHEN status = 'late' THEN amount ELSE 0 END), 0) as late,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as payments_count
        FROM rent_payments
        WHERE owner_id = ?
          AND due_date >= date('now', '-${months} months')
        GROUP BY month
        ORDER BY month DESC
      `)
      .bind(ownerId)
      .all();

    return successResponse(c, results.results || []);
  } catch (error) {
    console.error('[dashboard.revenue]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération des revenus', 500);
  }
});

/**
 * GET /api/dashboard/occupancy
 * Get occupancy rate over time
 */
dashboard.get('/occupancy', async (c) => {
  try {
    const ownerId = c.get('ownerId');

    // Current occupancy
    const current = await c.env.DB
      .prepare(`
        SELECT 
          COUNT(*) as total_properties,
          SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
          ROUND(CAST(SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100, 2) as occupancy_rate
        FROM properties
        WHERE owner_id = ?
      `)
      .bind(ownerId)
      .first();

    // Properties by type
    const byType = await c.env.DB
      .prepare(`
        SELECT 
          property_type,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied
        FROM properties
        WHERE owner_id = ?
        GROUP BY property_type
      `)
      .bind(ownerId)
      .all();

    // Properties by city
    const byCity = await c.env.DB
      .prepare(`
        SELECT 
          city,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied
        FROM properties
        WHERE owner_id = ?
        GROUP BY city
      `)
      .bind(ownerId)
      .all();

    return successResponse(c, {
      current_occupancy: current,
      by_type: byType.results || [],
      by_city: byCity.results || []
    });
  } catch (error) {
    console.error('[dashboard.occupancy]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération du taux d\'occupation', 500);
  }
});

/**
 * GET /api/dashboard/expenses
 * Get expenses summary
 */
dashboard.get('/expenses', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const months = parseInt(c.req.query('months') || '6'); // Default 6 months

    // Total expenses by month
    const byMonth = await c.env.DB
      .prepare(`
        SELECT 
          strftime('%Y-%m', expense_date) as month,
          COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE owner_id = ?
          AND expense_date >= date('now', '-${months} months')
        GROUP BY month
        ORDER BY month DESC
      `)
      .bind(ownerId)
      .all();

    // Expenses by category
    const byCategory = await c.env.DB
      .prepare(`
        SELECT 
          category,
          COALESCE(SUM(amount), 0) as total,
          COUNT(*) as count
        FROM expenses
        WHERE owner_id = ?
          AND expense_date >= date('now', '-${months} months')
        GROUP BY category
        ORDER BY total DESC
      `)
      .bind(ownerId)
      .all();

    // Recent expenses
    const recent = await c.env.DB
      .prepare(`
        SELECT e.*, p.name as property_name
        FROM expenses e
        LEFT JOIN properties p ON e.property_id = p.id
        WHERE e.owner_id = ?
        ORDER BY e.expense_date DESC
        LIMIT 10
      `)
      .bind(ownerId)
      .all();

    return successResponse(c, {
      by_month: byMonth.results || [],
      by_category: byCategory.results || [],
      recent_expenses: recent.results || []
    });
  } catch (error) {
    console.error('[dashboard.expenses]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération des dépenses', 500);
  }
});

export default dashboard;
