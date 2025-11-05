/**
 * LokoManager Type Definitions
 * Centralized TypeScript types for the entire application
 */

// ============================================================================
// CLOUDFLARE BINDINGS
// ============================================================================
export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
  CINETPAY_API_KEY?: string;
  CINETPAY_SITE_ID?: string;
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface Owner {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string;
  subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise';
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: number;
  owner_id: number;
  name: string;
  address: string;
  city: string;
  neighborhood: string | null;
  property_type: 'villa' | 'appartement' | 'studio' | 'bureau' | 'commerce';
  status: 'vacant' | 'occupied' | 'maintenance';
  total_units: number;
  monthly_rent: number | null;
  description: string | null;
  photos: string | null; // JSON string
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: number;
  owner_id: number;
  property_id: number;
  full_name: string;
  phone: string;
  email: string | null;
  id_card_number: string | null;
  move_in_date: string;
  move_out_date: string | null;
  monthly_rent: number;
  deposit_amount: number;
  status: 'active' | 'inactive' | 'evicted';
  emergency_contact: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentPayment {
  id: number;
  owner_id: number;
  tenant_id: number;
  property_id: number;
  amount: number;
  payment_date: string | null;
  due_date: string;
  payment_method: 'orange_money' | 'mtn_money' | 'moov_money' | 'wave' | 'cash' | 'bank_transfer' | null;
  transaction_id: string | null;
  status: 'pending' | 'completed' | 'late' | 'cancelled';
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  owner_id: number;
  tenant_id: number | null;
  type: 'rent_reminder' | 'late_payment' | 'payment_received' | 'maintenance' | 'general';
  channel: 'sms' | 'whatsapp' | 'email';
  recipient_phone: string | null;
  recipient_email: string | null;
  message: string;
  scheduled_at: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed';
  external_id: string | null;
  error_message: string | null;
  created_at: string;
}

export interface Expense {
  id: number;
  owner_id: number;
  property_id: number | null;
  category: 'maintenance' | 'taxes' | 'insurance' | 'utilities' | 'repairs' | 'other';
  amount: number;
  expense_date: string;
  description: string;
  receipt_url: string | null;
  paid_to: string | null;
  created_at: string;
}

export interface ServiceProvider {
  id: number;
  owner_id: number;
  name: string;
  phone: string;
  specialty: string;
  rating: number;
  notes: string | null;
  created_at: string;
}

// ============================================================================
// JWT PAYLOAD
// ============================================================================
export interface JWTPayload {
  sub: number; // owner_id
  email: string;
  tier: string;
  exp: number;
  iat: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// Authentication
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  owner: Omit<Owner, 'password_hash'>;
}

// Properties
export interface CreatePropertyRequest {
  name: string;
  address: string;
  city: string;
  neighborhood?: string;
  property_type: Property['property_type'];
  total_units?: number;
  monthly_rent?: number;
  description?: string;
  photos?: string[]; // Will be converted to JSON string
}

export interface UpdatePropertyRequest extends Partial<CreatePropertyRequest> {
  status?: Property['status'];
}

// Tenants
export interface CreateTenantRequest {
  property_id: number;
  full_name: string;
  phone: string;
  email?: string;
  id_card_number?: string;
  move_in_date: string;
  monthly_rent: number;
  deposit_amount?: number;
  emergency_contact?: string;
  notes?: string;
}

export interface UpdateTenantRequest extends Partial<CreateTenantRequest> {
  status?: Tenant['status'];
  move_out_date?: string;
}

// Payments
export interface CreatePaymentRequest {
  tenant_id: number;
  property_id: number;
  amount: number;
  due_date: string;
  payment_date?: string;
  payment_method?: RentPayment['payment_method'];
  transaction_id?: string;
  notes?: string;
}

export interface UpdatePaymentRequest {
  payment_date?: string;
  payment_method?: RentPayment['payment_method'];
  transaction_id?: string;
  status?: RentPayment['status'];
  notes?: string;
}

// Notifications
export interface SendNotificationRequest {
  tenant_id?: number;
  type: Notification['type'];
  channel: Notification['channel'];
  recipient_phone?: string;
  recipient_email?: string;
  message: string;
  scheduled_at?: string;
}

// Expenses
export interface CreateExpenseRequest {
  property_id?: number;
  category: Expense['category'];
  amount: number;
  expense_date: string;
  description: string;
  receipt_url?: string;
  paid_to?: string;
}

// Service Providers
export interface CreateServiceProviderRequest {
  name: string;
  phone: string;
  specialty: string;
  rating?: number;
  notes?: string;
}

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================
export interface DashboardStats {
  total_properties: number;
  occupied_properties: number;
  vacant_properties: number;
  total_tenants: number;
  active_tenants: number;
  total_revenue_this_month: number;
  total_revenue_last_month: number;
  pending_payments_count: number;
  pending_payments_amount: number;
  late_payments_count: number;
  late_payments_amount: number;
  recent_payments: Array<RentPayment & {
    tenant_name: string;
    property_name: string;
  }>;
  upcoming_payments: Array<RentPayment & {
    tenant_name: string;
    property_name: string;
  }>;
}

// ============================================================================
// API RESPONSE WRAPPER
// ============================================================================
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================================================
// SUBSCRIPTION LIMITS
// ============================================================================
export interface SubscriptionLimits {
  max_properties: number;
  max_tenants: number;
  notifications: number;
  reports: boolean;
  advanced_analytics?: boolean;
  white_label?: boolean;
  support: 'community' | 'email' | 'priority' | 'dedicated';
}

export const SUBSCRIPTION_TIERS: Record<Owner['subscription_tier'], { name: string; price: number; limits: SubscriptionLimits }> = {
  free: {
    name: 'Gratuit',
    price: 0,
    limits: {
      max_properties: 1,
      max_tenants: 1,
      notifications: 10,
      reports: false,
      support: 'community'
    }
  },
  starter: {
    name: 'Démarrage',
    price: 5000,
    limits: {
      max_properties: 5,
      max_tenants: 10,
      notifications: 50,
      reports: true,
      support: 'email'
    }
  },
  pro: {
    name: 'Professionnel',
    price: 10000,
    limits: {
      max_properties: 15,
      max_tenants: 50,
      notifications: 200,
      reports: true,
      advanced_analytics: true,
      support: 'priority'
    }
  },
  enterprise: {
    name: 'Entreprise',
    price: 25000,
    limits: {
      max_properties: 999,
      max_tenants: 9999,
      notifications: 99999,
      reports: true,
      advanced_analytics: true,
      white_label: true,
      support: 'dedicated'
    }
  }
};

// ============================================================================
// PAGINATION
// ============================================================================
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
