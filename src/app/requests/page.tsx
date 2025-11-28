'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import Button from '@/components/Button';
import { getPendingRequests, acceptFollowRequest, rejectFollowRequest } from '@/lib/follows';
import type { Follow } from '@/types/follows';
import type { User } from '@/types/user';

export default function RequestsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [requests, setRequests] = useState<(Follow & { user: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const pendingRequests = await getPendingRequests(user.uid);
      setRequests(pendingRequests);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadRequests();
    }
  }, [user, authLoading, router, loadRequests]);

  const handleAccept = async (request: Follow & { user: User }) => {
    if (!user) return;

    try {
      setActionLoading(request.id);
      await acceptFollowRequest(request.followerId, user.uid);
      // Retirer de la liste
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
      alert('Impossible d\'accepter cette demande');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (request: Follow & { user: User }) => {
    if (!user) return;

    try {
      setActionLoading(request.id);
      await rejectFollowRequest(request.followerId, user.uid);
      // Retirer de la liste
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error) {
      console.error('Erreur lors du refus:', error);
      alert('Impossible de refuser cette demande');
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            {`Demandes d'abonnement`}
          </h1>
          <p className="mt-2 text-[var(--foreground-muted)]">
            {requests.length} {requests.length === 1 ? 'demande en attente' : 'demandes en attente'}
          </p>
        </div>

        {/* Liste des demandes */}
        {requests.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 text-6xl">✉️</div>
            <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
              Aucune demande en attente
            </h3>
            <p className="text-[var(--foreground-muted)]">
              {`Vous n'avez pas de demandes d'abonnement pour le moment`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] p-4"
              >
                <Link
                  href={`/profile/${request.user.username}`}
                  className="flex flex-1 items-center gap-3"
                >
                  {/* Avatar */}
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-[var(--background-lighter)]">
                    {request.user.photoURL ? (
                      <Image
                        src={request.user.photoURL}
                        alt={request.user.username}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[var(--foreground-muted)]">
                        {request.user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Infos utilisateur */}
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate font-semibold text-[var(--foreground)]">
                      {request.user.username}
                    </p>
                    <p className="truncate text-sm text-[var(--foreground-muted)]">
                      @{request.user.username}
                    </p>
                  </div>
                </Link>

                {/* Boutons */}
                <div className="ml-3 flex gap-2">
                  <Button
                    onClick={() => handleAccept(request)}
                    loading={actionLoading === request.id}
                    disabled={actionLoading !== null}
                    variant="primary"
                    className="px-4 py-2 text-sm"
                  >
                    Accepter
                  </Button>
                  <Button
                    onClick={() => handleReject(request)}
                    loading={actionLoading === request.id}
                    disabled={actionLoading !== null}
                    variant="outline"
                    className="border-red-500/30 px-4 py-2 text-sm text-red-500 hover:border-red-500 hover:bg-red-500/10"
                  >
                    Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
