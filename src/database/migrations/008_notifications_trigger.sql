-- Migration: Triggers automatiques pour les notifications
-- Date: 2025-01-04
-- Description: Création automatique de notifications pour follows, likes et commentaires

-- ============================================================================
-- TRIGGER 1 : Notification quand quelqu'un te suit (new_follower)
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne pas notifier si quelqu'un se suit soi-même (ne devrait pas arriver mais sécurité)
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;

  -- Créer une notification pour la personne suivie
  INSERT INTO notifications (user_id, type, actor_id)
  VALUES (NEW.following_id, 'new_follower', NEW.follower_id)
  ON CONFLICT (user_id, type, actor_id, post_id, comment_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table follows
DROP TRIGGER IF EXISTS trigger_new_follower ON follows;
CREATE TRIGGER trigger_new_follower
  AFTER INSERT ON follows
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION notify_new_follower();

-- ============================================================================
-- TRIGGER 2 : Notification quand quelqu'un like ton post (post_like)
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  -- Récupérer l'auteur du post
  SELECT user_id INTO post_author_id
  FROM posts
  WHERE id = NEW.post_id;

  -- Ne pas notifier si on like son propre post
  IF NEW.user_id = post_author_id THEN
    RETURN NEW;
  END IF;

  -- Créer une notification pour l'auteur du post
  INSERT INTO notifications (user_id, type, actor_id, post_id)
  VALUES (post_author_id, 'post_like', NEW.user_id, NEW.post_id)
  ON CONFLICT (user_id, type, actor_id, post_id, comment_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table post_likes
DROP TRIGGER IF EXISTS trigger_post_like ON post_likes;
CREATE TRIGGER trigger_post_like
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_like();

-- ============================================================================
-- TRIGGER 3 : Notification quand quelqu'un commente ton post (post_comment)
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  -- Récupérer l'auteur du post
  SELECT user_id INTO post_author_id
  FROM posts
  WHERE id = NEW.post_id;

  -- Ne pas notifier si on commente son propre post
  IF NEW.user_id = post_author_id THEN
    RETURN NEW;
  END IF;

  -- Créer une notification pour l'auteur du post
  INSERT INTO notifications (user_id, type, actor_id, post_id, comment_id)
  VALUES (post_author_id, 'post_comment', NEW.user_id, NEW.post_id, NEW.id)
  ON CONFLICT (user_id, type, actor_id, post_id, comment_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table comments
DROP TRIGGER IF EXISTS trigger_post_comment ON comments;
CREATE TRIGGER trigger_post_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_comment();

-- ============================================================================
-- TRIGGERS DE SUPPRESSION : Supprimer les notifications quand l'action est annulée
-- ============================================================================

-- Supprimer la notification quand quelqu'un unfollow
CREATE OR REPLACE FUNCTION delete_follower_notification()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM notifications
  WHERE user_id = OLD.following_id
    AND type = 'new_follower'
    AND actor_id = OLD.follower_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_delete_follower_notification ON follows;
CREATE TRIGGER trigger_delete_follower_notification
  AFTER DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION delete_follower_notification();

-- Supprimer la notification quand quelqu'un unlike
CREATE OR REPLACE FUNCTION delete_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM notifications
  WHERE type = 'post_like'
    AND actor_id = OLD.user_id
    AND post_id = OLD.post_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_delete_like_notification ON post_likes;
CREATE TRIGGER trigger_delete_like_notification
  AFTER DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION delete_like_notification();

-- Supprimer la notification quand quelqu'un supprime son commentaire
CREATE OR REPLACE FUNCTION delete_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM notifications
  WHERE type = 'post_comment'
    AND comment_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_delete_comment_notification ON comments;
CREATE TRIGGER trigger_delete_comment_notification
  AFTER DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION delete_comment_notification();

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON FUNCTION notify_new_follower() IS 'Crée une notification quand quelqu''un suit un utilisateur';
COMMENT ON FUNCTION notify_post_like() IS 'Crée une notification quand quelqu''un like un post';
COMMENT ON FUNCTION notify_post_comment() IS 'Crée une notification quand quelqu''un commente un post';
COMMENT ON FUNCTION delete_follower_notification() IS 'Supprime la notification quand quelqu''un unfollow';
COMMENT ON FUNCTION delete_like_notification() IS 'Supprime la notification quand quelqu''un unlike';
COMMENT ON FUNCTION delete_comment_notification() IS 'Supprime la notification quand un commentaire est supprimé';