import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Autocomplete,
  Chip,
  IconButton,
  Stack,
  InputAdornment,
  Avatar,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import {
  ArrowBackRounded as ArrowBackIcon,
  ArrowForwardRounded as ArrowForwardIcon,
  EmailRounded as EmailIcon,
  LockRounded as LockIcon,
  PersonRounded as PersonIcon,
  PhotoCameraRounded as PhotoIcon,
  LocationOnRounded as LocationIcon,
  Visibility,
  VisibilityOff,
  AddPhotoAlternateRounded as AddPhotoIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://localhost:8080';

// Suggested interests for the autocomplete field
const suggestedInterests = [
  'Dancing', 'Stand-up Comedy', 'Photography', 'Cooking', 'Hiking', 'Travel',
  'Reading', 'Movies', 'Music', 'Art', 'Fitness', 'Yoga', 'Gaming', 'Technology',
  'Fashion', 'Coffee', 'Wine Tasting', 'Board Games', 'Volunteering', 'Podcasts',
  'Sports', 'Foodie', 'Meditation', 'Shopping', 'Swimming', 'Cycling', 'Singing',
  'Painting', 'Writing', 'Pets', 'Nature', 'Gardening'
];

function SignUpPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');

  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    interestedIn: '',
    lookingFor: '',
    interests: [],
    sexualOrientation: 'Straight',
    bio: '',
    photos: [],
    location: {
      latitude: null,
      longitude: null,
      city: '',
      country: ''
    }
  });

  const [previewUrls, setPreviewUrls] = useState([]);
  const [errors, setErrors] = useState({});

  const steps = ['Personal Info', 'Preferences', 'Photos & Bio'];

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            );
            
            if (response.ok) {
              const data = await response.json();
              const city = data.address.city || data.address.town || data.address.village || '';
              const country = data.address.country || '';
              
              setFormData(prev => ({
                ...prev,
                location: { latitude, longitude, city, country }
              }));
            }
          } catch (error) {
            console.error('Error fetching location details:', error);
          } finally {
            setLoadingLocation(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoadingLocation(false);
        }
      );
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0:
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) newErrors.dateOfBirth = 'You must be at least 18 years old';
        break;

      case 1:
        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (!formData.interestedIn) newErrors.interestedIn = 'Please specify who you\'re interested in';
        if (!formData.lookingFor) newErrors.lookingFor = 'Please specify what you\'re looking for';
        break;

      case 2:
        if (!formData.bio.trim()) newErrors.bio = 'Bio is required';
        if (formData.bio.length < 50) newErrors.bio = 'Bio must be at least 50 characters';
        if (formData.photos.length === 0) newErrors.photos = 'At least one photo is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleInterestChange = (event, newValue) => {
    setFormData(prev => ({ ...prev, interests: newValue }));
  };

  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    if (formData.photos.length + files.length > 6) {
      setSubmitError('You can upload a maximum of 6 photos');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    setIsUploading(true);
    
    try {
      const formDataUpload = new FormData();
      files.forEach(file => {
        formDataUpload.append('photos', file);
      });

      const response = await axios.post(
        `${API_URL}/public/upload/photos`,
        formDataUpload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const uploadedUrls = response.data.urls;
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls]
      }));

      const newPreviewUrls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    } catch (error) {
      console.error('Error uploading photos:', error);
      setSubmitError('Failed to upload photos. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/register`, formData);
      
      if (response.data.message && response.data.user_id) {
        // Show success message
        setSubmitError('Account created successfully! Please log in to continue.');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Registration successful! Please log in with your credentials.',
              email: formData.email 
            }
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitError(error.response?.data?.message || 'Registration failed. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              error={!!errors.firstName}
              helperText={errors.firstName}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              error={!!errors.dateOfBirth}
              helperText={errors.dateOfBirth}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={4}>
            <FormControl error={!!errors.gender}>
              <FormLabel sx={{ fontWeight: 600, mb: 1 }}>Gender</FormLabel>
              <RadioGroup
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                row
              >
                <FormControlLabel value="Male" control={<Radio />} label="Male" />
                <FormControlLabel value="Female" control={<Radio />} label="Female" />
                <FormControlLabel value="Non-binary" control={<Radio />} label="Non-binary" />
                <FormControlLabel value="Other" control={<Radio />} label="Other" />
              </RadioGroup>
              {errors.gender && (
                <Typography variant="caption" color="error">
                  {errors.gender}
                </Typography>
              )}
            </FormControl>

            <FormControl error={!!errors.interestedIn}>
              <FormLabel sx={{ fontWeight: 600, mb: 1 }}>Interested In</FormLabel>
              <RadioGroup
                value={formData.interestedIn}
                onChange={(e) => handleInputChange('interestedIn', e.target.value)}
                row
              >
                <FormControlLabel value="Men" control={<Radio />} label="Men" />
                <FormControlLabel value="Women" control={<Radio />} label="Women" />
                <FormControlLabel value="Everyone" control={<Radio />} label="Everyone" />
              </RadioGroup>
              {errors.interestedIn && (
                <Typography variant="caption" color="error">
                  {errors.interestedIn}
                </Typography>
              )}
            </FormControl>

            <FormControl error={!!errors.lookingFor}>
              <FormLabel sx={{ fontWeight: 600, mb: 1 }}>Looking For</FormLabel>
              <RadioGroup
                value={formData.lookingFor}
                onChange={(e) => handleInputChange('lookingFor', e.target.value)}
              >
                <FormControlLabel value="Casual dating" control={<Radio />} label="Casual dating" />
                <FormControlLabel value="Serious relationship" control={<Radio />} label="Serious relationship" />
                <FormControlLabel value="Friends" control={<Radio />} label="Friends" />
                <FormControlLabel value="Not sure" control={<Radio />} label="Not sure" />
              </RadioGroup>
              {errors.lookingFor && (
                <Typography variant="caption" color="error">
                  {errors.lookingFor}
                </Typography>
              )}
            </FormControl>

            <FormControl>
              <FormLabel sx={{ fontWeight: 600, mb: 1 }}>Sexual Orientation</FormLabel>
              <RadioGroup
                value={formData.sexualOrientation}
                onChange={(e) => handleInputChange('sexualOrientation', e.target.value)}
                row
              >
                <FormControlLabel value="Straight" control={<Radio />} label="Straight" />
                <FormControlLabel value="Gay" control={<Radio />} label="Gay" />
                <FormControlLabel value="Lesbian" control={<Radio />} label="Lesbian" />
                <FormControlLabel value="Bisexual" control={<Radio />} label="Bisexual" />
                <FormControlLabel value="Other" control={<Radio />} label="Other" />
              </RadioGroup>
            </FormControl>

            <Autocomplete
              multiple
              freeSolo
              options={suggestedInterests}
              value={formData.interests}
              onChange={handleInterestChange}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                    sx={{ 
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': { backgroundColor: 'rgba(233, 30, 99, 0.04)' }
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Interests (Optional)"
                  placeholder="Add your interests..."
                  helperText="Add up to 10 interests to help find compatible matches"
                />
              )}
            />
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={4}>
            <TextField
              fullWidth
              label="Bio"
              multiline
              rows={4}
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              error={!!errors.bio}
              helperText={errors.bio || `${formData.bio.length}/500 characters`}
              inputProps={{ maxLength: 500 }}
              placeholder="Tell others about yourself, your interests, and what you're looking for..."
            />

            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Photos {errors.photos && <Typography component="span" color="error">*</Typography>}
              </Typography>
              
              <Grid container spacing={2}>
                {previewUrls.map((url, index) => (
                  <Grid item xs={6} sm={4} key={index}>
                    <Card sx={{ position: 'relative' }}>
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        style={{
                          width: '100%',
                          height: 120,
                          objectFit: 'cover',
                          borderRadius: 8
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => removePhoto(index)}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          }
                        }}
                      >
                        ×
                      </IconButton>
                    </Card>
                  </Grid>
                ))}
                
                {formData.photos.length < 6 && (
                  <Grid item xs={6} sm={4}>
                    <Card
                      sx={{
                        height: 120,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px dashed ${theme.palette.primary.main}`,
                        backgroundColor: 'rgba(233, 30, 99, 0.04)',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(233, 30, 99, 0.08)',
                        }
                      }}
                      component="label"
                    >
                      <input
                        type="file"
                        hidden
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={isUploading}
                      />
                      <Stack alignItems="center" spacing={1}>
                        <AddPhotoIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                          {isUploading ? 'Uploading...' : 'Add Photos'}
                        </Typography>
                      </Stack>
                    </Card>
                  </Grid>
                )}
              </Grid>
              
              {errors.photos && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  {errors.photos}
                </Typography>
              )}
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Upload 1-6 photos. First photo will be your main profile picture.
              </Typography>
            </Box>

            {loadingLocation && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Getting your location...</Typography>
              </Box>
            )}

            {formData.location.city && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon color="primary" />
                <Typography variant="body2">
                  Location: {formData.location.city}, {formData.location.country}
                </Typography>
              </Box>
            )}
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.customTokens.gradients.primary,
        py: 4,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%)`,
          pointerEvents: 'none',
        }
      }}
    >
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4, md: 6 },
            borderRadius: theme.customTokens.borderRadius.xl,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 32px 64px rgba(0, 0, 0, 0.12)',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 1,
                fontSize: { xs: '2rem', sm: '2.25rem' }
              }}
              className="gradient-text"
            >
              Join CampusCupid
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                fontSize: '1.1rem',
                fontWeight: 500
              }}
            >
              Find your perfect match in just a few steps
            </Typography>
          </Box>

          {/* Progress Stepper */}
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel={!isMobile}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <LinearProgress 
              variant="determinate" 
              value={(activeStep / (steps.length - 1)) * 100}
              sx={{ 
                mt: 2, 
                height: 6, 
                borderRadius: 3,
                backgroundColor: 'rgba(233, 30, 99, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: theme.customTokens.gradients.primary,
                }
              }}
            />
          </Box>

          {/* Step Content */}
          <Box sx={{ mb: 4 }}>
            {renderStepContent(activeStep)}
          </Box>

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={activeStep === 0 ? () => navigate('/login') : handleBack}
              startIcon={<ArrowBackIcon />}
              sx={{
                color: 'text.secondary',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {activeStep === 0 ? 'Back to Login' : 'Back'}
            </Button>

            <Button
              variant="contained"
              onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
              endIcon={activeStep === steps.length - 1 ? null : <ArrowForwardIcon />}
              disabled={isSubmitting || isUploading}
              sx={{
                background: theme.customTokens.gradients.primary,
                px: 4,
                py: 1.5,
                borderRadius: theme.customTokens.borderRadius.medium,
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 8px 25px rgba(233, 30, 99, 0.3)',
                },
                '&:disabled': {
                  background: 'rgba(0, 0, 0, 0.12)',
                  color: 'rgba(0, 0, 0, 0.26)',
                  transform: 'none',
                }
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : activeStep === steps.length - 1 ? (
                'Create Account'
              ) : (
                'Continue'
              )}
            </Button>
          </Box>
        </Paper>
      </Container>

      {/* Success/Error Snackbar */}
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={snackbarSeverity === 'success' ? 3000 : 6000} 
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={snackbarSeverity} 
          sx={{ 
            width: '100%',
            borderRadius: theme.customTokens.borderRadius.medium,
          }}
        >
          {submitError}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SignUpPage;