import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Autocomplete from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Chip from '@mui/material/Chip';
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
  styled,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';

const StyledTextField = styled(TextField)({
  '& label.Mui-focused': {
    color: '#FE3C72',
  },
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused fieldset': {
      borderColor: '#FE3C72',
    },
    '&:hover fieldset': {
      borderColor: '#FF6036',
    },
  },
});

const ImageUploadBox = styled(Box)({
  width: '100%',
  height: 200,
  border: '2px dashed #FE3C72',
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  margin: '8px 0',
  padding: '16px',
  '&:hover': {
    borderColor: '#FF6036',
    backgroundColor: 'rgba(254, 60, 114, 0.05)',
  },
});

// List of suggested interests for the autocomplete field
const suggestedInterests = [
  'Dancing',
  'Stand-up Comedy',
  'Photography',
  'Cooking',
  'Hiking',
  'Travel',
  'Reading',
  'Movies',
  'Music',
  'Art',
  'Fitness',
  'Yoga',
  'Gaming',
  'Technology',
  'Fashion',
  'Coffee',
  'Wine Tasting',
  'Board Games',
  'Volunteering',
  'Podcasts',
  'Sports',
  'Foodie',
  'Meditation',
  'Shopping',
  'Swimming',
  'Cycling',
  'Singing',
  'Painting',
  'Writing',
  'Pets',
  'Nature',
  'Gardening'
];

const API_URL = process.env.REACT_APP_API_URL || 'https://campuscupid.onrender.com';

function SignUpPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const navigateToHome = () => {
    navigate('/');
  };

  const [activeStep, setActiveStep] = useState(0);
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
    sexualOrientation: 'Straight', // Default value
    bio: '', // Added bio field
    photos: [],
    location: {
      latitude: null,
      longitude: null,
      city: '',
      country: ''
    }
  });
  const [previewUrls, setPreviewUrls] = useState([]);
  const [errors, setErrors] = useState({
    dateOfBirth: '',
    password: '',
    bio: '',
    location: ''
  });
  const [submitError, setSubmitError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const steps = ['Basic Info', 'About You', 'Photos'];

  // Get user's location when component mounts
  useEffect(() => {
    getUserLocation();
  }, []);

  // Function to get user's location
  const getUserLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Use reverse geocoding to get city and country
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            );
            
            if (response.ok) {
              const data = await response.json();
              const city = data.address.city || data.address.town || data.address.village || '';
              const country = data.address.country || '';
              
              setFormData(prev => ({
                ...prev,
                location: {
                  latitude,
                  longitude,
                  city,
                  country
                }
              }));
            } else {
              // If reverse geocoding fails, just store coordinates
              setFormData(prev => ({
                ...prev,
                location: {
                  latitude,
                  longitude,
                  city: '',
                  country: ''
                }
              }));
            }
          } catch (error) {
            console.error('Error fetching location details:', error);
            setErrors(prev => ({
              ...prev,
              location: 'Failed to get location details. Please try again or enter manually.'
            }));
          } finally {
            setLoadingLocation(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setErrors(prev => ({
            ...prev,
            location: 'Failed to get location. Please enable location services or enter manually.'
          }));
          setLoadingLocation(false);
        }
      );
    } else {
      setErrors(prev => ({
        ...prev,
        location: 'Geolocation is not supported by this browser.'
      }));
      setLoadingLocation(false);
    }
  };

  // Handle manual location input
  const handleLocationChange = (field) => (event) => {
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        [field]: event.target.value
      }
    });
  };

  // Validate age (18+)
  const validateAge = (dateString) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      setErrors({...errors, dateOfBirth: 'You must be at least 18 years old to register'});
      return false;
    } else {
      setErrors({...errors, dateOfBirth: ''});
      return true;
    }
  };

  // Validate password match
  const validatePassword = () => {
    if (formData.password !== formData.confirmPassword) {
      setErrors({...errors, password: 'Passwords do not match'});
      return false;
    } else {
      setErrors({...errors, password: ''});
      return true;
    }
  };

  // Validate bio length
  const validateBio = (bioText) => {
    if (bioText.length > 500) {
      setErrors({...errors, bio: 'Bio must be 500 characters or less'});
      return false;
    } else {
      setErrors({...errors, bio: ''});
      return true;
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Check if user is 18+ and passwords match before proceeding
      if (formData.dateOfBirth && validateAge(formData.dateOfBirth) && validatePassword()) {
        setActiveStep((prevStep) => prevStep + 1);
      }
    } else if (activeStep === 1) {
      // Validate bio before proceeding
      if (validateBio(formData.bio)) {
        setActiveStep((prevStep) => prevStep + 1);
      }
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });

    // Validate bio as user types
    if (field === 'bio') {
      validateBio(event.target.value);
    }
  };

  const handleDateOfBirthChange = (event) => {
    const newDob = event.target.value;
    setFormData({
      ...formData,
      dateOfBirth: newDob,
    });
    validateAge(newDob);
  };

  const handleInterestsChange = (event, newValue) => {
    setFormData({
      ...formData,
      interests: newValue
    });
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    const newPhotos = [...formData.photos];
    const newPreviewUrls = [...previewUrls];

    files.forEach(file => {
      if (newPhotos.length < 9) {
        newPhotos.push(file);
        const previewUrl = URL.createObjectURL(file);
        newPreviewUrls.push(previewUrl);
      }
    });

    setFormData({
      ...formData,
      photos: newPhotos
    });
    setPreviewUrls(newPreviewUrls);
  };

  // Convert form data to match backend API expectations
  const prepareFormDataForSubmission = () => {
    // Map the gender values to match backend expectations
    const genderMap = {
      'woman': 'Female',
      'man': 'Male',
      'other': 'Other'
    };

    // Map the interestedIn values to match backend expectations
    const interestedInMap = {
      'women': 'Female',
      'men': 'Male',
      'everyone': 'Both'
    };

    // Map the lookingFor values to match backend expectations
    const lookingForMap = {
      'longTerm': 'Relationship',
      'shortTerm': 'Casual',
      'casual': 'Casual',
      'friendship': 'Friendship'
    };

    // Convert photo files to filenames or URLs
    // In a real app, you would upload these files to a server and get back URLs
    const photoUrls = formData.photos.map((photo, index) => 
      `photo${index + 1}.jpg`
    );

    return {
      firstName: formData.firstName,
      email: formData.email,
      password: formData.password,
      dateOfBirth: formData.dateOfBirth,
      gender: genderMap[formData.gender] || formData.gender,
      interestedIn: interestedInMap[formData.interestedIn] || formData.interestedIn,
      lookingFor: lookingForMap[formData.lookingFor] || formData.lookingFor,
      interests: formData.interests,
      sexualOrientation: formData.sexualOrientation,
      bio: formData.bio,
      photos: photoUrls,
      location: {
        latitude: formData.location.latitude,
        longitude: formData.location.longitude,
        city: formData.location.city,
        country: formData.location.country
      }
    };
  };

  const handleSubmit = async () => {
    try {
      // Check if at least 2 photos are uploaded
      if (formData.photos.length < 2) {
        setSubmitError('Please upload at least 2 photos');
        setOpenSnackbar(true);
        return;
      }

      // Prepare data for API
      const apiData = prepareFormDataForSubmission();
      console.log('Submitting data to API:', apiData);
   
      // Make API call to register endpoint
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      // Simply redirect to login page after successful registration (no animation)
      navigate('/login');
      
    } catch (error) {
      console.error('Error during registration:', error);
      setSubmitError(error.message);
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <StyledTextField
              fullWidth
              required
              color="primary"
              label="First Name"
              value={formData.firstName}
              onChange={handleInputChange('firstName')}
              margin="normal"
              InputProps={{
                style: { color: '#757575' },
              }}
            />
            <StyledTextField
              fullWidth
              required
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              margin="normal"
              InputProps={{
                style: { color: '#757575' },
              }}
            />
            <StyledTextField
              fullWidth
              required
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              margin="normal"
              InputProps={{
                style: { color: '#757575' },
              }}
            />
            <StyledTextField
              fullWidth
              required
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              margin="normal"
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                style: { color: '#757575' },
              }}
            />
            <StyledTextField
              fullWidth
              required
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleDateOfBirthChange}
              margin="normal"
              error={!!errors.dateOfBirth}
              helperText={errors.dateOfBirth}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                style: { color: '#757575' },
              }}
            />
            
            {/* Location Information */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Your Location</Typography>
              
              {loadingLocation ? (
                <Box display="flex" alignItems="center" gap={2}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Detecting your location...</Typography>
                </Box>
              ) : (
                <>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={getUserLocation}
                    sx={{ mb: 2 }}
                  >
                    Detect My Location
                  </Button>
                  
                  {errors.location && (
                    <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                      {errors.location}
                    </Typography>
                  )}
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <StyledTextField
                        fullWidth
                        label="City"
                        value={formData.location.city}
                        onChange={handleLocationChange('city')}
                        InputProps={{
                          style: { color: '#757575' },
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <StyledTextField
                        fullWidth
                        label="Country"
                        value={formData.location.country}
                        onChange={handleLocationChange('country')}
                        InputProps={{
                          style: { color: '#757575' },
                        }}
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }} required>
              <FormLabel component="legend">I am a</FormLabel>
              <RadioGroup
                value={formData.gender}
                onChange={handleInputChange('gender')}
              >
                <FormControlLabel value="woman" control={<Radio />} label="Woman" />
                <FormControlLabel value="man" control={<Radio />} label="Man" />
                <FormControlLabel value="other" control={<Radio />} label="Other" />
              </RadioGroup>
            </FormControl>

            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }} required>
              <FormLabel component="legend">Interested in</FormLabel>
              <RadioGroup
                value={formData.interestedIn}
                onChange={handleInputChange('interestedIn')}
              >
                <FormControlLabel value="women" control={<Radio />} label="Women" />
                <FormControlLabel value="men" control={<Radio />} label="Men" />
                <FormControlLabel value="everyone" control={<Radio />} label="Everyone" />
              </RadioGroup>
            </FormControl>

            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }} required>
              <FormLabel component="legend">Looking for</FormLabel>
              <RadioGroup
                value={formData.lookingFor}
                onChange={handleInputChange('lookingFor')}
              >
                <FormControlLabel value="longTerm" control={<Radio />} label="Long-term Relationship" />
                <FormControlLabel value="shortTerm" control={<Radio />} label="Short-term Relationship" />
                <FormControlLabel value="casual" control={<Radio />} label="Casual Dating" />
                <FormControlLabel value="friendship" control={<Radio />} label="Friendship" />
              </RadioGroup>
            </FormControl>

            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }} required>
              <FormLabel component="legend">Sexual Orientation</FormLabel>
              <RadioGroup
                value={formData.sexualOrientation}
                onChange={handleInputChange('sexualOrientation')}
              >
                <FormControlLabel value="Straight" control={<Radio />} label="Straight" />
                <FormControlLabel value="Gay" control={<Radio />} label="Gay" />
                <FormControlLabel value="Lesbian" control={<Radio />} label="Lesbian" />
                <FormControlLabel value="Bisexual" control={<Radio />} label="Bisexual" />
                <FormControlLabel value="Other" control={<Radio />} label="Other" />
              </RadioGroup>
            </FormControl>

            <Box sx={{ mb: 3, width: '100%' }}>
              <FormLabel component="legend" sx={{ mb: 1 }}>Your Interests</FormLabel>
              <Autocomplete
                multiple
                id="interests-tags"
                options={suggestedInterests}
                value={formData.interests}
                onChange={handleInterestsChange}
                freeSolo
                ListboxProps={{
                  style: { maxHeight: '150px', overflow: 'auto' }
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      sx={{ 
                        borderColor: theme.palette.primary.main,
                        margin: '2px' 
                      }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <StyledTextField
                    {...params}
                    placeholder="Add your interests"
                    helperText="Add up to 5 interests that define you"
                  />
                )}
                sx={{ mt: 1 }}
              />
            </Box>

            <Box sx={{ mb: 3, width: '100%' }}>
              <FormLabel component="legend" sx={{ mb: 1 }}>About You</FormLabel>
              <StyledTextField
                fullWidth
                multiline
                rows={4}
                label="Your Bio"
                placeholder="Tell others about yourself..."
                value={formData.bio}
                onChange={handleInputChange('bio')}
                margin="normal"
                error={!!errors.bio}
                helperText={errors.bio || `${formData.bio.length}/500 characters`}
                InputProps={{
                  style: { color: '#757575' },
                }}
              />
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Add your photos (2-9)
            </Typography>
            <Grid container spacing={2}>
              {previewUrls.map((url, index) => (
                <Grid item xs={6} sm={4} key={index}>
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                </Grid>
              ))}
              {previewUrls.length < 9 && (
                <Grid item xs={6} sm={4}>
                  <ImageUploadBox component="label">
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                    />
                    <Typography variant="body1" color="primary" textAlign="center">
                      Click to upload photo
                    </Typography>
                    <Typography variant="caption" color="text.secondary" textAlign="center">
                      {previewUrls.length === 0 
                        ? 'Add at least 2 photos'
                        : `${previewUrls.length}/9 photos uploaded`}
                    </Typography>
                  </ImageUploadBox>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, position: 'relative' }}>
          {/* Home navigation button */}
          <IconButton
            onClick={() => navigate('/')}
            sx={{
              position: 'absolute',
              left: 16,
              top: 16,
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: 'rgba(254, 60, 114, 0.1)',
              },
            }}
            aria-label="back to home"
          >
            <ArrowBackIcon />
          </IconButton>

          <Typography
            variant="h4"
            sx={{
              textAlign: 'center',
              mb: 4,
              fontWeight: 'bold',
              background: '-webkit-linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Join Campus Cupid
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ color: '#FE3C72' }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
              sx={{
                background: 'linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #E31C5F 30%, #E31C5F 90%)',
                },
              }}
            >
              {activeStep === steps.length - 1 ? 'Create Account' : 'Next'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default SignUpPage;