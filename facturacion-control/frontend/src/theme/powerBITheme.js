import { createTheme } from '@mui/material/styles';

// Paleta de colores inspirada en Power BI
const powerBIColors = {
  primary: {
    main: '#4facfe',
    light: '#7ec8ff',
    dark: '#0066cb',
    contrastText: '#ffffff'
  },
  secondary: {
    main: '#667eea',
    light: '#9bb1ff',
    dark: '#314eb7',
    contrastText: '#ffffff'
  },
  success: {
    main: '#2ed573',
    light: '#68ff9f',
    dark: '#00a343',
    contrastText: '#ffffff'
  },
  warning: {
    main: '#ffa502',
    light: '#ffd954',
    dark: '#c57500',
    contrastText: '#000000'
  },
  error: {
    main: '#ff4757',
    light: '#ff7988',
    dark: '#c70025',
    contrastText: '#ffffff'
  },
  info: {
    main: '#70a1ff',
    light: '#a5d3ff',
    dark: '#3472cb',
    contrastText: '#ffffff'
  },
  grey: {
    50: '#f8f9fa',
    100: '#e9ecef',
    200: '#dee2e6',
    300: '#ced4da',
    400: '#adb5bd',
    500: '#6c757d',
    600: '#495057',
    700: '#343a40',
    800: '#212529',
    900: '#1a1d20'
  }
};

// Gradientes personalizados
export const powerBIGradients = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  secondary: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  success: 'linear-gradient(135deg, #2ed573 0%, #17c0eb 100%)',
  warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  error: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  info: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  dark: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
  light: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
};

// Crear tema base
const createPowerBITheme = (mode = 'light') => {
  const isLight = mode === 'light';
  
  return createTheme({
    palette: {
      mode,
      ...powerBIColors,
      background: {
        default: isLight ? '#f8f9fa' : '#1a1d20',
        paper: isLight ? '#ffffff' : '#212529',
        gradient: isLight ? powerBIGradients.light : powerBIGradients.dark
      },
      text: {
        primary: isLight ? '#212529' : '#ffffff',
        secondary: isLight ? '#6c757d' : '#adb5bd',
        disabled: isLight ? '#adb5bd' : '#495057'
      },
      divider: isLight ? '#dee2e6' : '#343a40'
    },
    typography: {
      fontFamily: '"Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.02em'
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.01em'
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4
      },
      h6: {
        fontSize: '1.1rem',
        fontWeight: 600,
        lineHeight: 1.5
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.5
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.57
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.43
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.66,
        fontWeight: 400
      },
      overline: {
        fontSize: '0.75rem',
        fontWeight: 500,
        lineHeight: 2.66,
        textTransform: 'uppercase',
        letterSpacing: '0.08em'
      }
    },
    shape: {
      borderRadius: 12
    },
    spacing: 8,
    shadows: [
      'none',
      '0px 2px 4px -1px rgba(0,0,0,0.06), 0px 4px 6px -1px rgba(0,0,0,0.04)',
      '0px 3px 6px -2px rgba(0,0,0,0.08), 0px 6px 12px -2px rgba(0,0,0,0.06)',
      '0px 4px 8px -2px rgba(0,0,0,0.10), 0px 8px 16px -2px rgba(0,0,0,0.08)',
      '0px 6px 12px -3px rgba(0,0,0,0.12), 0px 12px 24px -3px rgba(0,0,0,0.10)',
      '0px 8px 16px -4px rgba(0,0,0,0.14), 0px 16px 32px -4px rgba(0,0,0,0.12)',
      '0px 10px 20px -5px rgba(0,0,0,0.16), 0px 20px 40px -5px rgba(0,0,0,0.14)',
      ...Array(18).fill('0px 20px 40px -5px rgba(0,0,0,0.16), 0px 20px 40px -5px rgba(0,0,0,0.14)')
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': {
            boxSizing: 'border-box',
          },
          html: {
            MozOsxFontSmoothing: 'grayscale',
            WebkitFontSmoothing: 'antialiased',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            width: '100%',
          },
          body: {
            display: 'flex',
            flex: '1 1 auto',
            flexDirection: 'column',
            minHeight: '100%',
            width: '100%',
          },
          '#root': {
            display: 'flex',
            flex: '1 1 auto',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0px 4px 8px -2px rgba(0,0,0,0.10), 0px 8px 16px -2px rgba(0,0,0,0.08)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: '0px 8px 16px -4px rgba(0,0,0,0.14), 0px 16px 32px -4px rgba(0,0,0,0.12)',
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0px 4px 8px -2px rgba(0,0,0,0.10), 0px 8px 16px -2px rgba(0,0,0,0.08)'
          },
          elevation1: {
            boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.06), 0px 4px 6px -1px rgba(0,0,0,0.04)'
          },
          elevation2: {
            boxShadow: '0px 3px 6px -2px rgba(0,0,0,0.08), 0px 6px 12px -2px rgba(0,0,0,0.06)'
          },
          elevation3: {
            boxShadow: '0px 4px 8px -2px rgba(0,0,0,0.10), 0px 8px 16px -2px rgba(0,0,0,0.08)'
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 4px 8px -2px rgba(0,0,0,0.10), 0px 8px 16px -2px rgba(0,0,0,0.08)'
            }
          },
          contained: {
            background: powerBIGradients.primary,
            '&:hover': {
              background: powerBIGradients.primary,
              opacity: 0.9
            }
          }
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
              backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)'
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            fontWeight: 500
          }
        }
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            height: 8
          },
          bar: {
            borderRadius: 8
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'all 0.2s ease-in-out',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: powerBIColors.primary.light
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: powerBIColors.primary.main,
                borderWidth: 2
              }
            }
          }
        }
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: 12
          }
        }
      }
    }
  });
};

// Tema claro
export const lightPowerBITheme = createPowerBITheme('light');

// Tema oscuro
export const darkPowerBITheme = createPowerBITheme('dark');

export { powerBIColors };
export default lightPowerBITheme;