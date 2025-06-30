import React from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

// Modern color palette inspired by contemporary dating apps
const colors = {
  primary: '#E91E63', // Modern Pink
  primaryLight: '#F48FB1',
  primaryDark: '#AD1457',
  secondary: '#FF5722', // Vibrant Orange
  secondaryLight: '#FF8A65',
  secondaryDark: '#D84315',
  accent: '#00BCD4', // Cyan
  accentLight: '#4DD0E1',
  accentDark: '#0097A7',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  outline: '#E0E0E0',
  onPrimary: '#FFFFFF',
  onSurface: '#212121',
  onSurfaceVariant: '#757575',
  onBackground: '#212121',
};

// Define a modern, consistent theme for the entire application
const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
      dark: colors.primaryDark,
      contrastText: colors.onPrimary,
    },
    secondary: {
      main: colors.secondary,
      light: colors.secondaryLight,
      dark: colors.secondaryDark,
      contrastText: colors.onPrimary,
    },
    success: {
      main: colors.success,
    },
    warning: {
      main: colors.warning,
    },
    error: {
      main: colors.error,
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.onSurface,
      secondary: colors.onSurfaceVariant,
    },
    divider: colors.outline,
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '3.5rem',
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.75rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.875rem',
      lineHeight: 1.3,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    subtitle1: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 400,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.9375rem',
      letterSpacing: '0.005em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      fontWeight: 400,
    },
    overline: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
  },
  shape: {
    borderRadius: 10,
  },
  spacing: 8,
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.04)',
    '0px 1px 3px rgba(0, 0, 0, 0.06)',
    '0px 2px 4px rgba(0, 0, 0, 0.08)',
    '0px 3px 6px rgba(0, 0, 0, 0.10)',
    '0px 4px 8px rgba(0, 0, 0, 0.12)',
    '0px 6px 12px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.16)',
    '0px 12px 24px rgba(0, 0, 0, 0.18)',
    '0px 16px 32px rgba(0, 0, 0, 0.20)',
    '0px 20px 40px rgba(0, 0, 0, 0.22)',
    '0px 24px 48px rgba(0, 0, 0, 0.24)',
    '0px 28px 56px rgba(0, 0, 0, 0.26)',
    '0px 32px 64px rgba(0, 0, 0, 0.28)',
    '0px 36px 72px rgba(0, 0, 0, 0.30)',
    '0px 40px 80px rgba(0, 0, 0, 0.32)',
    '0px 44px 88px rgba(0, 0, 0, 0.34)',
    '0px 48px 96px rgba(0, 0, 0, 0.36)',
    '0px 52px 104px rgba(0, 0, 0, 0.38)',
    '0px 56px 112px rgba(0, 0, 0, 0.40)',
    '0px 60px 120px rgba(0, 0, 0, 0.42)',
    '0px 64px 128px rgba(0, 0, 0, 0.44)',
    '0px 68px 136px rgba(0, 0, 0, 0.46)',
    '0px 72px 144px rgba(0, 0, 0, 0.48)',
    '0px 76px 152px rgba(0, 0, 0, 0.50)'
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${colors.primary} ${colors.surfaceVariant}`,
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: colors.primary,
            border: `2px solid ${colors.background}`,
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            borderRadius: 8,
            backgroundColor: colors.surfaceVariant,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '12px 24px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9375rem',
          minHeight: 48,
          '&:focus-visible': {
            outline: `2px solid ${colors.primary}`,
            outlineOffset: 2,
          },
        },
        contained: {
          boxShadow: `0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)`,
          '&:hover': {
            boxShadow: `0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)`,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            transform: 'translateY(-1px)',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: `rgba(233, 30, 99, 0.04)`,
          },
        },
        sizeLarge: {
          padding: '16px 32px',
          fontSize: '1rem',
          minHeight: 56,
        },
        sizeSmall: {
          padding: '8px 16px',
          fontSize: '0.875rem',
          minHeight: 36,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: `1px solid ${colors.outline}`,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 24px rgba(0, 0, 0, 0.12)`,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: colors.surface,
            transition: 'all 0.2s ease-in-out',
            '& fieldset': {
              borderColor: colors.outline,
              borderWidth: 2,
            },
            '&:hover fieldset': {
              borderColor: colors.primary,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary,
              borderWidth: 2,
            },
            '&.Mui-error fieldset': {
              borderColor: colors.error,
            },
          },
          '& .MuiInputLabel-root': {
            fontWeight: 500,
            '&.Mui-focused': {
              color: colors.primary,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: `1px solid ${colors.outline}`,
        },
        elevation1: {
          boxShadow: `0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)`,
        },
        elevation2: {
          boxShadow: `0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)`,
        },
        elevation3: {
          boxShadow: `0 6px 12px rgba(0, 0, 0, 0.16), 0 6px 12px rgba(0, 0, 0, 0.23)`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.8125rem',
          height: 32,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        filled: {
          backgroundColor: `rgba(233, 30, 99, 0.08)`,
          color: colors.primary,
          '&:hover': {
            backgroundColor: `rgba(233, 30, 99, 0.12)`,
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: `3px solid ${colors.surface}`,
          boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1)`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: `rgba(255, 255, 255, 0.8)`,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${colors.outline}`,
          boxShadow: `0 1px 3px rgba(0, 0, 0, 0.12)`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          boxShadow: `0 24px 48px rgba(0, 0, 0, 0.16)`,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9375rem',
          minHeight: 48,
        },
      },
    },
  },
});

// Add custom design tokens to theme
theme.customTokens = {
  gradients: {
    primary: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
    accent: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentDark} 100%)`,
    surface: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceVariant} 100%)`,
  },
  borderRadius: {
    small: 1,
    medium: 2,
    large: 4,
    xl: 6,
    full: 8,
  },
  animations: {
    fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Create a custom gradient text style utility
theme.typography.gradientText = {
  background: theme.customTokens.gradients.primary,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 'bold',
  display: 'inline-block',
};

const ThemeProvider = ({ children }) => {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;
export { theme };
