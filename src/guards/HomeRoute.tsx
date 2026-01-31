import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'
import Landing from '../pages/Landing'
import Feed from '../pages/Feed'

export default function HomeRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />
  }

  return user ? <Feed /> : <Landing />
}