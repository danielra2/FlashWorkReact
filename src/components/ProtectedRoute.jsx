import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, requiredRole }) {
  const { token, userType } = useAuth()

  if (!token) return <Navigate to="/login" replace />

  if (requiredRole && userType !== requiredRole) {
    return <Navigate to={userType === 'WORKER' ? '/worker' : '/employer'} replace />
  }

  return children
}

export default ProtectedRoute
