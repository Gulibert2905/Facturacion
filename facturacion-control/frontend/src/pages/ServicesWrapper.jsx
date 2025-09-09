import React, { useState, useEffect } from 'react';
import { Box, Container, Fade } from '@mui/material';

// Importar ambas versiones
import Services from './Services'; // Versión clásica
import ModernServices from './ModernServices'; // Versión moderna
import ServiceVersionToggle from '../components/ServiceVersionToggle';

// Importar estilos para animaciones
import '../styles/modernAnimations.css';

const ServicesWrapper = () => {
  const [currentVersion, setCurrentVersion] = useState('classic');
  const [showSelector, setShowSelector] = useState(true);

  // Cargar preferencia del usuario del localStorage
  useEffect(() => {
    const savedVersion = localStorage.getItem('servicesVersion');
    const hasSeenSelector = localStorage.getItem('hasSeenServicesSelector');
    
    if (savedVersion) {
      setCurrentVersion(savedVersion);
    }
    
    // Mostrar selector solo la primera vez o si el usuario lo solicita
    if (hasSeenSelector) {
      setShowSelector(false);
    }
  }, []);

  // Guardar preferencia cuando cambie
  const handleVersionChange = (version) => {
    setCurrentVersion(version);
    localStorage.setItem('servicesVersion', version);
    localStorage.setItem('hasSeenServicesSelector', 'true');
    
    // Ocultar selector después de un tiempo
    setTimeout(() => {
      setShowSelector(false);
    }, 1000);
  };

  // Permitir mostrar selector con teclas Alt + V
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.altKey && event.key.toLowerCase() === 'v') {
        setShowSelector(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Selector de versión */}
      {showSelector && (
        <Fade in timeout={800}>
          <Container maxWidth="lg" sx={{ py: 3 }}>
            <ServiceVersionToggle
              currentVersion={currentVersion}
              onVersionChange={handleVersionChange}
              showComparison={true}
            />
          </Container>
        </Fade>
      )}

      {/* Componente de servicios según la versión seleccionada */}
      <Fade in timeout={600} key={currentVersion}>
        <Box>
          {currentVersion === 'modern' ? <ModernServices /> : <Services />}
        </Box>
      </Fade>

      {/* Hint para mostrar selector (solo si está oculto) */}
      {!showSelector && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            opacity: 0.7,
            '&:hover': { opacity: 1 }
          }}
        >
          <ServiceVersionToggle
            currentVersion={currentVersion}
            onVersionChange={handleVersionChange}
            showComparison={false}
          />
        </Box>
      )}
    </Box>
  );
};

export default ServicesWrapper;