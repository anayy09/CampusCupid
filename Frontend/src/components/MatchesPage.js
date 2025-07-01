import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
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
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  Card,
  CardContent,
  useMediaQuery,
  Snackbar,
  Alert,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  Stack,
  useTheme,
  Container,
  Fab,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  SendRounded as SendIcon,
  ArrowBackRounded as ArrowBackIcon,
  ForumRounded as ForumIcon,
  FavoriteRounded as FavoriteIcon,
  SearchRounded as SearchIcon,
  PersonRounded as PersonIcon,
  ChatRounded as ChatIcon,
  StarRounded as StarIcon,
  MoreVertRounded as MoreVertIcon,
  HeartBrokenRounded as UnmatchIcon,
  ReportRounded as ReportIcon,
  BlockRounded as BlockIcon,
  VideocamRounded as VideoIcon,
  PhoneRounded as PhoneIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import NavBar from './common/NavBar';

const API_URL = 'http://localhost:8080';
const DEFAULT_PROFILE_IMAGE = '/default-profile.jpg';

function MatchesPage() {
  const theme = useTheme();
  const user = JSON.parse(localStorage.getItem('user'));
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
  const [anchorEl, setAnchorEl] = useState(null);
  const [unmatchDialogOpen, setUnmatchDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = useCallback(async (shouldSetDefaultMatch = false) => {
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

        // Only set default match if explicitly requested and no match is selected
        if (shouldSetDefaultMatch && response.data.length > 0 && !selectedMatch) {
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
  }, [navigate]); // Remove selectedMatch dependency

  // New function to fetch all matches including those without messages
  const fetchAllMatches = useCallback(async () => {
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
  }, [navigate, conversations]);

  const fetchMessages = useCallback(async (matchId) => {
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
  }, [navigate, fetchConversations]);

  // Fetch all data on component mount
  useEffect(() => {
    fetchConversations(true); // Pass true to set default match on first load
    fetchAllMatches();
  }, []); // Remove fetchConversations and fetchAllMatches from dependencies

  // Fetch messages when a match is selected
  useEffect(() => {
    if (selectedMatch) {
      fetchMessages(selectedMatch.id);
      setShowMobileConversations(false); // On mobile, show the messages when a conversation is selected
    }
  }, [selectedMatch, fetchMessages]);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleUnmatchUser = async () => {
    if (!selectedMatch) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/unmatch/${selectedMatch.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setError('You have unmatched with this user');
      setOpenSnackbar(true);
      setUnmatchDialogOpen(false);
      
      // Refresh conversations and go back to conversation list
      fetchConversations();
      fetchAllMatches();
      setSelectedMatch(null);
      if (isMobile) {
        setShowMobileConversations(true);
      }
    } catch (err) {
      console.error('Error unmatching user:', err);
      setError('Failed to unmatch user');
      setOpenSnackbar(true);
    }
  };

  const handleReportUser = async () => {
    if (!selectedMatch || !reportReason.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/report/${selectedMatch.id}`, {
        reason: reportReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setError('User reported successfully');
      setOpenSnackbar(true);
      setReportDialogOpen(false);
      setReportReason('');
    } catch (err) {
      console.error('Error reporting user:', err);
      setError('Failed to report user');
      setOpenSnackbar(true);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedMatch) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/block/${selectedMatch.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setError('User has been blocked');
      setOpenSnackbar(true);
      setBlockDialogOpen(false);
      
      // Refresh conversations and go back to conversation list
      fetchConversations();
      fetchAllMatches();
      setSelectedMatch(null);
      if (isMobile) {
        setShowMobileConversations(true);
      }
    } catch (err) {
      console.error('Error blocking user:', err);
      setError('Failed to block user');
      setOpenSnackbar(true);
    }
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

  const filteredConversations = conversations.filter(conversation => 
    conversation.user.firstName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <Stack sx={{ height: '100%' }}>
        {/* Search Bar */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: { borderRadius: '25px' }
            }}
          />
        </Box>

        {/* New Matches Carousel */}
        {loadingMatches ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box>
        ) : newMatches.length > 0 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
              New Matches
            </Typography>
            <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
              {newMatches.map(match => (
                <Stack 
                  key={match.id} 
                  alignItems="center" 
                  spacing={1} 
                  onClick={() => handleSelectMatch(match)} 
                  sx={{ cursor: 'pointer', minWidth: 80 }}>
                  <Avatar
                    alt={match.firstName}
                    src={match.profilePictureURL || DEFAULT_PROFILE_IMAGE}
                    sx={{ width: 60, height: 60, border: `2px solid ${theme.palette.primary.main}` }}
                  />
                  <Typography variant="caption" noWrap>{match.firstName}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}

        <Divider />

        {/* Conversations List */}
        <List sx={{ width: '100%', p: 0, flexGrow: 1, overflowY: 'auto' }}>
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation, index) => (
              <ListItem
                key={conversation.user.id}
                button
                alignItems="flex-start"
                onClick={() => handleSelectMatch(conversation)}
                selected={selectedMatch?.id === conversation.user.id}
                sx={{
                  p: 2,
                  transition: 'background-color 0.2s ease',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.action.selected,
                    borderRight: `3px solid ${theme.palette.primary.main}`,
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    invisible={!conversation.user.isOnline} // Assuming you have this data
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: '#44b700',
                        color: '#44b700',
                        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
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
                  primary={conversation.user.firstName}
                  secondary={
                    <Typography sx={{ display: 'block' }} component="span" variant="body2" noWrap color="text.secondary">
                      {conversation.lastMessage.content}
                    </Typography>
                  }
                  primaryTypographyProps={{ fontWeight: 600 }}
                  sx={{ ml: 1.5 }}
                />
                <Stack alignItems="flex-end" spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    {formatConversationTime(conversation.lastMessage.created_at)}
                  </Typography>
                  {conversation.unreadCount > 0 && (
                    <Badge badgeContent={conversation.unreadCount} color="primary" />
                  )}
                </Stack>
              </ListItem>
            ))
          ) : (
            <Box sx={{ p: 3, textAlign: 'center', mt: 4 }}>
              <ForumIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No conversations found.
              </Typography>
            </Box>
          )}
        </List>
      </Stack>
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
            textAlign: 'center',
            p: 3,
          }}
        >
          <ChatIcon sx={{ fontSize: 80, color: 'primary.main', opacity: 0.5, mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Select a Conversation
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Choose one of your matches to see the conversation.
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
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default' }}>
        <AppBar
          position="static"
          color="default"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" color="inherit" onClick={handleBackToConversations} sx={{ mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
            )}
            <Avatar
              alt={selectedMatch.firstName}
              src={selectedMatch.profilePictureURL || DEFAULT_PROFILE_IMAGE}
              sx={{ width: 40, height: 40, mr: 2 }}
            />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {selectedMatch.firstName}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton sx={{ color: 'text.secondary' }}><PhoneIcon /></IconButton>
            <IconButton sx={{ color: 'text.secondary' }}><VideoIcon /></IconButton>
            <IconButton onClick={handleMenuOpen} sx={{ color: 'text.secondary' }}>
              <MoreVertIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            {messages.length === 0 ? (
              <Box sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
                <Typography>You matched with {selectedMatch.firstName}.</Typography>
                <Typography variant="body2">Send a message to start the conversation!</Typography>
              </Box>
            ) : (
              messages.map((message) => {
                const isSender = message.sender_id === userId;
                return (
                  <Stack key={message.id} direction="row" justifyContent={isSender ? 'flex-end' : 'flex-start'}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: '20px',
                        border: isSender ? 'none' : `1px solid ${theme.palette.divider}`,
                        borderTopLeftRadius: isSender ? '20px' : '5px',
                        borderTopRightRadius: isSender ? '5px' : '20px',
                        maxWidth: '70%',
                        bgcolor: isSender ? 'primary.main' : 'background.paper',
                        color: isSender ? 'white' : 'text.primary',
                      }}
                    >
                      <Typography variant="body1">{message.content}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.7, mt: 0.5 }}>
                        {formatMessageTime(message.created_at)}
                      </Typography>
                    </Paper>
                  </Stack>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </Stack>
        </Box>

        <Box
          component="form"
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          sx={{
            p: { xs: 1, sm: 2 },
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            autoComplete="off"
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: '25px',
              }
            }}
          />
          <Fab color="primary" type="submit" size="medium" disabled={!newMessage.trim()}>
            <SendIcon />
          </Fab>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <NavBar user={user} />
      <Box sx={{ 
        height: '100vh',
        pt: '64px', // Height of NavBar
        background: 'linear-gradient(to top right, #FFF0F5, #FFE4E1)'
      }}>
        <Container maxWidth="xl" sx={{ height: 'calc(100vh - 64px)', p: { xs: 0, sm: 2 } }}>
          <Paper
            elevation={0}
            sx={{
              height: '100%',
              borderRadius: { xs: 0, sm: theme.customTokens.borderRadius.xl },
              border: { xs: 'none', sm: `1px solid ${theme.palette.divider}` },
              overflow: 'hidden',
              display: 'flex'
            }}
          >
            {isMobile ? (
              showMobileConversations ? (
                <Box sx={{ width: '100%' }}>{renderConversations()}</Box>
              ) : (
                <Box sx={{ width: '100%' }}>{renderMessages()}</Box>
              )
            ) : (
              <>
                <Box sx={{ width: '35%', borderRight: `1px solid ${theme.palette.divider}` }}>
                  {renderConversations()}
                </Box>
                <Box sx={{ width: '65%' }}>
                  {renderMessages()}
                </Box>
              </>
            )}
          </Paper>
        </Container>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: theme.customTokens.borderRadius.medium,
            border: `1px solid ${theme.palette.divider}`,
            mt: 1
          }
        }}
      >
        <MenuItem onClick={() => {
          setUnmatchDialogOpen(true);
          handleMenuClose();
        }}>
          <UnmatchIcon sx={{ mr: 1, color: 'error.main' }} />
          Unmatch
        </MenuItem>
        <MenuItem onClick={() => {
          setReportDialogOpen(true);
          handleMenuClose();
        }}>
          <ReportIcon sx={{ mr: 1 }} />
          Report User
        </MenuItem>
        <MenuItem onClick={() => {
          setBlockDialogOpen(true);
          handleMenuClose();
        }}>
          <BlockIcon sx={{ mr: 1 }} />
          Block User
        </MenuItem>
      </Menu>

      {/* Unmatch Dialog */}
      <Dialog
        open={unmatchDialogOpen}
        onClose={() => setUnmatchDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: theme.customTokens.borderRadius.xl,
            border: `1px solid ${theme.palette.divider}`,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Unmatch with {selectedMatch?.firstName}?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            Are you sure you want to unmatch with {selectedMatch?.firstName}? This action cannot be undone. 
            You will no longer be able to message each other and your conversation will be deleted.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setUnmatchDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUnmatchUser}
            variant="contained"
            color="error"
          >
            Unmatch
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report User Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: theme.customTokens.borderRadius.xl,
            border: `1px solid ${theme.palette.divider}`,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Report {selectedMatch?.firstName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please let us know why you're reporting this user. This will help us maintain a safe community.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Describe the issue..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setReportDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReportUser}
            variant="contained"
            color="error"
            disabled={!reportReason.trim()}
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block User Dialog */}
      <Dialog
        open={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: theme.customTokens.borderRadius.xl,
            border: `1px solid ${theme.palette.divider}`,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Block {selectedMatch?.firstName}?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            Are you sure you want to block this user? They won't be able to see your profile or send you messages, 
            and you won't see them in your potential matches.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setBlockDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBlockUser}
            variant="contained"
            color="error"
          >
            Block User
          </Button>
        </DialogActions>
      </Dialog>

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

export default MatchesPage;