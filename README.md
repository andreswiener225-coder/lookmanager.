# 🏠 LookManager - Gestion Locative Intelligente pour l'Afrique

**Plateforme SaaS PropTech** pour simplifier la gestion immobilière en Côte d'Ivoire et Afrique francophone.

**Développé par** : BioBuild Innov | **Fondateur** : Kinaya Hintan Ignace Parfait

---

## 🌐 URLs d'Accès

### Production
- **Application**: https://lookmanager.pages.dev
- **API Health**: https://lookmanager.pages.dev/api/health
- **Portail Locataire**: https://lookmanager.pages.dev/static/tenant-login.html

### Compte Admin (Production)
```
Email: admin@biobuildinnov.com
Password: BioBuild2025@Admin
Tier: Enterprise (toutes fonctionnalités)
```

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

### ✅ Gestion Dépenses
- Catégories: Maintenance, Taxes, Assurance, Services, Réparations
- Filtres par date, catégorie, propriété
- Statistiques et graphiques

### ✅ Prestataires de Services
- Carnet d'adresses artisans
- Spécialités: Plomberie, Électricité, Peinture, Menuiserie, etc.
- Système de notation (1-5 étoiles)
- Appel direct intégré

### ✅ Dashboard Statistiques
- Revenus temps réel
- Taux d'occupation
- Paiements en retard
- Notifications intelligentes

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
- **Chart.js** - Graphiques interactifs
- **Font Awesome** - Icônes

### Paiements
- **CinetPay API** - Mobile Money Côte d'Ivoire
- **Webhooks** - Notifications temps réel

### PWA
- **manifest.json** - Installation mobile
- **Meta tags** - Optimisé mobile

---

## 📦 Installation Locale

### Prérequis
- Node.js 18+
- npm ou pnpm
- Compte Cloudflare (gratuit)

### Étapes

```bash
# 1. Cloner le projet
git clone https://github.com/andreswiener225-coder/lookmanager.git
cd lookmanager

# 2. Installer dépendances
npm install

# 3. Appliquer migrations locales
npx wrangler d1 migrations apply lookmanager-production --local

# 4. Build
npm run build

# 5. Démarrer en local
pm2 start ecosystem.config.cjs

# 6. Accéder à l'application
open http://localhost:3000
```

---

## 📊 Structure Base de Données

### Tables Principales
- `owners` - Propriétaires
- `properties` - Biens immobiliers
- `tenants` - Locataires
- `rent_payments` - Paiements de loyer
- `expenses` - Dépenses
- `service_providers` - Prestataires
- `owner_payment_methods` - Comptes propriétaires
- `tenant_payment_methods` - Moyens paiement locataires
- `cinetpay_transactions` - Transactions CinetPay
- `payment_receipts` - Reçus PDF

---

## 📚 API Documentation

### Authentication
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/auth/register` | POST | Inscription propriétaire |
| `/api/auth/login` | POST | Connexion propriétaire |
| `/api/auth/me` | GET | Profil utilisateur |
| `/api/tenant/login` | POST | Connexion locataire (PIN) |

### Properties
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/properties` | GET | Liste des propriétés |
| `/api/properties` | POST | Créer propriété |
| `/api/properties/:id` | GET | Détails propriété |
| `/api/properties/:id` | PUT | Modifier propriété |
| `/api/properties/:id` | DELETE | Supprimer propriété |

### Tenants
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/tenants` | GET | Liste des locataires |
| `/api/tenants` | POST | Créer locataire |
| `/api/tenants/:id` | GET | Détails locataire |
| `/api/tenants/:id` | PUT | Modifier locataire |
| `/api/tenants/:id` | DELETE | Supprimer locataire |

### Payments
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/payments` | GET | Historique paiements |
| `/api/payments/pending` | GET | Paiements en attente |
| `/api/payments/upcoming` | GET | Paiements à venir |
| `/api/payments` | POST | Enregistrer paiement |
| `/api/payments/:id` | PUT | Modifier paiement |

### Dashboard
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/dashboard` | GET | Statistiques globales |
| `/api/dashboard/revenue` | GET | Revenus mensuels |
| `/api/dashboard/occupancy` | GET | Taux d'occupation |
| `/api/dashboard/expenses` | GET | Résumé dépenses |

### CinetPay
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/cinetpay/tenant/init-payment` | POST | Initialiser paiement |
| `/api/cinetpay/tenant/check-payment/:id` | GET | Vérifier statut |
| `/api/cinetpay/webhook` | POST | Webhook callback |

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

## 💰 Business Model

| Plan | Prix (FCFA/mois) | Biens | Locataires |
|------|------------------|-------|------------|
| Gratuit | 0 | 1 | 1 |
| Starter | 50 000 | 10 | 50 |
| Pro | 100 000 | 50 | 200 |
| Enterprise | 200 000 | Illimité | Illimité |

---

## 🛣️ Roadmap

### Version 2.0 (Q1 2025)
- [ ] Alertes automatiques SMS (Twilio)
- [ ] Export données (Excel, CSV)
- [ ] Application mobile (React Native)

### Version 3.0 (Q2 2025)
- [ ] Multi-devises (FCFA, EUR, USD)
- [ ] Multi-langues (Français, Anglais)
- [ ] Intelligence artificielle (prédiction retards)
- [ ] Intégration comptabilité

---

## 🐛 Support

- **GitHub Issues**: [github.com/andreswiener225-coder/lookmanager/issues](https://github.com/andreswiener225-coder/lookmanager./issues)
- **Email**: contact@biobuildinnov.com
- **Website**: [www.biobuildinnov.com](https://www.biobuildinnov.com)

---

## 📄 Licence

Propriétaire - BioBuild Innov © 2025

---

## 👨‍💻 Auteur

**Kinaya Hintan Ignace Parfait**
- Fondateur BioBuild Innov
- Entrepreneur PropTech
- Étudiant en Administration Publique - Université de Tokat
- Côte d'Ivoire 🇨🇮

---

## 🙏 Remerciements

- Cloudflare Workers Team
- CinetPay Team
- Communauté Hono.js
- Développeurs PropTech Afrique

---

**Fait avec ❤️ pour l'Afrique par BioBuild Innov**
