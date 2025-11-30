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
  InputAdornment,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { householdsAPI } from '../services/api';

export default function Households() {
  const [households, setHouseholds] = useState([]);
  const [filteredHouseholds, setFilteredHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState(null);

  const [formData, setFormData] = useState({
    primary_contact_name: '',
    phone_number: '',
    address: '',
    household_size: 1,
    priority_level: 1,
  });

  useEffect(() => {
    loadHouseholds();
  }, []);

  useEffect(() => {
    filterHouseholds();
  }, [searchTerm, households]);

  const loadHouseholds = async () => {
    try {
      setLoading(true);
      const response = await householdsAPI.getAll();
      setHouseholds(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load households: ' + (err.response?.data?.detail || err.message));
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterHouseholds = () => {
    if (!searchTerm) {
      setFilteredHouseholds(households);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = households.filter(
      (h) =>
        h.primary_contact_name.toLowerCase().includes(term) ||
        h.phone_number?.toLowerCase().includes(term) ||
        h.address?.toLowerCase().includes(term)
    );
    setFilteredHouseholds(filtered);
  };

  const handleOpenDialog = (household = null) => {
    if (household) {
      setEditingHousehold(household);
      setFormData({
        primary_contact_name: household.primary_contact_name,
        phone_number: household.phone_number || '',
        address: household.address || '',
        household_size: household.household_size,
        priority_level: household.priority_level,
      });
    } else {
      setEditingHousehold(null);
      setFormData({
        primary_contact_name: '',
        phone_number: '',
        address: '',
        household_size: 1,
        priority_level: 1,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingHousehold(null);
    setFormData({
      primary_contact_name: '',
      phone_number: '',
      address: '',
      household_size: 1,
      priority_level: 1,
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingHousehold) {
        await householdsAPI.update(editingHousehold.household_id, formData);
        setSuccessMessage('Household updated successfully');
      } else {
        await householdsAPI.create(formData);
        setSuccessMessage('Household created successfully');
      }

      handleCloseDialog();
      loadHouseholds();
    } catch (err) {
      setError('Failed to save household: ' + (err.response?.data?.detail || err.message));
      console.error('Save error:', err);
    }
  };

  const handleDelete = async (householdId) => {
    if (!window.confirm('Are you sure you want to delete this household?')) {
      return;
    }

    try {
      await householdsAPI.delete(householdId);
      setSuccessMessage('Household deleted successfully');
      loadHouseholds();
    } catch (err) {
      setError('Failed to delete household: ' + (err.response?.data?.detail || err.message));
      console.error('Delete error:', err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'error';
      case 2: return 'warning';
      case 3: return 'info';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return 'High';
      case 2: return 'Medium';
      case 3: return 'Low';
      default: return 'Unknown';
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
            Household Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage beneficiary households and their information
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Household
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
            <TextField
              placeholder="Search households..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
            <Box>
              <Chip
                icon={<PeopleIcon />}
                label={`Total: ${households.length}`}
                color="primary"
                sx={{ mr: 1 }}
              />
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadHouseholds}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Contact Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell align="center">Size</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Registered</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHouseholds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No households found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHouseholds.map((household) => (
                    <TableRow key={household.household_id} hover>
                      <TableCell>{household.household_id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {household.primary_contact_name}
                        </Typography>
                      </TableCell>
                      <TableCell>{household.phone_number || 'N/A'}</TableCell>
                      <TableCell>{household.address || 'N/A'}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={household.household_size}
                          size="small"
                          color="default"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getPriorityLabel(household.priority_level)}
                          size="small"
                          color={getPriorityColor(household.priority_level)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(household.registration_date).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(household)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(household.household_id)}
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
          {editingHousehold ? 'Edit Household' : 'Add New Household'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Primary Contact Name"
                value={formData.primary_contact_name}
                onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Household Size"
                value={formData.household_size}
                onChange={(e) => setFormData({ ...formData, household_size: parseInt(e.target.value) })}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Priority Level"
                value={formData.priority_level}
                onChange={(e) => setFormData({ ...formData, priority_level: parseInt(e.target.value) })}
                required
              >
                <option value={1}>High (1)</option>
                <option value={2}>Medium (2)</option>
                <option value={3}>Low (3)</option>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={!formData.primary_contact_name}
          >
            {editingHousehold ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
