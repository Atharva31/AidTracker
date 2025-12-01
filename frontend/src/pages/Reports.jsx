import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
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
  Divider,
  Button,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { reportsAPI } from '../services/api';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [pendingHouseholds, setPendingHouseholds] = useState([]);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [summaryRes, pendingRes, statsRes] = await Promise.all([
        reportsAPI.getMonthlySummary(),
        reportsAPI.getPendingHouseholds(),
        reportsAPI.getDashboard(),
      ]);

      setMonthlySummary(summaryRes.data.summary);
      setPendingHouseholds(pendingRes.data.households);

      // Map dashboard data to statistics format expected by UI
      const dashboard = statsRes.data;
      setStatistics({
        total_distributions: dashboard.total_distributions,
        unique_households: dashboard.total_households, // Approximation
        active_centers: dashboard.total_centers,
        package_types: 12, // Hardcoded for now or fetch from packages API
        most_distributed_package: 'Basic Food Kit', // Placeholder
        most_distributed_count: 0,
        avg_days_between_distributions: 0,
        distribution_rate: (dashboard.total_distributions / dashboard.total_households) * 100
      });
      setError(null);
    } catch (err) {
      setError('Failed to load reports: ' + (err.response?.data?.detail || err.message));
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Reports & Analytics
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Comprehensive insights into aid distribution activities
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadReports}
        >
          Refresh Data
        </Button>
      </Box>

      {/* Statistics Overview */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <AssessmentIcon color="primary" />
                  <Typography variant="h6" fontWeight="600">
                    Distribution Statistics
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight="bold" color="primary.main">
                        {statistics.total_distributions || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Distributions
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight="bold" color="success.main">
                        {statistics.unique_households || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Households Served
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight="bold" color="info.main">
                        {statistics.active_centers || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Active Centers
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight="bold" color="secondary.main">
                        {statistics.package_types || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Package Types
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {statistics.most_distributed_package && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                    <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                      Most Distributed Package
                    </Typography>
                    <Typography variant="body2">
                      <strong>{statistics.most_distributed_package}</strong> - {statistics.most_distributed_count} distributions
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Monthly Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CalendarIcon color="primary" />
                <Typography variant="h6" fontWeight="600">
                  Monthly Summary
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" paragraph>
                Distribution trends by month and year
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell>Year</TableCell>
                      <TableCell align="right">Distributions</TableCell>
                      <TableCell align="right">Households</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {monthlySummary.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="textSecondary">
                            No monthly data available
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      monthlySummary.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Chip
                              label={new Date(item.year, item.month - 1).toLocaleString('default', { month: 'long' })}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{item.year}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="600">
                              {item.total_distributions}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="600">
                              {item.unique_households}
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

        {/* Pending Households */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <WarningIcon color="warning" />
                <Typography variant="h6" fontWeight="600">
                  Pending Households
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" paragraph>
                Households that haven't received aid in 30+ days
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Household</TableCell>
                      <TableCell>Last Distribution</TableCell>
                      <TableCell align="right">Days Ago</TableCell>
                      <TableCell>Priority</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingHouseholds.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="textSecondary">
                            No pending households
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingHouseholds.map((household) => (
                        <TableRow key={household.household_id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="600">
                              {household.primary_contact_name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Size: {household.family_size}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {household.last_distribution_date
                                ? new Date(household.last_distribution_date).toLocaleDateString()
                                : 'Never'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={household.days_since_last_distribution || 'N/A'}
                              size="small"
                              color={
                                !household.days_since_last_distribution
                                  ? 'error'
                                  : household.days_since_last_distribution > 60
                                    ? 'error'
                                    : 'warning'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={household.priority_level}
                              size="small"
                              color={
                                ['critical', 'high'].includes(household.priority_level)
                                  ? 'error'
                                  : household.priority_level === 'medium'
                                    ? 'warning'
                                    : 'default'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {pendingHouseholds.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="600">
                    {pendingHouseholds.length} household(s) need attention
                  </Typography>
                  <Typography variant="caption">
                    Consider prioritizing these households for upcoming distributions
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Insights */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <TrendingIcon color="primary" />
            <Typography variant="h6" fontWeight="600">
              Key Insights
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  Average Distribution Frequency
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {statistics?.avg_days_between_distributions
                    ? `${Math.round(statistics.avg_days_between_distributions)} days`
                    : 'N/A'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Time between distributions per household
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  Distribution Rate
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {statistics?.distribution_rate
                    ? `${statistics.distribution_rate.toFixed(1)}%`
                    : 'N/A'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Households served vs. total registered
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  Critical Households
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {pendingHouseholds.filter(h => !h.last_distribution_date).length}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Never received any aid
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
