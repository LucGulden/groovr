import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProfileHeader from '../components/ProfileHeader';
import ProfileVinyls from '../components/ProfileVinyls';
import Feed from '../components/Feed';
import { supabase } from '../supabaseClient';
import { getFollowStats } from '../lib/follows';
import { getVinylStats } from '../lib/vinyls';
import { type User } from '../types/user';
import AddVinylModal from '../components/AddVinylModal';

interface ProfileStats {
  releasesCount: number;
  wishlistCount: number;
  followersCount: number;
  followingCount: number;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, loading: authLoading } = useAuth();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    releasesCount: 0,
    wishlistCount: 0,
    followersCount: 0,
    followingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'collection' | 'wishlist'>('collection');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {  // ← Changé
        setNotFound(true);
        return;
      }

      try {
        setLoading(true);

        // Récupérer l'utilisateur par username
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)  // ← Changé
          .single();

        if (error || !data) {
          console.error('Erreur lors du chargement du profil:', error);
          setNotFound(true);
          return;
        }

        setProfileUser(data);
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  // Charger les stats
  useEffect(() => {
    const loadStats = async () => {
      if (!profileUser) return;

      try {
        // Récupérer les stats de vinyles
        const vinylStats = await getVinylStats(profileUser.uid);
        
        // Récupérer les stats de follow
        const followStats = await getFollowStats(profileUser.uid);

        setStats({
          releasesCount: vinylStats.collectionCount,
          wishlistCount: vinylStats.wishlistCount,
          followersCount: followStats.followersCount,
          followingCount: followStats.followingCount,
        });
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error);
      }
    };

    loadStats();
  }, [profileUser]);

  // Callback pour rafraîchir les stats après un follow/unfollow
  const handleFollowChange = async () => {
    if (!profileUser) return;

    try {
      const followStats = await getFollowStats(profileUser.uid);
      setStats((prev) => ({
        ...prev,
        followersCount: followStats.followersCount,
        followingCount: followStats.followingCount,
      }));
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des stats:', error);
    }
  };

  // Fonction pour ouvrir le modal depuis ProfileVinyls
const handleOpenAddVinyl = () => {
  setIsModalOpen(true);
};

// Callback après succès du modal
const handleModalSuccess = async () => {
  setIsModalOpen(false);
  
  // Rafraîchir les stats
  if (profileUser) {
    try {
      const vinylStats = await getVinylStats(profileUser.uid);
      setStats((prev) => ({
        ...prev,
        releasesCount: vinylStats.collectionCount,
        wishlistCount: vinylStats.wishlistCount,
      }));
      
      // Émettre un event pour que ProfileVinyls se rafraîchisse
      window.dispatchEvent(new Event('vinyl-added'));
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des stats:', error);
    }
  }
};

  // Rediriger vers 404 si profil non trouvé
  if (notFound) {
    return <Navigate to="/404" replace />;
  }

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
      </div>
    );
  }

  if (!profileUser) {
    return null;
  }

  const isOwnProfile = currentUser?.id === profileUser.uid;

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
        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <Feed userId={profileUser.uid} profileFeed={true} />
        )}

        {/* Collection Tab */}
        {activeTab === 'collection' && (
          <ProfileVinyls
            userId={profileUser.uid}
            type="collection"
            isOwnProfile={isOwnProfile}
            username={profileUser.username}
            onOpenAddVinyl={handleOpenAddVinyl}
          />
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <ProfileVinyls
            userId={profileUser.uid}
            type="wishlist"
            isOwnProfile={isOwnProfile}
            username={profileUser.username}
            onOpenAddVinyl={handleOpenAddVinyl}
          />
        )}
      </div>

      {/* Modal d'ajout de vinyle */}
      {isOwnProfile && (
        <AddVinylModal
          key={isModalOpen ? 'modal-open' : 'modal-closed'}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          userId={currentUser!.id}
          targetType={activeTab === 'wishlist' ? 'wishlist' : 'collection'}
        />
      )}
    </div>
  );
}