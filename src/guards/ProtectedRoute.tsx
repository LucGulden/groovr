import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />
  }

  return user ? <Outlet /> : <Navigate to="/" replace />
}