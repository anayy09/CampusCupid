import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  ThemeProvider,
  createTheme,
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
  Dialog,
  DialogContent,
  Zoom,
  IconButton
} from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FE3C72',
      light: '#FF7A9C',
      dark: '#E31C5F',
    },
    secondary: {
      main: '#FF6036',
    }
  },
  shape: {
    borderRadius: 8,
  },
});

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

function SignUpPage() {
  const navigate = useNavigate();
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
    bio: '',
    sexualOrientation: '',
    photos: [],
  });
  const [previewUrls, setPreviewUrls] = useState([]);
  const [errors, setErrors] = useState({
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
  });
  const [showCelebration, setShowCelebration] = useState(false);

  const steps = ['Basic Info', 'Preferences', 'Bio & Photos'];

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
      setErrors(prev => ({...prev, dateOfBirth: 'You must be at least 18 years old to register'}));
      return false;
    } else {
      setErrors(prev => ({...prev, dateOfBirth: ''}));
      return true;
    }
  };

  // Validate password
  const validatePassword = () => {
    if (formData.password.length < 8) {
      setErrors(prev => ({...prev, password: 'Password must be at least 8 characters'}));
      return false;
    } else {
      setErrors(prev => ({...prev, password: ''}));
      return true;
    }
  };

  // Validate confirm password
  const validateConfirmPassword = () => {
    if (formData.password !== formData.confirmPassword) {
      setErrors(prev => ({...prev, confirmPassword: 'Passwords do not match'}));
      return false;
    } else {
      setErrors(prev => ({...prev, confirmPassword: ''}));
      return true;
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Check if user is 18+ and passwords are valid before proceeding
      const isAgeValid = formData.dateOfBirth && validateAge(formData.dateOfBirth);
      const isPasswordValid = formData.password && validatePassword();
      const isConfirmPasswordValid = formData.confirmPassword && validateConfirmPassword();
      
      if (isAgeValid && isPasswordValid && isConfirmPasswordValid) {
        setActiveStep((prevStep) => prevStep + 1);
      } else {
        // Trigger validations to show errors
        if (formData.dateOfBirth) validateAge(formData.dateOfBirth);
        if (formData.password) validatePassword();
        if (formData.confirmPassword) validateConfirmPassword();
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
  };

  const handleDateOfBirthChange = (event) => {
    const newDob = event.target.value;
    setFormData({
      ...formData,
      dateOfBirth: newDob,
    });
    validateAge(newDob);
  };

  const handlePasswordChange = (event) => {
    const newPassword = event.target.value;
    setFormData({
      ...formData,
      password: newPassword,
    });
    
    // Only validate if there's content to avoid immediate errors when starting to type
    if (newPassword) {
      validatePassword();
      // If confirm password has content, validate it again since password changed
      if (formData.confirmPassword) {
        validateConfirmPassword();
      }
    }
  };

  const handleConfirmPasswordChange = (event) => {
    const newConfirmPassword = event.target.value;
    setFormData({
      ...formData,
      confirmPassword: newConfirmPassword,
    });
    
    // Only validate if there's content
    if (newConfirmPassword && formData.password) {
      validateConfirmPassword();
    }
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

  const handleSubmit = async () => {
    console.log('Form submitted:', formData);
    
    // Show celebration dialog
    setShowCelebration(true);
    
    // After 3 seconds, close the celebration and proceed
    setTimeout(() => {
      setShowCelebration(false);
      // navigate('/'); // Uncomment this to navigate after celebration
    }, 3000);

    try {
        const response = await fetch('https://c9a3-68-101-69-114.ngrok-free.app/register', {
            mode: 'cors',
            method: 'POST',
            headers: {  // Headers must be inside an object
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "ageRange": "string",
                "bio": formData.bio,
                "createdAt": "string",
                "distance": 0,
                "email": formData.email,
                "genderPreference": formData.interestedIn,
                "id": 0,
                "interests": formData.interests.join(','),
                "password": formData.password,
                "profilePictureURL": "string",
                "updatedAt": "string",
                "username": formData.firstName
            })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        console.log('Success:', result);
    } catch (error) {
        console.error('API Error:', error.message);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <StyledTextField
              fullWidth
              color="primary"
              label="First Name"
              value={formData.firstName}
              onChange={handleInputChange('firstName')}
              margin="normal"
              InputProps={{
                style: { color: '#757575' }, // Tinder's gray color
              }}
            />
            <StyledTextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              margin="normal"
              InputProps={{
                style: { color: '#757575' }, // Tinder's gray color
              }}
            />
            <StyledTextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={handlePasswordChange}
              margin="normal"
              error={!!errors.password}
              helperText={errors.password || "Must be at least 8 characters"}
              InputProps={{
                style: { color: '#757575' },
              }}
            />
            <StyledTextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleConfirmPasswordChange}
              margin="normal"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                style: { color: '#757575' },
              }}
            />
            <StyledTextField
              fullWidth
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
                style: { color: '#757575' }, // Tinder's gray color
              }}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
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

            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
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

            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
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

            {/* New Interests field with scrollable dropdown */}
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
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            {/* Bio section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                About You
              </Typography>
              <StyledTextField
                fullWidth
                label="Bio"
                multiline
                rows={4}
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={handleInputChange('bio')}
                margin="normal"
                helperText="A good bio increases your chances of finding matches. Max 500 characters."
                inputProps={{ maxLength: 500 }}
                InputProps={{
                  style: { color: '#757575' },
                }}
              />
              <Typography variant="body2" sx={{ textAlign: 'right', color: 'text.secondary' }}>
                {formData.bio.length}/500
              </Typography>
            </Box>
            
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
  
  // Celebration Dialog
  const CelebrationDialog = () => (
    <Dialog 
      open={showCelebration} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent sx={{ 
        textAlign: 'center', 
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '20px',
        padding: 4
      }}>
        <Zoom in={showCelebration} timeout={500}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 2, 
                fontWeight: 'bold',
                background: '-webkit-linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'pulse 1.5s infinite'
              }}
            >
              Welcome to Campus Cupid!
            </Typography>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Your account has been created successfully!
            </Typography>
            <Box sx={{ 
              fontSize: '4rem', 
              display: 'flex',
              justifyContent: 'center',
              animation: 'bounce 1s infinite alternate'
            }}>
              ❤️ 💕 ❤️
            </Box>
          </Box>
        </Zoom>
      </DialogContent>
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes bounce {
          from { transform: translateY(0px); }
          to { transform: translateY(-15px); }
        }
      `}</style>
    </Dialog>
  );

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Box sx={{ minHeight: '100vh', py: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
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
      <CelebrationDialog />
    </ThemeProvider>
  );
}

export default SignUpPage;