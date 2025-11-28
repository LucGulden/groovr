import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';

/**
 * Middleware pour la protection des routes
 *
 * Routes publiques : /, /login, /signup
 * Routes protégées : /feed, /collection, /wishlist, /profil/*
 *
 * Ce middleware vérifie l'authentification côté serveur en validant
 * le token Firebase stocké dans un cookie HTTP-only sécurisé.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/feed', '/collection', '/wishlist', '/profil'];

  // Récupère le token depuis le cookie
  const token = request.cookies.get('token')?.value;

  // Vérifie si la route est protégée
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  // Vérifie si c'est une route d'authentification
  const isAuthRoute = ['/', '/login', '/signup'].includes(pathname);

  // Si on a un token, on le vérifie
  let isValidToken = false;
  if (token) {
    const decodedToken = await verifyIdToken(token);
    isValidToken = decodedToken !== null;
  }

  // Redirection vers login si route protégée et pas de token valide
  if (isProtected && !isValidToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirection vers /feed si utilisateur déjà connecté visite /, /login ou /signup
  if (isAuthRoute && isValidToken) {
    const feedUrl = new URL('/feed', request.url);
    return NextResponse.redirect(feedUrl);
  }

  return NextResponse.next();
}

/**
 * Configuration du matcher pour les routes à traiter
 */
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - api (API routes)
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (favicon)
     * - Fichiers publics (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
