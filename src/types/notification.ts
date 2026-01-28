// Types pour le système de notifications

export type NotificationType = 'new_follower' | 'post_like' | 'post_comment';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id: string;
  post_id: string | null;
  comment_id: string | null;
  read: boolean;
  created_at: string;
}

// Interface enrichie avec les détails de l'acteur (utilisateur qui a déclenché la notification)
export interface NotificationWithDetails extends Notification {
  actor: {
    uid: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
  };
  // Détails optionnels du post (pour post_like et post_comment)
  post?: {
    id: string;
    vinyl_id: string;
    content: string | null;
    vinyl: {
      id: string;
      title: string;
      artist: string;
      cover_url: string | null;
    };
  };
  // Détails optionnels du commentaire (pour post_comment)
  comment?: {
    id: string;
    content: string;
  };
}

// Type pour la création d'une notification
export interface CreateNotificationParams {
  user_id: string;
  type: NotificationType;
  actor_id: string;
  post_id?: string;
  comment_id?: string;
}