import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  AppBar,
  Toolbar,
  IconButton,
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
  useTheme
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const API_URL = 'http://localhost:8080';
const DEFAULT_PROFILE_IMAGE = '/default-profile.jpg';

function EditProfilePage() {
  const theme = useTheme();
  const navigate = useNavigate();
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f8f8f8', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: 'white', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => navigate('/dashboard')}
            sx={{ color: theme.palette.primary.main }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold', color: theme.palette.primary.main }}
          >
            Edit Profile
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="photo-upload"
                  type="file"
                  onChange={handlePhotoUpload}
                />
                <label htmlFor="photo-upload">
                  <Avatar
                    src={formData.photos[0] || DEFAULT_PROFILE_IMAGE}
                    sx={{ width: 120, height: 120, cursor: 'pointer' }}
                  />
                </label>
              </Box>

              <TextField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                fullWidth
                required
              />

              <TextField
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                fullWidth
                required
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>

              <TextField
                select
                label="Interested In"
                name="interestedIn"
                value={formData.interestedIn}
                onChange={handleInputChange}
                fullWidth
                required
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Both">Both</MenuItem>
              </TextField>

              <TextField
                select
                label="Looking For"
                name="lookingFor"
                value={formData.lookingFor}
                onChange={handleInputChange}
                fullWidth
                required
              >
                <MenuItem value="Relationship">Relationship</MenuItem>
                <MenuItem value="Friendship">Friendship</MenuItem>
                <MenuItem value="Casual">Casual</MenuItem>
              </TextField>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Interests</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  {formData.interests.map((interest, index) => (
                    <Chip
                      key={index}
                      label={interest}
                      onDelete={() => handleInterestDelete(interest)}
                    />
                  ))}
                </Box>
                <TextField
                  placeholder="Add interest (press Enter)"
                  fullWidth
                  onKeyPress={handleInterestAdd}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                sx={{
                  mt: 3,
                  background: 'linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                  color: 'white'
                }}
              >
                {saving ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>

              <Button
                color="error"
                onClick={() => setDeleteDialog(true)}
                sx={{ mt: 2 }}
              >
                Delete Account
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          Are you sure you want to delete your account? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setOpenSnackbar(false)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default EditProfilePage;