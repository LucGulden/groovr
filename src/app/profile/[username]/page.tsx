'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ProfileHeader from '@/components/ProfileHeader';
import { getUserByUsername } from '@/lib/user';
import { subscribeToUserCollection, subscribeToUserWishlist } from '@/lib/user-albums';
import { getFollowStats } from '@/lib/follows';
import type { User, ProfileStats } from '@/types/user';
import type { UserAlbumWithDetails } from '@/types/collection';
import Feed from '@/components/Feed';
import ProfileAlbums from '@/components/profileAlbums';

export default function ProfilePage() {
  const params = useParams();
  const { user: currentUser, loading: authLoading } = useAuth();

  const username = params.username as string;

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ albumsCount: 0, followersCount: 0, followingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'collection' | 'wishlist'>('feed');

  // Données de collection et wishlist
  const [collection, setCollection] = useState<UserAlbumWithDetails[]>([]);
  const [wishlist, setWishlist] = useState<UserAlbumWithDetails[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);

  // Charger l'utilisateur par username
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        // Récupérer l'utilisateur par username
        const user = await getUserByUsername(username);

        if (!user) {
          notFound();
          return;
        }

        setProfileUser(user);
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  // Charger collection et wishlist en real-time
  useEffect(() => {
    if (!profileUser) return;

    // Vérifier les permissions
    const isOwnProfile = currentUser?.uid === profileUser.uid;
    const canView = isOwnProfile || !profileUser.isPrivate;

    if (!canView) {
      console.log('[Profile] Profil privé, pas d\'accès aux albums');
      return;
    }

    setLoadingAlbums(true);
    console.log(`[Profile] Chargement des albums de ${profileUser.username}...`);

    // Subscribe à la collection
    const unsubscribeCollection = subscribeToUserCollection(
      profileUser.uid,
      (albums) => {
        console.log(`[Profile] Collection: ${albums.length} albums`);
        setCollection(albums);
        setLoadingAlbums(false);
      },
      (error) => {
        console.error('[Profile] Erreur collection:', error);
        setLoadingAlbums(false);
      }
    );

    // Subscribe à la wishlist
    const unsubscribeWishlist = subscribeToUserWishlist(
      profileUser.uid,
      (albums) => {
        console.log(`[Profile] Wishlist: ${albums.length} albums`);
        setWishlist(albums);
      },
      (error) => {
        console.error('[Profile] Erreur wishlist:', error);
      }
    );

    return () => {
      console.log('[Profile] Désabonnement des listeners');
      unsubscribeCollection();
      unsubscribeWishlist();
    };
  }, [profileUser, currentUser]);

  // Charger les stats de follow avec useCallback
  const loadFollowStats = useCallback(async () => {
    if (!profileUser) return;

    try {
      const followStats = await getFollowStats(profileUser.uid);
      setStats({
        albumsCount: collection.length,
        wishlistCount: wishlist.length,
        followersCount: followStats.followersCount,
        followingCount: followStats.followingCount,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des stats de follow:', error);
      setStats({
        albumsCount: collection.length,
        wishlistCount: wishlist.length,
        followersCount: 0,
        followingCount: 0,
      });
    }
  }, [profileUser, collection.length, wishlist.length]);

  // Calculer les stats réelles basées sur les albums et follows
  useEffect(() => {
    loadFollowStats();
  }, [loadFollowStats]);

  const handleFollowChange = () => {
    // Rafraîchir les stats après un follow/unfollow
    loadFollowStats();
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
      </div>
    );
  }

  if (!profileUser) {
    notFound();
    return null;
  }

  const isOwnProfile = currentUser?.uid === profileUser.uid;
  const canViewAlbums = isOwnProfile || !profileUser.isPrivate;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Profile Header */}
      <ProfileHeader
        user={profileUser}
        stats={stats}
        isOwnProfile={isOwnProfile}
        onFollowChange={handleFollowChange}
      />

      {/* Tabs */}
      <div className="border-b border-[var(--background-lighter)]">
        <div className="mx-auto max-w-5xl px-6 sm:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('feed')}
              className={`relative py-4 text-sm font-semibold transition-colors ${
                activeTab === 'feed'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Feed
              {activeTab === 'feed' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('collection')}
              className={`relative py-4 text-sm font-semibold transition-colors ${
                activeTab === 'collection'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Collection
              {activeTab === 'collection' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`relative py-4 text-sm font-semibold transition-colors ${
                activeTab === 'wishlist'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Wishlist
              {activeTab === 'wishlist' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
        {/* Profil privé */}
        {!canViewAlbums && (
          <div className="py-16 text-center">
            <div className="mb-4 text-6xl">🔒</div>
            <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
              Ce profil est privé
            </h3>
            <p className="text-[var(--foreground-muted)]">
              {profileUser.username} a un compte privé. Seuls ses amis peuvent voir sa collection.
            </p>
          </div>
        )}

        {/* Collection Tab */}
        {canViewAlbums && activeTab === 'feed' && (
          <>
            <Feed userId={profileUser.uid} profileFeed={true}/>
          </>
        )}

        {/* Collection Tab */}
        {canViewAlbums && activeTab === 'collection' && (
          <>
            <ProfileAlbums
              loadingAlbums={loadingAlbums}
              isOwnProfile={isOwnProfile}
              albums={collection}
              username={profileUser.username}
              tab='collection'
            />
          </>
        )}

        {/* Wishlist Tab */}
        {canViewAlbums && activeTab === 'wishlist' && (
          <>
            <ProfileAlbums
              loadingAlbums={loadingAlbums}
              isOwnProfile={isOwnProfile}
              albums={wishlist}
              username={profileUser.username}
              tab='wishlist'
            />
          </>
        )}
      </div>
    </div>
  );
}
