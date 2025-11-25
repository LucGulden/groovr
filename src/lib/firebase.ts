import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Configuration Firebase
 * Les variables d'environnement sont définies dans .env.local
 * Voir .env.example pour la structure requise
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Initialise Firebase
 * Vérifie si une instance existe déjà pour éviter les duplications
 * (utile en développement avec Hot Module Replacement)
 */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Auth - Gestion de l'authentification des utilisateurs
 * Utilisé pour login, signup, logout, réinitialisation de mot de passe
 */
export const auth = getAuth(app);

/**
 * Firestore - Base de données NoSQL
 * Utilisé pour stocker les collections, profils utilisateurs, posts, etc.
 */
export const db = getFirestore(app);

/**
 * Storage - Stockage de fichiers
 * Utilisé pour les images de profil, photos de vinyles, etc.
 */
export const storage = getStorage(app);

export default app;
