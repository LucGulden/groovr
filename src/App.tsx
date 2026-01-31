import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { useAuth } from './hooks/useAuth'
import { useNotificationsStore } from './stores/notificationsStore'
import { useUserStore } from './stores/userStore'
import { useVinylStatsStore } from './stores/vinylStatsStore'
import Layout from './components/Layout'
import ProtectedRoute from './guards/ProtectedRoute'
import PublicOnlyRoute from './guards/PublicOnlyRoute'
import Signup from './pages/Signup'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import Followers from './pages/Followers'
import Following from './pages/Following'
import Notifications from './pages/Notifications'
import Search from './pages/Search'
import Settings from './pages/Settings'
import HomeRoute from './guards/HomeRoute'

function App() {
  const { user } = useAuth()
  const previousUserIdRef = useRef<string | null>(null)
  
  const { initialize: initializeNotifications, cleanup: cleanupNotifications } = useNotificationsStore()
  const { initialize: initializeUser, cleanup: cleanupUser } = useUserStore()
  const { initialize: initializeVinylStats, cleanup: cleanupVinylStats } = useVinylStatsStore()

  // Initialiser les stores quand l'utilisateur se connecte
  useEffect(() => {
    const currentUserId = user?.id || null
    const previousUserId = previousUserIdRef.current

    // ✅ Ne faire quelque chose que si l'userId a vraiment changé
    if (currentUserId !== previousUserId) {
      if (currentUserId) {
        // Connexion
        initializeNotifications(currentUserId)
        initializeUser(currentUserId)
        initializeVinylStats(currentUserId)
      } else {
        // Déconnexion
        cleanupNotifications()
        cleanupUser()
        cleanupVinylStats()
      }

      // Mettre à jour la référence
      previousUserIdRef.current = currentUserId
    }
  }, [user, initializeNotifications, cleanupNotifications, initializeUser, cleanupUser, initializeVinylStats, cleanupVinylStats])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Route dynamique selon auth */}
          <Route path="/" element={<HomeRoute />} />

          {/* Routes publiques uniquement (bloquées si connecté) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Routes protégées (bloquées si déconnecté) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Routes publiques (accessibles à tous) */}
          <Route path="/search" element={<Search />} />
          <Route path="/profile/:username/followers" element={<Followers />} />
          <Route path="/profile/:username/following" element={<Following />} />
          <Route path="/profile/:username" element={<Profile />} />
          
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App