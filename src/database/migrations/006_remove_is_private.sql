-- Migration: Retirer le champ is_private de la table users
-- Date: 2025-01-04
-- Description: Simplification du système - suppression des profils privés

-- ÉTAPE 1 : Supprimer les policies qui dépendent de is_private

-- Policies sur la table users
DROP POLICY IF EXISTS users_public_read ON users;
DROP POLICY IF EXISTS users_private_read_own ON users;
DROP POLICY IF EXISTS users_private_read_followers ON users;

-- Policies sur la table user_vinyls
DROP POLICY IF EXISTS user_releases_public_read ON user_vinyls;
DROP POLICY IF EXISTS user_releases_followers_read ON user_vinyls;

-- ÉTAPE 2 : Supprimer la colonne is_private
ALTER TABLE users DROP COLUMN IF EXISTS is_private;

-- ÉTAPE 3 : Recréer des policies simplifiées (sans is_private)

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS user_vinyls_public_read ON user_vinyls;

-- Policy users : Lecture publique pour tous les profils
CREATE POLICY "users_public_read"
  ON users FOR SELECT
  USING (true);

-- Policy users : Mise à jour de son propre profil
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = uid)
  WITH CHECK (auth.uid() = uid);

-- Policy user_vinyls : Lecture publique de toutes les collections/wishlists
CREATE POLICY "user_vinyls_public_read"
  ON user_vinyls FOR SELECT
  USING (true);

-- Note: Les fonctions dans follows.ts qui vérifient requiresApproval devront être mises à jour
-- pour toujours passer requiresApproval = false