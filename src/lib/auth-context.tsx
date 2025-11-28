'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile, getUserByUid, isUsernameAvailable } from './user';
import type { User, SignUpData, SignInData, AuthError } from '@/types/user';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: AuthError | null;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (data: SignInData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Traduit les erreurs Firebase en français
 */
function translateFirebaseError(code: string): string {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Cette adresse email est déjà utilisée',
    'auth/invalid-email': 'Adresse email invalide',
    'auth/operation-not-allowed': 'Opération non autorisée',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères',
    'auth/user-disabled': 'Ce compte a été désactivé',
    'auth/user-not-found': 'Aucun compte trouvé avec cette adresse email',
    'auth/wrong-password': 'Mot de passe incorrect',
    'auth/invalid-credential': 'Identifiants invalides',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard',
    'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion',
    'auth/popup-closed-by-user': 'Connexion annulée',
    'auth/cancelled-popup-request': 'Connexion annulée',
  };

  return errorMessages[code] || 'Une erreur est survenue. Réessayez plus tard';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Écoute les changements d'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Récupérer le profil utilisateur depuis Firestore
          const userProfile = await getUserByUid(firebaseUser.uid);

          if (userProfile) {
            setUser(userProfile);
            setFirebaseUser(firebaseUser);

            // Créer la session côté serveur
            try {
              const idToken = await firebaseUser.getIdToken();
              await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
              });
            } catch (sessionError) {
              console.error('Erreur lors de la création de la session:', sessionError);
            }
          } else {
            // Si le profil n'existe pas, déconnecter l'utilisateur
            await firebaseSignOut(auth);
            setUser(null);
            setFirebaseUser(null);
          }
        } else {
          setUser(null);
          setFirebaseUser(null);

          // Supprimer la session côté serveur
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
          } catch (logoutError) {
            console.error('Erreur lors de la suppression de la session:', logoutError);
          }
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du profil:', err);
        setUser(null);
        setFirebaseUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Inscription avec email et mot de passe
   */
  const signUp = async (data: SignUpData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier que le nom d'utilisateur est disponible
      const usernameAvailable = await isUsernameAvailable(data.username);
      if (!usernameAvailable) {
        throw new Error('Ce nom d\'utilisateur est déjà pris');
      }

      // Créer le compte Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Créer le profil dans Firestore
      await createUserProfile(userCredential.user.uid, {
        email: data.email,
        username: data.username,
        photoURL: userCredential.user.photoURL || undefined,
      });

      // Le profil sera chargé automatiquement par onAuthStateChanged
    } catch (err) {
      const errorCode = (err as { code?: string }).code || 'unknown';
      const authError: AuthError = {
        code: errorCode,
        message: err instanceof Error ? err.message : translateFirebaseError(errorCode),
      };
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connexion avec email et mot de passe
   */
  const signIn = async (data: SignInData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await signInWithEmailAndPassword(auth, data.email, data.password);

      // Le profil sera chargé automatiquement par onAuthStateChanged
    } catch (err) {
      const errorCode = (err as { code?: string }).code || 'unknown';
      const authError: AuthError = {
        code: errorCode,
        message: err instanceof Error ? err.message : translateFirebaseError(errorCode),
      };
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connexion avec Google
   */
  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Vérifier si le profil existe déjà
      const existingProfile = await getUserByUid(result.user.uid);

      if (!existingProfile) {
        // Créer un profil avec un username basé sur l'email
        const username = result.user.email?.split('@')[0] || `user${Date.now()}`;

        await createUserProfile(result.user.uid, {
          email: result.user.email || '',
          username,
          photoURL: result.user.photoURL || undefined,
        });
      }

      // Le profil sera chargé automatiquement par onAuthStateChanged
    } catch (err) {
      const errorCode = (err as { code?: string }).code || 'unknown';
      const authError: AuthError = {
        code: errorCode,
        message: err instanceof Error ? err.message : translateFirebaseError(errorCode),
      };
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Déconnexion
   */
  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      const errorCode = (err as { code?: string }).code || 'unknown';
      const authError: AuthError = {
        code: errorCode,
        message: 'Erreur lors de la déconnexion',
      };
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efface l'erreur actuelle
   */
  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook pour utiliser le contexte d'authentification
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}
