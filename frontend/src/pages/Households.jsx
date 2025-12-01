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
    family_name: '',
    primary_contact_name: '',
    phone_number: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    family_size: 1,
    income_level: 'low',
    priority_level: 'medium',
    registration_date: new Date().toISOString().split('T')[0],
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
        h.family_name.toLowerCase().includes(term) ||
        h.phone_number?.toLowerCase().includes(term) ||
        h.address?.toLowerCase().includes(term)
    );
    setFilteredHouseholds(filtered);
  };

  const handleOpenDialog = (household = null) => {
    if (household) {
      setEditingHousehold(household);
      setFormData({
        family_name: household.family_name,
        primary_contact_name: household.primary_contact_name,
        phone_number: household.phone_number || '',
        email: household.email || '',
        address: household.address || '',
        city: household.city || '',
        state: household.state || '',
        zip_code: household.zip_code || '',
        family_size: household.family_size,
        income_level: household.income_level,
        priority_level: household.priority_level,
        registration_date: household.registration_date,
      });
    } else {
      setEditingHousehold(null);
      setFormData({
        family_name: '',
        primary_contact_name: '',
        phone_number: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        family_size: 1,
        income_level: 'low',
        priority_level: 'medium',
        registration_date: new Date().toISOString().split('T')[0],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingHousehold(null);
    setFormData({
      family_name: '',
      primary_contact_name: '',
      phone_number: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      family_size: 1,
      income_level: 'low',
      priority_level: 'medium',
      registration_date: new Date().toISOString().split('T')[0],
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
    switch (priority?.toLowerCase()) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority) => {
    if (!priority) return 'Unknown';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
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
                  <TableCell>Family Name</TableCell>
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
                    <TableCell colSpan={9} align="center">
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
                          {household.family_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {household.primary_contact_name}
                        </Typography>
                      </TableCell>
                      <TableCell>{household.phone_number || 'N/A'}</TableCell>
                      <TableCell>{household.address}, {household.city}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={household.family_size}
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingHousehold ? 'Edit Household' : 'Add New Household'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Family Name"
                value={formData.family_name}
                onChange={(e) => setFormData({ ...formData, family_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Primary Contact Name"
                value={formData.primary_contact_name}
                onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Zip Code"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Family Size"
                value={formData.family_size}
                onChange={(e) => setFormData({ ...formData, family_size: parseInt(e.target.value) })}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Income Level"
                value={formData.income_level}
                onChange={(e) => setFormData({ ...formData, income_level: e.target.value })}
                required
                SelectProps={{ native: true }}
              >
                <option value="no_income">No Income</option>
                <option value="very_low">Very Low</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Priority Level"
                value={formData.priority_level}
                onChange={(e) => setFormData({ ...formData, priority_level: e.target.value })}
                required
                SelectProps={{ native: true }}
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
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
            disabled={!formData.family_name || !formData.primary_contact_name || !formData.phone_number}
          >
            {editingHousehold ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
