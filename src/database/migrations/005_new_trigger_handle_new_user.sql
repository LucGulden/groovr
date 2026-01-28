-- Migration 005: Fix du trigger handle_new_user
-- Date: 2025-12-31

-- Supprimer l'ancien trigger et fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Nouvelle fonction améliorée
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_username TEXT;
BEGIN
  -- Récupérer le username des metadata
  user_username := NEW.raw_user_meta_data->>'username';
  
  -- Si username est NULL ou vide, utiliser la partie avant @ de l'email
  IF user_username IS NULL OR user_username = '' THEN
    user_username := SPLIT_PART(NEW.email, '@', 1);
  END IF;

  -- Insérer dans la table users
  INSERT INTO public.users (uid, email, username, created_at)
  VALUES (
    NEW.id, 
    NEW.email,
    user_username,
    NOW()
  )
  ON CONFLICT (uid) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Logger l'erreur dans les logs Supabase
    RAISE LOG 'Error creating user profile for %: %', NEW.email, SQLERRM;
    -- Ne pas bloquer la création de l'utilisateur dans auth.users
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Migration 005: Fix de la policy INSERT pour la table users
-- Description: Permettre au trigger de créer des profils utilisateurs
-- Date: 2025-12-31

-- ============================================================================
-- POLICY INSERT POUR LA TABLE USERS
-- ============================================================================

-- Permettre l'insertion de nouveaux profils utilisateurs
-- Cette policy permet au trigger handle_new_user() de créer des profils
CREATE POLICY "users_insert_new"
  ON users FOR INSERT
  WITH CHECK (
    -- Autoriser l'insertion si l'uid correspond à l'utilisateur authentifié
    auth.uid() = uid
  );

-- ============================================================================
-- FIN DE LA MIGRATION 005
-- ============================================================================