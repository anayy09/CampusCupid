import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Avatar,
  Chip,
  Divider,
  Button,
  Paper,
  Stack,
  useTheme
} from '@mui/material';
import {
  NotificationsRounded as NotificationsIcon,
  FavoriteRounded as MatchIcon,
  ChatRounded as MessageIcon,
  PersonRounded as LikeIcon,
  MarkEmailReadRounded as MarkReadIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';

const API_URL = 'http://localhost:8080';

const NotificationDropdown = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { 
    unreadCount, 
    notifications, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchNotifications().finally(() => setLoading(false));
    }
  }, [open, fetchNotifications]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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
          if (data.action === 'view_match') {
            navigate('/matches');
          }
          break;
        case 'message':
          if (data.action === 'view_chat') {
            navigate('/matches');
          }
          break;
        case 'like':
          if (data.action === 'view_profile') {
            navigate('/matcher');
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error parsing notification data:', error);
    }

    handleClose();
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

  return (
    <>
      <IconButton
        size="large"
        onClick={handleClick}
        sx={{ color: 'text.secondary' }}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error" 
          variant={unreadCount > 0 ? "standard" : "dot"}
          invisible={unreadCount === 0}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            borderRadius: theme.customTokens?.borderRadius?.large || 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: `1px solid ${theme.palette.divider}`,
          }
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<MarkReadIcon />}
                onClick={markAllAsRead}
                sx={{ textTransform: 'none' }}
              >
                Mark all read
              </Button>
            )}
          </Box>
        </Box>

        {/* Notifications List */}
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">Loading...</Typography>
            </Box>
          ) : !notifications || notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No notifications yet</Typography>
            </Box>
          ) : (
            notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <MenuItem
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    p: 2,
                    alignItems: 'flex-start',
                    backgroundColor: !notification.read ? getNotificationColor(notification.type) : 'transparent',
                    '&:hover': {
                      backgroundColor: !notification.read 
                        ? `${getNotificationColor(notification.type)}80`
                        : theme.palette.action.hover,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                    <Box sx={{ mr: 2, mt: 0.5 }}>
                      {notification.fromUser ? (
                        <Avatar
                          src={notification.fromUser.profilePictureUrl}
                          alt={notification.fromUser.firstName}
                          sx={{ width: 40, height: 40 }}
                        />
                      ) : (
                        <Box sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          backgroundColor: theme.palette.grey[200]
                        }}>
                          {getNotificationIcon(notification.type)}
                        </Box>
                      )}
                    </Box>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: !notification.read ? 600 : 400,
                          mb: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        {notification.title}
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
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ mb: 1 }}
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
                  </Box>
                </MenuItem>
                {index < (notifications?.length || 0) - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </Box>

        {/* Footer */}
        {notifications && notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button
                size="small"
                onClick={() => {
                  handleClose();
                  navigate('/notifications');
                }}
                sx={{ textTransform: 'none' }}
              >
                View All Notifications
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationDropdown;
