import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let app: App;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variables
 */
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    // Check if we're using service account JSON or individual env vars
    if (
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      // Option 2: Individual env vars (reuses NEXT_PUBLIC_FIREBASE_PROJECT_ID)
      app = initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    } else {
      throw new Error(
        'Firebase Admin credentials not found. Please set FIREBASE_SERVICE_ACCOUNT or individual credentials in .env'
      );
    }
  } else {
    app = getApps()[0];
  }

  return app;
}

/**
 * Get Firebase Admin Auth instance
 */
export function getAdminAuth() {
  if (!app) {
    initializeFirebaseAdmin();
  }
  return getAuth(app);
}

/**
 * Verify a Firebase ID token
 * @param token - The Firebase ID token to verify
 * @returns The decoded token or null if invalid
 */
export async function verifyIdToken(token: string) {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
}
