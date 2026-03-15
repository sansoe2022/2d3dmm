import {
  Container,
  Card,
  CardContent,
  Button,
  Box,
  Typography,
  Stack,
  Chip,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useLanguage } from '../contexts/LanguageContext';
import { useSession } from '../contexts/SessionContext';
import {
  getCustomersForSession,
  getSessionKey,
  type CustomerRecord,
} from '../lib/customerManager';
import { formatAmount } from '../lib/bettingParser';
import { useState, useMemo } from 'react';

export default function WinnerSearch() {
  const { t } = useLanguage();
  const { date, session } = useSession();
  const { enqueueSnackbar } = useSnackbar();
  const [winningNumber, setWinningNumber] = useState('');
  const [bettingType, setBettingType] = useState<'2D' | '3D'>('2D');
  const [winners, setWinners] = useState<Array<{ customer: CustomerRecord; amount: number }>>([]);
  const [searched, setSearched] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [displayDate, setDisplayDate] = useState(date.toISOString().split('T')[0]);
  const [displaySession, setDisplaySession] = useState(session);
  const [pickerDate, setPickerDate] = useState(displayDate);
  const [pickerSession, setPickerSession] = useState(displaySession);

  const handleSearch = () => {
    if (!winningNumber.trim()) {
      enqueueSnackbar('Please enter a winning number', { variant: 'error' });
      return;
    }

    const numStr = winningNumber.trim();
    const isValid = bettingType === '2D' 
      ? /^\d{2}$/.test(numStr) 
      : /^\d{3}$/.test(numStr);

    if (!isValid) {
      enqueueSnackbar(
        bettingType === '2D' 
          ? 'Please enter a valid 2D number (00-99)' 
          : 'Please enter a valid 3D number (000-999)',
        { variant: 'error' }
      );
      return;
    }

    const sessionKey = getSessionKey(new Date(displayDate), displaySession);
    const customers = getCustomersForSession(sessionKey);
    const winnersList: Array<{ customer: CustomerRecord; amount: number }> = [];

    customers.forEach((customer) => {
      if (customer.bettingType !== bettingType) return;

      const bettingData = Array.isArray(customer.bettingData)
        ? customer.bettingData
        : Object.values(customer.bettingData || {}).flat();

      const amount = bettingData
        .filter((entry: any) => entry.number === numStr)
        .reduce((sum: number, entry: any) => sum + entry.amount, 0);

      if (amount > 0) {
        winnersList.push({ customer, amount });
      }
    });

    setWinners(winnersList);
    setSearched(true);

    if (winnersList.length === 0) {
      enqueueSnackbar('No winners found for this number', { variant: 'info' });
    }
  };

  const handleDateSelect = () => {
    setDisplayDate(pickerDate);
    setDisplaySession(pickerSession);
    setShowDatePicker(false);
  };

  const totalPayout = winners.reduce((sum, w) => sum + w.amount, 0);
  const cashWinners = winners.filter(w => w.customer.paymentType === 'cash').length;

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
          {t('winners.title')}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          {t('winners.description')}
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

      {/* Search Section */}
      <Card elevation={1} sx={{ mb: 4, p: 3 }}>
        <Stack spacing={2}>
          {/* 2D/3D Toggle */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              {t('modal.bettingType')}
            </Typography>
            <ToggleButtonGroup
              value={bettingType}
              exclusive
              onChange={(e, newType) => newType && setBettingType(newType)}
              fullWidth
            >
              <ToggleButton value="2D">2D (00-99)</ToggleButton>
              <ToggleButton value="3D">3D (000-999)</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Number Input */}
          <TextField
            fullWidth
            label={t('winners.winningNumber')}
            value={winningNumber}
            onChange={(e) => setWinningNumber(e.target.value)}
            placeholder={bettingType === '2D' ? '00-99' : '000-999'}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />

          {/* Search Button */}
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleSearch}
            fullWidth
            size="large"
          >
            {t('winners.search')}
          </Button>
        </Stack>
      </Card>

      {/* Results */}
      {searched && (
        <>
          {/* Stats Cards */}
          {winners.length > 0 && (
            <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
              <Card elevation={1} sx={{ flex: 1 }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography color="textSecondary" variant="body2">
                    {t('winners.totalWinners')}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {winners.length}
                  </Typography>
                </CardContent>
              </Card>
              <Card elevation={1} sx={{ flex: 1 }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography color="textSecondary" variant="body2">
                    {t('winners.cashWinners')}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {cashWinners}
                  </Typography>
                </CardContent>
              </Card>
              <Card elevation={1} sx={{ flex: 1 }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography color="textSecondary" variant="body2">
                    {t('winners.totalPayout')}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {formatAmount(totalPayout)}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          )}

          {/* Winners List */}
          {winners.length === 0 ? (
            <Card elevation={1} sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>
                {t('winners.noWinners')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t('winners.tryAnother')}
              </Typography>
            </Card>
          ) : (
            <Stack spacing={2}>
              {winners.map((winner, idx) => (
                <Card key={idx} elevation={1}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {winner.customer.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {winner.customer.session === 'morning' ? '🌅 Morning' : '🌙 Evening'}
                        </Typography>
                      </Box>
                      <Chip
                        label={winner.customer.paymentType === 'cash' ? '💵 Cash' : '📋 Credit'}
                        color={winner.customer.paymentType === 'cash' ? 'success' : 'warning'}
                        variant="filled"
                      />
                    </Stack>

                    <Box sx={{ backgroundColor: 'action.hover', p: 2, borderRadius: 1 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Bet on {winningNumber}: <strong>{formatAmount(winner.amount)}</strong>
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </>
      )}

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
