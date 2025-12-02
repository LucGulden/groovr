import ImageOptimized from './ImageOptimized';
import type { CollectionType, UserReleaseWithDetails } from '@/types/collection';

interface ProfileReleasesProps {
  loadingReleases: boolean;
  isOwnProfile: boolean;
  releases: UserReleaseWithDetails[];
  username: string;
  tab: CollectionType
}

export default function ProfileReleases({ loadingReleases, isOwnProfile, releases, username, tab }: ProfileReleasesProps) {
  const messages = {
    icon: {
      collection: '💿',
      wishlist: '⭐'
    },
    empty: {
      collection: 'Aucun vinyle pour le moment',
      wishlist: 'Wishlist vide'
    },
    add: {
      collection: 'Commencez à ajouter des vinyles à votre collection',
      wishlist: 'Ajoutez des vinyles que vous souhaitez acquérir'
    },
    userShouldAdd: {
      collection: 'n\'a pas encore ajouté de vinyles',
      wishlist: 'n\'a pas encore de wishlist'
    }
};

  return (
   <>
    {loadingReleases ? (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square w-full rounded-lg bg-[var(--background-lighter)]"></div>
            <div className="mt-3 h-4 rounded bg-[var(--background-lighter)]"></div>
            <div className="mt-2 h-3 w-2/3 rounded bg-[var(--background-lighter)]"></div>
          </div>
        ))}
      </div>
    ) : releases.length === 0 ? (
      <div className="py-16 text-center">
        <div className="mb-4 text-6xl">{messages.icon[tab]}</div>
        <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
          {messages.empty[tab]}
        </h3>
        <p className="text-[var(--foreground-muted)]">
          {isOwnProfile
            ? `${messages.add[tab]}`
            : `${username} ${messages.userShouldAdd[tab]}`}
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {releases.map((userRelease) => (
          <div key={userRelease.id} className="group relative overflow-hidden rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] transition-all hover:border-[var(--primary)] hover:shadow-lg hover:shadow-[var(--primary)]/20">
            {/* Pochette */}
            <div className="relative aspect-square w-full overflow-hidden bg-[var(--background)]">
              <ImageOptimized
                src={userRelease.release.coverUrl}
                alt={`${userRelease.release.title} par ${userRelease.release.artist}`}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>

            {/* Informations */}
            <div className="p-4">
              <h3 className="mb-1 line-clamp-1 font-semibold text-[var(--foreground)]" title={userRelease.release.title}>
                {userRelease.release.title}
              </h3>
              <p className="mb-1 line-clamp-1 text-sm text-[var(--foreground-muted)]" title={userRelease.release.artist}>
                {userRelease.release.artist}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">{userRelease.release.year}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </>
  );
}
