// src/components/GlobalLoadingOverlay.jsx
import React from 'react';
import { Backdrop, Paper, Box } from '@mui/material';
import { useLoading } from '../contexts/LoadingContext';
import LoadingIndicator from './LoadingIndicator';

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
          <LoadingIndicator 
            type={progress > 0 ? 'linear' : 'circular'}
            progress={progress}
            message={message}
            size="large"
          />
        </Box>
      </Paper>
    </Backdrop>
  );
};

export default GlobalLoadingOverlay;