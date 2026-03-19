import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Calendar, Sun, Moon, Users, Banknote, CreditCard, RefreshCw, Hash, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSession } from '../contexts/SessionContext';
import { useToast } from '../contexts/ToastContext';
import { getCustomersForSession, deleteCustomerFromSession, getSessionKey, addCustomer, updateCustomerInSession, type CustomerRecord } from '../lib/customerManager';
import { formatAmount, parseBettingText } from '../lib/bettingParser';
import { deleteCustomerFromApi } from '../lib/apiClient';
import { useApiSync, mergeCustomers } from '../hooks/useApiSync';
import BottomSheet from '../components/BottomSheet';

export default function CustomerList() {
  const { t } = useLanguage();
  const { date, session } = useSession();
  const { showToast } = useToast();

  const [localCustomers, setLocalCustomers] = useState<CustomerRecord[]>([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [viewMode, setViewMode] = useState<'approved' | 'pending'>('approved');
  const [searchTerm, setSearchTerm] = useState('');

  const [displayDate, setDisplayDate] = useState(date.toISOString().split('T')[0]);
  const [displaySession, setDisplaySession] = useState<'morning' | 'evening'>(session);

  const [name, setName] = useState('');
  const [bettingData, setBettingData] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash');
  const [weeklySettle, setWeeklySettle] = useState(false);
  const [bettingType, setBettingType] = useState<'2D' | '3D'>('2D');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSession, setFormSession] = useState<'morning' | 'evening'>(() => new Date().getHours() < 12 ? 'morning' : 'evening');

  const { remoteCustomers, pendingCustomers = [], isLoading: isSyncing, refresh, approveCustomer, rejectCustomer } = useApiSync({ date: displayDate, session: displaySession });

  const [isSpinning, setIsSpinning] = useState(false);

  const customers = useMemo(() => mergeCustomers(localCustomers, remoteCustomers), [localCustomers, remoteCustomers]);
  const filteredCustomers = useMemo(() => customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())), [customers, searchTerm]);

  useEffect(() => { loadLocalCustomers(); }, [displayDate, displaySession]);

  const loadLocalCustomers = () => {
    const [year, month, day] = displayDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
    setLocalCustomers(getCustomersForSession(getSessionKey(dateObj, displaySession)));
  };

  const handleManualRefresh = async () => {
    setIsSpinning(true);
    await refresh();
    setTimeout(() => setIsSpinning(false), 2000);
  };

  const resetForm = () => {
    setName(''); setBettingData(''); setPaymentType('cash'); setWeeklySettle(false); setBettingType('2D'); setEditingCustomer(null);
  };

  const handleSaveCustomer = () => {
    if (!name.trim()) { showToast(t('modal.customerName') + ' required', 'error'); return; }
    if (!bettingData.trim()) { showToast(t('modal.bettingData') + ' required', 'error'); return; }
    try {
      const parsed = parseBettingText(bettingData, bettingType);
      if (parsed.entries.length === 0) { showToast('No valid bets found', 'error'); return; }
      const now = new Date();
      const [year, month, day] = formDate.split('-').map(Number);
      const customerDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), 0, 0);

      const customer: CustomerRecord = {
        id: editingCustomer?.id || `customer_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        name, bettingData: parsed.entries, paymentType, weeklySettle: paymentType === 'credit' ? weeklySettle : false,
        bettingType, date: customerDate, session: formSession, totalBet: parsed.totalAmount, source: 'web',
      };

      if (editingCustomer) {
        const oKey = getSessionKey(new Date(editingCustomer.date), editingCustomer.session);
        const nKey = getSessionKey(customerDate, formSession);
        if (oKey !== nKey) { deleteCustomerFromSession(editingCustomer.id, oKey); addCustomer(customer, customerDate, formSession); } 
        else { updateCustomerInSession(customer.id, customer, nKey); }
      } else { addCustomer(customer, customerDate, formSession); }

      resetForm(); setShowAddSheet(false); setTimeout(() => loadLocalCustomers(), 100);
      showToast(editingCustomer ? 'Customer updated' : 'Customer added', 'success');
    } catch { showToast('Error parsing data', 'error'); }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    const c = customers.find(x => x.id === deletingId);
    const [year, month, day] = displayDate.split('-').map(Number);
    const currentSessionKey = getSessionKey(new Date(year, month - 1, day, 0, 0, 0, 0), displaySession);
    const deletedLocal = deleteCustomerFromSession(deletingId, currentSessionKey);
    if (c?.source === 'api') await deleteCustomerFromApi(deletingId, displayDate, displaySession);
    if (deletedLocal || c?.source === 'api') { showToast('Customer deleted', 'success'); loadLocalCustomers(); await refresh(); }
    setDeletingId(null); setShowDeleteSheet(false);
  };

  const handleApproveSubmission = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    try { if (approveCustomer) { await approveCustomer(id); showToast('Customer Approved', 'success'); await refresh(); } } 
    catch (err: any) { showToast('Approve Error: API ချိတ်ဆက်မှု စစ်ဆေးပါ', 'error'); }
  };

  const openRejectModal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRejectingId(id); setRejectReason(''); setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    try {
      if (rejectingId && rejectCustomer) {
        await rejectCustomer(rejectingId, rejectReason); showToast('Customer Rejected', 'success'); await refresh(); setShowRejectModal(false);
      }
    } catch (err: any) { showToast('Reject Error: API ချိတ်ဆက်မှု စစ်ဆေးပါ', 'error'); }
  };

  // ဤနေရာတွင် customers အစား filteredCustomers ကိုသုံး၍ တွက်ချက်ထားပါသည် (Search ချိန်တွင် အလိုအလျောက် ပြောင်းလဲစေရန်)
  const stats = useMemo(() => {
    return {
      cash: filteredCustomers.filter(c => c.paymentType === 'cash').length,
      credit: filteredCustomers.filter(c => c.paymentType === 'credit').length,
      total: filteredCustomers.reduce((sum, c) => sum + c.totalBet, 0)
    };
  }, [filteredCustomers]);

  const displayDateFormatted = (() => {
    const [year, month, day] = displayDate.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  })();

  return (
    <>
      <style>{`.spin-anim { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div><h1 className="page-title">{t('customers.title')}</h1><p className="page-subtitle">{t('customers.description')}</p></div>
          <button className="btn btn-secondary" onClick={handleManualRefresh} style={{ padding: '8px 12px', width: 'auto' }}><RefreshCw size={18} className={isSpinning ? 'spin-anim' : ''} /></button>
        </div>
      </div>

      <div className="date-bar">
        <div className="date-btn" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          <Calendar size={15} /> <span>{displayDateFormatted}</span>
          <input type="date" value={displayDate} onChange={(e) => { if (e.target.value) setDisplayDate(e.target.value); }} style={{ position: 'absolute', opacity: 0, left: 0, top: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
        </div>
        <div className="toggle-group">
          <button className={`toggle-btn${displaySession === 'morning' ? ' active' : ''}`} onClick={() => setDisplaySession('morning')}><Sun size={13} /> {t('modal.morning')}</button>
          <button className={`toggle-btn${displaySession === 'evening' ? ' active' : ''}`} onClick={() => setDisplaySession('evening')}><Moon size={13} /> {t('modal.evening')}</button>
        </div>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <button className={`btn ${viewMode === 'approved' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setViewMode('approved')}><Users size={16} style={{ marginRight: 6 }} /> Approved ({customers.length})</button>
        <button className={`btn ${viewMode === 'pending' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, position: 'relative' }} onClick={() => setViewMode('pending')}><Clock size={16} style={{ marginRight: 6 }} /> Pending {pendingCustomers.length > 0 && (<span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>{pendingCustomers.length}</span>)}</button>
      </div>

      {viewMode === 'approved' && (
        <>
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
            <input type="text" className="form-input" style={{ paddingLeft: '38px' }} placeholder="Search customer name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="stats-grid">
            <div className="stat-card"><div className="stat-label">{t('customers.totalCustomers')}</div><div className="stat-value">{filteredCustomers.length}</div></div>
            <div className="stat-card"><div className="stat-label">{t('customers.totalBets')}</div><div className="stat-value" style={{ fontSize: filteredCustomers.length > 0 ? '18px' : '22px' }}>{formatAmount(stats.total)}</div></div>
          </div>

          <button className="btn btn-primary btn-full btn-lg mb-4" onClick={() => { resetForm(); setShowAddSheet(true); }}><Plus size={18} /> {t('customers.addNew')}</button>

          {filteredCustomers.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon"><Users /></div><h3>{searchTerm ? 'No results found' : t('customers.noCust')}</h3></div>
          ) : (
            <div>
              {filteredCustomers.map((customer) => {
                const bettingArray = Array.isArray(customer.bettingData) ? customer.bettingData : Object.values(customer.bettingData || {}).flat();
                const isFromApi = (customer as any).source === 'api';
                return (
                  <div key={customer.id} className={`customer-card${isFromApi ? ' api-card' : ''}`}>
                    <div className="customer-card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="customer-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{customer.name} {isFromApi && <span className="badge badge-success"><CheckCircle size={9} /> App</span>}</div>
                        <div className="customer-meta"><span className={`badge badge-${customer.bettingType === '2D' ? 'accent' : 'info'}`}><Hash size={9} /> {customer.bettingType}</span><span className="badge badge-muted">{customer.session === 'morning' ? <Sun size={9} /> : <Moon size={9} />} {customer.session === 'morning' ? t('modal.morning') : t('modal.evening')}</span></div>
                      </div>
                      {!isFromApi && (
                        <div className="customer-card-actions">
                          <button className="btn-icon" onClick={() => {
                            setEditingCustomer(customer); setName(customer.name); setPaymentType(customer.paymentType); setWeeklySettle(customer.weeklySettle || false); setBettingType(customer.bettingType);
                            setFormDate(new Date(customer.date).toISOString().split('T')[0]); setFormSession(customer.session);
                            setBettingData((bettingArray as any[]).map((b: any) => `${b.number} ${b.amount}`).join('\n')); setShowAddSheet(true);
                          }}><Edit2 size={16} /></button>
                          <button className="btn-icon" onClick={() => { setDeletingId(customer.id); setShowDeleteSheet(true); }} style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>
                    <div className="customer-card-body">
                      <div className="bet-entries">
                        {(bettingArray as any[]).slice(0, 12).map((bet: any, idx: number) => <span key={idx} className="bet-entry">{bet.number}: {formatAmount(bet.amount)}</span>)}
                        {bettingArray.length > 12 && <span className="bet-entry" style={{ color: 'var(--text-muted)' }}>+{bettingArray.length - 12} more</span>}
                      </div>
                      <div className="bet-total"><span className="text-secondary text-sm">Total</span> <span className="bet-total-amount">{formatAmount(customer.totalBet)}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {viewMode === 'pending' && (
        <div>
          {pendingCustomers.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon"><Clock /></div><h3>No Pending Approvals</h3></div>
          ) : (
            <div>
              {pendingCustomers.map((customer) => {
                const bettingArray = Array.isArray(customer.bettingData) ? customer.bettingData : Object.values(customer.bettingData || {}).flat();
                return (
                  <div key={customer.id} className="customer-card pending-card" style={{ borderLeft: '4px solid var(--warning)' }}>
                    <div className="customer-card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="customer-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{customer.name} <span className="badge badge-warning">Pending</span></div>
                        <div className="customer-meta"><span className={`badge badge-${customer.bettingType === '2D' ? 'accent' : 'info'}`}><Hash size={9} /> {customer.bettingType}</span><span className="badge badge-muted">{customer.session === 'morning' ? <Sun size={9} /> : <Moon size={9} />} {customer.session === 'morning' ? t('modal.morning') : t('modal.evening')}</span></div>
                      </div>
                    </div>
                    <div className="customer-card-body">
                      <div className="bet-entries">
                        {(bettingArray as any[]).slice(0, 12).map((bet: any, idx: number) => <span key={idx} className="bet-entry">{bet.number}: {formatAmount(bet.amount)}</span>)}
                        {bettingArray.length > 12 && <span className="bet-entry" style={{ color: 'var(--text-muted)' }}>+{bettingArray.length - 12} more</span>}
                      </div>
                      <div className="bet-total" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '10px' }}><span className="text-secondary text-sm">Total</span> <span className="bet-total-amount">{formatAmount(customer.totalBet)}</span></div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="btn" style={{ flex: 1, backgroundColor: '#16a34a', color: 'white', border: 'none', zIndex: 10 }} onClick={(e) => handleApproveSubmission(customer.id, e)}><CheckCircle size={16} /> Approve</button>
                        <button type="button" className="btn btn-danger" style={{ flex: 1, zIndex: 10 }} onClick={(e) => openRejectModal(customer.id, e)}><XCircle size={16} /> Reject</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <BottomSheet open={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Customer" footer={<><button className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>{t('modal.cancel')}</button><button className="btn btn-danger" onClick={handleConfirmReject}>Confirm Reject</button></>}>
        <div className="form-group"><label className="form-label">အကြောင်းပြချက် (Reason)</label><textarea className="form-textarea" rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="ဥပမာ - အချိန်ကျော်သွားပါပြီ (သို့) ဂဏန်းမှားယွင်းနေပါသည်" /></div>
      </BottomSheet>
      <BottomSheet open={showAddSheet} onClose={() => { setShowAddSheet(false); resetForm(); }} title={editingCustomer ? t('modal.editCustomer') : t('modal.addCustomer')} footer={ <> <button className="btn btn-secondary" onClick={() => { setShowAddSheet(false); resetForm(); }}> {t('modal.cancel')} </button> <button className="btn btn-primary" onClick={handleSaveCustomer}> {editingCustomer ? t('modal.updateButton') : t('modal.addButton')} </button> </> }>
        <div className="form-group"><label className="form-label">{t('modal.customerName')}</label><input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ko Aung" autoFocus /></div>
        <div className="form-group"><label className="form-label">{t('modal.date')}</label><input className="form-input" type="date" value={formDate} onChange={e => setFormDate(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">{t('modal.session')}</label><div className="toggle-group"><button className={`toggle-btn${formSession === 'morning' ? ' active' : ''}`} onClick={() => setFormSession('morning')}><Sun size={13} /> {t('modal.morning')}</button><button className={`toggle-btn${formSession === 'evening' ? ' active' : ''}`} onClick={() => setFormSession('evening')}><Moon size={13} /> {t('modal.evening')}</button></div></div>
        <div className="form-group"><label className="form-label">{t('modal.bettingType')}</label><div className="toggle-group"><button className={`toggle-btn${bettingType === '2D' ? ' active' : ''}`} onClick={() => setBettingType('2D')}>2D</button><button className={`toggle-btn${bettingType === '3D' ? ' active' : ''}`} onClick={() => setBettingType('3D')}>3D</button></div></div>
        <div className="form-group"><label className="form-label">{t('modal.bettingData')}</label><textarea className="form-textarea" value={bettingData} onChange={e => setBettingData(e.target.value)} placeholder="12 500" rows={5} /></div>
      </BottomSheet>
      <BottomSheet open={showDeleteSheet} onClose={() => setShowDeleteSheet(false)} title="Delete Customer" footer={ <> <button className="btn btn-secondary" onClick={() => setShowDeleteSheet(false)}> {t('modal.cancel')} </button> <button className="btn btn-danger" onClick={handleConfirmDelete}> Delete </button> </> }><div style={{ textAlign: 'center', padding: '8px 0 16px' }}><p>Delete this customer?</p></div></BottomSheet>
    </>
  );
}
