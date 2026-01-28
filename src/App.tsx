import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useNotificationsStore } from './stores/notificationsStore'
import Layout from './components/Layout'
import Home from './pages/Home.tsx'
import Signup from './pages/Signup.tsx'
import Login from './pages/Login.tsx'
import NotFound from './pages/NotFound.tsx'
import Feed from './pages/Feed.tsx'
import Profile from './pages/Profile.tsx'
import Followers from './pages/Followers.tsx'
import Following from './pages/Following.tsx'
import Notifications from './pages/Notifications.tsx'
import Search from './pages/Search.tsx'
import Settings from './pages/Settings.tsx'

function App() {
  const { user } = useAuth()
  const { initialize, cleanup } = useNotificationsStore()

  // Initialiser le store de notifications quand l'utilisateur se connecte
  useEffect(() => {
    if (user) {
      initialize(user.id)
    } else {
      cleanup()
    }

    return () => cleanup()
  }, [user, initialize, cleanup])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/search" element={<Search />} />
          <Route path="/settings" element={<Settings />} />

          {/* Routes spécifiques AVANT la route générique */}
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