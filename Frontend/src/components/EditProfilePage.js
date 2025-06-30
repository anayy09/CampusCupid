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
  Divider
} from '@mui/material';
import { 
  ArrowBackRounded as ArrowBackIcon,
  EditRounded as EditIcon,
  SaveRounded as SaveIcon,
  DeleteRounded as DeleteIcon,
  PhotoCameraRounded as PhotoIcon,
  PersonRounded as PersonIcon
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
    photos: []
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        const response = await axios.get(`${API_URL}/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setFormData(response.data);
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
      if (!formData.interests.includes(e.target.value)) {
        setFormData(prev => ({
          ...prev,
          interests: [...prev.interests, e.target.value]
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
        backgroundColor: 'background.default', 
        minHeight: '100vh',
        pt: 10
      }}>
        <Container maxWidth="md" sx={{ py: 4 }}>
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
              Edit Profile
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 400
              }}
            >
              Update your profile information
            </Typography>
          </Box>

          <Card
            elevation={0}
            sx={{
              borderRadius: theme.customTokens.borderRadius.xl,
              border: `1px solid ${theme.palette.divider}`,
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <form onSubmit={handleSubmit}>
                <Stack spacing={4}>
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
                            width: 120, 
                            height: 120, 
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
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            backgroundColor: 'primary.main',
                            color: 'white',
                            width: 36,
                            height: 36,
                            '&:hover': {
                              backgroundColor: 'primary.dark',
                              transform: 'scale(1.1)',
                            }
                          }}
                        >
                          <PhotoIcon fontSize="small" />
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
                      Click to change profile photo
                    </Typography>
                  </Box>

                  <Divider />

                  {/* Form Fields */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                        label="Date of Birth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        InputLabelProps={{ shrink: true }}
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
                        select
                        label="Gender"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          }
                        }}
                      >
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Non-Binary">Non-Binary</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        label="Interested In"
                        value={formData.interestedIn}
                        onChange={(e) => setFormData({ ...formData, interestedIn: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          }
                        }}
                      >
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Both">Both</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        select
                        label="Looking For"
                        value={formData.lookingFor}
                        onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          }
                        }}
                      >
                        <MenuItem value="Long-term relationship">Long-term relationship</MenuItem>
                        <MenuItem value="Short-term relationship">Short-term relationship</MenuItem>
                        <MenuItem value="Casual dating">Casual dating</MenuItem>
                        <MenuItem value="Friendship">Friendship</MenuItem>
                        <MenuItem value="Not sure">Not sure</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>

                  {/* Interests Section */}
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 2, 
                        fontWeight: 600 
                      }}
                    >
                      Interests
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {formData.interests.map((interest, index) => (
                        <Chip
                          key={index}
                          label={interest}
                          onDelete={() => {
                            const newInterests = formData.interests.filter((_, i) => i !== index);
                            setFormData({ ...formData, interests: newInterests });
                          }}
                          sx={{
                            backgroundColor: 'rgba(233, 30, 99, 0.08)',
                            color: 'primary.main',
                            fontWeight: 500,
                            '&:hover': {
                              backgroundColor: 'rgba(233, 30, 99, 0.12)',
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>

                  {/* Action Buttons */}
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={2} 
                    sx={{ pt: 2 }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={saving}
                      startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      sx={{
                        py: 2,
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
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/dashboard')}
                      sx={{
                        py: 2,
                        borderWidth: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          borderWidth: 2,
                          backgroundColor: 'rgba(233, 30, 99, 0.04)',
                          transform: 'translateY(-2px)',
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              </form>
            </CardContent>
          </Card>
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