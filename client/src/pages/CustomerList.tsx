import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, Calendar, Sun, Moon, Users,
  Banknote, CreditCard, RefreshCw, Hash, Send
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSession } from '../contexts/SessionContext';
import { useToast } from '../contexts/ToastContext';
import {
  getCustomersForSession,
  deleteCustomerFromSession,
  getSessionKey,
  addCustomer,
  updateCustomerInSession,
  type CustomerRecord,
} from '../lib/customerManager';
import { formatAmount, parseBettingText } from '../lib/bettingParser';
import { deleteCustomerFromApi } from '../lib/apiClient';
import { useApiSync, mergeCustomers } from '../hooks/useApiSync';
import BottomSheet from '../components/BottomSheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Calendar as CalendarComponent } from '../components/ui/calendar';

export default function CustomerList() {
  const { t } = useLanguage();
  const { date, session } = useSession();
  const { showToast } = useToast();

  const [localCustomers, setLocalCustomers] = useState<CustomerRecord[]>([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);

  // Date and session state
  const [displayDate, setDisplayDate] = useState(date.toISOString().split('T')[0]);
  const [displaySession, setDisplaySession] = useState<'morning' | 'evening'>(session);
  const [pickerDate, setPickerDate] = useState(displayDate);
  const [pickerSession, setPickerSession] = useState<'morning' | 'evening'>(displaySession);

  // Form state
  const [name, setName] = useState('');
  const [bettingData, setBettingData] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash');
  const [weeklySettle, setWeeklySettle] = useState(false);
  const [bettingType, setBettingType] = useState<'2D' | '3D'>('2D');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSession, setFormSession] = useState<'morning' | 'evening'>(() =>
    new Date().getHours() < 12 ? 'morning' : 'evening'
  );

  // API sync hook
  const { remoteCustomers, isLoading: isSyncing, lastSynced, apiAvailable, refresh } = useApiSync({
    date: displayDate,
    session: displaySession,
  });

  // Merged customers: local + remote (deduped)
  const customers = useMemo(
    () => mergeCustomers(localCustomers, remoteCustomers),
    [localCustomers, remoteCustomers]
  );

  useEffect(() => {
    loadLocalCustomers();
  }, [displayDate, displaySession]);

  const loadLocalCustomers = () => {
    // Parse date string properly without timezone issues
    const [year, month, day] = displayDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
    const loaded = getCustomersForSession(getSessionKey(dateObj, displaySession));
    setLocalCustomers(loaded);
  };

  const resetForm = () => {
    setName('');
    setBettingData('');
    setPaymentType('cash');
    setWeeklySettle(false);
    setBettingType('2D');
    setEditingCustomer(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormSession(new Date().getHours() < 12 ? 'morning' : 'evening');
  };

  const handleSaveCustomer = () => {
    if (!name.trim()) {
      showToast(t('modal.customerName') + ' required', 'error');
      return;
    }
    if (!bettingData.trim()) {
      showToast(t('modal.bettingData') + ' required', 'error');
      return;
    }

    try {
      const parsed = parseBettingText(bettingData, bettingType);
      if (parsed.entries.length === 0) {
        showToast('No valid bets found', 'error');
        return;
      }

      const now = new Date();
      // Parse date string properly without timezone issues
      const [year, month, day] = formDate.split('-').map(Number);
      const customerDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), 0, 0);

      const customer: CustomerRecord = {
        id: editingCustomer?.id || `customer_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        name,
        bettingData: parsed.entries,
        paymentType,
        weeklySettle: paymentType === 'credit' ? weeklySettle : false,
        bettingType,
        date: customerDate,
        session: formSession,
        totalBet: parsed.totalAmount,
        source: 'web',
      };

      if (editingCustomer) {
        // Get the original session key (where the customer currently lives)
        const originalDate = new Date(editingCustomer.date);
        const originalSessionKey = getSessionKey(originalDate, editingCustomer.session);
        const newSessionKey = getSessionKey(customerDate, formSession);
        if (originalSessionKey !== newSessionKey) {
          // Date or session changed: delete from old, add to new
          deleteCustomerFromSession(editingCustomer.id, originalSessionKey);
          addCustomer(customer, customerDate, formSession);
        } else {
          // Same session: just update in place
          updateCustomerInSession(customer.id, customer, newSessionKey);
        }
        showToast('Customer updated', 'success');
      } else {
        addCustomer(customer, customerDate, formSession);
        showToast('Customer added', 'success');
      }

      resetForm();
      setShowAddSheet(false);
      // Reload customers from the new session
      setTimeout(() => loadLocalCustomers(), 100);
    } catch {
      showToast('Error parsing betting data', 'error');
    }
  };

  const openDeleteSheet = (customerId: string) => {
    setDeletingId(customerId);
    setShowDeleteSheet(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    const customerToDelete = customers.find(c => c.id === deletingId);
    // Parse date string properly without timezone issues
    const [year, month, day] = displayDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
    const currentSessionKey = getSessionKey(dateObj, displaySession);

    // Try to delete from localStorage first
    const deletedLocal = deleteCustomerFromSession(deletingId, currentSessionKey);

    // If it's a remote (Telegram) customer, also delete from API
    if (customerToDelete?.source === 'telegram' && apiAvailable) {
      await deleteCustomerFromApi(deletingId, displayDate, displaySession);
    }

    if (deletedLocal || customerToDelete?.source === 'telegram') {
      showToast('Customer deleted', 'success');
      loadLocalCustomers();
      await refresh();
    }

    setDeletingId(null);
    setShowDeleteSheet(false);
  };

  const handleEditCustomer = (customer: CustomerRecord) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPaymentType(customer.paymentType);
    setWeeklySettle(customer.weeklySettle || false);
    setBettingType(customer.bettingType);
    setFormDate(new Date(customer.date).toISOString().split('T')[0]);
    setFormSession(customer.session);
    const bettingArray = Array.isArray(customer.bettingData)
      ? customer.bettingData
      : Object.values(customer.bettingData || {}).flat();
    setBettingData((bettingArray as any[]).map((b: any) => `${b.number} ${b.amount}`).join('\n'));
    setShowAddSheet(true);
  };

  const handleDateSelect = () => {
    setDisplayDate(pickerDate);
    setDisplaySession(pickerSession);
    setShowDateSheet(false);
  };

  const handleRefresh = async () => {
    loadLocalCustomers();
    await refresh();
    showToast('Refreshed', 'success');
  };

  const stats = useMemo(() => {
    const cash = customers.filter(c => c.paymentType === 'cash').length;
    const credit = customers.filter(c => c.paymentType === 'credit').length;
    const total = customers.reduce((sum, c) => sum + c.totalBet, 0);
    const fromTelegram = customers.filter(c => (c as any).source === 'telegram').length;
    return { cash, credit, total, fromTelegram };
  }, [customers]);

  const displayDateFormatted = (() => {
    const [year, month, day] = displayDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  })();

  const bettingPlaceholder = bettingType === '2D'
    ? '12 500\n34 1000R\n56 300\n78 200R'
    : '123 500\n456 1000R\n789 300';

  const deletingCustomer = customers.find(c => c.id === deletingId);

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">{t('customers.title')}</h1>
            <p className="page-subtitle">{t('customers.description')}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          </div>
        </div>
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
            onClick={() => setDisplaySession('morning')}
          >
            <Sun size={13} />
            {t('modal.morning')}
          </button>
          <button
            className={`toggle-btn${displaySession === 'evening' ? ' active' : ''}`}
            onClick={() => setDisplaySession('evening')}
          >
            <Moon size={13} />
            {t('modal.evening')}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t('customers.totalCustomers')}</div>
          <div className="stat-value">{customers.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('customers.totalBets')}</div>
          <div className="stat-value" style={{ fontSize: customers.length > 0 ? '18px' : '22px' }}>
            {formatAmount(stats.total)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('customers.cash')}</div>
          <div className="stat-value success">{stats.cash}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('customers.credit')}</div>
          <div className="stat-value warning">{stats.credit}</div>
        </div>
      </div>

      {/* Telegram sync info banner (only when API is available and there are Telegram customers) */}
      {apiAvailable && stats.fromTelegram > 0 && (
        <div className="sync-banner">
          <Send size={13} />
          <span>{stats.fromTelegram} customer{stats.fromTelegram !== 1 ? 's' : ''} from Telegram bot</span>
          {lastSynced && (
            <span style={{ marginLeft: 'auto', opacity: 0.7, fontSize: 11 }}>
              {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}

      {/* Add Button */}
      <button
        className="btn btn-primary btn-full btn-lg mb-4"
        onClick={() => { resetForm(); setShowAddSheet(true); }}
      >
        <Plus size={18} />
        {t('customers.addNew')}
      </button>

      {/* Customer List */}
      {customers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users />
          </div>
          <h3>{t('customers.noCust')}</h3>
          <p>{t('customers.addFirst')}</p>
        </div>
      ) : (
        <div>
          {customers.map((customer) => {
            const bettingArray = Array.isArray(customer.bettingData)
              ? customer.bettingData
              : Object.values(customer.bettingData || {}).flat();
            const isFromTelegram = (customer as any).source === 'telegram';

            return (
              <div key={customer.id} className={`customer-card${isFromTelegram ? ' telegram-card' : ''}`}>
                <div className="customer-card-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="customer-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {customer.name}
                      {isFromTelegram && (
                        <span className="badge badge-telegram" title="Added via Telegram bot">
                          <Send size={9} />
                          TG
                        </span>
                      )}
                    </div>
                    <div className="customer-meta">
                      <span className={`badge badge-${customer.bettingType === '2D' ? 'accent' : 'info'}`}>
                        <Hash size={9} />
                        {customer.bettingType}
                      </span>
                      {customer.paymentType === 'cash' ? (
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
                      {customer.weeklySettle && (
                        <span className="badge badge-muted">
                          <RefreshCw size={9} />
                          {t('modal.weeklyClear')}
                        </span>
                      )}
                      <span className="badge badge-muted">
                        {customer.session === 'morning' ? <Sun size={9} /> : <Moon size={9} />}
                        {customer.session === 'morning' ? t('modal.morning') : t('modal.evening')}
                      </span>
                    </div>
                  </div>
                  <div className="customer-card-actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleEditCustomer(customer)}
                      aria-label="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => openDeleteSheet(customer.id)}
                      aria-label="Delete"
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="customer-card-body">
                  <div className="bet-entries">
                    {(bettingArray as any[]).slice(0, 12).map((bet: any, idx: number) => (
                      <span key={idx} className="bet-entry">
                        {bet.number}: {formatAmount(bet.amount)}
                      </span>
                    ))}
                    {bettingArray.length > 12 && (
                      <span className="bet-entry" style={{ color: 'var(--text-muted)' }}>
                        +{bettingArray.length - 12} more
                      </span>
                    )}
                  </div>
                  <div className="bet-total">
                    <span className="text-secondary text-sm">Total</span>
                    <span className="bet-total-amount">{formatAmount(customer.totalBet)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Customer Bottom Sheet ── */}
      <BottomSheet
        open={showAddSheet}
        onClose={() => { setShowAddSheet(false); resetForm(); }}
        title={editingCustomer ? t('modal.editCustomer') : t('modal.addCustomer')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setShowAddSheet(false); resetForm(); }}>
              {t('modal.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSaveCustomer}>
              {editingCustomer ? t('modal.updateButton') : t('modal.addButton')}
            </button>
          </>
        }
      >
        {/* Name */}
        <div className="form-group">
          <label className="form-label">{t('modal.customerName')}</label>
          <input
            className="form-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Ko Aung"
            autoFocus
          />
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="form-label">{t('modal.date')}</label>
          <input
            className="form-input"
            type="date"
            value={formDate}
            onChange={e => setFormDate(e.target.value)}
          />
        </div>

        {/* Session */}
        <div className="form-group">
          <label className="form-label">{t('modal.session')}</label>
          <div className="toggle-group">
            <button
              className={`toggle-btn${formSession === 'morning' ? ' active' : ''}`}
              onClick={() => setFormSession('morning')}
            >
              <Sun size={13} />
              {t('modal.morning')}
            </button>
            <button
              className={`toggle-btn${formSession === 'evening' ? ' active' : ''}`}
              onClick={() => setFormSession('evening')}
            >
              <Moon size={13} />
              {t('modal.evening')}
            </button>
          </div>
        </div>

        {/* Betting Type */}
        <div className="form-group">
          <label className="form-label">{t('modal.bettingType')}</label>
          <div className="toggle-group">
            <button
              className={`toggle-btn${bettingType === '2D' ? ' active' : ''}`}
              onClick={() => setBettingType('2D')}
            >
              2D
            </button>
            <button
              className={`toggle-btn${bettingType === '3D' ? ' active' : ''}`}
              onClick={() => setBettingType('3D')}
            >
              3D
            </button>
          </div>
        </div>

        {/* Betting Data */}
        <div className="form-group">
          <label className="form-label">{t('modal.bettingData')}</label>
          <textarea
            className="form-textarea"
            value={bettingData}
            onChange={e => setBettingData(e.target.value)}
            placeholder={bettingPlaceholder}
            rows={5}
          />
        </div>

        {/* Payment Type */}
        <div className="form-group">
          <label className="form-label">{t('modal.paymentType')}</label>
          <div className="toggle-group">
            <button
              className={`toggle-btn${paymentType === 'cash' ? ' active' : ''}`}
              onClick={() => setPaymentType('cash')}
            >
              <Banknote size={13} />
              {t('modal.cash')}
            </button>
            <button
              className={`toggle-btn${paymentType === 'credit' ? ' active' : ''}`}
              onClick={() => setPaymentType('credit')}
            >
              <CreditCard size={13} />
              {t('modal.credit')}
            </button>
          </div>
        </div>

        {/* Weekly Settle (credit only) */}
        {paymentType === 'credit' && (
          <div className="form-group">
            <label className="checkbox-row">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={weeklySettle}
                onChange={e => setWeeklySettle(e.target.checked)}
                id="weekly-settle"
              />
              <span className="checkbox-label">{t('modal.weeklyClear')}</span>
            </label>
          </div>
        )}
      </BottomSheet>      {/* ── Search by Date Calendar Dialog ── */}
      <Dialog open={showDateSheet} onOpenChange={setShowDateSheet}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('modal.searchByDate')}</DialogTitle>
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
      {/* ── Delete Confirmation Bottom Sheet ── */}
      <BottomSheet
        open={showDeleteSheet}
        onClose={() => setShowDeleteSheet(false)}
        title="Delete Customer"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDeleteSheet(false)}>
              {t('modal.cancel')}
            </button>
            <button className="btn btn-danger" onClick={handleConfirmDelete}>
              Delete
            </button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--danger-bg)', color: 'var(--danger)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Trash2 size={24} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            Delete {deletingCustomer?.name || 'this customer'}?
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            This action cannot be undone. All betting data will be permanently removed.
          </p>
        </div>
      </BottomSheet>
    </>
  );
}
