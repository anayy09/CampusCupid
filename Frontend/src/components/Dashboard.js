import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Avatar, 
  Grid, 
  Button, 
  ThemeProvider, 
  createTheme,
  Card,
  CardContent,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Person as ProfileIcon, 
  Favorite as MatchIcon, 
  Settings as SettingsIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FE3C72', 
      light: '#FF7A9C',
      dark: '#E31C5F',
    },
    secondary: {
      main: '#FF6036', 
    },
    background: {
      default: '#F8F8F8',
    },
  },
  typography: {
    fontFamily: '"Gotham SSm", "Helvetica Neue", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

const API_URL = process.env.REACT_APP_API_URL || 'https://campuscupid-backend.onrender.com';
const DEFAULT_PROFILE_IMAGE = '/default-profile.jpg';

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_URL}/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUser(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
        setOpenSnackbar(true);
        setLoading(false);
        if (err.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "?";
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Typography variant="h6">Loading...</Typography>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ py: 4, backgroundColor: 'background.default', minHeight: '100vh' }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                background: '-webkit-linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              My Profile
            </Typography>
            <IconButton onClick={handleLogout} color="primary">
              <LogoutIcon />
            </IconButton>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Avatar
                alt={user?.firstName}
                src={user?.profilePictureURL || DEFAULT_PROFILE_IMAGE}
                sx={{ 
                  width: 200, 
                  height: 200, 
                  margin: 'auto',
                  border: '4px solid #FE3C72'
                }}
              />
              {user?.photos && user.photos.length > 0 && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    Additional Photos: {user.photos.length}
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h5" gutterBottom>
                {user?.firstName}, {calculateAge(user?.dateOfBirth)}
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                {user?.bio || 'No bio available'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Looking for: {user?.lookingFor || 'Not specified'}
                <br />
                Interested in: {user?.interestedIn || 'Not specified'}
                <br />
                Sexual Orientation: {user?.sexualOrientation || 'Not specified'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button 
                  variant="contained" 
                  startIcon={<EditIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                    textTransform: 'none'
                  }}
                >
                  Edit Profile
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12} md={4}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <ProfileIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
                  <Typography variant="h6">Personal Info</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Email: {user?.email}
                    <br />
                    Gender: {user?.gender}
                    <br />
                    Gender Preference: {user?.genderPreference}
                    <br />
                    Age Range: {user?.ageRange}
                    <br />
                    Distance: {user?.distance ? `${user.distance} miles` : 'Not set'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <MatchIcon color="secondary" sx={{ fontSize: 50, mb: 2 }} />
                  <Typography variant="h6">Matches</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Matches: {user?.totalMatches || 0}
                    <br />
                    Active Chats: {user?.activeChats || 0}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    size="small" 
                    sx={{ mt: 2, textTransform: 'none' }}
                    onClick={() => navigate('/matcher')}
                  >
                    Find Matches
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <SettingsIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
                  <Typography variant="h6">Account Settings</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Privacy: Custom
                    <br />
                    Notifications: On
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    size="small" 
                    sx={{ mt: 2, textTransform: 'none' }}
                  >
                    Manage Settings
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        <Snackbar 
          open={openSnackbar} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity="error" 
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default DashboardPage;