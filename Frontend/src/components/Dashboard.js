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
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  ImageList,
  ImageListItem,
  useTheme
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Person as ProfileIcon, 
  Favorite as MatchIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  PhotoLibrary as GalleryIcon,
  LocationOn as LocationIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './common/NavBar';

const API_URL = 'https://campuscupid.onrender.com';
// Use the first uploaded photo as profile image when available, or fall back to default
const DEFAULT_PROFILE_IMAGE = '/default-profile.jpg';

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openGallery, setOpenGallery] = useState(false); // State for gallery dialog
  const theme = useTheme(); // Get theme for breakpoints

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
  
  const handleFindMatches = () => {
    navigate('/matcher');
  };

  const handleViewMatches = () => {
    navigate('/matches');
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
        <NavBar user={null} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress color="primary" />
        </Box>
      </>
    );
  }

  return (
    <>
      <NavBar user={user} />
      <Container maxWidth="md" sx={{ pt: 10, pb: 4, backgroundColor: 'background.default', minHeight: '100vh' }}>
        <Paper elevation={3} sx={{ 
          p: 4, 
          borderRadius: 3,
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          }
        }}>
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
          </Box>          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                position: 'relative'
              }}>                <Avatar
                  alt={user?.firstName}
                  src={user?.profilePictureURL || (user?.photos && user?.photos.length > 0 ? user.photos[0] : DEFAULT_PROFILE_IMAGE)}
                  sx={{ 
                    width: 200, 
                    height: 200, 
                    margin: 'auto',
                    border: '4px solid #FE3C72',
                    boxShadow: '0 8px 20px rgba(254, 60, 114, 0.25)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 12px 28px rgba(254, 60, 114, 0.3)',
                    }
                  }}
                />
                {/* Photo gallery indicator - Make it clickable */} 
                {user?.photos && user.photos.length > 0 && (
                  <Box 
                    onClick={handleOpenGallery} // Add onClick handler
                    sx={{ 
                      mt: 2, 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      cursor: 'pointer', // Add cursor pointer
                      '&:hover': {
                        opacity: 0.8
                      }
                    }}
                  >
                    <GalleryIcon color="primary" fontSize="small" />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'primary.main', 
                        fontWeight: 500,
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {user.photos.length} {user.photos.length === 1 ? 'Photo' : 'Photos'}
                    </Typography>
                  </Box>
                )}
                
                {/* Location indicator */}
                {user?.location?.city && (
                  <Box 
                    sx={{ 
                      mt: 1, 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5
                    }}
                  >
                    <LocationIcon color="action" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      {user?.location?.city}, {user?.location?.country || ''}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {user?.firstName}, <Typography component="span" color="primary.main">{calculateAge(user?.dateOfBirth)}</Typography>
              </Typography>
              
              {/* User interests as chips */}
              {user?.interests && user.interests.length > 0 && (
                <Box sx={{ mb: 2, mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {user.interests.map((interest, index) => (
                    <Chip 
                      key={index}
                      label={interest}
                      size="small"
                      sx={{ 
                        backgroundColor: 'rgba(254, 60, 114, 0.08)',
                        color: 'primary.main',
                        fontWeight: 500
                      }}
                    />
                  ))}
                </Box>
              )}
              
              <Paper
                elevation={0}
                sx={{ 
                  p: 2, 
                  mb: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 2,
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}
              >
                <Typography 
                  variant="body1" 
                  paragraph
                  sx={{
                    fontStyle: user?.bio ? 'normal' : 'italic',
                    color: user?.bio ? 'text.primary' : 'text.secondary',
                    mb: 0
                  }}
                >
                  {user?.bio || 'No bio available'}
                </Typography>
              </Paper>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Looking for:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {user?.lookingFor || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Interested in:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {user?.interestedIn || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Orientation:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {user?.sexualOrientation || 'Not specified'}
                  </Typography>
                </Grid>
              </Grid><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={2}>
                <Button 
                  variant="contained" 
                  startIcon={<EditIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                    textTransform: 'none',
                    boxShadow: '0 4px 10px rgba(254, 60, 114, 0.25)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #E31C5F 30%, #E54A22 90%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 15px rgba(254, 60, 114, 0.35)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Edit Profile
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<MatchIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                    textTransform: 'none',
                    boxShadow: '0 4px 10px rgba(254, 60, 114, 0.25)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #E31C5F 30%, #E54A22 90%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 15px rgba(254, 60, 114, 0.35)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                  onClick={handleFindMatches}
                >
                  Find Matches
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<ChatIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #24E5A0 30%, #20D3AD 90%)',
                    textTransform: 'none',
                    boxShadow: '0 4px 10px rgba(36, 229, 160, 0.25)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #20D3AD 30%, #00B377 90%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 15px rgba(36, 229, 160, 0.35)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                  onClick={handleViewMatches}
                >
                  View Matches
                </Button>
              </Stack>
            </Grid>
          </Grid>          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ 
                height: '100%',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                },
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '5px',
                  background: 'linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                }
              }}>
                <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(254, 60, 114, 0.1)', 
                    borderRadius: '50%', 
                    width: 80, 
                    height: 80, 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <ProfileIcon color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Personal Info</Typography>
                  <Box sx={{ textAlign: 'left', pl: 2 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={5}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>Email:</Typography>
                      </Grid>
                      <Grid item xs={7}>
                        <Typography variant="body2">{user?.email || 'Not set'}</Typography>
                      </Grid>
                      
                      <Grid item xs={5}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>Gender:</Typography>
                      </Grid>
                      <Grid item xs={7}>
                        <Typography variant="body2">{user?.gender || 'Not set'}</Typography>
                      </Grid>
                      
                      <Grid item xs={5}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>Preference:</Typography>
                      </Grid>
                      <Grid item xs={7}>
                        <Typography variant="body2">{user?.genderPreference || 'Not set'}</Typography>
                      </Grid>
                      
                      <Grid item xs={5}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>Age Range:</Typography>
                      </Grid>
                      <Grid item xs={7}>
                        <Typography variant="body2">{user?.ageRange || 'Not set'}</Typography>
                      </Grid>
                      
                      <Grid item xs={5}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>Distance:</Typography>
                      </Grid>
                      <Grid item xs={7}>
                        <Typography variant="body2">{user?.distance ? `${user.distance} miles` : 'Not set'}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ 
                height: '100%',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                },
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '5px',
                  background: 'linear-gradient(45deg, #FF6036 30%, #FFA07A 90%)',
                }
              }}>
                <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(255, 96, 54, 0.1)', 
                    borderRadius: '50%', 
                    width: 80, 
                    height: 80, 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <MatchIcon color="secondary" sx={{ fontSize: 40 }} />
                  </Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Matches</Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      px: 3
                    }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {user?.totalMatches || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Total Matches</Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      px: 3 
                    }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                        {user?.activeChats || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Active Chats</Typography>
                    </Box>
                  </Box>
                  
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    sx={{ 
                      mt: 2, 
                      textTransform: 'none',
                      borderRadius: '20px',
                      px: 3,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 96, 54, 0.08)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                    onClick={handleViewMatches}
                  >
                    View All Matches
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ 
                height: '100%',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                },
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '5px',
                  background: 'linear-gradient(45deg, #24E5A0 30%, #20D3AD 90%)',
                }
              }}>
                <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(36, 229, 160, 0.1)', 
                    borderRadius: '50%', 
                    width: 80, 
                    height: 80, 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <SettingsIcon sx={{ fontSize: 40, color: '#24E5A0' }} />
                  </Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Account Settings</Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>Privacy:</Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'left' }}>
                        <Chip 
                          label="Custom" 
                          size="small" 
                          sx={{ 
                            bgcolor: 'rgba(36, 229, 160, 0.1)', 
                            color: '#24E5A0',
                            fontWeight: 500
                          }} 
                        />
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>Notifications:</Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'left' }}>
                        <Chip 
                          label="On" 
                          size="small" 
                          sx={{ 
                            bgcolor: 'rgba(36, 229, 160, 0.1)', 
                            color: '#24E5A0',
                            fontWeight: 500
                          }} 
                        />
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Button 
                    variant="outlined" 
                    sx={{ 
                      mt: 1,
                      textTransform: 'none',
                      borderRadius: '20px',
                      borderColor: '#24E5A0',
                      color: '#24E5A0',
                      px: 3,
                      '&:hover': {
                        borderColor: '#00B377',
                        backgroundColor: 'rgba(36, 229, 160, 0.08)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => navigate('/settings')}
                  >
                    Manage Settings
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>        </Paper>
        
        {/* Activity feed section */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            borderRadius: 3, 
            mt: 3,
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            }
          }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3, 
              fontWeight: 600,
              borderBottom: '2px solid rgba(254, 60, 114, 0.2)',
              paddingBottom: 1
            }}
          >
            Recent Activity
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Show a message if there's no activity */}
            <Box sx={{ 
              p: 3, 
              textAlign: 'center', 
              backgroundColor: 'rgba(0, 0, 0, 0.02)', 
              borderRadius: 2 
            }}>
              <Typography color="text.secondary">
                No recent activity to show. Start matching with people to see activity here!
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleFindMatches}
                sx={{ 
                  mt: 2,
                  background: 'linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                  textTransform: 'none',
                  px: 4,
                  py: 1,
                  boxShadow: '0 4px 10px rgba(254, 60, 114, 0.25)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #E31C5F 30%, #E54A22 90%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 15px rgba(254, 60, 114, 0.35)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Find Matches Now
              </Button>
            </Box>
          </Box>
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
            sx={{ 
              width: '100%',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              borderRadius: 2
            }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Container>

      {/* Photo Gallery Dialog */}
      <Dialog 
        open={openGallery} 
        onClose={handleCloseGallery} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Photo Gallery
          <IconButton
            aria-label="close"
            onClick={handleCloseGallery}
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 1 }}>
          {user?.photos && user.photos.length > 0 ? (
            <ImageList 
              variant="masonry" 
              cols={theme.breakpoints.up('sm') ? 3 : 2} // Adjust columns based on screen size
              gap={8}
            >
              {user.photos.map((photoUrl, index) => (
                <ImageListItem key={index}>
                  <img
                    src={`${photoUrl}`}
                    srcSet={`${photoUrl}`}
                    alt={`User photo ${index + 1}`}
                    loading="lazy"
                    style={{ borderRadius: '8px', display: 'block', width: '100%' }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          ) : (
            <Typography sx={{ textAlign: 'center', p: 3 }}>No photos available.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DashboardPage;