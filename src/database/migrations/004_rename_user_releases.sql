-- Migration: Renommer user_releases en user_vinyls
-- Fichier: src/database/migrations/006_rename_user_releases.sql

-- 1. Supprimer le trigger existant
DROP TRIGGER IF EXISTS on_vinyl_added_create_post ON user_releases;

-- 2. Renommer la table
ALTER TABLE user_releases RENAME TO user_vinyls;

-- 3. Renommer la contrainte unique
ALTER TABLE user_vinyls RENAME CONSTRAINT user_releases_user_id_release_id_type_key 
  TO user_vinyls_user_id_release_id_type_key;

-- 4. Renommer la contrainte primary key
ALTER TABLE user_vinyls RENAME CONSTRAINT user_releases_pkey 
  TO user_vinyls_pkey;

-- 5. Renommer les contraintes foreign key
ALTER TABLE user_vinyls RENAME CONSTRAINT user_releases_release_id_fkey 
  TO user_vinyls_release_id_fkey;

ALTER TABLE user_vinyls RENAME CONSTRAINT user_releases_user_id_fkey 
  TO user_vinyls_user_id_fkey;

-- 6. Renommer la contrainte check
ALTER TABLE user_vinyls RENAME CONSTRAINT user_releases_type_check 
  TO user_vinyls_type_check;

-- 7. Recréer le trigger avec le nouveau nom de table
CREATE TRIGGER on_vinyl_added_create_post
  AFTER INSERT ON user_vinyls
  FOR EACH ROW
  EXECUTE FUNCTION create_post_on_vinyl_add();