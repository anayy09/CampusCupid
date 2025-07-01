import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Avatar, 
  Grid, 
  Button, 
  Card,
  CardContent,
  IconButton,
  Snackbar,
  Alert,
  Stack,
  CircularProgress,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  ImageList,
  ImageListItem,
  useTheme,
  useMediaQuery,
  Divider,
  Badge
} from '@mui/material';
import {
  EditRounded as EditIcon,
  PersonRounded as ProfileIcon,
  FavoriteRounded as MatchIcon,
  ChatRounded as ChatIcon,
  SettingsRounded as SettingsIcon,
  PhotoLibraryRounded as GalleryIcon,
  LocationOnRounded as LocationIcon,
  CloseRounded as CloseIcon,
  TrendingUpRounded as TrendingIcon,
  NotificationsRounded as NotificationsIcon,
  VerifiedRounded as VerifiedIcon,
  HistoryRounded as ActivityIcon,
  AdminPanelSettingsRounded as AdminIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './common/NavBar';

const API_URL = 'http://localhost:8080';
const DEFAULT_PROFILE_IMAGE = '/default-profile.jpg';

function DashboardPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [user, setUser] = useState(() => {
    // Initialize with user data from localStorage if available
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openGallery, setOpenGallery] = useState(false);

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

        // Preserve admin status from localStorage
        const storedUser = localStorage.getItem('user');
        const storedUserData = storedUser ? JSON.parse(storedUser) : {};
        
        setUser({
          ...response.data,
          isAdmin: storedUserData.isAdmin || response.data.isAdmin || false
        });
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

  const handleOpenGallery = () => {
    setOpenGallery(true);
  };

  const handleCloseGallery = () => {
    setOpenGallery(false);
  };

  if (loading) {
    return (
      <>
        <NavBar user={user} />
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: 'linear-gradient(135deg, rgba(233, 30, 99, 0.05) 0%, rgba(255, 87, 34, 0.05) 100%)'
        }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress color="primary" size={48} />
            <Typography variant="h6" color="text.secondary">
              Loading your profile...
            </Typography>
          </Stack>
        </Box>
      </>
    );
  }

  const statsCards = [
    {
      title: 'Total Matches',
      value: user?.totalMatches || 0,
      icon: <MatchIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main,
      bgColor: 'rgba(233, 30, 99, 0.1)',
      action: () => navigate('/matches')
    },
    {
      title: 'Active Chats',
      value: user?.activeChats || 0,
      icon: <ChatIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.secondary.main,
      bgColor: 'rgba(255, 87, 34, 0.1)',
      action: () => navigate('/matches')
    },
    {
      title: 'Profile Views',
      value: user?.profileViews || 0,
      icon: <TrendingIcon sx={{ fontSize: 40 }} />,
      color: '#00BCD4',
      bgColor: 'rgba(0, 188, 212, 0.1)',
      action: () => navigate('/editprofile')
    }
  ];

  return (
    <>
      <NavBar user={user} />
      <Box sx={{ 
        backgroundColor: 'background.default', 
        minHeight: '100vh',
        pt: 10
      }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Welcome Header */}
          <Box sx={{ mb: 4, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800,
                mb: 1,
                fontSize: { xs: '2rem', md: '2.75rem' }
              }}
            >
              Welcome back, 
              <Box component="span" className="gradient-text" sx={{ ml: 1 }}>
                {user?.firstName}!
              </Box>
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 400
              }}
            >
              Here's what's happening in your love life
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* Profile Section */}
            <Grid item xs={12} lg={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: theme.customTokens.borderRadius.xl,
                  border: `1px solid ${theme.palette.divider}`,
                  height: 'fit-content',
                  position: 'sticky',
                  top: 100,
                }}
              >
                <Stack spacing={3} alignItems="center">
                  {/* Profile Picture */}
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      alt={user?.firstName}
                      src={user?.profilePictureURL || (user?.photos && user?.photos.length > 0 ? user.photos[0] : DEFAULT_PROFILE_IMAGE)}
                      sx={{ 
                        width: { xs: 120, md: 150 }, 
                        height: { xs: 120, md: 150 },
                        border: `4px solid ${theme.palette.primary.main}`,
                        boxShadow: `0 8px 32px rgba(233, 30, 99, 0.2)`,
                      }}
                    />
                    <Badge
                      badgeContent={<VerifiedIcon sx={{ fontSize: 16 }} />}
                      color="primary"
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        '& .MuiBadge-badge': {
                          backgroundColor: theme.palette.primary.main,
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                        }
                      }}
                    />
                  </Box>

                  {/* User Info */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 700,
                        mb: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1
                      }}
                    >
                      {user?.firstName}
                      <Typography 
                        component="span" 
                        sx={{ 
                          color: 'primary.main',
                          fontSize: 'inherit',
                          fontWeight: 'inherit'
                        }}
                      >
                        , {calculateAge(user?.dateOfBirth)}
                      </Typography>
                    </Typography>
                    
                    {/* Location */}
                    {user?.location?.city && (
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.5,
                          mb: 2
                        }}
                      >
                        <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {user?.location?.city}, {user?.location?.country || ''}
                        </Typography>
                      </Box>
                    )}

                    {/* Bio */}
                    <Typography 
                      variant="body1" 
                      sx={{
                        color: 'text.secondary',
                        fontStyle: user?.bio ? 'normal' : 'italic',
                        mb: 2,
                        lineHeight: 1.6
                      }}
                    >
                      {user?.bio || 'No bio available'}
                    </Typography>

                    {/* Interests */}
                    {user?.interests && user.interests.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          Interests
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                          {user.interests.slice(0, 6).map((interest, index) => (
                            <Chip 
                              key={index}
                              label={interest}
                              size="small"
                              sx={{ 
                                backgroundColor: 'rgba(233, 30, 99, 0.08)',
                                color: 'primary.main',
                                fontWeight: 500,
                                fontSize: '0.75rem'
                              }}
                            />
                          ))}
                          {user.interests.length > 6 && (
                            <Chip 
                              label={`+${user.interests.length - 6} more`}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                borderColor: 'primary.main',
                                color: 'primary.main',
                                fontSize: '0.75rem'
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Photo Gallery Button */}
                    {user?.photos && user.photos.length > 0 && (
                      <Button 
                        onClick={handleOpenGallery} 
                        startIcon={<GalleryIcon />}
                        variant="outlined"
                        size="small"
                        sx={{ 
                          mb: 3,
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          '&:hover': {
                            backgroundColor: 'rgba(233, 30, 99, 0.04)',
                            borderColor: 'primary.dark',
                          }
                        }}
                      >
                        View {user.photos.length} Photo{user.photos.length !== 1 ? 's' : ''}
                      </Button>
                    )}

                    {/* Action Buttons */}
                    <Stack spacing={2} sx={{ width: '100%' }}>
                      <Button 
                        variant="contained" 
                        startIcon={<EditIcon />}
                        onClick={() => navigate('/editprofile')}
                        sx={{
                          background: theme.customTokens.gradients.primary,
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 1.5,
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 8px 25px rgba(233, 30, 99, 0.3)',
                          }
                        }}
                      >
                        Edit Profile
                      </Button>
                      
                      <Button 
                        variant="outlined" 
                        startIcon={<MatchIcon />}
                        onClick={() => navigate('/matcher')}
                        sx={{
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 1.5,
                          '&:hover': {
                            backgroundColor: 'rgba(233, 30, 99, 0.04)',
                            borderColor: 'primary.dark',
                            transform: 'translateY(-1px)',
                          }
                        }}
                      >
                        Find Matches
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Main Content */}
            <Grid item xs={12} lg={8}>
              <Stack spacing={4}>
                {/* Stats Cards */}
                <Grid container spacing={3}>
                  {statsCards.map((stat, index) => (
                    <Grid item xs={12} sm={4} key={index}>
                      <Card 
                        elevation={0}
                        sx={{ 
                          p: 3,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: theme.customTokens.borderRadius.large,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 12px 32px rgba(0, 0, 0, 0.08)`,
                            borderColor: stat.color,
                          }
                        }}
                        onClick={stat.action}
                      >
                        <Stack spacing={2}>
                          <Box
                            sx={{
                              width: 64,
                              height: 64,
                              borderRadius: '50%',
                              backgroundColor: stat.bgColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: stat.color
                            }}
                          >
                            {stat.icon}
                          </Box>
                          <Box>
                            <Typography variant="h3" sx={{ fontWeight: 800, color: stat.color }}>
                              {stat.value}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              {stat.title}
                            </Typography>
                          </Box>
                        </Stack>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Quick Actions */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: theme.customTokens.borderRadius.xl,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                    Quick Actions
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ChatIcon />}
                        onClick={() => navigate('/matches')}
                        sx={{
                          py: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: 'divider',
                          color: 'text.primary',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'rgba(233, 30, 99, 0.04)',
                          }
                        }}
                      >
                        Messages
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                        onClick={() => navigate('/settings')}
                        sx={{
                          py: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: 'divider',
                          color: 'text.primary',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'rgba(233, 30, 99, 0.04)',
                          }
                        }}
                      >
                        Settings
                      </Button>
                    </Grid>
                    {user?.isAdmin && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<ActivityIcon />}
                          onClick={() => navigate('/activity-log')}
                          sx={{
                            py: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: 'divider',
                            color: 'text.primary',
                            '&:hover': {
                              borderColor: 'primary.main',
                              backgroundColor: 'rgba(233, 30, 99, 0.04)',
                            }
                          }}
                        >
                          Activity Log
                        </Button>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ProfileIcon />}
                        onClick={() => navigate('/editprofile')}
                        sx={{
                          py: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: 'divider',
                          color: 'text.primary',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'rgba(233, 30, 99, 0.04)',
                          }
                        }}
                      >
                        Edit Profile
                      </Button>
                    </Grid>
                  </Grid>
                  
                  {/* Admin Panel Link - Show only for admin users */}
                  {user?.isAdmin && (
                    <Box sx={{ mt: 3 }}>
                      <Divider sx={{ mb: 3 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'error.main' }}>
                        Admin Panel
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AdminIcon />}
                        onClick={() => navigate('/admin/reports')}
                        color="error"
                        sx={{
                          py: 2,
                          px: 3,
                          textTransform: 'none',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: 'rgba(244, 67, 54, 0.04)',
                          }
                        }}
                      >
                        View Reports
                      </Button>
                    </Box>
                  )}
                </Paper>

                {/* Profile Completion */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: theme.customTokens.borderRadius.xl,
                    border: `1px solid ${theme.palette.divider}`,
                    background: 'linear-gradient(135deg, rgba(233, 30, 99, 0.02) 0%, rgba(255, 87, 34, 0.02) 100%)',
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                    Profile Completion
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Complete your profile to get better matches and increase your visibility.
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Profile Strength
                      </Typography>
                      <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                        85%
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: '100%',
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(233, 30, 99, 0.1)',
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          width: '85%',
                          height: '100%',
                          background: theme.customTokens.gradients.primary,
                          borderRadius: 4,
                        }}
                      />
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => navigate('/editprofile')}
                    sx={{
                      background: theme.customTokens.gradients.primary,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Complete Profile
                  </Button>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Photo Gallery Dialog */}
      <Dialog 
        open={openGallery} 
        onClose={handleCloseGallery} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: theme.customTokens.borderRadius.xl,
            border: `1px solid ${theme.palette.divider}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Photo Gallery
          </Typography>
          <IconButton
            onClick={handleCloseGallery}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {user?.photos && user.photos.length > 0 ? (
            <ImageList 
              variant="masonry" 
              cols={isMobile ? 2 : 3} 
              gap={12}
            >
              {user.photos.map((photoUrl, index) => (
                <ImageListItem key={index}>
                  <img
                    src={photoUrl}
                    alt={`Profile ${index + 1}`}
                    loading="lazy"
                    style={{ 
                      borderRadius: theme.customTokens.borderRadius.medium,
                      display: 'block', 
                      width: '100%' 
                    }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          ) : (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              No photos available.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="error" 
          sx={{ 
            width: '100%',
            borderRadius: theme.customTokens.borderRadius.medium,
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

export default DashboardPage;