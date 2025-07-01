import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert,
  useTheme,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  TablePagination,
  Stack,
  IconButton
} from '@mui/material';
import {
  ReportRounded as ReportIcon,
  PersonRounded as PersonIcon,
  VisibilityRounded as ViewIcon,
  SecurityRounded as AdminIcon,
  FilterListRounded as FilterIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import NavBar from './common/NavBar';

const API_URL = 'http://localhost:8080';

function AdminReportsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_URL}/reports`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data) {
          setReports(response.data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reports:', err);
        
        if (err.response?.status === 403) {
          setError('Access denied. Admin privileges required.');
        } else if (err.response?.status === 401) {
          navigate('/login');
          return;
        } else {
          setError('Failed to load reports');
        }
        
        setOpenSnackbar(true);
        setLoading(false);
      }
    };

    fetchReports();
  }, [navigate]);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setDetailDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDetailDialogOpen(false);
    setSelectedReport(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getSeverityColor = (reason) => {
    const lowerReason = reason.toLowerCase();
    if (lowerReason.includes('harassment') || lowerReason.includes('abuse')) {
      return 'error';
    } else if (lowerReason.includes('spam') || lowerReason.includes('fake')) {
      return 'warning';
    } else if (lowerReason.includes('inappropriate')) {
      return 'info';
    }
    return 'default';
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
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
              Loading reports...
            </Typography>
          </Card>
        </Box>
      </>
    );
  }

  // Handle pagination
  const paginatedReports = reports.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <NavBar user={user} />
      <Box sx={{ 
        backgroundColor: 'background.default', 
        minHeight: '100vh',
        pt: 10
      }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
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
              <AdminIcon sx={{ mr: 2, fontSize: 'inherit' }} />
              Admin Reports
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 400
              }}
            >
              Manage user reports and maintain community safety
            </Typography>
          </Box>

          {/* Summary Stats */}
          <Card 
            elevation={0}
            sx={{ 
              mb: 4,
              borderRadius: theme.customTokens.borderRadius.xl,
              border: `1px solid ${theme.palette.divider}`,
              background: 'linear-gradient(135deg, rgba(233, 30, 99, 0.02) 0%, rgba(255, 87, 34, 0.02) 100%)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Reports Overview
              </Typography>
              <Stack direction="row" spacing={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {reports.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Reports
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main' }}>
                    {reports.filter(r => r.reason.toLowerCase().includes('harassment')).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Harassment Reports
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'warning.main' }}>
                    {reports.filter(r => r.reason.toLowerCase().includes('spam')).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Spam Reports
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: theme.customTokens.borderRadius.xl,
              border: `1px solid ${theme.palette.divider}`,
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: 0 }}>
              {reports.length === 0 ? (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <ReportIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    No Reports Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Great! No user reports to review at the moment.
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'rgba(233, 30, 99, 0.02)' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Report ID</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Reporter</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Reported User</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedReports.map((report) => (
                          <TableRow 
                            key={report.id}
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: 'rgba(233, 30, 99, 0.02)' 
                              }
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                #{report.id}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  User #{report.reporterId}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  User #{report.targetId}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={report.reason.length > 30 ? `${report.reason.substring(0, 30)}...` : report.reason}
                                size="small"
                                color={getSeverityColor(report.reason)}
                                sx={{ maxWidth: 200 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(report.createdAt)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <IconButton
                                onClick={() => handleViewReport(report)}
                                size="small"
                                sx={{ 
                                  color: 'primary.main',
                                  '&:hover': {
                                    backgroundColor: 'rgba(233, 30, 99, 0.08)'
                                  }
                                }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={reports.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* Report Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: theme.customTokens.borderRadius.xl,
            border: `1px solid ${theme.palette.divider}`,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Report Details - #{selectedReport?.id}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedReport && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Reporter
                </Typography>
                <Typography variant="body1">
                  User #{selectedReport.reporterId}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Reported User
                </Typography>
                <Typography variant="body1">
                  User #{selectedReport.targetId}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Report Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedReport.createdAt)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Reason for Report
                </Typography>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    backgroundColor: 'rgba(233, 30, 99, 0.02)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body1">
                    {selectedReport.reason}
                  </Typography>
                </Paper>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Close
          </Button>
          <Button variant="contained" color="warning">
            Investigate
          </Button>
          <Button variant="contained" color="error">
            Take Action
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

export default AdminReportsPage;
