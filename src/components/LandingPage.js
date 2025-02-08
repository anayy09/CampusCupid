import React from "react";
import { Container, Typography, Button, Grid, Card, CardContent } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PeopleIcon from "@mui/icons-material/People";
import SecurityIcon from "@mui/icons-material/Security";
import { styled } from "@mui/system";

const HeroSection = styled("div")({
  textAlign: "center",
  padding: "80px 20px",
  backgroundColor: "#ffccd5",
});

const FeaturesSection = styled("div")({
  padding: "60px 20px",
  backgroundColor: "#fff",
});

const CallToAction = styled("div")({
  textAlign: "center",
  padding: "60px 20px",
  backgroundColor: "#ffccd5",
});

const LandingPage = () => {
  return (
    <div>
      {/* Hero Section */}
      <HeroSection>
        <Typography variant="h2" gutterBottom>
          Campus Cupid
        </Typography>
        <Typography variant="h5" paragraph>
          Join millions of people connecting through love.
        </Typography>
        <Button variant="contained" color="primary" size="large">
          Get Started
        </Button>
      </HeroSection>

      {/* Features Section */}
      <FeaturesSection>
        <Container>
          <Typography variant="h4" align="center" gutterBottom>
            Why Choose Us?
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <FavoriteIcon fontSize="large" color="secondary" />
                  <Typography variant="h6" gutterBottom>
                    Smart Matching
                  </Typography>
                  <Typography>
                    Our advanced algorithm helps you find the right match.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <PeopleIcon fontSize="large" color="primary" />
                  <Typography variant="h6" gutterBottom>
                    Large Community
                  </Typography>
                  <Typography>
                    Join a diverse and growing user base looking for love.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <SecurityIcon fontSize="large" color="success" />
                  <Typography variant="h6" gutterBottom>
                    Safe & Secure
                  </Typography>
                  <Typography>
                    Your data and privacy are our top priority.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </FeaturesSection>

      {/* Call To Action */}
      <CallToAction>
        <Typography variant="h4" gutterBottom>
          Ready to Find Love?
        </Typography>
        <Button variant="contained" color="primary" size="large">
          Sign Up Now
        </Button>
      </CallToAction>
    </div>
  );
};

export default LandingPage;
