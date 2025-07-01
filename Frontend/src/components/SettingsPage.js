import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Switch, 
  Button, 
  TextField, 
  MenuItem,
  Slider,
  Divider,
  FormControlLabel,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Stack,
  useTheme,
  useMediaQuery,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  NotificationsRounded as NotificationsIcon,
  SecurityRounded as SecurityIcon,
  TuneRounded as PreferencesIcon,
  AccountCircleRounded as AccountIcon,
  LogoutRounded as LogoutIcon,
  DeleteRounded as DeleteIcon,
  SaveRounded as SaveIcon,
  BlockRounded as BlockIcon,
  PersonRemoveRounded as UnblockIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './common/NavBar';
// API URL
const API_URL = 'http://localhost:8080';

function SettingsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [userToUnblock, setUserToUnblock] = useState(null);
  
  const [settings, setSettings] = useState({
    notifications: {
      newMatches: true,
      messages: true,
      appUpdates: false,
    },
    privacy: {
      showOnlineStatus: true,
      showLastActive: true,
      showDistance: true,
    },
    preferences: {
      ageRangeMin: 18,
      ageRangeMax: 35,
      distance: 25,
      showMe: 'everyone', // 'men', 'women', 'everyone'
    },
    account: {
      email: '',
      phone: '',
      city: '',
      country: '',
    }
  });
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
          navigate('/login');
          return;
        }

        // Fetch user profile data
        const profileResponse = await axios.get(`${API_URL}/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Fetch user settings data
        const settingsResponse = await axios.get(`${API_URL}/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUser(profileResponse.data);
        
        // Set blocked users if available
        if (profileResponse.data.blockedUsers) {
          setBlockedUsers(profileResponse.data.blockedUsers);
        }
        
        // Populate settings with combined data from both endpoints
        if (profileResponse.data || settingsResponse.data) {
          setSettings(prevSettings => ({
            ...prevSettings,
            notifications: settingsResponse.data.notificationSettings || prevSettings.notifications,
            privacy: settingsResponse.data.privacySettings || prevSettings.privacy,
            preferences: {
              ...prevSettings.preferences,
              ageRangeMin: profileResponse.data.ageRangeMin || 18,
              ageRangeMax: profileResponse.data.ageRangeMax || 35,
              distance: profileResponse.data.distance || 25,
              showMe: profileResponse.data.genderPreference?.toLowerCase() === 'female' ? 'women' : 
                     profileResponse.data.genderPreference?.toLowerCase() === 'male' ? 'men' : 'everyone',
            },
            account: {
              ...prevSettings.account,
              email: profileResponse.data.email || '',
              phone: settingsResponse.data.phone || profileResponse.data.phone || '',
              city: settingsResponse.data.city || '',
              country: settingsResponse.data.country || '',
            }
          }));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setSnackbarSeverity('error');
        setSnackbarMessage('Failed to load profile');
        setOpenSnackbar(true);
        setLoading(false);
        
        if (err.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleNotificationChange = (setting) => (event) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [setting]: event.target.checked,
      }
    });
  };

  const handlePrivacyChange = (setting) => (event) => {
    setSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [setting]: event.target.checked,
      }
    });
  };

  const handleAgeRangeChange = (event, newValue) => {
    setSettings({
      ...settings,
      preferences: {
        ...settings.preferences,
        ageRangeMin: newValue[0],
        ageRangeMax: newValue[1],
      }
    });
  };

  const handleDistanceChange = (event, newValue) => {
    setSettings({
      ...settings,
      preferences: {
        ...settings.preferences,
        distance: newValue,
      }
    });
  };

  const handleShowMeChange = (event) => {
    setSettings({
      ...settings,
      preferences: {
        ...settings.preferences,
        showMe: event.target.value,
      }
    });
  };

  const handleAccountChange = (field) => (event) => {
    setSettings({
      ...settings,
      account: {
        ...settings.account,
        [field]: event.target.value,
      }
    });
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        navigate('/login');
        return;
      }

      // Map the settings to the format expected by your API
      const settingsData = {
        notificationSettings: settings.notifications,
        privacySettings: settings.privacy,
        city: settings.account.city || '',
        country: settings.account.country || '',
        phone: settings.account.phone || ''
      };

      // Make API call to update user settings using the settings endpoint
      await axios.put(`${API_URL}/settings`, settingsData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Also update preferences using the profile endpoint if they changed
      const preferencesData = {
        ageRangeMin: settings.preferences.ageRangeMin,
        ageRangeMax: settings.preferences.ageRangeMax,
        distance: settings.preferences.distance,
        genderPreference: settings.preferences.showMe === 'women' ? 'Female' : 
                          settings.preferences.showMe === 'men' ? 'Male' : 'Both',
        email: settings.account.email
      };

      await axios.put(`${API_URL}/profile/${userId}`, preferencesData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSnackbarSeverity('success');
      setSnackbarMessage('Settings saved successfully');
      setOpenSnackbar(true);
    } catch (err) {
      console.error('Error saving settings:', err);
      setSnackbarSeverity('error');
      setSnackbarMessage('Failed to save settings');
      setOpenSnackbar(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleUnblockUser = async () => {
    if (!userToUnblock) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_URL}/block/${userToUnblock}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBlockedUsers(prev => prev.filter(id => id !== userToUnblock));
      setSnackbarSeverity('success');
      setSnackbarMessage('User unblocked successfully');
      setOpenSnackbar(true);
      setUnblockDialogOpen(false);
      setUserToUnblock(null);
    } catch (err) {
      console.error('Error unblocking user:', err);
      setSnackbarSeverity('error');
      setSnackbarMessage('Failed to unblock user');
      setOpenSnackbar(true);
    }
  };

  if (loading) {
    return (
      <>
        <NavBar user={user} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress color="primary" />
        </Box>
      </>
    );
  }

  return (
    <>
      <NavBar user={user} />
      <Box sx={{ 
        pt: 10, 
        pb: 4, 
        backgroundColor: 'background.default', 
        minHeight: '100vh' 
      }}>
        <Container maxWidth="md">
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
              Settings
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 400
              }}
            >
              Customize your CampusCupid experience
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {/* Account Settings */}
            <Grid item xs={12}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: theme.customTokens.borderRadius.xl,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <AccountIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Account Settings
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        value={settings.account.email}
                        onChange={handleAccountChange('email')}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="City"
                        value={settings.account.city}
                        onChange={handleAccountChange('city')}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Country"
                        value={settings.account.country}
                        onChange={handleAccountChange('country')}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={settings.account.phone}
                        onChange={handleAccountChange('phone')}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        spacing={2} 
                        sx={{ mt: 2 }}
                      >
                        <Button
                          variant="outlined"
                          sx={{
                            borderWidth: 2,
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': {
                              borderWidth: 2,
                              transform: 'translateY(-2px)',
                            }
                          }}
                        >
                          Change Password
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          sx={{
                            borderWidth: 2,
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': {
                              borderWidth: 2,
                              transform: 'translateY(-2px)',
                            }
                          }}
                        >
                          Deactivate Account
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Preferences Settings */}
            <Grid item xs={12} md={6}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: theme.customTokens.borderRadius.xl,
                  border: `1px solid ${theme.palette.divider}`,
                  height: '100%'
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <PreferencesIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Dating Preferences
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 3 }} />
                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>Show me</Typography>
                  <TextField
                    select
                    fullWidth
                    value={settings.preferences.showMe}
                    onChange={handleShowMeChange}
                    variant="outlined"
                  >
                    <MenuItem value="women">Women</MenuItem>
                    <MenuItem value="men">Men</MenuItem>
                    <MenuItem value="everyone">Everyone</MenuItem>
                  </TextField>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Age range: {settings.preferences.ageRangeMin} - {settings.preferences.ageRangeMax}
                  </Typography>
                  <Slider
                    value={[settings.preferences.ageRangeMin, settings.preferences.ageRangeMax]}
                    onChange={handleAgeRangeChange}
                    valueLabelDisplay="auto"
                    min={18}
                    max={100}
                    sx={{ 
                      color: '#FE3C72',
                      '& .MuiSlider-thumb': {
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: '0 0 0 8px rgba(254, 60, 114, 0.16)'
                        }
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Maximum distance: {settings.preferences.distance} miles
                  </Typography>
                  <Slider
                    value={settings.preferences.distance}
                    onChange={handleDistanceChange}
                    valueLabelDisplay="auto"
                    min={1}
                    max={100}
                    sx={{ 
                      color: '#FE3C72',
                      '& .MuiSlider-thumb': {
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: '0 0 0 8px rgba(254, 60, 114, 0.16)'
                        }
                      }
                    }}
                  />
                </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Privacy & Notifications Settings */}
            <Grid item xs={12} md={6}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: theme.customTokens.borderRadius.xl,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <NotificationsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Notifications
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 3 }} />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.newMatches}
                      onChange={handleNotificationChange('newMatches')}
                      color="primary"
                    />
                  }
                  label="New Matches"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.messages}
                      onChange={handleNotificationChange('messages')}
                      color="primary"
                    />
                  }
                  label="Messages"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.appUpdates}
                      onChange={handleNotificationChange('appUpdates')}
                      color="primary"
                    />
                  }
                  label="App Updates"
                />
                </CardContent>

              <Divider />

              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <SecurityIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Privacy
                  </Typography>
                </Stack>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.privacy.showOnlineStatus}
                      onChange={handlePrivacyChange('showOnlineStatus')}
                      color="primary"
                    />
                  }
                  label="Show Online Status"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.privacy.showLastActive}
                      onChange={handlePrivacyChange('showLastActive')}
                      color="primary"
                    />
                  }
                  label="Show Last Active Time"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.privacy.showDistance}
                      onChange={handlePrivacyChange('showDistance')}
                      color="primary"
                    />
                  }
                  label="Show Distance"
                />
                </CardContent>
              </Card>
            </Grid>
            
            {/* Blocked Users Management */}
            <Grid item xs={12}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: theme.customTokens.borderRadius.xl,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <BlockIcon sx={{ fontSize: 28, color: 'error.main' }} />
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Blocked Users
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 3 }} />
                  
                  {blockedUsers.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <BlockIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        No blocked users
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Users you block will appear here
                      </Typography>
                    </Box>
                  ) : (
                    <List sx={{ width: '100%' }}>
                      {blockedUsers.map((userId, index) => (
                        <ListItem
                          key={userId}
                          sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            mb: 2,
                            '&:last-child': { mb: 0 }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'error.light' }}>
                              <BlockIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`User #${userId}`}
                            secondary="Blocked user"
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<UnblockIcon />}
                            onClick={() => {
                              setUserToUnblock(userId);
                              setUnblockDialogOpen(true);
                            }}
                            sx={{
                              borderColor: 'error.main',
                              color: 'error.main',
                              '&:hover': {
                                borderColor: 'error.dark',
                                backgroundColor: 'rgba(244, 67, 54, 0.04)'
                              }
                            }}
                          >
                            Unblock
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Save Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button
                  variant="contained"
                  onClick={handleSaveSettings}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  sx={{
                    py: 2,
                    px: 4,
                    background: theme.customTokens.gradients.primary,
                    fontSize: '1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: theme.customTokens.borderRadius.medium,
                    minWidth: 200,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(233, 30, 99, 0.3)',
                    },
                    '&:disabled': {
                      background: 'rgba(0, 0, 0, 0.12)',
                      color: 'rgba(0, 0, 0, 0.26)',
                      transform: 'none',
                    }
                  }}
                >
                  {saving ? 'Saving Changes...' : 'Save All Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Unblock User Dialog */}
      <Dialog
        open={unblockDialogOpen}
        onClose={() => setUnblockDialogOpen(false)}
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
          Unblock User?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            Are you sure you want to unblock User #{userToUnblock}? This will allow them to see your profile and interact with you again.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setUnblockDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUnblockUser}
            variant="contained"
            color="error"
          >
            Unblock User
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default SettingsPage;
