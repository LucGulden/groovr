-- Migration 003: Système de posts, likes et commentaires
-- Description: Ajouter les tables pour le feed social
-- Date: 2024-12-30

-- ============================================================================
-- 1. TABLE POSTS
-- ============================================================================
-- Posts du feed social (ajout à la collection ou wishlist)
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
  vinyl_id UUID REFERENCES vinyls(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('collection_add', 'wishlist_add')),
  content TEXT, -- Commentaire optionnel de l'utilisateur
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. TABLE POST_LIKES
-- ============================================================================
-- Likes sur les posts
CREATE TABLE post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id) -- Un utilisateur ne peut liker qu'une fois
);

-- ============================================================================
-- 3. TABLE COMMENTS
-- ============================================================================
-- Commentaires sur les posts
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEX POUR OPTIMISATION DES PERFORMANCES
-- ============================================================================

-- Posts
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_vinyl_id ON posts(vinyl_id);
CREATE INDEX idx_posts_type ON posts(type);

-- Post Likes
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

-- Comments
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at ASC);

-- ============================================================================
-- VUES POUR FACILITER LES REQUÊTES
-- ============================================================================

-- Vue pour récupérer les posts avec le nombre de likes et commentaires
CREATE OR REPLACE VIEW posts_with_stats AS
SELECT 
  p.id,
  p.user_id,
  p.vinyl_id,
  p.type,
  p.content,
  p.created_at,
  COUNT(DISTINCT pl.id) as likes_count,
  COUNT(DISTINCT c.id) as comments_count
FROM posts p
LEFT JOIN post_likes pl ON p.id = pl.post_id
LEFT JOIN comments c ON p.id = c.post_id
GROUP BY p.id;

-- ============================================================================
-- TRIGGER POUR CRÉER AUTOMATIQUEMENT UN POST
-- ============================================================================

-- Fonction pour créer un post quand un vinyle est ajouté
CREATE OR REPLACE FUNCTION create_post_on_vinyl_add()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer un post uniquement si c'est un ajout (pas une modification)
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO posts (user_id, vinyl_id, type)
    VALUES (
      NEW.user_id,
      NEW.release_id,
      CASE 
        WHEN NEW.type = 'collection' THEN 'collection_add'
        WHEN NEW.type = 'wishlist' THEN 'wishlist_add'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur user_releases pour créer automatiquement les posts
CREATE TRIGGER on_vinyl_added_create_post
  AFTER INSERT ON user_releases
  FOR EACH ROW
  EXECUTE FUNCTION create_post_on_vinyl_add();

-- ============================================================================
-- POLICIES RLS (Row Level Security)
-- ============================================================================

-- Activer RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policies pour POSTS
CREATE POLICY "posts_public_read"
  ON posts FOR SELECT
  USING (true); -- Tout le monde peut voir les posts publics

CREATE POLICY "posts_owner_insert"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_owner_delete"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour POST_LIKES
CREATE POLICY "post_likes_public_read"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "post_likes_owner_insert"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_likes_owner_delete"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour COMMENTS
CREATE POLICY "comments_public_read"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "comments_owner_insert"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_owner_update"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_owner_delete"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. Un post est créé automatiquement quand un vinyle est ajouté via le trigger
-- 2. Les posts contiennent une référence au vinyle (vinyl_id) pour récupérer les détails
-- 3. La vue posts_with_stats permet de récupérer facilement le nombre de likes/comments
-- 4. RLS est activé : seul le propriétaire peut supprimer ses posts/likes/comments
-- 
-- ============================================================================
-- FIN DE LA MIGRATION 003
-- ============================================================================