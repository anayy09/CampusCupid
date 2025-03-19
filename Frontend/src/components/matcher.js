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
  createTheme
} from '@mui/material';
import { Close as CloseIcon, Favorite as FavoriteIcon } from '@mui/icons-material';

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
const DEFAULT_PROFILE_IMAGE = '/default-profile.jpg'; // Add a default profile image to your public folder

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

  // Fetch profiles from the backend API
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No auth token found. Redirecting to login.');
          navigate('/login');
          return;
        }
        
        // Get the current user's ID
        const currentUserId = localStorage.getItem('userId') || 'me';
        
        // Fetch potential matches
        const response = await axios.get(`${API_URL}/users/matches`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // If the matches endpoint is not available, fall back to fetching profiles individually
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          console.log("No matches available, fetching sample profiles");
          // Fallback to sample profiles
          const userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
          const profileRequests = userIds.map(id =>
            axios.get(`${API_URL}/profile/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(error => {
              console.warn(`Failed to fetch profile ${id}:`, error);
              return { data: null };
            })
          );
          
          const responses = await Promise.all(profileRequests);
          const fetchedProfiles = responses
            .map(response => response.data)
            .filter(profile => profile !== null);
          
          console.log("Fetched profiles:", fetchedProfiles);
          
          setProfiles(fetchedProfiles);
          if (fetchedProfiles.length > 0) {
            setCurrentProfile(fetchedProfiles[0]);
          }
        } else {
          console.log("Matches fetched:", response.data);
          setProfiles(response.data);
          if (response.data.length > 0) {
            setCurrentProfile(response.data[0]);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profiles:", error);
        setLoading(false);
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
    console.log(`Liked user ${currentProfile.id}`);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/users/like/${currentProfile.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error(`Error liking user ${currentProfile.id}:`, error);
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
    console.log(`Disliked user ${currentProfile.id}`);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/users/dislike/${currentProfile.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error(`Error disliking user ${currentProfile.id}:`, error);
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
    console.error("Failed to load profile image");
    setImageLoadError(true);
  };

  // Render loading state
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress color="primary" />
        </Container>
      </ThemeProvider>
    );
  }

  // Render empty state when no more profiles
  if (!currentProfile) {
    return (
      <ThemeProvider theme={theme}>
        <Container sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>No more profiles to show</Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.location.reload()}
            sx={{
              background: 'linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
              boxShadow: '0 4px 12px rgba(254, 60, 114, 0.3)',
            }}
          >
            Refresh
          </Button>
        </Container>
      </ThemeProvider>
    );
  }

  // Determine profile image URL
  const profileImageUrl = currentProfile.profilePictureURL || DEFAULT_PROFILE_IMAGE;

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm" sx={{ pt: 4, pb: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            textAlign: 'center', 
            mb: 4, 
            fontWeight: 'bold',
            background: '-webkit-linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Campus Cupid
        </Typography>
        
        <Box sx={{ flexGrow: 1, position: 'relative', mb: 4 }}>
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
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Typography variant="body1">Image not available</Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  height: '100%',
                  width: '100%',
                  bgcolor: '#f0f0f0', // Background color while image loads
                  position: 'relative',
                }}
              >
                <img
                  src={profileImageUrl}
                  alt={`${currentProfile.firstName}'s profile`}
                  onError={handleImageError}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: imageLoadError ? 'none' : 'block'
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
              <Typography variant="body1" sx={{ mt: 1 }}>
                {currentProfile.bio || 'No bio available'}
              </Typography>
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
      </Container>
    </ThemeProvider>
  );
}

export default MatcherPage;