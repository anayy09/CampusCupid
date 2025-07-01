import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert,
  useTheme,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  FavoriteRounded as LikeIcon,
  HeartBrokenRounded as DislikeIcon,
  CelebrationRounded as MatchIcon,
  EditRounded as ProfileUpdateIcon,
  PersonAddRounded as RegisterIcon,
  ChatRounded as MessageIcon,
  BlockRounded as BlockIcon,
  ReportRounded as ReportIcon,
  HistoryRounded as ActivityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import NavBar from './common/NavBar';

const API_URL = 'http://localhost:8080';

function ActivityLogPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    const fetchActivityLog = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_URL}/activity-log`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.activities) {
          setActivities(response.data.activities);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching activity log:', err);
        setError('Failed to load activity log');
        setOpenSnackbar(true);
        setLoading(false);
        
        if (err.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchActivityLog();
  }, [navigate]);

  const getActivityIcon = (event) => {
    switch (event) {
      case 'like':
        return <LikeIcon sx={{ color: '#ff4081' }} />;
      case 'dislike':
        return <DislikeIcon sx={{ color: '#757575' }} />;
      case 'match':
        return <MatchIcon sx={{ color: '#4caf50' }} />;
      case 'profile_update':
        return <ProfileUpdateIcon sx={{ color: '#2196f3' }} />;
      case 'register':
        return <RegisterIcon sx={{ color: '#9c27b0' }} />;
      case 'message':
        return <MessageIcon sx={{ color: '#ff9800' }} />;
      case 'block':
        return <BlockIcon sx={{ color: '#f44336' }} />;
      case 'report':
        return <ReportIcon sx={{ color: '#ff5722' }} />;
      default:
        return <ActivityIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  const getActivityColor = (event) => {
    switch (event) {
      case 'like':
        return '#ff4081';
      case 'match':
        return '#4caf50';
      case 'profile_update':
        return '#2196f3';
      case 'message':
        return '#ff9800';
      default:
        return 'text.secondary';
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
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
              Loading your activity...
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
              Activity Log
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 400
              }}
            >
              Track your dating journey
            </Typography>
          </Box>

          {/* Activity List */}
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: theme.customTokens.borderRadius.xl,
              border: `1px solid ${theme.palette.divider}`,
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: 0 }}>
              {activities.length === 0 ? (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <ActivityIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    No Activity Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start exploring to see your activity here
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {activities.map((activity, index) => (
                    <React.Fragment key={index}>
                      <ListItem 
                        sx={{ 
                          py: 3,
                          px: 3,
                          '&:hover': {
                            backgroundColor: 'rgba(233, 30, 99, 0.02)'
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 56 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              backgroundColor: `${getActivityColor(activity.event)}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {getActivityIcon(activity.event)}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {activity.message}
                              </Typography>
                              <Chip 
                                label={activity.event}
                                size="small"
                                sx={{ 
                                  backgroundColor: `${getActivityColor(activity.event)}15`,
                                  color: getActivityColor(activity.event),
                                  fontWeight: 500,
                                  fontSize: '0.75rem',
                                  textTransform: 'capitalize'
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < activities.length - 1 && (
                        <Divider component="li" sx={{ ml: 9 }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Summary Stats */}
          {activities.length > 0 && (
            <Card 
              elevation={0}
              sx={{ 
                mt: 4,
                borderRadius: theme.customTokens.borderRadius.xl,
                border: `1px solid ${theme.palette.divider}`,
                background: 'linear-gradient(135deg, rgba(233, 30, 99, 0.02) 0%, rgba(255, 87, 34, 0.02) 100%)',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Activity Summary
                </Typography>
                <Stack direction="row" spacing={4} sx={{ flexWrap: 'wrap' }}>
                  {Object.entries(
                    activities.reduce((acc, activity) => {
                      acc[activity.event] = (acc[activity.event] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([event, count]) => (
                    <Box key={event} sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: getActivityColor(event) }}>
                        {count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {event}{count !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Container>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error"
          sx={{ 
            width: '100%',
            borderRadius: theme.customTokens.borderRadius.medium,
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

export default ActivityLogPage;
