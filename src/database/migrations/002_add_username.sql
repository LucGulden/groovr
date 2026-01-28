-- Migration 002: Ajout du champ username
-- Description: Ajouter username à la table users et mettre à jour le trigger
-- Date: 2024-12-30

-- ============================================================================
-- 1. AJOUTER LE CHAMP USERNAME
-- ============================================================================

ALTER TABLE users ADD COLUMN username TEXT UNIQUE;

-- ============================================================================
-- 2. INDEX POUR OPTIMISER LES RECHERCHES PAR USERNAME
-- ============================================================================

CREATE INDEX idx_users_username ON users(username);

-- ============================================================================
-- 3. METTRE À JOUR LE TRIGGER POUR GÉRER LE USERNAME
-- ============================================================================

-- Supprimer l'ancien trigger et fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Nouvelle fonction qui récupère le username des metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (uid, email, username, created_at)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'username', -- Récupère username des metadata
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 4. AJOUTER UNE POLICY POUR LA RECHERCHE DE USERNAME
-- ============================================================================

-- Permettre la vérification de disponibilité du username
CREATE POLICY "users_username_check"
  ON users FOR SELECT
  USING (true); -- Tout le monde peut vérifier si un username existe

-- ============================================================================
-- FIN DE LA MIGRATION 002
-- ============================================================================