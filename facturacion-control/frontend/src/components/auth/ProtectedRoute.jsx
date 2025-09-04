// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null }) => {
    const { isAuthenticated, loading, user, hasRole, hasPermission, isAdmin, isSuperAdmin } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight="100vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role requirement with hierarchy support
    if (requiredRole) {
        let hasRequiredRole = false;
        
        switch (requiredRole) {
            case 'superadmin':
                hasRequiredRole = isSuperAdmin();
                break;
            case 'admin':
                hasRequiredRole = isAdmin(); // This includes both admin and superadmin
                break;
            default:
                hasRequiredRole = hasRole(requiredRole);
        }
        
        if (!hasRequiredRole) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    // Check permission requirement
    if (requiredPermission) {
        const { module, action } = requiredPermission;
        if (!hasPermission(module, action)) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    // User is authenticated and has required permissions
    return children;
};

export default ProtectedRoute;