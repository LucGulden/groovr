-- Activer Realtime pour la table notifications
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Publier les changements de la table notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;