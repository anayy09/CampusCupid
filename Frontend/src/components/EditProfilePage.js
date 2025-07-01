import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  Card,
  CardContent,
  Grid,
  useMediaQuery,
  Fab,
  Divider,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  ArrowBackRounded as ArrowBackIcon,
  EditRounded as EditIcon,
  SaveRounded as SaveIcon,
  DeleteRounded as DeleteIcon,
  PhotoCameraRounded as PhotoIcon,
  PersonRounded as PersonIcon,
  VpnKeyRounded as PasswordIcon,
  ExitToAppRounded as LogoutIcon,
  DeleteForeverRounded as DeleteForeverIcon,
  AddAPhotoRounded as AddAPhotoIcon
} from '@mui/icons-material';
import NavBar from './common/NavBar';

const API_URL = 'http://localhost:8080';
const DEFAULT_PROFILE_IMAGE = '/default-profile.jpg';

function EditProfilePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const user = JSON.parse(localStorage.getItem('user'));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    dateOfBirth: '',
    gender: '',
    interestedIn: '',
    lookingFor: '',
    interests: [],
    photos: [],
    bio: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        const response = await axios.get(`${API_URL}/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setFormData({
          ...response.data,
          dateOfBirth: response.data.dateOfBirth ? response.data.dateOfBirth.split('T')[0] : ''
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to load profile');
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInterestDelete = (interestToDelete) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToDelete)
    }));
  };

  const handleInterestAdd = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      const newInterest = e.target.value.trim();
      if (newInterest && !formData.interests.includes(newInterest)) {
        setFormData(prev => ({
          ...prev,
          interests: [...prev.interests, newInterest]
        }));
      }
      e.target.value = '';
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, response.data.url]
      }));
    } catch (err) {
      setError('Failed to upload photo');
      setOpenSnackbar(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      await axios.put(`${API_URL}/profile/${userId}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      navigate('/dashboard');
    } catch (err) {
      setError('Failed to save changes');
      setOpenSnackbar(true);
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      await axios.delete(`${API_URL}/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.clear();
      navigate('/login');
    } catch (err) {
      setError('Failed to delete account');
      setOpenSnackbar(true);
    }
  };

  if (loading) {
    return (
      <>
        <NavBar user={user} />
        <Box sx={{
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
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
              Loading profile...
            </Typography>
          </Card>
        </Box>
      </>
    );
  }

  return (
    <>
      <NavBar user={user} />
      <Box sx={{
        minHeight: '100vh',
        background: theme.customTokens.gradients.primary,
        pt: 10,
        pb: 6
      }}>
        <Container maxWidth="md">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 1,
                color: 'white',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                fontSize: { xs: '2.5rem', md: '3rem' }
              }}
            >
              Edit Your Profile
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 400
              }}
            >
              Keep your profile fresh and up-to-date!
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              borderRadius: theme.customTokens.borderRadius.xl,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 32px 64px rgba(0, 0, 0, 0.12)',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3, md: 5 } }}>
              <form onSubmit={handleSubmit}>
                <Stack spacing={5}>
                  {/* Profile Photo Section */}
                  <Box sx={{ textAlign: 'center' }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="photo-upload"
                      type="file"
                      onChange={handlePhotoUpload}
                    />
                    <label htmlFor="photo-upload">
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <Avatar
                          src={formData.photos[0] || DEFAULT_PROFILE_IMAGE}
                          sx={{
                            width: 140,
                            height: 140,
                            cursor: 'pointer',
                            border: `4px solid ${theme.palette.background.paper}`,
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.16)',
                            }
                          }}
                        />
                        <Fab
                          size="small"
                          component="span"
                          sx={{
                            position: 'absolute',
                            bottom: 5,
                            right: 5,
                            background: theme.customTokens.gradients.primary,
                            color: 'white',
                            width: 40,
                            height: 40,
                            '&:hover': {
                              transform: 'scale(1.1)',
                            }
                          }}
                        >
                          <AddAPhotoIcon />
                        </Fab>
                      </Box>
                    </label>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 2,
                        color: 'text.secondary',
                        fontWeight: 500
                      }}
                    >
                      Click image to change main profile photo
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 0 }} />

                  {/* Form Fields */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ width: { xs: '100%', sm: `calc(50% - ${theme.spacing(1.5)})` } }}>
                      <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        variant="outlined"
                      />
                    </Box>

                    <Box sx={{ width: { xs: '100%', sm: `calc(50% - ${theme.spacing(1.5)})` } }}>
                      <TextField
                        fullWidth
                        label="Date of Birth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>

                    <Box sx={{ width: '100%' }}>
                      <TextField
                        fullWidth
                        label="Bio"
                        name="bio"
                        multiline
                        rows={4}
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us something interesting about yourself..."
                        helperText={`${formData.bio ? formData.bio.length : 0}/500 characters`}
                        inputProps={{ maxLength: 500 }}
                      />
                    </Box>

                    <Box sx={{ width: { xs: '100%', sm: `calc(50% - ${theme.spacing(1.5)})` } }}>
                      <TextField
                        fullWidth
                        select
                        label="Gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                      >
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Non-Binary">Non-Binary</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </TextField>
                    </Box>

                    <Box sx={{ width: { xs: '100%', sm: `calc(50% - ${theme.spacing(1.5)})` } }}>
                      <TextField
                        fullWidth
                        select
                        label="Interested In"
                        name="interestedIn"
                        value={formData.interestedIn}
                        onChange={handleInputChange}
                      >
                        <MenuItem value="Men">Men</MenuItem>
                        <MenuItem value="Women">Women</MenuItem>
                        <MenuItem value="Everyone">Everyone</MenuItem>
                      </TextField>
                    </Box>

                    <Box sx={{ width: '100%' }}>
                      <TextField
                        fullWidth
                        select
                        label="Looking For"
                        name="lookingFor"
                        value={formData.lookingFor}
                        onChange={handleInputChange}
                      >
                        <MenuItem value="Casual dating">Casual dating</MenuItem>
                        <MenuItem value="Serious relationship">Serious relationship</MenuItem>
                        <MenuItem value="Friends">Friends</MenuItem>
                        <MenuItem value="Not sure">Not sure</MenuItem>
                      </TextField>
                    </Box>
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        fontWeight: 600
                      }}
                    >
                      Your Interests
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {formData.interests.map((interest) => (
                        <Chip
                          key={interest}
                          label={interest}
                          onDelete={() => handleInterestDelete(interest)}
                          sx={{
                            backgroundColor: 'rgba(233, 30, 99, 0.08)',
                            color: 'primary.main',
                            fontWeight: 600,
                            '&:hover': {
                              backgroundColor: 'rgba(233, 30, 99, 0.12)',
                            },
                            '.MuiChip-deleteIcon': {
                              color: 'primary.main',
                              '&:hover': {
                                color: 'primary.dark'
                              }
                            }
                          }}
                        />
                      ))}
                    </Box>
                    <TextField
                      fullWidth
                      label="Add an interest"
                      onKeyDown={handleInterestAdd}
                      placeholder="Type and press Enter to add"
                    />
                  </Box>

                  {/* Action Buttons */}
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ pt: 3 }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={saving}
                      startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      sx={{
                        py: 1.5,
                        background: theme.customTokens.gradients.primary,
                        fontSize: '1rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        flex: 1,
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
                      {saving ? 'Saving...' : 'Save All Changes'}
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={() => navigate('/dashboard')}
                      sx={{
                        py: 1.5,
                        borderWidth: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                        borderColor: 'grey.400',
                        color: 'text.secondary',
                        '&:hover': {
                          borderWidth: 2,
                          borderColor: 'text.primary',
                          color: 'text.primary',
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>

                  <Divider sx={{ my: 2, borderColor: 'rgba(0,0,0,0.1)' }} />

                  {/* Danger Zone */}
                  <Box>
                    <Typography variant="h6" color="error" sx={{ fontWeight: 700, mb: 2 }}>
                      Danger Zone
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteForeverIcon />}
                        onClick={() => setDeleteDialog(true)}
                        sx={{ flex: 1, textTransform: 'none', fontWeight: 600, py: 1.5 }}
                      >
                        Delete My Account
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </form>
            </CardContent>
          </Paper>
        </Container>
      </Box>

      {/* Delete Account Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: theme.customTokens.borderRadius.large,
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Delete Account
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your account? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDeleteDialog(false)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={error ? "error" : "success"}
          sx={{
            width: '100%',
            borderRadius: theme.customTokens.borderRadius.medium,
          }}
        >
          {error || 'Profile updated successfully!'}
        </Alert>
      </Snackbar>
    </>
  );
}

export default EditProfilePage;