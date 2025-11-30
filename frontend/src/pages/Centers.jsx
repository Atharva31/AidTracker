import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { distributionCentersAPI } from '../services/api';

export default function Centers() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contact_number: '',
  });

  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      setLoading(true);
      const response = await distributionCentersAPI.getAll();
      setCenters(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load centers: ' + (err.response?.data?.detail || err.message));
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (center = null) => {
    if (center) {
      setEditingCenter(center);
      setFormData({
        name: center.name,
        location: center.location,
        contact_number: center.contact_number || '',
      });
    } else {
      setEditingCenter(null);
      setFormData({
        name: '',
        location: '',
        contact_number: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCenter(null);
    setFormData({
      name: '',
      location: '',
      contact_number: '',
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingCenter) {
        await distributionCentersAPI.update(editingCenter.center_id, formData);
        setSuccessMessage('Center updated successfully');
      } else {
        await distributionCentersAPI.create(formData);
        setSuccessMessage('Center created successfully');
      }

      handleCloseDialog();
      loadCenters();
    } catch (err) {
      setError('Failed to save center: ' + (err.response?.data?.detail || err.message));
      console.error('Save error:', err);
    }
  };

  const handleDelete = async (centerId) => {
    if (!window.confirm('Are you sure you want to delete this center?')) {
      return;
    }

    try {
      await distributionCentersAPI.delete(centerId);
      setSuccessMessage('Center deleted successfully');
      loadCenters();
    } catch (err) {
      setError('Failed to delete center: ' + (err.response?.data?.detail || err.message));
      console.error('Delete error:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Distribution Centers
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage distribution center locations and contact information
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Center
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <LocationIcon color="primary" />
              <Typography variant="h6" fontWeight="600">
                All Centers
              </Typography>
              <Chip label={`Total: ${centers.length}`} size="small" color="primary" />
            </Box>
            <Button size="small" startIcon={<RefreshIcon />} onClick={loadCenters}>
              Refresh
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Contact Number</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {centers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No centers found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  centers.map((center) => (
                    <TableRow key={center.center_id} hover>
                      <TableCell>{center.center_id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {center.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {center.location}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {center.contact_number || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(center)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(center.center_id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCenter ? 'Edit Distribution Center' : 'Add New Distribution Center'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Center Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Milpitas Community Center"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                placeholder="e.g., 123 Main St, Milpitas, CA 95035"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Number"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                placeholder="e.g., (408) 555-1234"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={!formData.name || !formData.location}
          >
            {editingCenter ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
