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
  AdminPanelSettingsRounded as AdminIcon,
  ArrowForwardRounded as ArrowForwardIcon
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

  // Mock profile completion for demonstration
  const profileCompletion = 85;

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
          background: 'linear-gradient(to top right, #FFF0F5, #FFE4E1)' // Softer gradient
        }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress color="primary" size={48} />
            <Typography variant="h6" color="text.secondary">
              Loading your dashboard...
            </Typography>
          </Stack>
        </Box>
      </>
    );
  }

  const stats = [
    {
      title: 'Total Matches',
      value: user?.totalMatches || 0,
      icon: <MatchIcon sx={{ fontSize: 28 }} />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Active Chats',
      value: user?.activeChats || 0,
      icon: <ChatIcon sx={{ fontSize: 28 }} />,
      color: theme.palette.secondary.main,
    },
    {
      title: 'Profile Views',
      value: user?.profileViews || 0,
      icon: <TrendingIcon sx={{ fontSize: 28 }} />,
      color: '#00BCD4',
    }
  ];

  return (
    <>
      <NavBar user={user} />
      <Box sx={{ 
        backgroundColor: 'background.default', 
        minHeight: '100vh',
        pt: 10,
        background: 'linear-gradient(to top right, #FFF0F5, #FFE4E1)'
      }}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Welcome Header */}
          <Box sx={{ mb: 4, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800,
                mb: 1,
                fontSize: { xs: '2.5rem', md: '3rem' }
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
              Here's your daily snapshot. Ready to find a connection?
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* Profile Section */}
            <Grid item xs={12} lg={4}>
              <Paper
                elevation={0}
                sx={{
                  p: {xs: 2, md: 3},
                  borderRadius: theme.customTokens.borderRadius.xl,
                  border: `1px solid ${theme.palette.divider}`,
                  height: '100%',
                  position: 'sticky',
                  top: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <Stack spacing={3} alignItems="center">
                  {/* Profile Picture with Completion Ring */}
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    <CircularProgress
                      variant="determinate"
                      value={profileCompletion}
                      size={170}
                      thickness={2.5}
                      sx={{ 
                        color: 'primary.main',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        mt: '-85px',
                        ml: '-85px',
                        transform: 'rotate(-90deg)',
                        '& .MuiCircularProgress-circle': {
                          strokeLinecap: 'round',
                        },
                      }}
                    />
                    <Avatar
                      alt={user?.firstName}
                      src={user?.profilePictureURL || (user?.photos && user?.photos.length > 0 ? user.photos[0] : DEFAULT_PROFILE_IMAGE)}
                      sx={{ 
                        width: 150, 
                        height: 150,
                        border: `4px solid ${theme.palette.background.paper}`,
                      }}
                    />
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <VerifiedIcon color="primary" sx={{ 
                          fontSize: 32, 
                          background: 'white', 
                          borderRadius: '50%',
                          p: '2px'
                        }} />
                      }
                    />
                  </Box>

                  {/* User Info */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {user?.firstName}
                      <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                        , {calculateAge(user?.dateOfBirth)}
                      </Typography>
                    </Typography>
                    
                    {user?.location?.city && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                        <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {user?.location?.city}, {user?.location?.country || ''}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Bio */}
                  <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', fontStyle: user?.bio ? 'normal' : 'italic' }}>
                    "{user?.bio || 'Your bio is empty. Add a few words to attract more attention!'}"
                  </Typography>

                  {/* Interests */}
                  {user?.interests && user.interests.length > 0 && (
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, textAlign: 'center' }}>
                        Interests
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                        {user.interests.slice(0, 5).map((interest) => (
                          <Chip key={interest} label={interest} size="small" variant="outlined" color="primary" />
                        ))}
                        {user.interests.length > 5 && (
                          <Chip label={`+${user.interests.length - 5}`} size="small" />
                        )}
                      </Box>
                    </Box>
                  )}
                </Stack>
                
                {/* Action Buttons */}
                <Stack spacing={1.5} sx={{ width: '100%', mt: 4 }}>
                  <Button 
                    variant="contained" 
                    startIcon={<EditIcon />}
                    onClick={() => navigate('/editprofile')}
                    sx={{ textTransform: 'none', fontWeight: 600, py: 1.5 }}
                  >
                    Edit Profile
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<GalleryIcon />}
                    onClick={handleOpenGallery}
                    sx={{ textTransform: 'none', fontWeight: 600, py: 1.5 }}
                  >
                    View Gallery ({user?.photos?.length || 0})
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            {/* Main Content */}
            <Grid item xs={12} lg={8}>
              <Stack spacing={4}>
                {/* Matcher Card */}
                <Card
                  elevation={0}
                  onClick={() => navigate('/matcher')}
                  sx={{
                    p: 4,
                    borderRadius: theme.customTokens.borderRadius.xl,
                    border: `1px solid ${theme.palette.divider}`,
                    background: theme.customTokens.gradients.primary,
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 32px rgba(233, 30, 99, 0.3)`,
                    }
                  }}
                >
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      Find Your Match
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Start swiping and discover new connections today.
                    </Typography>
                  </Box>
                  <ArrowForwardIcon sx={{ fontSize: 40 }} />
                </Card>

                {/* Stats & Quick Actions */}
                <Paper
                  elevation={0}
                  sx={{
                    p: {xs: 2, md: 3},
                    borderRadius: theme.customTokens.borderRadius.xl,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                    Your Activity
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    {stats.map((stat) => (
                      <Grid item xs={12} sm={4} key={stat.title}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color, width: 56, height: 56 }}>
                            {stat.icon}
                          </Avatar>
                          <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                              {stat.value}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              {stat.title}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    ))}
                  </Grid>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
                    <Button fullWidth variant="outlined" startIcon={<ChatIcon />} onClick={() => navigate('/matches')}>
                      Messages
                    </Button>
                    <Button fullWidth variant="outlined" startIcon={<SettingsIcon />} onClick={() => navigate('/settings')}>
                      Settings
                    </Button>
                    <Button fullWidth variant="outlined" startIcon={<NotificationsIcon />} onClick={() => navigate('/notifications')}>
                      Notifications
                    </Button>
                  </Stack>
                </Paper>

                {/* Admin Panel */}
                {user?.isAdmin && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: {xs: 2, md: 3},
                      borderRadius: theme.customTokens.borderRadius.xl,
                      border: `1px solid ${theme.palette.error.main}`,
                      backgroundColor: 'rgba(244, 67, 54, 0.05)'
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'error.dark' }}>
                      Admin Tools
                    </Typography>
                    <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<AdminIcon />}
                        onClick={() => navigate('/admin/reports')}
                      >
                        View Reports
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<ActivityIcon />}
                        onClick={() => navigate('/activity-log')}
                      >
                        Activity Log
                      </Button>
                    </Stack>
                  </Paper>
                )}
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