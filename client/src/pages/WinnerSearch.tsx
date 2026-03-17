import React, { useState } from 'react';
import {
  Search, Calendar, Sun, Moon, Trophy,
  Banknote, CreditCard, Hash
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSession } from '../contexts/SessionContext';
import { useToast } from '../contexts/ToastContext';
import {
  getCustomersForSession,
  getSessionKey,
  type CustomerRecord,
} from '../lib/customerManager';
import { formatAmount } from '../lib/bettingParser';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Calendar as CalendarComponent } from '../components/ui/calendar';

export default function WinnerSearch() {
  const { t } = useLanguage();
  const { date, session } = useSession();
  const { showToast } = useToast();

  const [winningNumber, setWinningNumber] = useState('');
  const [bettingType, setBettingType] = useState<'2D' | '3D'>('2D');
  const [winners, setWinners] = useState<Array<{ customer: CustomerRecord; amount: number }>>([]);
  const [searched, setSearched] = useState(false);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [displayDate, setDisplayDate] = useState(date.toISOString().split('T')[0]);
  const [displaySession, setDisplaySession] = useState(session);
  const [pickerDate, setPickerDate] = useState(displayDate);
  const [pickerSession, setPickerSession] = useState(displaySession);

  const handleSearch = () => {
    if (!winningNumber.trim()) {
      showToast('Please enter a winning number', 'error');
      return;
    }

    const numStr = winningNumber.trim();
    const isValid = bettingType === '2D'
      ? /^\d{2}$/.test(numStr)
      : /^\d{3}$/.test(numStr);

    if (!isValid) {
      showToast(
        bettingType === '2D'
          ? 'Please enter a valid 2D number (00-99)'
          : 'Please enter a valid 3D number (000-999)',
        'error'
      );
      return;
    }

    // Parse date string properly without timezone issues
    const [year, month, day] = displayDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
    const sk = getSessionKey(dateObj, displaySession);
    const customers = getCustomersForSession(sk);
    const winnersList: Array<{ customer: CustomerRecord; amount: number }> = [];

    customers.forEach((customer) => {
      if (customer.bettingType !== bettingType) return;

      const bettingData = Array.isArray(customer.bettingData)
        ? customer.bettingData
        : Object.values(customer.bettingData || {}).flat();

      const amount = (bettingData as any[])
        .filter((entry: any) => entry.number === numStr)
        .reduce((sum: number, entry: any) => sum + entry.amount, 0);

      if (amount > 0) {
        winnersList.push({ customer, amount });
      }
    });

    setWinners(winnersList);
    setSearched(true);

    if (winnersList.length === 0) {
      showToast('No winners found for this number', 'info');
    }
  };

  const handleDateSelect = () => {
    setDisplayDate(pickerDate);
    setDisplaySession(pickerSession);
    setShowDateSheet(false);
    setSearched(false);
    setWinners([]);
  };

  const totalPayout = winners.reduce((sum, w) => sum + w.amount, 0);
  const cashWinners = winners.filter(w => w.customer.paymentType === 'cash').length;

  const displayDateFormatted = (() => {
    const [year, month, day] = displayDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  })();

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">{t('winners.title')}</h1>
        <p className="page-subtitle">{t('winners.description')}</p>
      </div>

      {/* Date Bar */}
      <div className="date-bar">
        <button className="date-btn" onClick={() => {
          setPickerDate(displayDate);
          setPickerSession(displaySession);
          setShowDateSheet(true);
        }}>
          <Calendar size={15} />
          {displayDateFormatted}
        </button>
        <div className="toggle-group">
          <button
            className={`toggle-btn${displaySession === 'morning' ? ' active' : ''}`}
            onClick={() => { setDisplaySession('morning'); setSearched(false); }}
          >
            <Sun size={13} />
            {t('modal.morning')}
          </button>
          <button
            className={`toggle-btn${displaySession === 'evening' ? ' active' : ''}`}
            onClick={() => { setDisplaySession('evening'); setSearched(false); }}
          >
            <Moon size={13} />
            {t('modal.evening')}
          </button>
        </div>
      </div>

      {/* Search Card */}
      <div className="card mb-4">
        <div className="card-body-lg">
          {/* 2D / 3D Toggle */}
          <div className="form-group">
            <label className="form-label">{t('modal.bettingType')}</label>
            <div className="toggle-group">
              <button
                className={`toggle-btn${bettingType === '2D' ? ' active' : ''}`}
                onClick={() => { setBettingType('2D'); setSearched(false); setWinningNumber(''); }}
              >
                2D (00–99)
              </button>
              <button
                className={`toggle-btn${bettingType === '3D' ? ' active' : ''}`}
                onClick={() => { setBettingType('3D'); setSearched(false); setWinningNumber(''); }}
              >
                3D (000–999)
              </button>
            </div>
          </div>

          {/* Number Input */}
          <div className="form-group">
            <label className="form-label">{t('winners.winningNumber')}</label>
            <div className="search-box">
              <Hash size={18} />
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={bettingType === '2D' ? 2 : 3}
                value={winningNumber}
                onChange={e => setWinningNumber(e.target.value.replace(/\D/g, ''))}
                placeholder={bettingType === '2D' ? '00–99' : '000–999'}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          {/* Search Button */}
          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={handleSearch}
          >
            <Search size={18} />
            {t('winners.search')}
          </button>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <>
          {/* Stats */}
          {winners.length > 0 && (
            <div className="stats-grid mb-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="stat-card">
                <div className="stat-label">{t('winners.totalWinners')}</div>
                <div className="stat-value">{winners.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">{t('winners.cashWinners')}</div>
                <div className="stat-value success">{cashWinners}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">{t('winners.totalPayout')}</div>
                <div className="stat-value warning" style={{ fontSize: '16px' }}>
                  {formatAmount(totalPayout)}
                </div>
              </div>
            </div>
          )}

          {/* Winners List */}
          {winners.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Trophy />
              </div>
              <h3>{t('winners.noWinners')}</h3>
              <p>Try a different number or date</p>
            </div>
          ) : (
            <div>
              <p className="section-heading">
                {winners.length} winner{winners.length !== 1 ? 's' : ''} for #{winningNumber}
              </p>
              {winners.map((winner, idx) => (
                <div key={idx} className="winner-card">
                  <div className="winner-card-header">
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {winner.customer.name}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <span className={`badge badge-${winner.customer.bettingType === '2D' ? 'accent' : 'info'}`}>
                          <Hash size={9} />
                          {winner.customer.bettingType}
                        </span>
                        {winner.customer.paymentType === 'cash' ? (
                          <span className="badge badge-success">
                            <Banknote size={9} />
                            {t('modal.cash')}
                          </span>
                        ) : (
                          <span className="badge badge-warning">
                            <CreditCard size={9} />
                            {t('modal.credit')}
                          </span>
                        )}
                        <span className="badge badge-muted">
                          {winner.customer.session === 'morning' ? <Sun size={9} /> : <Moon size={9} />}
                          {winner.customer.session === 'morning' ? t('modal.morning') : t('modal.evening')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="winner-payout">
                    Bet on <strong>#{winningNumber}</strong>: <strong>{formatAmount(winner.amount)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Date Picker Calendar Dialog */}
      <Dialog open={showDateSheet} onOpenChange={setShowDateSheet}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('winners.searchByDate')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <CalendarComponent
                mode="single"
                selected={new Date(pickerDate + 'T00:00:00')}
                onSelect={(day) => {
                  if (day) {
                    const year = day.getFullYear();
                    const month = String(day.getMonth() + 1).padStart(2, '0');
                    const dayStr = String(day.getDate()).padStart(2, '0');
                    setPickerDate(`${year}-${month}-${dayStr}`);
                  }
                }}
                disabled={(date) => date > new Date()}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('modal.session')}</label>
              <div className="toggle-group">
                <button
                  className={`toggle-btn${pickerSession === 'morning' ? ' active' : ''}`}
                  onClick={() => setPickerSession('morning')}
                >
                  <Sun size={13} />
                  {t('modal.morning')}
                </button>
                <button
                  className={`toggle-btn${pickerSession === 'evening' ? ' active' : ''}`}
                  onClick={() => setPickerSession('evening')}
                >
                  <Moon size={13} />
                  {t('modal.evening')}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button className="btn btn-secondary" onClick={() => setShowDateSheet(false)}>
              {t('modal.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleDateSelect}>
              {t('winners.search')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
