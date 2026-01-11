import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home.tsx'
import Collection from './pages/Collection.tsx'
import Wishlist from './pages/Wishlist.tsx'
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
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/wishlist" element={<Wishlist />} />
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