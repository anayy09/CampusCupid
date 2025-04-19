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
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './common/NavBar';
import ThemeProvider from './common/ThemeProvider';
// API URL
const API_URL = process.env.REACT_APP_API_URL || 'https://campuscupid.onrender.com';

function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    }
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
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
        
        // Populate settings with user data if available
        if (response.data) {
          setSettings(prevSettings => ({
            ...prevSettings,
            preferences: {
              ...prevSettings.preferences,
              ageRangeMin: response.data.ageRangeMin || 18,
              ageRangeMax: response.data.ageRangeMax || 35,
              distance: response.data.distance || 25,
              showMe: response.data.genderPreference?.toLowerCase() === 'female' ? 'women' : 
                     response.data.genderPreference?.toLowerCase() === 'male' ? 'men' : 'everyone',
            },
            account: {
              ...prevSettings.account,
              email: response.data.email || '',
              phone: response.data.phone || '',
            }
          }));
        }
        
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
      const updateData = {
        ageRangeMin: settings.preferences.ageRangeMin,
        ageRangeMax: settings.preferences.ageRangeMax,
        distance: settings.preferences.distance,
        genderPreference: settings.preferences.showMe === 'women' ? 'Female' : 
                          settings.preferences.showMe === 'men' ? 'Male' : 'Both',
        email: settings.account.email,
        phone: settings.account.phone,
        // Add other settings as needed for your API
        notifications: settings.notifications,
        privacy: settings.privacy
      };

      // Make API call to update user settings
      await axios.put(`${API_URL}/profile/${userId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Settings saved successfully');
      setOpenSnackbar(true);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
      setOpenSnackbar(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
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
      <Box sx={{ pt: 10, pb: 4, backgroundColor: 'background.default', minHeight: '100vh' }}>
        <Container maxWidth="md">
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 4, 
              fontWeight: 'bold',
              background: '-webkit-linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Settings
          </Typography>
          
          <Grid container spacing={3}>
            {/* Account Settings */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Account</Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={settings.account.email}
                      onChange={handleAccountChange('email')}
                      variant="outlined"
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={settings.account.phone}
                      onChange={handleAccountChange('phone')}
                      variant="outlined"
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      sx={{ mr: 2 }}
                    >
                      Change Password
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                    >
                      Deactivate Account
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Preferences Settings */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, mb: 3, height: '100%', borderRadius: 3 }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Dating Preferences</Typography>
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
              </Paper>
            </Grid>

            {/* Privacy & Notifications Settings */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Notifications</Typography>
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
              </Paper>

              <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Privacy</Typography>
                <Divider sx={{ mb: 3 }} />
                
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
              </Paper>
            </Grid>
            
            {/* Save Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveSettings}
                  disabled={saving}
                  sx={{
                    background: 'linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                    textTransform: 'none',
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem'
                  }}
                >
                  {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </>
  );
}

export default SettingsPage;
