// src/components/GlobalLoadingOverlay.jsx
import React from 'react';
import { Backdrop, Paper, Box, CircularProgress, Typography, LinearProgress } from '@mui/material';
import { useLoading } from '../contexts/LoadingContext';

const GlobalLoadingOverlay = () => {
  const { isLoading, message, progress } = useLoading();

  return (
    <Backdrop
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        color: '#fff',
        backgroundColor: 'rgba(0, 0, 0, 0.7)'
      }}
      open={isLoading}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 400
        }}
      >
        <Box sx={{ width: '100%', mb: 2 }}>
          {progress > 0 ? (
            <>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: 10, borderRadius: 5, mb: 1 }} 
              />
              <Typography 
                variant="body2" 
                color="text.secondary" 
                align="center"
              >
                {progress}%
              </Typography>
            </>
          ) : (
            <CircularProgress sx={{ display: 'block', mx: 'auto', mb: 2 }} />
          )}
          
          {message && (
            <Typography 
              variant="body1" 
              align="center"
              sx={{ mt: 2 }}
            >
              {message}
            </Typography>
          )}
        </Box>
      </Paper>
    </Backdrop>
  );
};

export default GlobalLoadingOverlay;