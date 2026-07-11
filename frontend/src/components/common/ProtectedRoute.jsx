import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { isAuthenticated, role } = useAuthStore();

    // Login nahi hai
    if (!isAuthenticated) {
        if (allowedRole === 'super_admin') {
            return <Navigate to="/super-admin/login" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    // Role match nahi karta
    if (allowedRole && role !== allowedRole) {
        if (role === 'super_admin') {
            return <Navigate to="/super-admin/dashboard" replace />;
        }
        if (role === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;