import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  TextField,
  Button,
  Badge,
  CircularProgress,
  ThemeProvider,
  createTheme,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  Card,
  useMediaQuery,
  Snackbar,
  Alert,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  Stack,
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Forum as ForumIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FE3C72',
      light: '#FF7A9C',
      dark: '#E31C5F',
    },
    secondary: {
      main: '#FF6036',
    },
    background: {
      default: '#F8F8F8',
    },
  },
  typography: {
    fontFamily: '"Gotham SSm", "Helvetica Neue", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

const API_URL = process.env.REACT_APP_API_URL || 'https://campuscupid-backend.onrender.com';
const DEFAULT_PROFILE_IMAGE = '/default-profile.jpg';

function MatchesPage() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [conversations, setConversations] = useState([]);
  const [newMatches, setNewMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const messagesEndRef = useRef(null);
  const [showMobileConversations, setShowMobileConversations] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  
  // Fetch all data on component mount
  useEffect(() => {
    fetchConversations();
    fetchAllMatches();
  }, []);

  // Fetch messages when a match is selected
  useEffect(() => {
    if (selectedMatch) {
      fetchMessages(selectedMatch.id);
      setShowMobileConversations(false); // On mobile, show the messages when a conversation is selected
    }
  }, [selectedMatch]);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        setConversations(response.data);
        
        // If there are conversations and no selected match yet, select the first one by default
        if (response.data.length > 0 && !selectedMatch) {
          setSelectedMatch({
            id: response.data[0].user.id,
            firstName: response.data[0].user.firstName,
            profilePictureURL: response.data[0].user.profilePictureURL
          });
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
      setOpenSnackbar(true);
      setLoading(false);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  // New function to fetch all matches including those without messages
  const fetchAllMatches = async () => {
    try {
      setLoadingMatches(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        navigate('/login');
        return;
      }

      // Get all matched users from the matchmaking API
      const response = await axios.get(`${API_URL}/matches/${userId}?matched=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        // Filter out matches that already have conversations
        const matchesWithoutConversations = response.data.filter(match => {
          return !conversations.some(conv => conv.user.id === match.id);
        });
        
        setNewMatches(matchesWithoutConversations);
      }
      setLoadingMatches(false);
    } catch (err) {
      console.error('Error fetching all matches:', err);
      setError('Failed to load all matches');
      setOpenSnackbar(true);
      setLoadingMatches(false);
    }
  };

  const fetchMessages = async (matchId) => {
    try {
      setLoadingMessages(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/messages/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        // Sort messages by created_at in ascending order
        const sortedMessages = [...response.data].sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        );
        setMessages(sortedMessages);
      } else {
        setMessages([]);
      }
      setLoadingMessages(false);

      // Refresh conversations to update unread counts
      fetchConversations();
    } catch (err) {
      console.error('Error fetching messages:', err);
      setLoadingMessages(false);
      setError('Failed to load messages');
      setOpenSnackbar(true);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMatch) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const userId = localStorage.getItem('userId');
      
      // Optimistically add message to UI
      const tempMessage = {
        id: `temp-${Date.now()}`,
        sender_id: Number(userId),
        receiver_id: selectedMatch.id,
        content: newMessage,
        created_at: new Date().toISOString(),
        read: false,
      };
      
      setMessages([...messages, tempMessage]);
      setNewMessage('');      // Send message to server
      const response = await axios.post(
        `${API_URL}/messages`,
        {
          receiver_id: selectedMatch.id,
          content: newMessage
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        // Replace temporary message with actual message from server if needed
        fetchMessages(selectedMatch.id);
        
        // After sending a first message to a new match, refresh everything
        if (messages.length === 0) {
          fetchConversations();
          fetchAllMatches();
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      setOpenSnackbar(true);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleSelectMatch = (match) => {
    // normalize the match object format from either a conversation or a new match
    const normalizedMatch = match.user ? 
      { id: match.user.id, firstName: match.user.firstName, profilePictureURL: match.user.profilePictureURL } : 
      match;
    
    setSelectedMatch(normalizedMatch);
    if (isMobile) {
      setShowMobileConversations(false);
    }
  };

  const handleBackToConversations = () => {
    setShowMobileConversations(true);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  const formatConversationTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If message is from today, show time only
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    }
    
    // If message is from this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, 'MMM d');
    }
    
    // Otherwise show date with year
    return format(date, 'MMM d, yyyy');
  };

  // Render conversations list
  const renderConversations = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress color="primary" />
        </Box>
      );
    }

    if (conversations.length === 0 && newMatches.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <ForumIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            You don't have any matches yet
          </Typography>
          <Button 
            variant="contained" 
            sx={{ 
              mt: 2, 
              background: 'linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
              textTransform: 'none'
            }}
            onClick={() => navigate('/matcher')}
          >
            Find New Matches
          </Button>
        </Box>
      );
    }

    return (
      <>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
            },
            '& .Mui-selected': {
              color: theme.palette.primary.main,
              fontWeight: 700,
            }
          }}
        >
          <Tab label="Messages" />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                New Matches
                {newMatches.length > 0 && (
                  <Chip 
                    size="small" 
                    label={newMatches.length} 
                    color="primary" 
                    sx={{ ml: 1, height: 20, fontSize: '0.75rem' }} 
                  />
                )}
              </Box>
            } 
          />
        </Tabs>
        
        {tabValue === 0 ? (
          // Messages tab
          conversations.length > 0 ? (
            <List sx={{ width: '100%', p: 0 }}>
              {conversations.map((conversation, index) => (
                <React.Fragment key={conversation.user.id}>
                  <ListItem 
                    button 
                    alignItems="flex-start" 
                    onClick={() => handleSelectMatch(conversation)}
                    selected={selectedMatch?.id === conversation.user.id}
                    sx={{ 
                      p: 2,
                      bgcolor: selectedMatch?.id === conversation.user.id ? 'rgba(254, 60, 114, 0.08)' : 'transparent',
                      '&:hover': {
                        bgcolor: 'rgba(254, 60, 114, 0.05)'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Badge 
                        badgeContent={conversation.unreadCount} 
                        color="primary"
                        invisible={conversation.unreadCount === 0}
                        sx={{ 
                          '& .MuiBadge-badge': { 
                            right: 5, 
                            top: 5, 
                            border: `2px solid ${theme.palette.background.paper}`,
                            padding: '0 4px',
                          } 
                        }}
                      >
                        <Avatar 
                          alt={conversation.user.firstName} 
                          src={conversation.user.profilePictureURL || DEFAULT_PROFILE_IMAGE} 
                          sx={{ width: 50, height: 50 }}
                        />
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={
                        <Typography 
                          variant="subtitle1" 
                          component="span"
                          fontWeight={conversation.unreadCount > 0 ? 'bold' : 'regular'}
                        >
                          {conversation.user.firstName}
                        </Typography>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography
                            sx={{ display: 'inline', color: conversation.unreadCount > 0 ? 'text.primary' : 'text.secondary' }}
                            component="span"
                            variant="body2"
                            noWrap
                          >
                            {conversation.lastMessage.content.length > 30 
                              ? conversation.lastMessage.content.substring(0, 30) + '...' 
                              : conversation.lastMessage.content}
                          </Typography>
                        </React.Fragment>
                      }
                      sx={{ ml: 1.5 }}
                    />
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ minWidth: '40px', textAlign: 'right', mt: 1 }}
                    >
                      {formatConversationTime(conversation.lastMessage.created_at)}
                    </Typography>
                  </ListItem>
                  {index < conversations.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No conversations yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Start chatting with your matches
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                sx={{ mt: 2, textTransform: 'none' }}
                onClick={() => setTabValue(1)}
              >
                View your matches
              </Button>
            </Box>
          )
        ) : (
          // New matches tab
          loadingMatches ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress color="primary" size={24} />
            </Box>
          ) : newMatches.length > 0 ? (
            <Grid container spacing={2} sx={{ p: 2 }}>
              {newMatches.map(match => (
                <Grid item xs={6} sm={4} md={6} key={match.id}>
                  <Card 
                    sx={{ 
                      borderRadius: 2, 
                      overflow: 'hidden', 
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                      },
                    }} 
                    onClick={() => handleSelectMatch(match)}
                    elevation={2}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <Avatar 
                        alt={match.firstName} 
                        src={match.profilePictureURL || DEFAULT_PROFILE_IMAGE} 
                        sx={{ 
                          width: '100%', 
                          height: 140,
                          borderRadius: 0
                        }}
                        variant="square"
                      />
                      <Box sx={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        right: 0, 
                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                        p: 1
                      }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <FavoriteIcon sx={{ color: '#ff4081', fontSize: 16 }} />
                          <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
                            New Match!
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>
                    <Box sx={{ p: 1.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {match.firstName}
                      </Typography>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        size="small" 
                        fullWidth
                        sx={{ 
                          mt: 1, 
                          textTransform: 'none',
                          fontSize: '0.8rem'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectMatch(match);
                        }}
                      >
                        Say Hello
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No new matches
              </Typography>
              <Button 
                variant="contained" 
                sx={{ 
                  mt: 2, 
                  background: 'linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)',
                  textTransform: 'none'
                }}
                onClick={() => navigate('/matcher')}
              >
                Find New Matches
              </Button>
            </Box>
          )
        )}
      </>
    );
  };

  // Render messages for selected match
  const renderMessages = () => {
    if (!selectedMatch) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            backgroundColor: '#f8f8f8',
            p: 3,
          }}
        >
          <ForumIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
          <Typography variant="body1" color="text.secondary" align="center">
            Select a conversation to start messaging
          </Typography>
        </Box>
      );
    }

    if (loadingMessages) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress color="primary" />
        </Box>
      );
    }

    const userId = Number(localStorage.getItem('userId'));

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <AppBar 
          position="static" 
          color="default" 
          elevation={0}
          sx={{ 
            bgcolor: 'white', 
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            pl: { xs: 1, sm: 2 }
          }}
        >
          <Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' } }}>
            {isMobile && (
              <IconButton 
                edge="start" 
                color="inherit" 
                aria-label="back" 
                onClick={handleBackToConversations}
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Avatar 
              alt={selectedMatch.firstName} 
              src={selectedMatch.profilePictureURL || DEFAULT_PROFILE_IMAGE}
              sx={{ width: 40, height: 40, mr: 2 }}
            />
            <Typography variant="h6" noWrap component="div">
              {selectedMatch.firstName}
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Box 
          sx={{ 
            flexGrow: 1, 
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#f8f8f8'
          }}
        >
          {messages.length === 0 ? (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}
            >
              <Typography variant="body1" color="text.secondary">
                No messages yet. Say hello!
              </Typography>
            </Box>
          ) : (
            messages.map((message) => {
              const isSender = message.sender_id === userId;
              
              return (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: isSender ? 'flex-end' : 'flex-start',
                    mb: 1.5,
                  }}
                >
                  {!isSender && (
                    <Avatar
                      alt={selectedMatch.firstName}
                      src={selectedMatch.profilePictureURL || DEFAULT_PROFILE_IMAGE}
                      sx={{ width: 36, height: 36, mr: 1, mt: 1, display: { xs: 'none', sm: 'block' } }}
                    />
                  )}
                  <Box
                    sx={{
                      maxWidth: '70%',
                      position: 'relative'
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        bgcolor: isSender ? '#FE3C72' : 'white',
                        color: isSender ? 'white' : 'inherit',
                        borderRadius: isSender 
                          ? '18px 18px 4px 18px' 
                          : '18px 18px 18px 4px',
                        wordBreak: 'break-word'
                      }}
                    >
                      <Typography variant="body1">
                        {message.content}
                      </Typography>
                    </Paper>
                    <Typography
                      variant="caption"
                      color={isSender ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        ml: 0.5,
                        textAlign: isSender ? 'right' : 'left'
                      }}
                    >
                      {formatMessageTime(message.created_at)}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </Box>
        
        <Box 
          component="form" 
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          sx={{ 
            p: 2, 
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            bgcolor: 'white',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            size="medium"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button 
                    variant="contained" 
                    color="primary" 
                    type="submit"
                    disabled={!newMessage.trim()}
                    sx={{ 
                      borderRadius: '50%', 
                      minWidth: 'unset', 
                      width: 40, 
                      height: 40,
                      background: 'linear-gradient(45deg, #FE3C72 30%, #FF6036 90%)'
                    }}
                  >
                    <SendIcon />
                  </Button>
                </InputAdornment>
              ),
              sx: { pr: 0.5 }
            }}
          />
        </Box>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" sx={{ bgcolor: 'white', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
          <Toolbar>
            <IconButton 
              edge="start" 
              color="inherit" 
              aria-label="back to dashboard"
              onClick={handleBackToDashboard}
              sx={{ color: theme.palette.primary.main }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1, 
                textAlign: 'center',
                fontWeight: 'bold',
                color: theme.palette.primary.main
              }}
            >
              Your Matches
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Mobile View: Show either conversations or messages */}
          {isMobile ? (
            showMobileConversations ? (
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                {renderConversations()}
              </Box>
            ) : (
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                {renderMessages()}
              </Box>
            )
          ) : (
            // Desktop View: Show both conversations and messages side by side
            <Grid container sx={{ flexGrow: 1 }}>
              <Grid item xs={4} sx={{ borderRight: '1px solid rgba(0, 0, 0, 0.12)', height: 'calc(100vh - 64px)' }}>
                <Card sx={{ height: '100%', boxShadow: 'none', borderRadius: 0 }}>
                  <Box sx={{ height: '100%', overflowY: 'auto' }}>
                    {renderConversations()}
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={8} sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
                {renderMessages()}
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>
      
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default MatchesPage;