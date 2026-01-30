// Types pour le système de notifications

export type NotificationType = 'new_follower' | 'post_like' | 'post_comment';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string;
  postId: string | null;
  commentId: string | null;
  read: boolean;
  createdAt: string;
}

// Interface enrichie avec les détails de l'acteur (utilisateur qui a déclenché la notification)
export interface NotificationWithDetails extends Notification {
  actor: {
    uid: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
  };
  // Détails optionnels du post (pour post_like et post_comment)
  post?: {
    id: string;
    vinylId: string;
    content: string | null;
    vinyl: {
      id: string;
      title: string;
      artist: string;
      coverUrl: string | null;
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
userId: string;
  type: NotificationType;
  actorId: string;
  postId?: string;
  commentId?: string;
}