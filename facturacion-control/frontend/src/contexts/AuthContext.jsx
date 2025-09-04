// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../components/services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Initialize authentication state on app load
    useEffect(() => {
        const initializeAuth = () => {
            try {
                const currentUser = authService.getCurrentUser();
                const token = authService.getToken();
                
                if (currentUser && token) {
                    setUser(currentUser);
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (username, password) => {
        try {
            setLoading(true);
            const response = await authService.login(username, password);
            
            if (response.success && response.user) {
                // Agregar timestamp para forzar re-render y limpiar estado anterior
                const userWithTimestamp = {
                    ...response.user,
                    _loginTimestamp: Date.now()
                };
                
                setUser(userWithTimestamp);
                setIsAuthenticated(true);
                return response;
            } else {
                throw new Error('Invalid login response');
            }
        } catch (error) {
            setUser(null);
            setIsAuthenticated(false);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        // Limpiar cache, tokens y storage
        authService.logout();
        
        // Limpiar estado del usuario
        setUser(null);
        setIsAuthenticated(false);
        
        // Usar window.location.replace para evitar historial
        window.location.replace('/login');
    };

    const hasRole = (role) => {
        return user && user.role === role;
    };

    const hasPermission = (module, action) => {
        if (!user || !user.permissions) return false;
        
        const modulePermission = user.permissions.find(p => p.module === module);
        return modulePermission && modulePermission.actions.includes(action);
    };

    const isSuperAdmin = () => {
        return hasRole('superadmin');
    };

    const isAdmin = () => {
        return hasRole('admin') || hasRole('superadmin');
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        hasRole,
        hasPermission,
        isSuperAdmin,
        isAdmin
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;