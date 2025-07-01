import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Button,
  Stack,
  Divider,
  useTheme,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  ArrowBackRounded as BackIcon,
  NotificationsRounded as NotificationsIcon,
  FavoriteRounded as MatchIcon,
  ChatRounded as MessageIcon,
  PersonRounded as LikeIcon,
  MarkEmailReadRounded as MarkReadIcon,
  CheckRounded as CheckIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import NavBar from './common/NavBar';

const NotificationsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      await fetchNotifications(50); // Load more notifications for the full page
      setLoading(false);
    };

    loadNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      markAsRead([notification.id]);
    }

    // Handle navigation based on notification type
    try {
      const data = JSON.parse(notification.data || '{}');
      switch (notification.type) {
        case 'match':
          navigate('/matches');
          break;
        case 'message':
          navigate('/matches');
          break;
        case 'like':
          navigate('/matcher');
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error parsing notification data:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'match':
        return <MatchIcon sx={{ color: theme.palette.error.main }} />;
      case 'message':
        return <MessageIcon sx={{ color: theme.palette.primary.main }} />;
      case 'like':
        return <LikeIcon sx={{ color: theme.palette.warning.main }} />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'match':
        return theme.palette.error.light;
      case 'message':
        return theme.palette.primary.light;
      case 'like':
        return theme.palette.warning.light;
      default:
        return theme.palette.grey[200];
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  return (
    <>
      <NavBar user={user} />
      <Container maxWidth="md" sx={{ mt: 12, mb: 4 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3,
            borderRadius: theme.customTokens?.borderRadius?.large || 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <IconButton 
                onClick={() => navigate(-1)}
                sx={{ color: 'text.secondary' }}
              >
                <BackIcon />
              </IconButton>
              <Typography variant="h4" sx={{ fontWeight: 700, flex: 1 }}>
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Button
                  startIcon={<MarkReadIcon />}
                  onClick={markAllAsRead}
                  variant="outlined"
                  size="small"
                >
                  Mark all read
                </Button>
              )}
            </Stack>

            {/* Filter Buttons */}
            <Stack direction="row" spacing={1}>
              <Button
                variant={filter === 'all' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'read' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setFilter('read')}
              >
                Read ({notifications.length - unreadCount})
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Notifications List */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {filter === 'unread' ? 'No unread notifications' : 
                 filter === 'read' ? 'No read notifications' : 
                 'No notifications yet'}
              </Typography>
              <Typography variant="body2" color="text.disabled">
                You'll receive notifications for matches, messages, and likes here.
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: !notification.read ? `${getNotificationColor(notification.type)}20` : 'transparent',
                      '&:hover': {
                        backgroundColor: !notification.read 
                          ? `${getNotificationColor(notification.type)}40`
                          : theme.palette.action.hover,
                      },
                      border: !notification.read ? `1px solid ${getNotificationColor(notification.type)}` : '1px solid transparent',
                    }}
                  >
                    <ListItemAvatar>
                      {notification.fromUser ? (
                        <Avatar
                          src={notification.fromUser.profilePictureUrl}
                          alt={notification.fromUser.firstName}
                          sx={{ width: 48, height: 48 }}
                        />
                      ) : (
                        <Avatar sx={{ bgcolor: theme.palette.grey[200] }}>
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      )}
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ fontWeight: !notification.read ? 600 : 400 }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: theme.palette.error.main,
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.disabled"
                          >
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </Typography>
                        </Box>
                      }
                    />

                    {!notification.read && (
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead([notification.id]);
                        }}
                        size="small"
                        sx={{ ml: 1 }}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    )}
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider sx={{ mx: 2 }} />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Container>
    </>
  );
};

export default NotificationsPage;
