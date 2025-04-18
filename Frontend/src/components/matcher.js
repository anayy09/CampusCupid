import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  CircularProgress, 
  IconButton, 
  Paper,
  ThemeProvider,
  createTheme,
  Chip,
  Avatar,
  AppBar,
  Toolbar,
  Snackbar,
  Alert
} from '@mui/material';
import { Close as CloseIcon, Favorite as FavoriteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

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

const API_URL = process.env.REACT_APP_API_URL || 'https://campuscupid-backend.onrender.com';
const DEFAULT_PROFILE_IMAGE = '/default-profile.jpg';

function MatcherPage() {
  const navigate = useNavigate();
  const [currentProfile, setCurrentProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const cardRef = useRef(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [matchAlert, setMatchAlert] = useState({ open: false, message: '' });

  // Fetch profiles from the backend API
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
          console.error('Authentication information missing. Redirecting to login.');
          navigate('/login');
          return;
        }
        
        // Fetch potential matches using the correct API endpoint
        const response = await axios.get(`${API_URL}/matches/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          console.log("Matches fetched:", response.data);
          setProfiles(response.data);
          setCurrentProfile(response.data[0]);
        } else {
          console.log("No matches available");
          // Leave profiles empty which will trigger the empty state UI
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profiles:", error.response?.data?.error || error.message);
        setLoading(false);
        
        // If error is 401 or 403, redirect to login
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          navigate('/login');
        }
      }
    };

    fetchProfiles();
  }, [navigate]);

  // Handle key press events for arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handleDislike();
      } else if (e.key === 'ArrowRight') {
        handleLike();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentProfile]);

  const handleLike = async () => {
    if (!currentProfile) return;
    setSwipeDirection('right');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/like/${currentProfile.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check if this like created a match
      if (response.data && response.data.matched) {
        setMatchAlert({ 
          open: true, 
          message: `You matched with ${currentProfile.firstName}!` 
        });
      }
      
    } catch (error) {
      console.error(`Error liking user ${currentProfile.id}:`, error.response?.data?.error || error.message);
    }
    
    setTimeout(() => {
      nextProfile();
      setSwipeDirection(null);
      setOffsetX(0);
      setImageLoadError(false);
    }, 300);
  };

  const handleDislike = async () => {
    if (!currentProfile) return;
    setSwipeDirection('left');
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/dislike/${currentProfile.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error(`Error disliking user ${currentProfile.id}:`, error.response?.data?.error || error.message);
    }
    
    setTimeout(() => {
      nextProfile();
      setSwipeDirection(null);
      setOffsetX(0);
      setImageLoadError(false);
    }, 300);
  };

  const nextProfile = () => {
    const currentIndex = profiles.findIndex(profile => profile.id === currentProfile.id);
    if (currentIndex < profiles.length - 1) {
      setCurrentProfile(profiles[currentIndex + 1]);
    } else {
      setCurrentProfile(null);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Touch event handlers for swiping
  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setOffsetX(diff);
  };

  const handleTouchEnd = () => {
    if (offsetX > 100) {
      handleLike();
    } else if (offsetX < -100) {
      handleDislike();
    } else {
      setOffsetX(0);
    }
  };

  // Calculate age from date of birth
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

  // Get card style based on swipe direction
  const getCardStyle = () => {
    if (swipeDirection === 'left') {
      return {
        transform: 'translateX(-150%) rotate(-30deg)',
        transition: 'transform 0.3s ease-out'
      };
    } else if (swipeDirection === 'right') {
      return {
        transform: 'translateX(150%) rotate(30deg)',
        transition: 'transform 0.3s ease-out'
      };
    } else if (offsetX !== 0) {
      const rotate = offsetX * 0.1;
      return { transform: `translateX(${offsetX}px) rotate(${rotate}deg)` };
    }
    return {};
  };

  // Handler for image load errors
  const handleImageError = () => {
    setImageLoadError(true);
  };

  const handleCloseAlert = () => {
    setMatchAlert({ ...matchAlert, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f8f8f8' }}>
        <AppBar position="static" sx={{ bgcolor: 'white', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
          <Toolbar>
            <IconButton 
              edge="start" 
              color="inherit" 
              aria-label="back to dashboard"
              onClick={handleBackToDashboard}
              sx={{ color: theme.palette.primary.main }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1, 
                textAlign: 'center',
                fontWeight: 'bold',
                color: theme.palette.primary.main
              }}
            >
              Find Matches
            </Typography>
          </Toolbar>
        </AppBar>

        <Container 
          maxWidth="sm" 
          sx={{ 
            pt: 4, 
            pb: 4, 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: loading || !currentProfile ? 'center' : 'flex-start',
            minHeight: 'calc(100vh - 64px)'
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CircularProgress color="primary" />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Finding potential matches...
              </Typography>
            </Box>
          ) : !currentProfile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Typography variant="h5" sx={{ mb: 2 }}>No more profiles to show</Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                We'll notify you when new matches become available
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/dashboard')}
                sx={{
                  background: 'linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                  boxShadow: '0 4px 12px rgba(254, 60, 114, 0.3)',
                  px: 4,
                  py: 1.5
                }}
              >
                Back to Dashboard
              </Button>
            </Box>
          ) : (
            <>
              <Box sx={{ position: 'relative', mb: 4 }}>
                <Paper
                  ref={cardRef}
                  elevation={8}
                  sx={{
                    height: '500px',
                    borderRadius: '16px',
                    overflow: 'hidden', 
                    position: 'relative',
                    ...getCardStyle()
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {imageLoadError ? (
                    <Box
                      sx={{
                        height: '100%',
                        width: '100%',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        p: 3
                      }}
                    >
                      <Avatar 
                        sx={{ 
                          width: 100, 
                          height: 100, 
                          mb: 2,
                          bgcolor: theme.palette.primary.light
                        }}
                      >
                        {currentProfile.firstName && currentProfile.firstName.charAt(0)}
                      </Avatar>
                      <Typography variant="body1">Profile picture not available</Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        height: '100%',
                        width: '100%',
                        position: 'relative',
                      }}
                    >
                      <img
                        src={currentProfile.profilePictureURL || DEFAULT_PROFILE_IMAGE}
                        alt={`${currentProfile.firstName}'s profile`}
                        onError={handleImageError}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </Box>
                  )}
                  
                  <Box 
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4) 50%, rgba(0,0,0,0))',
                      padding: 3,
                      color: 'white',
                    }}
                  >
                    <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                      {currentProfile.firstName}, {calculateAge(currentProfile.dateOfBirth)}
                    </Typography>
                    
                    {currentProfile.lookingFor && (
                      <Typography variant="body1" sx={{ mt: 0.5, opacity: 0.9 }}>
                        Looking for: {currentProfile.lookingFor}
                      </Typography>
                    )}
                    
                    {currentProfile.interests && currentProfile.interests.length > 0 && (
                      <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                        {currentProfile.interests.map((interest, index) => (
                          <Chip 
                            key={index} 
                            label={interest} 
                            size="small" 
                            sx={{ 
                              bgcolor: 'rgba(255, 255, 255, 0.2)',
                              color: 'white',
                              fontSize: '0.75rem'
                            }} 
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 2 }}>
                <IconButton 
                  onClick={handleDislike}
                  sx={{ 
                    backgroundColor: 'white', 
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    p: 2,
                    '&:hover': { backgroundColor: '#F5F5F5' }
                  }}
                >
                  <CloseIcon fontSize="large" sx={{ color: '#FE3C72' }} />
                </IconButton>
                
                <IconButton 
                  onClick={handleLike}
                  sx={{ 
                    backgroundColor: 'white', 
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    p: 2,
                    '&:hover': { backgroundColor: '#F5F5F5' }
                  }}
                >
                  <FavoriteIcon fontSize="large" sx={{ color: '#24E5A0' }} />
                </IconButton>
              </Box>
              
              <Typography variant="body2" sx={{ textAlign: 'center', color: 'grey.600' }}>
                Swipe left/right or use arrow keys to navigate
              </Typography>
            </>
          )}
        </Container>
        
        <Snackbar
          open={matchAlert.open}
          autoHideDuration={5000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseAlert}
            severity="success"
            variant="filled"
            sx={{ width: '100%' }}
          >
            {matchAlert.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default MatcherPage;