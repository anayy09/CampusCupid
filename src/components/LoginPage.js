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
  styled
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

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
      borderColor: '#rgba(0, 0, 0, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: '#FF6036',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#FE3C72',
    },
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-input': {
    color: '#FE3C72',
  },
  '& .MuiInputBase-input': {
    '&::placeholder': {
      color: '#FF6036',
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

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Logging in with', email, password);
    navigate('/');
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
            py: 8,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography
              component="h1"
              variant="h4"
              sx={{
                mb: 4,
                fontWeight: 'bold',
                background: '-webkit-linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Campus Cupid
            </Typography>

            <Box component="form" sx={{ width: '100%' }}>
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
              />
              <StyledTextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleLogin}
                sx={{
                  height: 56,
                  background: 'linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #E31C5F 30%, #E31C5F 90%)',
                  },
                }}
              >
                Sign In
              </Button>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Link href="#" variant="body2" sx={{ color: 'primary.main' }}>
                  Forgot password?
                </Link>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" display="inline" sx={{ mr: 1 }}>
                    Don't have an account?
                  </Typography>
                  <Link href="/signup" variant="body2" sx={{ color: 'primary.main' }}>
                    Sign Up
                  </Link>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default LoginPage;