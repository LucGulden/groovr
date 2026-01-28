import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { type User, AuthError } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  useEffect(() => {
    // Récupérer la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Écouter les changements d'auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async ({
    email,
    username,
    password,
  }: {
    email: string
    username: string
    password: string
  }) => {
    try {
      setError(null)
      
      // Créer l'utilisateur dans Supabase Auth
      // Le trigger on_auth_user_created va automatiquement créer l'entrée dans users
      // avec le username récupéré depuis les metadata
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username, // Stocké dans auth.users metadata et récupéré par le trigger
          },
        },
      })

      if (signUpError) throw signUpError

      return data
    } catch (err) {
      setError(err as AuthError)
      throw err
    }
  }

  const signInWithPassword = async (email: string, password: string) => {
    try {
      setError(null)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError
      return data
    } catch (err) {
      setError(err as AuthError)
      throw err
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
    } catch (err) {
      setError(err as AuthError)
      throw err
    }
  }

  return {
    user,
    loading,
    error,
    signUp,
    signInWithPassword,
    signOut,
  }
}