import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Chip,
  Avatar,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  Stack,
  Card,
  CardContent,
  Fab,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  CloseRounded as CloseIcon, 
  FavoriteRounded as FavoriteIcon, 
  ArrowBackRounded as ArrowBackIcon,
  InfoRounded as InfoIcon,
  LocationOnRounded as LocationIcon,
  StarRounded as StarIcon,
  ReportRounded as ReportIcon,
  BlockRounded as BlockIcon,
  UndoRounded as UndoIcon,
  StarBorderRounded as SuperLikeIcon
} from '@mui/icons-material';
import NavBar from './common/NavBar';

const API_URL = 'http://localhost:8080';
const DEFAULT_PROFILE_IMAGE = '/default-profile.jpg';

function MatcherPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const user = JSON.parse(localStorage.getItem('user'));
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [lastSwipedProfile, setLastSwipedProfile] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const nextProfile = useCallback(() => {
    setLastSwipedProfile(currentProfile); // Save last profile for undo
    const currentIndex = profiles.findIndex(profile => profile.id === currentProfile.id);
    const nextIndex = currentIndex + 1;

    if (nextIndex < profiles.length) {
      setCurrentProfile(profiles[nextIndex]);
      setCurrentImageIndex(0);
    } else {
      setCurrentProfile(null);
    }
  }, [profiles, currentProfile]);

  const handleLike = useCallback(async () => {
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
  }, [currentProfile, nextProfile]);

  const handleDislike = useCallback(async () => {
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
  }, [currentProfile, nextProfile]);

  const handleRewind = () => {
    if (lastSwipedProfile) {
      const newProfiles = [lastSwipedProfile, ...profiles.slice(profiles.findIndex(p => p.id === lastSwipedProfile.id) + 1)];
      setProfiles(newProfiles);
      setCurrentProfile(lastSwipedProfile);
      setLastSwipedProfile(null); // Prevent multiple rewinds
      setMatchAlert({ open: true, message: 'Rewinded to the last profile!' });
    }
  };

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
        // matched=false means we want potential matches, not existing matches
        const response = await axios.get(`${API_URL}/matches/${userId}?matched=false`, {
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

  // Track profile views when currentProfile changes
  useEffect(() => {
    const trackProfileView = async () => {
      if (!currentProfile) return;
      
      try {
        const token = localStorage.getItem('token');
        
        if (!token) return;
        
        // Call the profile view tracking endpoint
        await axios.post(`${API_URL}/profile/${currentProfile.id}/view`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`Profile view tracked for user ${currentProfile.id}`);
      } catch (error) {
        console.error('Error tracking profile view:', error);
        // Don't show error to user, just log it
      }
    };

    trackProfileView();
  }, [currentProfile]);

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
  }, [handleDislike, handleLike]);

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

  const handleReportUser = async () => {
    if (!currentProfile || !reportReason.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/report/${currentProfile.id}`, {
        reason: reportReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMatchAlert({ 
        open: true, 
        message: `User reported successfully` 
      });
      
      setReportDialogOpen(false);
      setReportReason('');
    } catch (error) {
      console.error('Error reporting user:', error);
      setMatchAlert({ 
        open: true, 
        message: 'Failed to report user' 
      });
    }
  };

  const handleBlockUser = async () => {
    if (!currentProfile) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/block/${currentProfile.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMatchAlert({ 
        open: true, 
        message: `${currentProfile.firstName} has been blocked` 
      });
      
      setBlockDialogOpen(false);
      // Remove the blocked user from current profiles and move to next
      setTimeout(() => {
        nextProfile();
        setSwipeDirection(null);
        setOffsetX(0);
        setImageLoadError(false);
      }, 300);
    } catch (error) {
      console.error('Error blocking user:', error);
      setMatchAlert({ 
        open: true, 
        message: 'Failed to block user' 
      });
    }
  };

  return (
    <>
      <NavBar user={user} />
      <Box sx={{ 
        backgroundColor: 'background.default', 
        minHeight: '100vh',
        pt: 10,
        background: 'linear-gradient(to top right, #FFF0F5, #FFE4E1)'
      }}>
        <Container maxWidth="sm" sx={{ py: 4, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800,
                mb: 1,
                fontSize: { xs: '2rem', md: '2.75rem' }
              }}
              className="gradient-text"
            >
              Discover
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 400
              }}
            >
              Find your perfect match
            </Typography>
          </Box>

          {loading ? (
            <Card 
              elevation={0}
              sx={{ 
                p: 6, 
                textAlign: 'center',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.customTokens.borderRadius.xl,
              }}
            >
              <CircularProgress color="primary" size={48} />
              <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
                Finding amazing people for you...
              </Typography>
            </Card>
          ) : !currentProfile ? (
            <Card 
              elevation={0}
              sx={{ 
                p: {xs: 4, sm: 6}, 
                textAlign: 'center',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.customTokens.borderRadius.xl,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                flexGrow: 1
              }}
            >
              <StarIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
                You're all caught up!
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                We'll notify you when new matches become available
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/dashboard')}
                sx={{
                  background: theme.customTokens.gradients.primary,
                  px: 4,
                  py: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Back to Dashboard
              </Button>
            </Card>
          ) : (
            <Stack spacing={3} sx={{ flexGrow: 1, justifyContent: 'space-between' }}>
              {/* Profile Card */}
              <Box sx={{ position: 'relative', flexGrow: 1 }}>
                <Card
                  ref={cardRef}
                  elevation={0}
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: theme.customTokens.borderRadius.xl,
                    overflow: 'hidden',
                    position: 'absolute',
                    border: `1px solid ${theme.palette.divider}`,
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' },
                    ...getCardStyle()
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Gradient Overlay & Image Navigation */}
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, p: 2, zIndex: 2 }}>
                    {currentProfile.photos && currentProfile.photos.length > 1 && (
                      <Stack direction="row" spacing={1}>
                        {currentProfile.photos.map((_, index) => (
                          <Box
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            sx={{
                              flex: 1,
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: index === currentImageIndex ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
                              cursor: 'pointer',
                              transition: 'background-color 0.3s ease'
                            }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>

                  {/* Profile Images */}
                  <Box sx={{ position: 'relative', height: '100%' }}>
                    {imageLoadError ? (
                      <Box
                        sx={{
                          height: '100%',
                          width: '100%',
                          backgroundColor: 'background.paper',
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
                            bgcolor: 'primary.light'
                          }}
                        >
                          {currentProfile.firstName?.[0]}
                        </Avatar>
                        <Typography variant="body1" color="text.secondary">
                          Profile picture not available
                        </Typography>
                      </Box>
                    ) : (
                      <img
                        src={currentProfile.photos?.[currentImageIndex] || currentProfile.profilePictureURL || DEFAULT_PROFILE_IMAGE}
                        alt={`${currentProfile.firstName}'s profile`}
                        onError={handleImageError}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    )}
                  </Box>

                  {/* Profile Info Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      p: {xs: 2, sm: 3},
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                      color: 'white',
                      zIndex: 1
                    }}
                  >
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 700,
                        textShadow: '1px 1px 4px rgba(0,0,0,0.5)'
                      }}
                    >
                      {currentProfile.firstName}, {calculateAge(currentProfile.dateOfBirth)}
                    </Typography>
                    
                    {currentProfile.location?.city && (
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                        <LocationIcon sx={{ fontSize: 16 }} />
                        <Typography variant="body2">
                          {currentProfile.location.city}
                        </Typography>
                      </Stack>
                    )}

                    {currentProfile.bio && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mt: 1.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.5,
                          opacity: 0.9
                        }}
                      >
                        {currentProfile.bio}
                      </Typography>
                    )}

                    {currentProfile.interests && currentProfile.interests.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                        {currentProfile.interests.slice(0, 4).map((interest) => (
                          <Chip 
                            key={interest}
                            label={interest}
                            size="small"
                            sx={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.15)',
                              color: 'white',
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              backdropFilter: 'blur(4px)'
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Card>
              </Box>

              {/* Action Buttons */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-evenly', 
                  alignItems: 'center',
                  py: 2
                }}
              >
                <Fab size="small" sx={{ bgcolor: 'background.paper' }} onClick={handleRewind} disabled={!lastSwipedProfile}>
                  <UndoIcon color={lastSwipedProfile ? 'action' : 'disabled'} />
                </Fab>

                <Fab onClick={handleDislike} sx={{ bgcolor: 'background.paper', color: 'error.main', width: 64, height: 64 }}>
                  <CloseIcon fontSize="large" />
                </Fab>

                <Fab size="small" sx={{ bgcolor: 'background.paper', color: 'secondary.main' }}>
                  <SuperLikeIcon />
                </Fab>

                <Fab onClick={handleLike} sx={{ background: theme.customTokens.gradients.primary, color: 'white', width: 64, height: 64 }}>
                  <FavoriteIcon fontSize="large" />
                </Fab>

                <Fab size="small" sx={{ bgcolor: 'background.paper' }} onClick={handleMenuOpen}>
                  <InfoIcon color="action" />
                </Fab>
              </Box>

              {/* Action Menu */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    borderRadius: theme.customTokens.borderRadius.medium,
                    border: `1px solid ${theme.palette.divider}`,
                    mt: 1
                  }
                }}
              >
                <MenuItem onClick={() => {
                  setReportDialogOpen(true);
                  handleMenuClose();
                }}>
                  <ReportIcon sx={{ mr: 1 }} />
                  Report User
                </MenuItem>
                <MenuItem onClick={() => {
                  setBlockDialogOpen(true);
                  handleMenuClose();
                }}>
                  <BlockIcon sx={{ mr: 1 }} />
                  Block User
                </MenuItem>
              </Menu>
            </Stack>
          )}
        </Container>
      </Box>

      {/* Match Alert */}
      <Snackbar 
        open={matchAlert.open} 
        autoHideDuration={4000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity="success" 
          sx={{ 
            width: '100%',
            borderRadius: theme.customTokens.borderRadius.medium,
          }}
        >
          {matchAlert.message}
        </Alert>
      </Snackbar>

      {/* Report User Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: theme.customTokens.borderRadius.xl,
            border: `1px solid ${theme.palette.divider}`,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Report {currentProfile?.firstName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please let us know why you're reporting this user. This will help us maintain a safe community.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Describe the issue..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setReportDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReportUser}
            variant="contained"
            color="error"
            disabled={!reportReason.trim()}
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block User Dialog */}
      <Dialog
        open={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: theme.customTokens.borderRadius.xl,
            border: `1px solid ${theme.palette.divider}`,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Block {currentProfile?.firstName}?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            Are you sure you want to block this user? They won't be able to see your profile or send you messages, and you won't see them in your potential matches.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setBlockDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBlockUser}
            variant="contained"
            color="error"
          >
            Block User
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default MatcherPage;