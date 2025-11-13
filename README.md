# 🏠 LokoManager

**Plateforme SaaS de gestion locative intelligente pour l'Afrique francophone**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-4.10-orange)](https://hono.dev/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange)](https://pages.cloudflare.com/)

---

## 📋 Vue d'ensemble

LokoManager est une solution SaaS moderne conçue spécifiquement pour le marché ivoirien et africain francophone. Elle permet aux propriétaires immobiliers de gérer efficacement leurs biens, locataires, paiements et communications de manière centralisée.

### 🎯 Problème résolu
- ✅ Retards de paiement des loyers (problème #1 des propriétaires CI)
- ✅ Gestion locative désorganisée
- ✅ Absence d'historique et de suivi structuré
- ✅ Communication inefficace avec les locataires

### 💡 Valeur ajoutée
- 🚀 Interface simple et intuitive (5 minutes de prise en main)
- 📱 Mobile-first (90%+ utilisateurs ivoiriens sur smartphone)
- 💸 Intégration Mobile Money (Orange, MTN, Moov, Wave)
- 📲 Alertes SMS/WhatsApp automatiques
- 📊 Dashboard financier en temps réel

---

## 🚀 Fonctionnalités actuelles

### ✅ Implémentées (v1.0 - Janvier 2025)

#### 🔐 Authentification Dual-System
- [x] Propriétaires : Email/password avec JWT (7 jours)
- [x] Locataires : Téléphone + PIN simplifié (4 chiffres)
- [x] Changement de mot de passe
- [x] Réinitialisation de mot de passe
- [x] Sessions sécurisées avec middleware

#### 🏠 Gestion des biens immobiliers
- [x] CRUD complet (Créer/modifier/supprimer)
- [x] Types: villa, appartement, studio, bureau, commerce
- [x] Statuts: vacant, occupé, en maintenance
- [x] Photos (stockage JSON)
- [x] Localisation (ville, quartier)
- [x] Validation robuste des données
- [x] **FIX**: Messages d'erreur clairs (plus de "[object Object]")

#### 👥 Gestion des locataires
- [x] CRUD complet avec modal moderne
- [x] Auto-remplissage du loyer depuis la propriété
- [x] Dépôt de garantie par défaut (1 mois)
- [x] Filtrage par statut et propriété
- [x] Liste uniquement des propriétés vacantes

#### 🏘️ Portail Locataire Dédié
- [x] Connexion simplifiée (téléphone + PIN)
- [x] Dashboard personnel avec statistiques
- [x] Vue détaillée de la propriété louée
- [x] Historique des paiements
- [x] Contact direct avec le propriétaire
- [x] Notifications intelligentes (bienvenue, rappels, retards)

#### 💰 Gestion des paiements
- [x] Créer/modifier/supprimer des paiements
- [x] Statuts: Payé, En attente, En retard
- [x] Enregistrement des paiements reçus
- [x] Filtrage par locataire, propriété, mois
- [x] Calcul automatique des soldes

#### 📊 Dashboard Propriétaire
- [x] Statistiques temps réel (revenus, occupation)
- [x] Liste des paiements en attente
- [x] Propriétés récentes
- [x] Badges de statut colorés

#### 🎓 Onboarding & UX
- [x] Guide interactif 8 étapes pour nouveaux utilisateurs
- [x] Tooltips positionnés intelligemment
- [x] Possibilité de redémarrer le tutoriel
- [x] Landing page professionnelle avec pricing

#### 🌐 Landing Page Publique
- [x] Hero avec CTA
- [x] 6 cartes de fonctionnalités
- [x] 4 plans tarifaires détaillés
- [x] 3 témoignages clients
- [x] Footer complet
- [x] Design mobile-first responsive

#### 🔒 Multi-tenant & Sécurité
- [x] Isolation complète des données par propriétaire
- [x] Vérification des limites d'abonnement
- [x] Protection contre les accès non autorisés
- [x] Rate limiting Cloudflare Workers
- [x] Gestion d'erreurs robuste et centralisée

### 🚧 En développement (v1.1 - Février 2025)
- [ ] **Option A - Groupes de Propriétés** (prochain sprint)
  - [ ] Immeubles parents avec unités enfants
  - [ ] Numéros d'appartements et étages
  - [ ] Vue hiérarchique en arbre
  - [ ] Statistiques par immeuble
- [ ] Notifications SMS/WhatsApp (Twilio)
- [ ] Intégration Mobile Money CI (CinetPay)
- [ ] Gestion des dépenses/charges
- [ ] Carnet d'artisans/fournisseurs

### 📅 Roadmap future (v2.0+)
- [ ] Application mobile PWA
- [ ] Génération de reçus PDF
- [ ] Intégration CinetPay (Mobile Money CI)
- [ ] Rapports financiers exportables (Excel/PDF)
- [ ] Module marketplace artisans
- [ ] Analyse défauts via IA (photos)

---

## 🛠️ Stack technique

### Backend
- **Framework**: Hono.js 4.10+ (ultra-léger, ultra-rapide)
- **Runtime**: Cloudflare Workers (edge computing)
- **Base de données**: Cloudflare D1 (SQLite distribué)
- **Authentification**: JWT + bcrypt
- **TypeScript**: 5.7+ (typage strict)

### Frontend
- **Framework**: Vanilla JS + TailwindCSS (CDN)
- **Icons**: FontAwesome 6.4
- **Charts**: Chart.js (prochainement)
- **HTTP Client**: Axios (prochainement)

### Infrastructure
- **Hébergement**: Cloudflare Pages (gratuit)
- **CDN**: Global (310+ datacenters)
- **CI/CD**: Auto-deploy sur git push
- **Domaine**: lokomanager.pages.dev

---

## 📦 Installation & Configuration

### Prérequis
- Node.js 18+ et npm
- Compte Cloudflare (gratuit)
- Git

### 1. Cloner le repository
```bash
git clone https://github.com/votre-username/lokomanager.git
cd lokomanager
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Créer la base de données D1 locale
```bash
# Créer la base de données
npm run db:create

# Appliquer les migrations
npm run db:migrate:local
```

### 4. Configurer les variables d'environnement
Créer un fichier `.dev.vars` à la racine :
```ini
JWT_SECRET=your-super-secret-jwt-key-change-me
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+225xxxxxxxxxx
CINETPAY_API_KEY=your-cinetpay-api-key
CINETPAY_SITE_ID=your-cinetpay-site-id
```

### 5. Peupler avec des données de test (optionnel)
```bash
wrangler d1 execute lokomanager-production --local --file=./migrations/seed.sql
```

### 6. Build du projet
```bash
npm run build
```

### 7. Lancer le serveur de développement
```bash
# Démarrer avec PM2 (recommandé)
pm2 start ecosystem.config.cjs

# Vérifier le statut
pm2 list

# Voir les logs
pm2 logs lokomanager --nostream

# Tester
curl http://localhost:3000/api/health
```

Le serveur sera accessible sur `http://localhost:3000`

---

## 🔧 Scripts npm disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server Vite (développement frontend) |
| `npm run dev:sandbox` | Wrangler pages dev sur 0.0.0.0:3000 |
| `npm run dev:d1` | Wrangler avec D1 local |
| `npm run build` | Build de production (vite build) |
| `npm run preview` | Preview du build |
| `npm run deploy` | Build + déploiement Cloudflare Pages |
| `npm run deploy:prod` | Déploiement avec nom de projet |
| `npm run clean-port` | Tuer le processus sur port 3000 |
| `npm run test` | Test curl du serveur local |
| `npm run db:create` | Créer la base D1 |
| `npm run db:migrate:local` | Appliquer migrations en local |
| `npm run db:migrate:prod` | Appliquer migrations en production |
| `npm run db:console:local` | Console SQL locale |
| `npm run db:console:prod` | Console SQL production |

---

## 📡 API Documentation

### Base URL
```
Local: http://localhost:3000
Production: https://lokomanager.pages.dev
```

### Format de réponse standard
```typescript
// Succès
{
  "success": true,
  "data": { /* ... */ },
  "message": "Opération réussie"
}

// Erreur
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description de l'erreur",
    "details": { /* ... */ }
  }
}
```

### Endpoints principaux

#### 🔓 Publics (sans authentification)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/health` | Status de l'API |
| `POST` | `/api/auth/register` | Créer un compte |
| `POST` | `/api/auth/login` | Se connecter |
| `POST` | `/api/auth/reset-password` | Réinitialiser mot de passe |

#### 🔒 Protégés (JWT requis)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/auth/me` | Infos utilisateur connecté |
| `POST` | `/api/auth/change-password` | Changer mot de passe |
| `GET` | `/api/properties` | Liste des biens |
| `POST` | `/api/properties` | Créer un bien |
| `GET` | `/api/properties/:id` | Détails d'un bien |
| `PUT` | `/api/properties/:id` | Modifier un bien |
| `DELETE` | `/api/properties/:id` | Supprimer un bien |

### Exemple d'utilisation

#### Inscription
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "amadou@example.com",
    "password": "SecurePass123",
    "full_name": "Amadou Koné",
    "phone": "+225 07 08 09 10 11"
  }'
```

#### Connexion
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "amadou@example.com",
    "password": "SecurePass123"
  }'
```

#### Créer un bien (avec JWT)
```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Villa Cocody Riviera",
    "address": "123 Bd de la Paix",
    "city": "Abidjan",
    "neighborhood": "Cocody",
    "property_type": "villa",
    "monthly_rent": 300000,
    "description": "Belle villa moderne avec jardin"
  }'
```

---

## 🗄️ Structure de la base de données

### Tables principales

1. **owners** - Propriétaires (comptes utilisateurs)
2. **properties** - Biens immobiliers
3. **tenants** - Locataires
4. **rent_payments** - Paiements de loyer
5. **notifications** - Notifications programmées
6. **expenses** - Dépenses/charges
7. **service_providers** - Artisans/fournisseurs

Voir le fichier `migrations/0001_initial_schema.sql` pour le schéma complet.

---

## 🚢 Déploiement en production

### 1. Créer la base de données D1 de production
```bash
npx wrangler d1 create lokomanager-production
```

Copier le `database_id` dans `wrangler.jsonc`

### 2. Appliquer les migrations en production
```bash
npm run db:migrate:prod
```

### 3. Configurer les secrets
```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put TWILIO_ACCOUNT_SID
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put CINETPAY_API_KEY
npx wrangler secret put CINETPAY_SITE_ID
```

### 4. Déployer sur Cloudflare Pages
```bash
npm run deploy:prod
```

### 5. Vérifier le déploiement
```bash
curl https://lokomanager.pages.dev/api/health
```

---

## 📊 Modèle économique

### Tarification (FCFA/mois)

| Plan | Prix | Biens | Locataires | Notifications |
|------|------|-------|------------|---------------|
| **Gratuit** | 0 | 1 | 1 | 10/mois |
| **Démarrage** | 5 000 | 5 | 10 | 50/mois |
| **Professionnel** | 10 000 | 15 | 50 | 200/mois |
| **Entreprise** | 25 000 | Illimité | Illimité | Illimité |

### Coûts infrastructure (100 clients actifs)

| Service | Coût mensuel |
|---------|--------------|
| Cloudflare Pages | 0€ (gratuit) |
| Cloudflare D1 | 0€ (< 5GB) |
| Twilio SMS | ~15€ (~10k FCFA) |
| Domaine .app | ~2€ |
| **Total** | **~17€/mois (~11k FCFA)** |

**ROI**: Avec 100 clients payants → 500k-1M FCFA/mois  
Infrastructure = 2% des revenus seulement 🚀

---

## 🐛 Corrections récentes

### ✅ Fix "[object Object]" Error (Janvier 2025)

**Problème** : Lors de l'ajout ou la modification de propriétés, l'utilisateur voyait le message "[object Object]" au lieu d'un message d'erreur clair.

**Cause** : Le client API (`api.js`) tentait d'afficher directement l'objet d'erreur retourné par le backend au lieu d'extraire la propriété `message`.

**Solution appliquée** :
```javascript
// Avant (ligne 41 de api.js)
throw new Error(data.error || `Erreur HTTP ${response.status}`);

// Après
let errorMessage = `Erreur HTTP ${response.status}`;
if (data.error) {
  if (typeof data.error === 'string') {
    errorMessage = data.error;
  } else if (data.error.message) {
    errorMessage = data.error.message;  // ✅ Extraction correcte
  } else if (data.error.details) {
    errorMessage = data.error.details;
  }
}
throw new Error(errorMessage);
```

**Impact** : Tous les messages d'erreur sont maintenant affichés clairement en français, améliorant considérablement l'expérience utilisateur.

---

## 👥 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 📞 Contact & Support

- **Fondateur**: Kinaya Hintan Ignace Parfait
- **Entreprise**: BioBuild Innov
- **Email**: contact@biobuildinnov.com
- **GitHub**: [github.com/biobuildinnov/lokomanager](https://github.com/biobuildinnov/lokomanager)

---

## 🙏 Remerciements

- [Hono.js](https://hono.dev/) - Framework web ultra-rapide
- [Cloudflare](https://www.cloudflare.com/) - Infrastructure edge
- [TailwindCSS](https://tailwindcss.com/) - Framework CSS
- [FontAwesome](https://fontawesome.com/) - Icônes

---

**Made with ❤️ in Côte d'Ivoire 🇨🇮**

*Révolutionnons ensemble la gestion immobilière en Afrique !*
