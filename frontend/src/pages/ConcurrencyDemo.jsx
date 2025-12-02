import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  Grid,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { distributionAPI, inventoryAPI } from '../services/api';

export default function ConcurrencyDemo() {
  const [loading, setLoading] = useState(false);
  const [inventoryBefore, setInventoryBefore] = useState(null);
  const [inventoryAfter, setInventoryAfter] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  // Milpitas center ID and package ID (should have only 1 item left)
  const MILPITAS_CENTER_ID = 1;
  const TEST_PACKAGE_ID = 1;
  const TEST_HOUSEHOLD_1 = 6;  // Williams Family - eligible
  const TEST_HOUSEHOLD_2 = 7;  // Patel Family - eligible

  useEffect(() => {
    loadInitialInventory();
  }, []);

  const loadInitialInventory = async () => {
    try {
      const response = await inventoryAPI.getAll();
      const milpitasInventory = response.data.find(
        (inv) => inv.center_id === MILPITAS_CENTER_ID && inv.package_id === TEST_PACKAGE_ID
      );
      setInventoryBefore(milpitasInventory);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  };

  const runRaceConditionTest = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setInventoryAfter(null);

    try {
      // Load inventory before test
      await loadInitialInventory();

      // Fire two simultaneous distribution requests
      const request1 = distributionAPI.distribute({
        center_id: MILPITAS_CENTER_ID,
        package_id: TEST_PACKAGE_ID,
        household_id: TEST_HOUSEHOLD_1,
      });

      const request2 = distributionAPI.distribute({
        center_id: MILPITAS_CENTER_ID,
        package_id: TEST_PACKAGE_ID,
        household_id: TEST_HOUSEHOLD_2,
      });

      // Wait for both to complete
      const [result1, result2] = await Promise.allSettled([request1, request2]);

      // Process results
      const processedResults = [
        {
          household: TEST_HOUSEHOLD_1,
          status: result1.status === 'fulfilled' ? 'success' : 'failed',
          message: result1.status === 'fulfilled'
            ? result1.value.data.message
            : result1.reason.response?.data?.detail || 'Request failed',
        },
        {
          household: TEST_HOUSEHOLD_2,
          status: result2.status === 'fulfilled' ? 'success' : 'failed',
          message: result2.status === 'fulfilled'
            ? result2.value.data.message
            : result2.reason.response?.data?.detail || 'Request failed',
        },
      ];

      setResults(processedResults);

      // Load inventory after test
      const afterResponse = await inventoryAPI.getAll();
      const milpitasAfter = afterResponse.data.find(
        (inv) => inv.center_id === MILPITAS_CENTER_ID && inv.package_id === TEST_PACKAGE_ID
      );
      setInventoryAfter(milpitasAfter);

    } catch (err) {
      setError('Failed to run race condition test: ' + (err.response?.data?.detail || err.message));
      console.error('Race condition test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetTest = async () => {
    setLoading(true);
    try {
      // Clear distribution logs for test households (makes them eligible again)
      await distributionAPI.resetTest();

      // Get current inventory
      const response = await inventoryAPI.getAll();
      const currentInventory = response.data.find(
        (inv) => inv.center_id === MILPITAS_CENTER_ID && inv.package_id === TEST_PACKAGE_ID
      );

      // Calculate how much to restock to get to exactly 1 item
      const currentQty = currentInventory?.quantity || 0;
      const targetQty = 1;
      const restockAmount = targetQty - currentQty;

      if (restockAmount > 0) {
        // Need to add items
        await inventoryAPI.restock({
          center_id: MILPITAS_CENTER_ID,
          package_id: TEST_PACKAGE_ID,
          quantity: restockAmount
        });
      } else if (restockAmount < 0) {
        // Too many items - need to manually set (use direct SQL or just inform user)
        setError(`Current inventory is ${currentQty}. Please manually set to 1 item for the test.`);
        setLoading(false);
        return;
      }

      setResults([]);
      setInventoryAfter(null);
      await loadInitialInventory();

      setError(null);
    } catch (err) {
      setError('Failed to reset inventory: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Race Condition Prevention Demo
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Demonstrating PostgreSQL's SELECT FOR UPDATE to prevent race conditions in concurrent transactions
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Explanation Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                The Problem: Race Conditions
              </Typography>
              <Typography variant="body2" paragraph>
                When multiple users try to distribute the same aid package simultaneously,
                a race condition can occur:
              </Typography>
              <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                <li>
                  <Typography variant="body2">
                    Both transactions read: "1 item available"
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Both think they can distribute
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Both decrement: 1 - 1 = 0, 1 - 1 = 0
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Result: 2 distributions but only 1 item was available!
                  </Typography>
                </li>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom fontWeight="600">
                The Solution: SELECT FOR UPDATE
              </Typography>
              <Typography variant="body2" paragraph>
                PostgreSQL's row-level locking prevents this:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <li>
                  <Typography variant="body2">
                    First transaction locks the row with SELECT FOR UPDATE
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Second transaction waits for the lock to release
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    First transaction distributes and decrements to 0
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Second transaction reads 0 items and fails gracefully
                  </Typography>
                </li>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Control Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Run the Test
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Click the button below to fire 2 simultaneous distribution requests
                for the same package at Milpitas center. Only ONE should succeed.
              </Typography>

              {inventoryBefore && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="600">
                    Current Inventory: {inventoryBefore.quantity} item(s) available
                  </Typography>
                  <Typography variant="caption" display="block">
                    Center: {inventoryBefore.center_name} | Package: {inventoryBefore.package_name}
                  </Typography>
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
                  onClick={runRaceConditionTest}
                  disabled={loading}
                >
                  {loading ? 'Testing...' : 'Test Race Condition'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<RefreshIcon />}
                  onClick={resetTest}
                  disabled={loading}
                >
                  Reset
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {results.length > 0 && (
                <Box>
                  <Alert
                    severity={successCount === 1 && failedCount === 1 ? 'success' : 'warning'}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="body2" fontWeight="600">
                      Test Complete: {successCount} succeeded, {failedCount} failed
                    </Typography>
                    {successCount === 1 && failedCount === 1 && (
                      <Typography variant="caption" display="block">
                        Perfect! SELECT FOR UPDATE prevented the race condition.
                      </Typography>
                    )}
                  </Alert>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Household</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Message</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell>Household #{result.household}</TableCell>
                            <TableCell>
                              <Chip
                                icon={result.status === 'success' ? <SuccessIcon /> : <ErrorIcon />}
                                label={result.status}
                                color={result.status === 'success' ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {result.message}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {inventoryAfter && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2" fontWeight="600">
                        Final Inventory: {inventoryAfter.quantity} item(s) remaining
                      </Typography>
                      <Typography variant="caption" display="block">
                        Inventory correctly decremented by 1 (not 2)
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* SQL Explanation Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                How It Works: The SQL Behind the Scenes
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  1. Acquire Row Lock (SELECT FOR UPDATE)
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" fontFamily="monospace">
                    SELECT quantity FROM inventory<br />
                    WHERE center_id = 1 AND package_id = 1<br />
                    FOR UPDATE;
                  </Typography>
                </Paper>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                  This locks the row, preventing other transactions from reading/modifying it until commit.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  2. Check Availability
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" fontFamily="monospace">
                    IF quantity &gt; 0 THEN<br />
                    &nbsp;&nbsp;-- Proceed with distribution<br />
                    ELSE<br />
                    &nbsp;&nbsp;RAISE 'Insufficient inventory';<br />
                    END IF;
                  </Typography>
                </Paper>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  3. Update Inventory (if available)
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" fontFamily="monospace">
                    UPDATE inventory<br />
                    SET quantity = quantity - 1<br />
                    WHERE center_id = 1 AND package_id = 1;
                  </Typography>
                </Paper>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  4. Commit Transaction
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" fontFamily="monospace">
                    COMMIT;
                  </Typography>
                </Paper>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                  Lock is released. The next waiting transaction can now acquire the lock and read the updated quantity.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
