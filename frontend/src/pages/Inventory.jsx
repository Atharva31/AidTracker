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
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { inventoryAPI, distributionCentersAPI, aidPackagesAPI } from '../services/api';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [centers, setCenters] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const [restockForm, setRestockForm] = useState({
    center_id: '',
    package_id: '',
    quantity: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inventoryRes, centersRes, packagesRes] = await Promise.all([
        inventoryAPI.getAll(),
        distributionCentersAPI.getAll(),
        aidPackagesAPI.getAll(),
      ]);

      setInventory(inventoryRes.data);
      setCenters(centersRes.data);
      setPackages(packagesRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load data: ' + (err.response?.data?.detail || err.message));
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setRestockForm({
      center_id: '',
      package_id: '',
      quantity: 0,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleRestock = async () => {
    try {
      await inventoryAPI.restock({
        center_id: parseInt(restockForm.center_id),
        package_id: parseInt(restockForm.package_id),
        quantity: parseInt(restockForm.quantity),
      });

      setSuccessMessage('Inventory restocked successfully');
      handleCloseDialog();
      loadData();
    } catch (err) {
      setError('Failed to restock: ' + (err.response?.data?.detail || err.message));
      console.error('Restock error:', err);
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'error', icon: <WarningIcon /> };
    if (quantity <= 5) return { label: 'Low Stock', color: 'warning', icon: <WarningIcon /> };
    return { label: 'In Stock', color: 'success', icon: <CheckIcon /> };
  };

  const lowStockCount = inventory.filter((item) => (item.quantity || 0) <= 5).length;
  const outOfStockCount = inventory.filter((item) => (item.quantity || 0) === 0).length;

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
            Inventory Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Monitor and manage aid package inventory across all centers
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Restock Inventory
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

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Items
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold">
                {inventory.reduce((sum, item) => sum + (item.quantity || 0), 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Across all centers
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Low Stock Items
                  </Typography>
                  <Typography variant="h3" component="div" fontWeight="bold" color="warning.main">
                    {lowStockCount}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Requires attention
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Out of Stock
                  </Typography>
                  <Typography variant="h3" component="div" fontWeight="bold" color="error.main">
                    {outOfStockCount}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Critical items
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Inventory Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="600">
              Inventory Status
            </Typography>
            <Button size="small" startIcon={<RefreshIcon />} onClick={loadData}>
              Refresh
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Center</TableCell>
                  <TableCell>Package</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No inventory data available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((item, index) => {
                    const status = getStockStatus(item.quantity || 0);
                    return (
                      <TableRow
                        key={index}
                        hover
                        sx={{
                          backgroundColor: (item.quantity || 0) === 0
                            ? 'error.lighter'
                            : (item.quantity || 0) <= 5
                              ? 'warning.lighter'
                              : 'transparent',
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            {item.center_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.center_location}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            {item.package_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.package_category}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            color={
                              (item.quantity || 0) === 0
                                ? 'error.main'
                                : (item.quantity || 0) <= 5
                                  ? 'warning.main'
                                  : 'success.main'
                            }
                          >
                            {item.quantity || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={status.icon}
                            label={status.label}
                            size="small"
                            color={status.color}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(item.last_updated).toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Restock Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Restock Inventory</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Distribution Center"
                value={restockForm.center_id}
                onChange={(e) => setRestockForm({ ...restockForm, center_id: e.target.value })}
                required
              >
                <MenuItem value="">Select a center</MenuItem>
                {centers.map((center) => (
                  <MenuItem key={center.center_id} value={center.center_id}>
                    {center.center_name} - {center.city}, {center.state}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Aid Package"
                value={restockForm.package_id}
                onChange={(e) => setRestockForm({ ...restockForm, package_id: e.target.value })}
                required
              >
                <MenuItem value="">Select a package</MenuItem>
                {packages.map((pkg) => (
                  <MenuItem key={pkg.package_id} value={pkg.package_id}>
                    {pkg.name} - {pkg.category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Quantity to Add"
                value={restockForm.quantity}
                onChange={(e) => setRestockForm({ ...restockForm, quantity: parseInt(e.target.value) })}
                inputProps={{ min: 1 }}
                required
                helperText="Enter the number of items to add to inventory"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleRestock}
            variant="contained"
            color="primary"
            disabled={!restockForm.center_id || !restockForm.package_id || restockForm.quantity <= 0}
          >
            Restock
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
