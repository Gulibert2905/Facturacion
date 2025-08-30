// src/pages/Unauthorized.jsx
import React from 'react';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleGoHome = () => {
        navigate('/dashboard');
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ mb: 3 }}>
                    <LockIcon sx={{ fontSize: 64, color: 'error.main' }} />
                </Box>
                
                <Typography variant="h4" gutterBottom color="error">
                    Acceso Denegado
                </Typography>
                
                <Typography variant="h6" gutterBottom>
                    Sin permisos suficientes
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Lo sentimos, no tienes los permisos necesarios para acceder a esta página.
                    {user && (
                        <>
                            <br />
                            <strong>Usuario:</strong> {user.fullName} ({user.role})
                        </>
                    )}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button 
                        variant="outlined" 
                        onClick={handleGoBack}
                    >
                        Volver
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleGoHome}
                    >
                        Ir al Dashboard
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default Unauthorized;