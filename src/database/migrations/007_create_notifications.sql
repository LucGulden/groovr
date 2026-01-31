-- Migration: Créer le système de notifications
-- Date: 2025-01-04
-- Description: Table notifications avec types new_follower, post_like, post_comment

-- Créer le type enum pour les types de notifications
CREATE TYPE notification_type AS ENUM ('new_follower', 'post_like', 'post_comment');

-- Créer la table notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  type notification_type NOT NULL,
  actor_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes de cohérence
  CONSTRAINT valid_post_notification CHECK (
    (type IN ('post_like', 'post_comment') AND post_id IS NOT NULL) OR
    (type = 'new_follower' AND post_id IS NULL)
  ),
  CONSTRAINT valid_comment_notification CHECK (
    (type = 'post_comment' AND comment_id IS NOT NULL) OR
    (type != 'post_comment' AND comment_id IS NULL)
  ),
  -- Éviter les doublons (même acteur, même type, même post dans un délai court)
  CONSTRAINT unique_notification UNIQUE (user_id, type, actor_id, post_id, comment_id)
);

-- Index pour les performances
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_actor_id ON notifications(actor_id);

-- RLS: Activer Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir uniquement leurs propres notifications
CREATE POLICY "users_select_own_notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour uniquement leurs propres notifications (marquer comme lu)
CREATE POLICY "users_update_own_notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Tout utilisateur authentifié peut créer des notifications (via triggers)
CREATE POLICY "authenticated_insert_notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "users_delete_own_notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Fonction pour nettoyer les anciennes notifications (30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour documentation
COMMENT ON TABLE notifications IS 'Système de notifications pour les interactions sociales';
COMMENT ON COLUMN notifications.type IS 'Type de notification: new_follower, post_like, post_comment';
COMMENT ON COLUMN notifications.actor_id IS 'Utilisateur qui a déclenché la notification';
COMMENT ON COLUMN notifications.user_id IS 'Utilisateur qui reçoit la notification';