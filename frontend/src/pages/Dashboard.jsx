import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  Inventory as InventoryIcon,
  LocationOn as LocationIcon,
  Warning as WarningIcon,
  LocalShipping as ShippingIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { reportsAPI } from '../services/api';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <Card>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h3" component="div" fontWeight="bold">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: 2,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ fontSize: 40, color: `${color}.main` }} />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getDashboard();
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error('Dashboard error:', err);
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
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard Overview
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Real-time monitoring of aid distribution activities
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Households"
            value={stats?.total_households || 0}
            icon={PeopleIcon}
            color="primary"
            subtitle="Active households registered"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Distributions"
            value={stats?.total_distributions || 0}
            icon={ShippingIcon}
            color="success"
            subtitle="Successful distributions"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Active Centers"
            value={stats?.total_centers || 0}
            icon={LocationIcon}
            color="info"
            subtitle="Distribution locations"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Low Stock Items"
            value={stats?.low_stock_items || 0}
            icon={WarningIcon}
            color="warning"
            subtitle="Requires restocking"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Critical Households"
            value={stats?.critical_households || 0}
            icon={WarningIcon}
            color="error"
            subtitle="Never received aid"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Recent Distributions"
            value={stats?.recent_distributions || 0}
            icon={TrendingIcon}
            color="secondary"
            subtitle="Last 7 days"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Quick Actions
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Use the navigation menu on the left to:
            </Typography>
            <Box component="ul" sx={{ mt: 2, pl: 3 }}>
              <li>
                <Typography variant="body2">
                  <strong>Distribution:</strong> Distribute aid packages to households
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Households:</strong> Manage beneficiary households
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Inventory:</strong> Monitor and restock supplies
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Reports:</strong> View detailed analytics and reports
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Concurrency Demo:</strong> Test race condition prevention
                </Typography>
              </li>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
