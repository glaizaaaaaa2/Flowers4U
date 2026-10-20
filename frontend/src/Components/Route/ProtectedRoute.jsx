import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Loader from '../Layout/Loader'

// Uses the logged-in user from redux (filled by loadUser when the app starts)
const ProtectedRoute = ({ children, isAdmin = false }) => {
    const { loading, isAuthenticated, user } = useSelector(state => state.auth)

    if (loading) return <Loader />
    if (!isAuthenticated || !user) return <Navigate to="/login" replace />
    if (isAdmin && user.role !== 'admin') return <Navigate to="/" replace />
    return children
}

export default ProtectedRoute
