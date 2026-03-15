import {
  Container,
  Card,
  CardContent,
  CardHeader,
  Button,
  Box,
  Grid,
  Typography,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useLanguage } from '../contexts/LanguageContext';
import { useSession } from '../contexts/SessionContext';
import {
  getCustomersForSession,
  deleteCustomerFromSession,
  getSessionKey,
  addCustomer,
  updateCustomerInSession,
  type CustomerRecord,
} from '../lib/customerManager';
import { formatAmount, parseBettingText } from '../lib/bettingParser';
import { useState, useEffect, useMemo } from 'react';

export default function CustomerList() {
  const { t } = useLanguage();
  const { date, session, sessionKey } = useSession();
  const { enqueueSnackbar } = useSnackbar();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  
  // Date and session state
  const [displayDate, setDisplayDate] = useState(date.toISOString().split('T')[0]);
  const [displaySession, setDisplaySession] = useState(session);
  const [pickerDate, setPickerDate] = useState(displayDate);
  const [pickerSession, setPickerSession] = useState(displaySession);
  
  // Form state
  const [name, setName] = useState('');
  const [bettingData, setBettingData] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash');
  const [weeklySettle, setWeeklySettle] = useState(false);
  const [bettingType, setBettingType] = useState<'2D' | '3D'>('2D');

  useEffect(() => {
    loadCustomers();
  }, [displayDate, displaySession]);

  const loadCustomers = () => {
    const dateStr = displayDate;
    const dateObj = new Date(dateStr);
    const loaded = getCustomersForSession(getSessionKey(dateObj, displaySession));
    setCustomers(loaded);
  };

  const resetForm = () => {
    setName('');
    setBettingData('');
    setPaymentType('cash');
    setWeeklySettle(false);
    setBettingType('2D');
    setEditingCustomer(null);
  };

  const handleAddCustomer = () => {
    if (!name.trim()) {
      enqueueSnackbar(t('modal.customerName') + ' required', { variant: 'error' });
      return;
    }

    if (!bettingData.trim()) {
      enqueueSnackbar(t('modal.bettingData') + ' required', { variant: 'error' });
      return;
    }

    try {
      const parsed = parseBettingText(bettingData, bettingType);
      if (parsed.entries.length === 0) {
        enqueueSnackbar('No valid bets found', { variant: 'error' });
        return;
      }

      // Use current time
      const now = new Date();
      const customerDate = new Date(displayDate);
      customerDate.setHours(now.getHours(), now.getMinutes(), 0);

      const customer: CustomerRecord = {
        id: editingCustomer?.id || Date.now().toString(),
        name,
        bettingData: parsed.entries,
        paymentType,
        weeklySettle: paymentType === 'credit' ? weeklySettle : false,
        bettingType,
        date: customerDate,
        session: displaySession,
        totalBet: parsed.totalAmount,
      };

      if (editingCustomer) {
        updateCustomerInSession(customer.id, customer, sessionKey);
      } else {
        addCustomer(customer, customerDate, displaySession);
      }
      enqueueSnackbar(editingCustomer ? 'Customer updated' : 'Customer added', { variant: 'success' });
      resetForm();
      setShowAddModal(false);
      loadCustomers();
    } catch (error) {
      enqueueSnackbar('Error parsing betting data', { variant: 'error' });
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      if (deleteCustomerFromSession(customerId, sessionKey)) {
        enqueueSnackbar('Customer deleted', { variant: 'success' });
        loadCustomers();
      }
    }
  };

  const handleEditCustomer = (customer: CustomerRecord) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPaymentType(customer.paymentType);
    setWeeklySettle(customer.weeklySettle || false);
    setBettingType(customer.bettingType);
    const bettingArray = Array.isArray(customer.bettingData)
      ? customer.bettingData
      : Object.values(customer.bettingData || {}).flat();
    setBettingData(
      bettingArray.map((b: any) => `${b.number} ${b.amount}`).join('\n')
    );
    setShowAddModal(true);
  };

  const handleDateSelect = () => {
    setDisplayDate(pickerDate);
    setDisplaySession(pickerSession);
    setShowDatePicker(false);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const cash = customers.filter(c => c.paymentType === 'cash').length;
    const credit = customers.filter(c => c.paymentType === 'credit').length;
    const total = customers.reduce((sum, c) => sum + c.totalBet, 0);
    return { cash, credit, total };
  }, [customers]);

  const totalBets = stats.total;
  const cashCount = stats.cash;
  const creditCount = stats.credit;

  const displayDateFormatted = new Date(displayDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {t('customers.title')}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          {t('customers.description')}
        </Typography>

        {/* Inline Date + Session Selector */}
        <Card elevation={1} sx={{ p: 2, mb: 3, backgroundColor: 'action.hover' }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Button
              variant="text"
              onClick={() => setShowDatePicker(true)}
              sx={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'primary.main',
                textTransform: 'none',
                '&:hover': { backgroundColor: 'action.hover' },
              }}
            >
              📅 {displayDateFormatted}
            </Button>
            <ToggleButtonGroup
              value={displaySession}
              exclusive
              onChange={(e, newSession) => newSession && setDisplaySession(newSession)}
              size="small"
            >
              <ToggleButton value="morning">🌅 {t('modal.morning')}</ToggleButton>
              <ToggleButton value="evening">🌙 {t('modal.evening')}</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Card>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6 }}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography color="textSecondary" variant="body2">
                {t('customers.totalCustomers')}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {customers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography color="textSecondary" variant="body2">
                {t('customers.totalBets')}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {formatAmount(totalBets)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography color="textSecondary" variant="body2">
                {t('customers.cash')}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                {cashCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography color="textSecondary" variant="body2">
                {t('customers.credit')}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {creditCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add New Customer Button */}
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => {
          resetForm();
          setShowAddModal(true);
        }}
        fullWidth
        sx={{ mb: 4 }}
      >
        {t('customers.addNew')}
      </Button>

      {/* Customer List */}
      {customers.length === 0 ? (
        <Card elevation={1} sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>
            {t('customers.noCust')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('customers.addFirst')}
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {customers.map((customer) => {
            const bettingData = Array.isArray(customer.bettingData)
              ? customer.bettingData
              : Object.values(customer.bettingData || {}).flat();
            return (
              <Card key={customer.id} elevation={1}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {customer.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {new Date(customer.date).toLocaleDateString()} •{' '}
                        {customer.session === 'morning' ? '🌅' : '🌙'}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditCustomer(customer)}
                        color="primary"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteCustomer(customer.id)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                    <Chip label={customer.bettingType} size="small" variant="outlined" />
                    <Chip
                      label={customer.paymentType === 'cash' ? '💵 Cash' : '📋 Credit'}
                      size="small"
                      color={customer.paymentType === 'cash' ? 'success' : 'warning'}
                      variant="filled"
                    />
                    {customer.weeklySettle && (
                      <Chip label="Weekly Clear" size="small" variant="outlined" />
                    )}
                  </Stack>

                  <Box sx={{ backgroundColor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                      {bettingData.map((bet: any, idx: number) => (
                        <Chip
                          key={idx}
                          label={`${bet.number}: ${formatAmount(bet.amount)}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Box>

                  <Typography variant="body2" sx={{ mt: 2, fontWeight: 600 }}>
                    Total: {formatAmount(customer.totalBet)}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Add/Edit Customer Modal */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCustomer ? t('modal.editCustomer') : t('modal.addCustomer')}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, maxHeight: '70vh', overflow: 'auto' }}>
          <TextField
            fullWidth
            label={t('modal.customerName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t('modal.bettingType')}</InputLabel>
            <Select value={bettingType} label={t('modal.bettingType')} onChange={(e) => setBettingType(e.target.value as '2D' | '3D')}>
              <MenuItem value="2D">2D</MenuItem>
              <MenuItem value="3D">3D</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={t('modal.bettingData')}
            value={bettingData}
            onChange={(e) => setBettingData(e.target.value)}
            multiline
            rows={4}
            sx={{ mb: 2 }}
            placeholder="12 500&#10;34 1000 ks&#10;56 300R"
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t('modal.paymentType')}</InputLabel>
            <Select
              value={paymentType}
              label={t('modal.paymentType')}
              onChange={(e) => setPaymentType(e.target.value as 'cash' | 'credit')}
            >
              <MenuItem value="cash">💵 Cash</MenuItem>
              <MenuItem value="credit">📋 Credit</MenuItem>
            </Select>
          </FormControl>

          {paymentType === 'credit' && (
            <FormControlLabel
              control={<Checkbox checked={weeklySettle} onChange={(e) => setWeeklySettle(e.target.checked)} />}
              label={t('modal.weeklyClear')}
              sx={{ mb: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddModal(false)}>{t('modal.cancel')}</Button>
          <Button variant="contained" onClick={handleAddCustomer}>
            {editingCustomer ? t('modal.updateButton') : t('modal.addButton')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Date Picker Dialog */}
      <Dialog open={showDatePicker} onClose={() => setShowDatePicker(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Select Date & Session</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            type="date"
            value={pickerDate}
            onChange={(e) => setPickerDate(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>{t('modal.session')}</InputLabel>
            <Select
              value={pickerSession}
              label={t('modal.session')}
              onChange={(e) => setPickerSession(e.target.value as 'morning' | 'evening')}
            >
              <MenuItem value="morning">🌅 {t('modal.morning')}</MenuItem>
              <MenuItem value="evening">🌙 {t('modal.evening')}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDatePicker(false)}>{t('modal.cancel')}</Button>
          <Button variant="contained" onClick={handleDateSelect}>
            {t('winners.search')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
