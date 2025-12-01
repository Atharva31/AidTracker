import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  distributionCentersAPI,
  aidPackagesAPI,
  householdsAPI,
  distributionAPI,
} from '../services/api';

export default function Distribution() {
  const [centers, setCenters] = useState([]);
  const [packages, setPackages] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [recentDistributions, setRecentDistributions] = useState([]);

  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [selectedHousehold, setSelectedHousehold] = useState('');

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [centersRes, packagesRes, householdsRes, logsRes] = await Promise.all([
        distributionCentersAPI.getAll(),
        aidPackagesAPI.getAll(),
        householdsAPI.getAll(),
        distributionAPI.getLogs({ limit: 10 }),
      ]);

      setCenters(centersRes.data);
      setPackages(packagesRes.data);
      setHouseholds(householdsRes.data);
      setRecentDistributions(logsRes.data.logs);
    } catch (err) {
      setError('Failed to load data: ' + (err.response?.data?.detail || err.message));
      console.error('Load error:', err);
    }
  };

  const checkEligibility = async () => {
    if (!selectedCenter || !selectedPackage || !selectedHousehold) {
      setError('Please select center, package, and household');
      return;
    }

    setChecking(true);
    setError(null);
    setEligibility(null);

    try {
      const response = await distributionAPI.checkEligibility({
        center_id: parseInt(selectedCenter),
        package_id: parseInt(selectedPackage),
        household_id: parseInt(selectedHousehold),
      });

      setEligibility(response.data);
    } catch (err) {
      setError('Eligibility check failed: ' + (err.response?.data?.detail || err.message));
      console.error('Eligibility error:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleDistribute = async () => {
    if (!selectedCenter || !selectedPackage || !selectedHousehold) {
      setError('Please select center, package, and household');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await distributionAPI.distribute({
        center_id: parseInt(selectedCenter),
        package_id: parseInt(selectedPackage),
        household_id: parseInt(selectedHousehold),
      });

      setSuccessMessage(response.data.message);
      setEligibility(null);

      // Reset form
      setSelectedCenter('');
      setSelectedPackage('');
      setSelectedHousehold('');

      // Reload recent distributions
      loadData();

    } catch (err) {
      setError('Distribution failed: ' + (err.response?.data?.detail || err.message));
      console.error('Distribution error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCenter('');
    setSelectedPackage('');
    setSelectedHousehold('');
    setEligibility(null);
    setSuccessMessage(null);
    setError(null);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Aid Distribution
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Distribute aid packages to eligible households
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Distribution Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                New Distribution
              </Typography>

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

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Distribution Center"
                    value={selectedCenter}
                    onChange={(e) => setSelectedCenter(e.target.value)}
                    disabled={loading}
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
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                    disabled={loading}
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
                    select
                    fullWidth
                    label="Household"
                    value={selectedHousehold}
                    onChange={(e) => setSelectedHousehold(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="">Select a household</MenuItem>
                    {households.map((household) => (
                      <MenuItem key={household.household_id} value={household.household_id}>
                        {household.primary_contact_name} - {household.household_size} members
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={checking ? <CircularProgress size={20} /> : <CheckIcon />}
                    onClick={checkEligibility}
                    disabled={checking || loading}
                  >
                    Check Eligibility
                  </Button>
                </Grid>

                {eligibility && (
                  <Grid item xs={12}>
                    <Alert severity={eligibility.eligible ? 'success' : 'warning'}>
                      <Typography variant="body2" fontWeight="600">
                        {eligibility.eligible ? 'Eligible for Distribution' : 'Not Eligible'}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {eligibility.message}
                      </Typography>
                      {eligibility.days_since_last_distribution !== null && (
                        <Typography variant="caption" display="block">
                          Days since last distribution: {eligibility.days_since_last_distribution}
                        </Typography>
                      )}
                    </Alert>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    color="primary"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    onClick={handleDistribute}
                    disabled={loading || checking}
                  >
                    Distribute
                  </Button>
                </Grid>

                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    color="secondary"
                    startIcon={<RefreshIcon />}
                    onClick={resetForm}
                    disabled={loading || checking}
                  >
                    Reset
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Distributions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="600">
                  Recent Distributions
                </Typography>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={loadData}
                >
                  Refresh
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Household</TableCell>
                      <TableCell>Package</TableCell>
                      <TableCell>Center</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentDistributions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="textSecondary">
                            No recent distributions
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentDistributions.map((dist) => (
                        <TableRow key={dist.log_id}>
                          <TableCell>
                            <Typography variant="caption">
                              {new Date(dist.distribution_date).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {dist.household_contact}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={dist.package_name}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {dist.center_name}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
