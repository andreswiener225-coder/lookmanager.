/**
 * LokoManager - Main Application Entry Point
 * SaaS de gestion locative pour l'Afrique francophone
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Env } from './types';

// Import routes
import authRoutes from './routes/auth.routes';
import propertiesRoutes from './routes/properties.routes';
import tenantsRoutes from './routes/tenants.routes';
import paymentsRoutes from './routes/payments.routes';
import dashboardRoutes from './routes/dashboard.routes';
import expensesRoutes from './routes/expenses.routes';
import serviceProvidersRoutes from './routes/service-providers.routes';

const app = new Hono<{ Bindings: Env }>();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Logger middleware (development)
app.use('*', logger());

// CORS middleware for API routes
app.use('/api/*', cors({
  origin: '*', // In production, restrict to your domain
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true
}));

// ============================================================================
// API ROUTES
// ============================================================================

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'lokomanager-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount API routes
app.route('/api/auth', authRoutes);
app.route('/api/properties', propertiesRoutes);
app.route('/api/tenants', tenantsRoutes);
app.route('/api/payments', paymentsRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/expenses', expensesRoutes);
app.route('/api/service-providers', serviceProvidersRoutes);

// ============================================================================
// STATIC FILES & FRONTEND
// ============================================================================

// Serve static assets from /static/* path
app.use('/static/*', serveStatic({ root: './public' }));

// Default landing page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LokoManager - Gestion Locative Intelligente</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div class="container mx-auto px-4 py-16">
            <div class="max-w-4xl mx-auto text-center">
                <!-- Logo / Title -->
                <div class="mb-8">
                    <h1 class="text-6xl font-bold text-indigo-900 mb-4">
                        <i class="fas fa-building mr-4"></i>
                        LokoManager
                    </h1>
                    <p class="text-2xl text-gray-700">
                        Gestion locative intelligente pour l'Afrique
                    </p>
                </div>

                <!-- Features Grid -->
                <div class="grid md:grid-cols-3 gap-6 mb-12">
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <i class="fas fa-home text-4xl text-indigo-600 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Gérez vos biens</h3>
                        <p class="text-gray-600">Centralisez tous vos biens immobiliers en un seul endroit</p>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <i class="fas fa-users text-4xl text-green-600 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Suivez vos locataires</h3>
                        <p class="text-gray-600">Historique complet et communication simplifiée</p>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <i class="fas fa-money-bill-wave text-4xl text-yellow-600 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Loyers automatisés</h3>
                        <p class="text-gray-600">Mobile Money, alertes SMS et rappels automatiques</p>
                    </div>
                </div>

                <!-- CTA Buttons -->
                <div class="space-x-4">
                    <a href="/login" class="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition duration-200">
                        <i class="fas fa-sign-in-alt mr-2"></i>
                        Se connecter
                    </a>
                    <a href="/register" class="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition duration-200">
                        <i class="fas fa-user-plus mr-2"></i>
                        Créer un compte
                    </a>
                </div>

                <!-- API Status -->
                <div class="mt-12 text-sm text-gray-600">
                    <p>
                        <i class="fas fa-check-circle text-green-500"></i>
                        API Status: <span id="api-status" class="font-bold">Checking...</span>
                    </p>
                </div>
            </div>
        </div>

        <script>
            // Check API health
            fetch('/api/health')
                .then(res => res.json())
                .then(data => {
                    document.getElementById('api-status').textContent = data.status === 'healthy' ? 'Opérationnel ✓' : 'En maintenance';
                    document.getElementById('api-status').className = data.status === 'healthy' ? 'font-bold text-green-600' : 'font-bold text-red-600';
                })
                .catch(err => {
                    document.getElementById('api-status').textContent = 'Erreur de connexion';
                    document.getElementById('api-status').className = 'font-bold text-red-600';
                });
        </script>
    </body>
    </html>
  `);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route introuvable'
    }
  }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error('[global.error]', err);
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Une erreur interne est survenue'
    }
  }, 500);
});

export default app;
