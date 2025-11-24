# 🏠 LokoManager - Gestion Locative Intelligente pour l'Afrique

**Plateforme SaaS PropTech** pour simplifier la gestion immobilière en Côte d'Ivoire et Afrique francophone.

---

## 🎯 Fonctionnalités Complètes

### ✅ Gestion Propriétés
- CRUD complet (Créer, Lire, Modifier, Supprimer)
- Regroupement hiérarchique (immeubles → appartements)
- Types: Villa, Appartement, Studio, Bureau, Commerce
- Statuts: Vacant, Occupé, Maintenance
- Auto-mise à jour loyer locataires actifs

### ✅ Gestion Locataires
- Profils complets avec documents
- Authentification PIN (4 derniers chiffres téléphone)
- Dashboard dédié locataire
- Statuts: Actif, Inactif, Résilié
- Historique complet

### ✅ Système Paiements
- Enregistrement paiements manuels
- Statuts: Payé, En attente, Partiel, En retard
- Statistiques temps réel
- Filtres avancés (statut, locataire, mois)
- Méthodes: Espèces, Mobile Money, Virement, Chèque

### ✅ CinetPay Integration 🚀
- **Orange Money** 🟠
- **MTN Money** 🟡
- **Moov Money** 🔵
- **Wave** 🌊
- Cartes bancaires (Visa, Mastercard)
- Paiements en ligne sécurisés
- Webhooks temps réel
- Mode Sandbox pour tests

### ✅ Génération PDF Reçus 📄
- Reçus professionnels automatiques
- Format A4 optimisé
- Numérotation unique
- Download / Preview
- Métadonnées complètes

### ✅ Moyens de Paiement
- **Propriétaires**: Comptes réception (Orange, MTN, Moov, Wave, Banque)
- **Locataires**: Moyens paiement enregistrés
- Système compte principal
- Stockage sécurisé D1

---

## 🛠️ Stack Technique

### Backend
- **Hono** - Framework ultra-léger (12KB)
- **Cloudflare Workers** - Edge computing global
- **Cloudflare D1** - Base de données SQLite distribuée
- **TypeScript** - Type safety complet

### Frontend
- **Vanilla JavaScript** - Léger et rapide
- **TailwindCSS** - Styling moderne
- **jsPDF** - Génération PDF côté client
- **Font Awesome** - Icônes

### Paiements
- **CinetPay API** - Mobile Money Côte d'Ivoire
- **Webhooks** - Notifications temps réel

---

## 📦 Installation Locale

### Prérequis
- Node.js 18+
- npm ou pnpm
- Compte Cloudflare (gratuit)
- Compte CinetPay (optionnel)

### Étapes

```bash
# 1. Cloner le projet
git clone https://github.com/votre-username/lokomanager.git
cd lokomanager

# 2. Installer dépendances
npm install

# 3. Configuration environnement
cp .dev.vars.example .dev.vars
# Éditer .dev.vars avec vos clés

# 4. Créer base de données locale
npx wrangler d1 create lokomanager-production

# 5. Appliquer migrations
npx wrangler d1 migrations apply lokomanager-production --local

# 6. Build
npm run build

# 7. Démarrer en local
npm run dev
# Ou avec PM2:
pm2 start ecosystem.config.cjs
```

---

## 🔑 Configuration CinetPay

### 1. Créer compte CinetPay
1. Aller sur [www.cinetpay.com](https://www.cinetpay.com)
2. S'inscrire (gratuit)
3. Vérifier email et téléphone

### 2. Obtenir clés API
1. Connexion → Dashboard
2. Menu "Paramètres" → "API Keys"
3. Copier:
   - **API Key**
   - **Site ID**
   - **Secret Key** (optionnel)

### 3. Configuration Sandbox (Tests)
```bash
# Dans .dev.vars:
CINETPAY_API_KEY=votre-api-key-sandbox
CINETPAY_SITE_ID=votre-site-id-sandbox
```

### 4. Mode Production
```bash
# Utiliser wrangler secrets:
npx wrangler secret put CINETPAY_API_KEY
npx wrangler secret put CINETPAY_SITE_ID
```

### 5. Configurer Webhook
Dans CinetPay Dashboard:
- URL Notification: `https://votre-domaine.com/api/cinetpay/webhook`
- Méthode: POST
- Format: JSON

---

## 🚀 Déploiement Cloudflare Pages

### Méthode 1: Via Wrangler CLI

```bash
# 1. Authentification
npx wrangler login

# 2. Créer projet
npx wrangler pages project create lokomanager \
  --production-branch main \
  --compatibility-date 2024-01-01

# 3. Créer base D1 production
npx wrangler d1 create lokomanager-production

# 4. Copier database_id dans wrangler.jsonc

# 5. Appliquer migrations production
npx wrangler d1 migrations apply lokomanager-production

# 6. Configurer secrets
npx wrangler secret put JWT_SECRET
npx wrangler secret put CINETPAY_API_KEY
npx wrangler secret put CINETPAY_SITE_ID

# 7. Déployer
npm run deploy
```

### Méthode 2: Via Dashboard Cloudflare

1. Connexion [dash.cloudflare.com](https://dash.cloudflare.com)
2. Pages → Create project
3. Connect Git repository
4. Configure build:
   - Build command: `npm run build`
   - Build output: `dist`
5. Environment variables → Add secrets
6. Deploy

---

## 📊 Structure Base de Données

### Tables Principales
- `owners` - Propriétaires
- `properties` - Biens immobiliers
- `tenants` - Locataires
- `payments` - Paiements
- `owner_payment_methods` - Comptes propriétaires
- `tenant_payment_methods` - Moyens paiement locataires
- `cinetpay_transactions` - Transactions CinetPay
- `payment_receipts` - Reçus PDF

### Relations
```
owners (1) → (N) properties
properties (1) → (1) tenants
tenants (1) → (N) payments
payments (1) → (1) cinetpay_transactions
payments (1) → (1) payment_receipts
```

---

## 🔐 Sécurité

- ✅ JWT authentication (propriétaires + locataires)
- ✅ Bcrypt password hashing (10 rounds)
- ✅ PIN authentication locataires (4 chiffres)
- ✅ Owner_id/tenant_id vérifiés à chaque requête
- ✅ CORS configuré
- ✅ Secrets Cloudflare (jamais en code)
- ✅ Rate limiting (Cloudflare)

---

## 📱 Support Mobile Money

### Opérateurs supportés (Côte d'Ivoire)
- Orange Money 🟠
- MTN Money 🟡
- Moov Money 🔵
- Wave 🌊

### Autres pays (via CinetPay)
- Flooz (Bénin)
- TMoney (Togo)
- Orange Money (multi-pays)
- Visa / Mastercard

---

## 🧪 Tests

### Localement
```bash
# Créer owner test
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Owner",
    "email": "test@example.com",
    "phone": "+225XXXXXXXXXX",
    "password": "SecurePass123!"
  }'

# Créer propriété
# Créer locataire
# Enregistrer paiement
# Générer PDF
```

### Tests CinetPay Sandbox
1. Utiliser clés sandbox
2. Montants tests: 100 XOF minimum
3. Numéros test fournis par CinetPay

---

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Inscription propriétaire
- `POST /api/auth/login` - Connexion propriétaire
- `POST /api/tenant/login` - Connexion locataire (PIN)

### Properties
- `GET /api/properties` - Liste
- `POST /api/properties` - Créer
- `PUT /api/properties/:id` - Modifier
- `DELETE /api/properties/:id` - Supprimer

### Tenants
- `GET /api/tenants` - Liste
- `POST /api/tenants` - Créer
- `PUT /api/tenants/:id` - Modifier
- `DELETE /api/tenants/:id` - Supprimer

### Payments
- `GET /api/payments` - Liste
- `POST /api/payments` - Créer
- `PUT /api/payments/:id` - Modifier
- `DELETE /api/payments/:id` - Supprimer

### CinetPay
- `POST /api/cinetpay/tenant/init-payment` - Initialiser paiement
- `GET /api/cinetpay/tenant/check-payment/:id` - Vérifier statut
- `POST /api/cinetpay/webhook` - Webhook callback
- `GET /api/cinetpay/owner/transactions` - Historique

### PDF Receipts
- `POST /api/receipts/generate` - Générer reçu
- `GET /api/receipts/payment/:id` - Récupérer reçu
- `GET /api/receipts/list` - Liste reçus

---

## 🛣️ Roadmap

### Version 2.0 (Q1 2025)
- [ ] Alertes automatiques SMS (Twilio)
- [ ] Statistiques avancées (revenus, taux occupation)
- [ ] Export données (Excel, CSV)
- [ ] Application mobile (React Native)

### Version 3.0 (Q2 2025)
- [ ] Multi-devises (FCFA, EUR, USD)
- [ ] Multi-langues (Français, Anglais)
- [ ] Intelligence artificielle (prédiction retards)
- [ ] Intégration comptabilité

---

## 🐛 Support

### Issues
GitHub Issues: [github.com/votre-username/lokomanager/issues](https://github.com/votre-username/lokomanager/issues)

### Contact
- Email: support@lokomanager.com
- Téléphone: +225 XX XX XX XX XX
- WhatsApp: [Lien WhatsApp]

---

## 📄 Licence

Propriétaire - BioBuild Innov © 2025

---

## 👨‍💻 Auteur

**Kinaya Hintan Ignace Parfait**
- Fondateur BioBuild Innov
- Entrepreneur PropTech
- Côte d'Ivoire 🇨🇮

---

## 🙏 Remerciements

- Cloudflare Workers Team
- CinetPay Team
- Communauté Hono.js
- Développeurs PropTech Afrique

---

**Fait avec ❤️ pour l'Afrique**
