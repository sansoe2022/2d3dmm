import { createTheme } from '@mui/material/styles';

// Material Design 3 Light Theme
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#00897B', // Teal 700 (MD3 primary seed)
      light: '#26A69A',
      dark: '#00695C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#7D5260', // MD3 secondary
      light: '#A0738D',
      dark: '#5F3F47',
      contrastText: '#FFFFFF',
    },

    background: {
      default: '#FFFBFE',
      paper: '#FFFBFE',
    },

    error: {
      main: '#B3261E',
      light: '#F9DEDC',
      dark: '#8C0E0E',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F9A825',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#00897B',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#2E7D32',
      contrastText: '#FFFFFF',
    },
    text: {
      primary: '#1C1B1F',
      secondary: '#49454E',
      disabled: '#938F96',
    },
    divider: '#E7E0EC',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    // MD3 Type Scale
    h1: {
      fontSize: '57px',
      fontWeight: 400,
      lineHeight: '64px',
      letterSpacing: '0px',
    },
    h2: {
      fontSize: '45px',
      fontWeight: 400,
      lineHeight: '52px',
      letterSpacing: '0px',
    },
    h3: {
      fontSize: '36px',
      fontWeight: 400,
      lineHeight: '44px',
      letterSpacing: '0px',
    },
    h4: {
      fontSize: '32px',
      fontWeight: 500,
      lineHeight: '40px',
      letterSpacing: '0px',
    },
    h5: {
      fontSize: '28px',
      fontWeight: 500,
      lineHeight: '36px',
      letterSpacing: '0px',
    },
    h6: {
      fontSize: '24px',
      fontWeight: 500,
      lineHeight: '32px',
      letterSpacing: '0px',
    },
    body1: {
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '24px',
      letterSpacing: '0.5px',
    },
    body2: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: '20px',
      letterSpacing: '0.25px',
    },
    button: {
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: '20px',
      letterSpacing: '0.1px',
      textTransform: 'none',
    },
    caption: {
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: '16px',
      letterSpacing: '0.4px',
    },
  },
  shape: {
    borderRadius: 12, // MD3 medium corner
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '100px', // MD3 full corner for buttons
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '14px',
          padding: '10px 24px',
          minHeight: '40px',
        },
        contained: {
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.12)',
          '&:hover': {
            boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.16)',
          },
        },
        outlined: {
          borderWidth: '1px',
          '&:hover': {
            borderWidth: '1px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '28px', // MD3 extra-large corner
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: '9px 12px',
        },
        switchBase: {
          '&.Mui-checked': {
            color: '#00897B',
          },
        },
        track: {
          backgroundColor: '#E7E0EC',
          opacity: 1,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px', // MD3 small corner
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          margin: '4px 0',
          '&:hover': {
            backgroundColor: 'rgba(0, 137, 123, 0.08)',
          },
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: '#00897B',
          },
        },
      },
    },
  },
});

// Material Design 3 Dark Theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#80DEEA', // Teal 300 (MD3 primary for dark)
      light: '#B2EBF2',
      dark: '#00897B',
      contrastText: '#00695C',
    },
    secondary: {
      main: '#CFB8C1', // MD3 secondary for dark
      light: '#E8DEE8',
      dark: '#9A7F8F',
      contrastText: '#3E2723',
    },

    background: {
      default: '#1C1B1F',
      paper: '#1C1B1F',
    },

    error: {
      main: '#F2B8B5',
      light: '#F9DEDC',
      dark: '#B3261E',
      contrastText: '#601410',
    },
    warning: {
      main: '#FFD54F',
      contrastText: '#000000',
    },
    info: {
      main: '#80DEEA',
      contrastText: '#00695C',
    },
    success: {
      main: '#81C784',
      contrastText: '#1B5E20',
    },
    text: {
      primary: '#E6E1E5',
      secondary: '#CAC7D0',
      disabled: '#938F96',
    },
    divider: '#49454E',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '57px',
      fontWeight: 400,
      lineHeight: '64px',
      letterSpacing: '0px',
    },
    h2: {
      fontSize: '45px',
      fontWeight: 400,
      lineHeight: '52px',
      letterSpacing: '0px',
    },
    h3: {
      fontSize: '36px',
      fontWeight: 400,
      lineHeight: '44px',
      letterSpacing: '0px',
    },
    h4: {
      fontSize: '32px',
      fontWeight: 500,
      lineHeight: '40px',
      letterSpacing: '0px',
    },
    h5: {
      fontSize: '28px',
      fontWeight: 500,
      lineHeight: '36px',
      letterSpacing: '0px',
    },
    h6: {
      fontSize: '24px',
      fontWeight: 500,
      lineHeight: '32px',
      letterSpacing: '0px',
    },
    body1: {
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '24px',
      letterSpacing: '0.5px',
    },
    body2: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: '20px',
      letterSpacing: '0.25px',
    },
    button: {
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: '20px',
      letterSpacing: '0.1px',
      textTransform: 'none',
    },
    caption: {
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: '16px',
      letterSpacing: '0.4px',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '100px',
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '14px',
          padding: '10px 24px',
          minHeight: '40px',
        },
        contained: {
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.3), 0px 1px 2px rgba(0, 0, 0, 0.4)',
          backgroundColor: '#2C2B2F',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '28px',
          backgroundColor: '#2C2B2F',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: '9px 12px',
        },
        switchBase: {
          '&.Mui-checked': {
            color: '#80DEEA',
          },
        },
        track: {
          backgroundColor: '#49454E',
          opacity: 1,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          margin: '4px 0',
          '&:hover': {
            backgroundColor: 'rgba(128, 222, 234, 0.08)',
          },
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: '#80DEEA',
          },
        },
      },
    },
  },
});
