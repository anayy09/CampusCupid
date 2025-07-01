import React from "react";
import { 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Box,
  Stack,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { 
  FavoriteRounded as FavoriteIcon,
  PeopleRounded as PeopleIcon,
  SecurityRounded as SecurityIcon,
  ArrowForwardRounded as ArrowIcon,
  StarRounded as StarIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      icon: <FavoriteIcon sx={{ fontSize: 48 }} />,
      title: "Smart Matching",
      description: "Our AI-powered algorithm learns your preferences to find your perfect match based on compatibility, interests, and values."
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 48 }} />,
      title: "Campus Community",
      description: "Connect with fellow students from your campus and nearby universities in a safe, verified environment."
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 48 }} />,
      title: "Safe & Secure",
      description: "Your privacy and safety are our top priority with verified profiles, secure messaging, and robust reporting features."
    }
  ];

  const stats = [
    { number: "50K+", label: "Active Students" },
    { number: "10K+", label: "Successful Matches" },
    { number: "500+", label: "Universities" },
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: theme.customTokens.gradients.primary,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
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
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack spacing={4}>
                <Box>
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      color: 'white',
                      mb: 2,
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      fontWeight: 800,
                      lineHeight: 1.1,
                    }}
                  >
                    Find Your
                    <Box component="span" sx={{ display: 'block' }}>
                      CampusCupid
                    </Box>
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      mb: 4,
                      fontSize: { xs: '1.25rem', md: '1.5rem' },
                      fontWeight: 400,
                      lineHeight: 1.4,
                    }}
                  >
                    Connect with fellow students, build meaningful relationships, and discover love on campus.
                  </Typography>
                </Box>
                
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate("/signup")}
                    endIcon={<ArrowIcon />}
                    sx={{
                      backgroundColor: 'white',
                      color: 'primary.main',
                      px: 4,
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      borderRadius: theme.customTokens.borderRadius.medium,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Get Started Free
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate("/login")}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      px: 4,
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderWidth: 2,
                      borderRadius: theme.customTokens.borderRadius.medium,
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 2,
                      },
                    }}
                  >
                    Sign In
                  </Button>
                </Stack>

                {/* Stats */}
                <Grid container spacing={4} sx={{ mt: 2 }}>
                  {stats.map((stat, index) => (
                    <Grid item xs={4} key={index}>
                      <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            color: 'white', 
                            fontWeight: 800,
                            fontSize: { xs: '1.5rem', md: '2rem' }
                          }}
                        >
                          {stat.number}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: { xs: '0.75rem', md: '0.875rem' }
                          }}
                        >
                          {stat.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  display: { xs: 'none', md: 'block' },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    filter: 'blur(80px)',
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 400,
                  }}
                >
                  <StarIcon sx={{ fontSize: 200, color: 'rgba(255, 255, 255, 0.2)' }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Stack spacing={8} alignItems="center">
          <Box sx={{ textAlign: 'center', maxWidth: 600 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                mb: 3,
                fontWeight: 700,
                color: 'text.primary',
                fontSize: { xs: '2rem', md: '2.75rem' }
              }}
            >
              Why Students Choose 
              <Box component="span" className="gradient-text" sx={{ ml: 1 }}>
                CampusCupid
              </Box>
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 400,
                lineHeight: 1.6
              }}
            >
              Designed specifically for college life with features that help you connect authentically and safely.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card 
                  elevation={0}
                  sx={{ 
                    height: '100%',
                    p: 3,
                    border: `2px solid ${theme.palette.divider}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 40px rgba(233, 30, 99, 0.1)`,
                    }
                  }}
                >
                  <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <Stack spacing={3} alignItems="center" textAlign="center">
                      <Box
                        sx={{
                          color: 'primary.main',
                          p: 2,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(233, 30, 99, 0.1)',
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography 
                        variant="h5" 
                        sx={{ fontWeight: 600, color: 'text.primary' }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ color: 'text.secondary', lineHeight: 1.6 }}
                      >
                        {feature.description}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>

      {/* CTA Section */}
      <Box 
        sx={{ 
          backgroundColor: 'text.primary',
          py: 10
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={4} alignItems="center" textAlign="center">
            <Typography 
              variant="h2" 
              sx={{ 
                color: 'white',
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '2.75rem' }
              }}
            >
              Ready to Find Your Match?
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                maxWidth: 500,
                fontWeight: 400
              }}
            >
              Join thousands of students who have already found meaningful connections through CampusCupid.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/signup")}
              endIcon={<ArrowIcon />}
              sx={{
                backgroundColor: 'primary.main',
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: theme.customTokens.borderRadius.medium,
                '&:hover': {
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Start Your Journey
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
