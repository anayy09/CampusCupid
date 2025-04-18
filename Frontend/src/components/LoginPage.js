import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Link,
  ThemeProvider,
  createTheme,
  styled,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Visibility, VisibilityOff } from '@mui/icons-material';

// Custom styled TextField
const StyledTextField = styled(TextField)({
  '& label.Mui-focused': {
    color: '#FE3C72',
  },
  '& .MuiInput-underline:after': {
    borderBottomColor: '#FE3C72',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: '#FF6036',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#FE3C72',
    },
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-input': {
    color: '#333',
  },
  '& .MuiInputBase-input': {
    '&::placeholder': {
      color: '#999',
      opacity: 1,
    },
  },
});

// Tinder-inspired theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#FE3C72', // Tinder's pink
      light: '#FF7A9C',
      dark: '#E31C5F',
    },
    secondary: {
      main: '#FF6036', // Tinder's orange
    },
    background: {
      default: '#fff',
    },
  },
  typography: {
    fontFamily: '"Gotham SSm", "Helvetica Neue", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

// Backend API base URL - use environment variable

// change this an envieremtnal varible 
const API_URL = process.env.REACT_APP_API_URL;

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!email) {
      setError('Email is required');
      setOpenSnackbar(true);
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setOpenSnackbar(true);
      return;
    }
    
    if (!password) {
      setError('Password is required');
      setOpenSnackbar(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password
      });

      // Handle successful login
      console.log('Login successful:', response.data);
      
      // Store token and user data in localStorage for authentication
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.user_id.toString()); // Updated to use user_id
        
        // Set authorization header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        setLoading(false);
        navigate('/dashboard');
      }
    } catch (err) {
      setLoading(false);
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            py: 4,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: '16px',
            }}
          >
            <Typography
              component="h1"
              variant="h4"
              sx={{
                mb: 3,
                fontWeight: 'bold',
                background: '-webkit-linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Campus Cupid
            </Typography>
            
            <Typography variant="subtitle1" sx={{ mb: 3, textAlign: 'center', color: '#666' }}>
              Welcome back! Please sign in to continue
            </Typography>

            <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
              <StyledTextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                error={!!error && error.includes('email')}
                helperText={error && error.includes('email') ? error : ''}
              />
              <StyledTextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
                error={!!error && error.includes('password')}
                helperText={error && error.includes('password') ? error : ''}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  height: 56,
                  background: 'linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #E31C5F 30%, #E31C5F 90%)',
                  },
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(254, 60, 114, 0.3)',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Link href="/forgot-password" variant="body2" sx={{ color: 'primary.main', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" display="inline" sx={{ mr: 1, color: '#666' }}>
                    Don't have an account?
                  </Typography>
                  <Link href="/signup" variant="body2" sx={{ color: 'primary.main', fontWeight: 'bold', textDecoration: 'none' }}>
                    Sign Up
                  </Link>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
        
        {/* Error Notification */}
        <Snackbar 
          open={openSnackbar} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity="error" 
            sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default LoginPage;