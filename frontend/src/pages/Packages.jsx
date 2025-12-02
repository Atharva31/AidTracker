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
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { aidPackagesAPI } from '../services/api';

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'food',
  });

  const categories = [
    { value: 'food', label: 'Food' },
    { value: 'hygiene', label: 'Hygiene' },
    { value: 'medical', label: 'Medical' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'educational', label: 'Educational' },
    { value: 'household', label: 'Household' },
  ];

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await aidPackagesAPI.getAll();
      setPackages(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load packages: ' + (err.response?.data?.detail || err.message));
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.package_name,
        description: pkg.description || '',
        category: pkg.category,
      });
    } else {
      setEditingPackage(null);
      setFormData({
        name: '',
        description: '',
        category: 'food',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPackage(null);
    setFormData({
      name: '',
      description: '',
      category: 'food',
    });
  };

  const handleSubmit = async () => {
    try {
      // Transform formData to match backend schema
      const apiData = {
        package_name: formData.name,
        description: formData.description,
        category: formData.category,
        estimated_cost: 10.0, // Default value
        validity_period_days: 30, // Default value
      };

      if (editingPackage) {
        await aidPackagesAPI.update(editingPackage.package_id, apiData);
        setSuccessMessage('Package updated successfully');
      } else {
        await aidPackagesAPI.create(apiData);
        setSuccessMessage('Package created successfully');
      }

      handleCloseDialog();
      loadPackages();
    } catch (err) {
      setError('Failed to save package: ' + (err.response?.data?.detail || err.message));
      console.error('Save error:', err);
    }
  };

  const handleDelete = async (packageId) => {
    if (!window.confirm('Are you sure you want to delete this package?')) {
      return;
    }

    try {
      await aidPackagesAPI.delete(packageId);
      setSuccessMessage('Package deleted successfully');
      loadPackages();
    } catch (err) {
      setError('Failed to delete package: ' + (err.response?.data?.detail || err.message));
      console.error('Delete error:', err);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      food: 'success',
      hygiene: 'info',
      medical: 'error',
      clothing: 'warning',
      educational: 'secondary',
      household: 'primary',
    };
    return colors[category] || 'default';
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
            Aid Packages
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage available aid packages and their details
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Package
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
              <InventoryIcon color="primary" />
              <Typography variant="h6" fontWeight="600">
                All Packages
              </Typography>
              <Chip label={`Total: ${packages.length}`} size="small" color="primary" />
            </Box>
            <Button size="small" startIcon={<RefreshIcon />} onClick={loadPackages}>
              Refresh
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {packages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No packages found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  packages.map((pkg) => (
                    <TableRow key={pkg.package_id} hover>
                      <TableCell>{pkg.package_id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {pkg.package_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {pkg.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={pkg.category}
                          size="small"
                          color={getCategoryColor(pkg.category)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(pkg)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(pkg.package_id)}
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
          {editingPackage ? 'Edit Package' : 'Add New Package'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Package Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Basic Food Package"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                placeholder="Describe the contents and purpose of this package"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
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
            disabled={!formData.name || !formData.category}
          >
            {editingPackage ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
