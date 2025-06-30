import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar, 
  useMediaQuery, 
  Drawer, 
  List, 
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Chip
} from '@mui/material';
import { 
  MenuRounded as MenuIcon, 
  PersonRounded as PersonIcon, 
  FavoriteRounded as FavoriteIcon, 
  ChatRounded as ChatIcon,
  SettingsRounded as SettingsIcon,
  LogoutRounded as LogoutIcon,
  HomeRounded as HomeIcon,
  NotificationsRounded as NotificationsIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const NavBar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    navigate('/login');
    handleMenuClose();
  };
  
  const isAuthenticated = !!localStorage.getItem('token');
  const isPublicPage = ['/', '/login', '/signup'].includes(location.pathname);

  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <PersonIcon />, active: location.pathname === '/dashboard' },
    { label: 'Discover', path: '/matcher', icon: <FavoriteIcon />, active: location.pathname === '/matcher' },
    { label: 'Messages', path: '/matches', icon: <ChatIcon />, active: location.pathname === '/matches', badge: 3 },
  ];
  
  // Public pages navbar
  if (isPublicPage && !isAuthenticated) {
    return (
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary',
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.02)'
              }
            }}
            className="gradient-text"
            onClick={() => navigate('/')}
          >
            Campus Cupid
          </Typography>
          
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              {location.pathname !== '/login' && (
                <Button 
                  variant="text"
                  onClick={() => navigate('/login')}
                  sx={{ 
                    color: 'text.primary',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: theme.customTokens.borderRadius.medium,
                    px: 3,
                    '&:hover': {
                      backgroundColor: 'rgba(233, 30, 99, 0.04)',
                    }
                  }}
                >
                  Sign In
                </Button>
              )}
              
              {location.pathname !== '/signup' && (
                <Button 
                  variant="contained" 
                  onClick={() => navigate('/signup')}
                  sx={{ 
                    background: theme.customTokens.gradients.primary,
                    color: 'white',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: theme.customTokens.borderRadius.medium,
                    px: 3,
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 20px rgba(233, 30, 99, 0.3)',
                    }
                  }}
                >
                  Get Started
                </Button>
              )}
            </Box>
          )}
          
          {isMobile && (
            <IconButton 
              color="primary" 
              edge="end" 
              onClick={handleDrawerToggle}
              sx={{ ml: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
        
        {/* Mobile Drawer for Public Pages */}
        {isMobile && (
          <Drawer
            anchor="right"
            open={drawerOpen}
            onClose={handleDrawerToggle}
            sx={{
              '& .MuiDrawer-paper': { 
                width: 280,
                borderRadius: `${theme.customTokens.borderRadius.large}px 0 0 ${theme.customTokens.borderRadius.large}px`,
              },
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                className="gradient-text"
                sx={{ fontWeight: 800 }}
              >
                Campus Cupid
              </Typography>
            </Box>
            <Divider />
            <List sx={{ px: 2 }}>
              <ListItem 
                button 
                onClick={() => { navigate('/'); handleDrawerToggle(); }}
                sx={{ borderRadius: theme.customTokens.borderRadius.medium, mb: 1 }}
              >
                <ListItemIcon>
                  <HomeIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Home" />
              </ListItem>
              {location.pathname !== '/login' && (
                <ListItem 
                  button 
                  onClick={() => { navigate('/login'); handleDrawerToggle(); }}
                  sx={{ borderRadius: theme.customTokens.borderRadius.medium, mb: 1 }}
                >
                  <ListItemIcon>
                    <PersonIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Sign In" />
                </ListItem>
              )}
              {location.pathname !== '/signup' && (
                <ListItem 
                  button 
                  onClick={() => { navigate('/signup'); handleDrawerToggle(); }}
                  sx={{ borderRadius: theme.customTokens.borderRadius.medium }}
                >
                  <ListItemIcon>
                    <PersonIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Get Started" />
                </ListItem>
              )}
            </List>
          </Drawer>
        )}
      </AppBar>
    );
  }
  
  // Authenticated users navbar
  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: 'text.primary',
        zIndex: theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: { xs: '1.25rem', md: '1.5rem' },
            transition: 'transform 0.2s ease',
            mr: 4,
            '&:hover': {
              transform: 'scale(1.02)'
            }
          }}
          className="gradient-text"
          onClick={() => navigate('/dashboard')}
        >
          Campus Cupid
        </Typography>
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 1 }}>
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                startIcon={
                  item.badge ? (
                    <Badge badgeContent={item.badge} color="error" variant="dot">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )
                }
                sx={{
                  color: item.active ? 'primary.main' : 'text.secondary',
                  fontWeight: item.active ? 700 : 600,
                  textTransform: 'none',
                  borderRadius: theme.customTokens.borderRadius.medium,
                  px: 2,
                  py: 1,
                  backgroundColor: item.active ? 'rgba(233, 30, 99, 0.08)' : 'transparent',
                  '&:hover': {
                    backgroundColor: item.active ? 'rgba(233, 30, 99, 0.12)' : 'rgba(233, 30, 99, 0.04)',
                    color: 'primary.main',
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        {/* Right side actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          {/* Notifications */}
          {!isMobile && (
            <IconButton
              size="large"
              sx={{ color: 'text.secondary' }}
            >
              <Badge badgeContent={2} color="error" variant="dot">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          )}
          
          {/* User Profile */}
          <IconButton
            size="large"
            edge="end"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            sx={{ ml: 1 }}
          >
            <Avatar 
              alt={user?.firstName || "User"} 
              src={user?.profilePictureURL}
              sx={{ 
                width: 40, 
                height: 40,
                border: `2px solid ${theme.palette.primary.main}`,
                '&:hover': {
                  transform: 'scale(1.05)',
                }
              }}
            />
          </IconButton>
          
          {/* Mobile menu toggle */}
          {isMobile && (
            <IconButton 
              color="primary" 
              edge="end" 
              onClick={handleDrawerToggle}
              sx={{ ml: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Box>
        
        {/* User Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          sx={{
            mt: 1,
            '& .MuiPaper-root': {
              borderRadius: theme.customTokens.borderRadius.large,
              minWidth: 200,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: `1px solid ${theme.palette.divider}`,
              py: 1,
            }
          }}
        >
          {/* User Info */}
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {user?.firstName || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          
          <MenuItem 
            onClick={() => { navigate('/dashboard'); handleMenuClose(); }}
            sx={{ py: 1.5, px: 3 }}
          >
            <ListItemIcon>
              <PersonIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="My Profile" />
          </MenuItem>
          <MenuItem 
            onClick={() => { navigate('/settings'); handleMenuClose(); }}
            sx={{ py: 1.5, px: 3 }}
          >
            <ListItemIcon>
              <SettingsIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </MenuItem>
          <Divider sx={{ my: 1 }} />
          <MenuItem 
            onClick={handleLogout}
            sx={{ py: 1.5, px: 3, color: 'error.main' }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Sign Out" />
          </MenuItem>
        </Menu>
      </Toolbar>
      
      {/* Mobile Navigation Drawer */}
      {isMobile && (
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          sx={{
            '& .MuiDrawer-paper': { 
              width: 280,
              borderRadius: `${theme.customTokens.borderRadius.large}px 0 0 ${theme.customTokens.borderRadius.large}px`,
            },
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar 
                alt={user?.firstName || "User"} 
                src={user?.profilePictureURL}
                sx={{ 
                  width: 48, 
                  height: 48,
                  border: `2px solid ${theme.palette.primary.main}`,
                }}
              />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {user?.firstName || 'User'}
                </Typography>
                <Chip 
                  label="Online" 
                  size="small" 
                  color="success" 
                  sx={{ fontSize: '0.75rem' }}
                />
              </Box>
            </Box>
          </Box>
          <Divider />
          <List sx={{ px: 2 }}>
            {navigationItems.map((item) => (
              <ListItem 
                key={item.path}
                button 
                onClick={() => { navigate(item.path); handleDrawerToggle(); }}
                sx={{ 
                  borderRadius: theme.customTokens.borderRadius.medium, 
                  mb: 1,
                  backgroundColor: item.active ? 'rgba(233, 30, 99, 0.08)' : 'transparent',
                }}
              >
                <ListItemIcon>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error" variant="dot">
                      {React.cloneElement(item.icon, { color: item.active ? 'primary' : 'inherit' })}
                    </Badge>
                  ) : (
                    React.cloneElement(item.icon, { color: item.active ? 'primary' : 'inherit' })
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  sx={{ 
                    '& .MuiTypography-root': { 
                      fontWeight: item.active ? 600 : 400,
                      color: item.active ? 'primary.main' : 'inherit'
                    } 
                  }} 
                />
              </ListItem>
            ))}
            <Divider sx={{ my: 2 }} />
            <ListItem 
              button 
              onClick={() => { navigate('/settings'); handleDrawerToggle(); }}
              sx={{ borderRadius: theme.customTokens.borderRadius.medium, mb: 1 }}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
            <ListItem 
              button 
              onClick={handleLogout}
              sx={{ borderRadius: theme.customTokens.borderRadius.medium, color: 'error.main' }}
            >
              <ListItemIcon>
                <LogoutIcon color="error" />
              </ListItemIcon>
              <ListItemText primary="Sign Out" />
            </ListItem>
          </List>
        </Drawer>
      )}
    </AppBar>
  );
};

export default NavBar;
