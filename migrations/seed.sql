-- LokoManager - Données de test pour développement
-- ⚠️ NE PAS EXÉCUTER EN PRODUCTION ⚠️

-- ============================================================================
-- OWNER TEST (Mot de passe: 'password123' - hash bcrypt)
-- ============================================================================
INSERT OR IGNORE INTO owners (id, email, password_hash, full_name, phone, subscription_tier, subscription_expires_at)
VALUES (
  1,
  'demo@lokomanager.app',
  '$2a$10$rO5N4.wHKGCJqBdQbWRNPOKjzx7qvUwCQVGZfpZ6KrU5d5lZ2O5Gy', -- password123
  'Amadou Koné',
  '+225 07 08 09 10 11',
  'pro',
  datetime('now', '+1 year')
);

-- ============================================================================
-- PROPERTIES TEST
-- ============================================================================
INSERT OR IGNORE INTO properties (owner_id, name, address, city, neighborhood, property_type, status, total_units, monthly_rent, description)
VALUES 
  (1, 'Villa Cocody Riviera', '123 Bd de la Paix', 'Abidjan', 'Cocody', 'villa', 'occupied', 1, 300000, 'Belle villa moderne avec jardin, 4 chambres, piscine'),
  (1, 'Appartement Marcory Zone 4', '45 Rue des Jardins', 'Abidjan', 'Marcory', 'appartement', 'occupied', 1, 150000, 'Appartement 3 pièces, 2ème étage, parking'),
  (1, 'Studio Yopougon', '78 Avenue Gbagbo', 'Abidjan', 'Yopougon', 'studio', 'vacant', 1, 80000, 'Studio moderne, climatisé, cuisine équipée'),
  (1, 'Immeuble Plateau', '12 Rue du Commerce', 'Abidjan', 'Plateau', 'bureau', 'occupied', 5, 500000, 'Immeuble de bureaux, 5 étages, parking, ascenseur');

-- ============================================================================
-- TENANTS TEST
-- ============================================================================
INSERT OR IGNORE INTO tenants (owner_id, property_id, full_name, phone, email, id_card_number, move_in_date, monthly_rent, deposit_amount, status)
VALUES 
  (1, 1, 'Fatoumata Diallo', '+225 05 04 03 02 01', 'fdiallo@email.com', 'CI123456', '2024-01-15', 300000, 600000, 'active'),
  (1, 2, 'Ibrahim Touré', '+225 07 11 22 33 44', 'itoure@email.com', 'CI789012', '2024-06-01', 150000, 300000, 'active'),
  (1, 4, 'Société InfoTech SARL', '+225 27 22 33 44 55', 'contact@infotech.ci', 'RC987654', '2023-12-01', 500000, 1000000, 'active');

-- ============================================================================
-- RENT PAYMENTS TEST (historique + futurs)
-- ============================================================================
-- Paiements passés (complétés)
INSERT OR IGNORE INTO rent_payments (owner_id, tenant_id, property_id, amount, payment_date, due_date, payment_method, transaction_id, status)
VALUES 
  (1, 1, 1, 300000, '2024-11-05', '2024-11-05', 'orange_money', 'OM2024110512345', 'completed'),
  (1, 1, 1, 300000, '2024-12-03', '2024-12-05', 'orange_money', 'OM2024120312346', 'completed'),
  (1, 2, 2, 150000, '2024-11-04', '2024-11-05', 'mtn_money', 'MTN2024110412347', 'completed'),
  (1, 2, 2, 150000, '2024-12-05', '2024-12-05', 'cash', NULL, 'completed'),
  (1, 3, 4, 500000, '2024-11-30', '2024-12-01', 'bank_transfer', 'BANK2024113012348', 'completed');

-- Paiements en cours (à venir)
INSERT OR IGNORE INTO rent_payments (owner_id, tenant_id, property_id, amount, payment_date, due_date, status)
VALUES 
  (1, 1, 1, 300000, NULL, date('now', '+3 days'), 'pending'),
  (1, 2, 2, 150000, NULL, date('now', '+5 days'), 'pending'),
  (1, 3, 4, 500000, NULL, date('now', '-2 days'), 'late'); -- En retard!

-- ============================================================================
-- NOTIFICATIONS TEST
-- ============================================================================
INSERT OR IGNORE INTO notifications (owner_id, tenant_id, type, channel, recipient_phone, message, scheduled_at, status)
VALUES 
  (1, 1, 'rent_reminder', 'sms', '+225 05 04 03 02 01', 'Bonjour Fatoumata, rappel : votre loyer de 300000 FCFA est dû dans 3 jours.', datetime('now', '+3 days', '-5 hours'), 'pending'),
  (1, 2, 'rent_reminder', 'sms', '+225 07 11 22 33 44', 'Bonjour Ibrahim, rappel : votre loyer de 150000 FCFA est dû dans 5 jours.', datetime('now', '+5 days', '-5 hours'), 'pending');

-- ============================================================================
-- EXPENSES TEST
-- ============================================================================
INSERT OR IGNORE INTO expenses (owner_id, property_id, category, amount, expense_date, description, paid_to)
VALUES 
  (1, 1, 'maintenance', 50000, '2024-11-15', 'Réparation climatisation', 'Froid Service CI'),
  (1, 2, 'utilities', 25000, '2024-12-01', 'Facture eau décembre', 'SODECI'),
  (1, 4, 'insurance', 120000, '2024-01-05', 'Assurance annuelle immeuble', 'NSIA Assurances'),
  (1, 1, 'repairs', 75000, '2024-10-20', 'Réparation fuite toiture', 'Toiture Pro');

-- ============================================================================
-- SERVICE PROVIDERS TEST
-- ============================================================================
INSERT OR IGNORE INTO service_providers (owner_id, name, phone, specialty, rating, notes)
VALUES 
  (1, 'Froid Service CI', '+225 27 20 30 40 50', 'Climatisation', 5, 'Très professionnel, rapide'),
  (1, 'Toiture Pro', '+225 05 60 70 80 90', 'Couverture/Toiture', 4, 'Bon travail, un peu cher'),
  (1, 'Electricité Plus', '+225 07 22 33 44 55', 'Electricité', 5, 'Excellent électricien, recommandé'),
  (1, 'Plomberie Express', '+225 01 23 45 67 89', 'Plomberie', 3, 'Correct, parfois en retard');
