'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { User } from '@/types/user';
import FollowButton from './FollowButton';

interface UserCardProps {
  user: User;
  showFollowButton?: boolean;
  onFollowChange?: () => void;
}

export default function UserCard({
  user,
  showFollowButton = false,
  onFollowChange,
}: UserCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] p-4 transition-colors hover:bg-[var(--background-lighter)]">
      <Link
        href={`/profile/${user.username}`}
        className="flex flex-1 items-center gap-3"
      >
        {/* Avatar */}
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-[var(--background-lighter)]">
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.username}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[var(--foreground-muted)]">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Infos utilisateur */}
        <div className="flex-1 overflow-hidden">
          <p className="truncate font-semibold text-[var(--foreground)]">
            {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.username}
          </p>
          <p className="truncate text-sm text-[var(--foreground-muted)]">
            @{user.username}
          </p>
        </div>
      </Link>

      {/* Bouton Follow (optionnel) */}
      {showFollowButton && (
        <div className="ml-3 flex-shrink-0">
          <FollowButton
            targetUserId={user.uid}
            onFollowChange={onFollowChange}
          />
        </div>
      )}
    </div>
  );
}
