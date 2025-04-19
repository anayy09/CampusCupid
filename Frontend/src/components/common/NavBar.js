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
  Divider
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Person as PersonIcon, 
  Favorite as FavoriteIcon, 
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const NavBar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
  
  // If on public pages and not authenticated, show login/signup buttons
  if (isPublicPage && !isAuthenticated) {
    return (
      <AppBar 
        position="fixed" 
        sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          color: 'primary.main',
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <Toolbar>
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              cursor: 'pointer',
              fontWeight: 'bold',
              background: '-webkit-linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
            onClick={() => navigate('/')}
          >
            Campus Cupid
          </Typography>
          
          <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
            {location.pathname !== '/login' && (
              <Button 
                color="primary" 
                onClick={() => navigate('/login')}
                sx={{ 
                  ml: 2,
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Login
              </Button>
            )}
            
            {location.pathname !== '/signup' && (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/signup')}
                sx={{ 
                  ml: 2,
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                  boxShadow: '0 4px 10px rgba(254, 60, 114, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #E31C5F 30%, #E31C5F 90%)',
                    boxShadow: '0 6px 15px rgba(254, 60, 114, 0.4)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Sign Up
              </Button>
            )}
          </Box>
          
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
        
        {isMobile && (
          <Drawer
            anchor="right"
            open={drawerOpen}
            onClose={handleDrawerToggle}
            sx={{
              '& .MuiDrawer-paper': { width: 240 },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2,
                  fontWeight: 'bold',
                  background: '-webkit-linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Menu
              </Typography>
            </Box>
            <Divider />
            <List>
              <ListItem button onClick={() => { navigate('/'); handleDrawerToggle(); }}>
                <ListItemIcon>
                  <HomeIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Home" />
              </ListItem>
              {location.pathname !== '/login' && (
                <ListItem button onClick={() => { navigate('/login'); handleDrawerToggle(); }}>
                  <ListItemIcon>
                    <PersonIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Login" />
                </ListItem>
              )}
              {location.pathname !== '/signup' && (
                <ListItem button onClick={() => { navigate('/signup'); handleDrawerToggle(); }}>
                  <ListItemIcon>
                    <PersonIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Sign Up" />
                </ListItem>
              )}
            </List>
          </Drawer>
        )}
      </AppBar>
    );
  }
  
  // For authenticated users in private pages
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        color: 'primary.main',
        zIndex: theme.zIndex.drawer + 1
      }}
    >
      <Toolbar>
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            cursor: 'pointer',
            fontWeight: 'bold',
            background: '-webkit-linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)'
            }
          }}
          onClick={() => navigate('/dashboard')}
        >
          Campus Cupid
        </Typography>
        
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              color="inherit" 
              startIcon={<PersonIcon />}
              onClick={() => navigate('/dashboard')}
              sx={{ 
                mr: 1,
                color: location.pathname === '/dashboard' ? 'primary.main' : 'text.secondary',
                fontWeight: location.pathname === '/dashboard' ? 'bold' : 'normal',
                textTransform: 'none'
              }}
            >
              Profile
            </Button>
            <Button 
              color="inherit" 
              startIcon={<FavoriteIcon />}
              onClick={() => navigate('/matcher')}
              sx={{ 
                mr: 1,
                color: location.pathname === '/matcher' ? 'primary.main' : 'text.secondary',
                fontWeight: location.pathname === '/matcher' ? 'bold' : 'normal',
                textTransform: 'none'
              }}
            >
              Find Matches
            </Button>
            <Button 
              color="inherit" 
              startIcon={<ChatIcon />}
              onClick={() => navigate('/matches')}
              sx={{ 
                mr: 2,
                color: location.pathname === '/matches' ? 'primary.main' : 'text.secondary',
                fontWeight: location.pathname === '/matches' ? 'bold' : 'normal',
                textTransform: 'none'
              }}
            >
              Matches
            </Button>
          </Box>
        )}
        
        {/* User profile icon/avatar that opens menu */}
        <IconButton
          size="large"
          edge="end"
          aria-haspopup="true"
          onClick={handleProfileMenuOpen}
          color="inherit"
          sx={{ ml: 1 }}
        >
          <Avatar 
            alt={user?.firstName || "User"} 
            src={user?.profilePictureURL}
            sx={{ 
              width: 35, 
              height: 35,
              border: '2px solid #FE3C72'
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
        
        {/* User profile menu */}
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
              borderRadius: 2,
              minWidth: 180,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }
          }}
        >
          <MenuItem onClick={() => { navigate('/dashboard'); handleMenuClose(); }}>
            <ListItemIcon>
              <PersonIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
            </ListItemIcon>
            <ListItemText primary="My Profile" />
          </MenuItem>
          <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
            </ListItemIcon>
            <ListItemText primary="Logout" />
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
            '& .MuiDrawer-paper': { width: 240 },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                fontWeight: 'bold',
                background: '-webkit-linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Menu
            </Typography>
          </Box>
          <Divider />
          <List>
            <ListItem button onClick={() => { navigate('/dashboard'); handleDrawerToggle(); }}>
              <ListItemIcon>
                <PersonIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="My Profile" />
            </ListItem>
            <ListItem button onClick={() => { navigate('/matcher'); handleDrawerToggle(); }}>
              <ListItemIcon>
                <FavoriteIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Find Matches" />
            </ListItem>
            <ListItem button onClick={() => { navigate('/matches'); handleDrawerToggle(); }}>
              <ListItemIcon>
                <ChatIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Matches" />
            </ListItem>
            <Divider />
            <ListItem button onClick={() => { navigate('/settings'); handleDrawerToggle(); }}>
              <ListItemIcon>
                <SettingsIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Drawer>
      )}
    </AppBar>
  );
};

export default NavBar;
