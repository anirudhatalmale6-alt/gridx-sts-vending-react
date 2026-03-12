import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Lock, Loader, X, Landmark } from 'lucide-react';
import { batchService, vendorService } from '../services/api';

const fmt = (n) => 'N$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusBadge = (status) => {
  const map = {
    open:   { cls: 'badge-success', label: 'Open' },
    closed: { cls: 'badge-muted',   label: 'Closed' },
    banked: { cls: 'badge-info',    label: 'Banked' },
  };
  const s = String(status).toLowerCase();
  const cfg = map[s] || { cls: 'badge-muted', label: status };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
};

export default function Batches() {
  const [activeTab, setActiveTab] = useState('sales');

  // ---- Sales Batches ----
  const [salesBatches, setSalesBatches] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState('');

  // ---- Banking Batches ----
  const [bankingBatches, setBankingBatches] = useState([]);
  const [bankingLoading, setBankingLoading] = useState(true);
  const [bankingError, setBankingError] = useState('');

  // ---- Open Batch Modal ----
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('sales'); // 'sales' or 'banking'
  const [vendors, setVendors] = useState([]);
  const [formVendor, setFormVendor] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formBankRef, setFormBankRef] = useState('');
  const [formSalesBatch, setFormSalesBatch] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // ---- Action loading ----
  const [closingId, setClosingId] = useState(null);

  // ---- Load data ----
  const loadSalesBatches = useCallback(async () => {
    setSalesLoading(true);
    setSalesError('');
    try {
      const res = await batchService.getSalesBatches();
      setSalesBatches(res.data || []);
    } catch (err) {
      setSalesError(err.message || 'Failed to load sales batches');
    } finally {
      setSalesLoading(false);
    }
  }, []);

  const loadBankingBatches = useCallback(async () => {
    setBankingLoading(true);
    setBankingError('');
    try {
      const res = await batchService.getBankingBatches();
      setBankingBatches(res.data || []);
    } catch (err) {
      setBankingError(err.message || 'Failed to load banking batches');
    } finally {
      setBankingLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSalesBatches();
    loadBankingBatches();
    vendorService.getAll()
      .then(res => setVendors(res.data || []))
      .catch(() => {});
  }, [loadSalesBatches, loadBankingBatches]);

  // ---- Close sales batch ----
  const handleCloseBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to close this batch? This cannot be undone.')) return;
    setClosingId(batchId);
    try {
      await batchService.closeSalesBatch(batchId);
      await loadSalesBatches();
    } catch (err) {
      alert('Failed to close batch: ' + (err.message || 'Unknown error'));
    } finally {
      setClosingId(null);
    }
  };

  // ---- Open modal ----
  const openModal = (type) => {
    setModalType(type);
    setFormVendor('');
    setFormNotes('');
    setFormBankRef('');
    setFormSalesBatch('');
    setFormError('');
    setShowModal(true);
  };

  // ---- Submit modal form ----
  const handleSubmit = async () => {
    setFormSubmitting(true);
    setFormError('');
    try {
      if (modalType === 'sales') {
        if (!formVendor) { setFormError('Please select a vendor'); setFormSubmitting(false); return; }
        await batchService.openSalesBatch(formVendor, formNotes);
        await loadSalesBatches();
      } else {
        if (!formSalesBatch || !formBankRef.trim()) {
          setFormError('Please select a sales batch and enter a bank reference');
          setFormSubmitting(false);
          return;
        }
        await batchService.openBankingBatch(formSalesBatch, formBankRef.trim());
        await loadBankingBatches();
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  // ---- Closed sales batches for banking dropdown ----
  const closedSalesBatches = salesBatches.filter(b => String(b.status).toLowerCase() === 'closed');

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="page-header-left">
          <h1 className="page-title">Batch Management</h1>
          <p className="page-desc">Manage sales and banking batches for vendor reconciliation</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={() => openModal('sales')}>
            <Plus size={14} style={{ marginRight: 4 }} /> Open Sales Batch
          </button>
          <button className="btn btn-secondary" onClick={() => openModal('banking')}>
            <Landmark size={14} style={{ marginRight: 4 }} /> Open Banking Batch
          </button>
        </div>
      </div>

      {/* Tab Toggle */}
      <div style={{ display: 'flex', gap: '2px', background: 'var(--content-bg)', borderRadius: '8px', padding: '3px', marginBottom: '20px', width: 'fit-content' }}>
        <button
          className={`btn ${activeTab === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('sales')}
          style={{ fontSize: '0.8125rem', padding: '6px 20px', borderRadius: '6px' }}
        >
          <Package size={14} style={{ marginRight: 6 }} /> Sales Batches
        </button>
        <button
          className={`btn ${activeTab === 'banking' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('banking')}
          style={{ fontSize: '0.8125rem', padding: '6px 20px', borderRadius: '6px' }}
        >
          <Landmark size={14} style={{ marginRight: 6 }} /> Banking Batches
        </button>
      </div>

      {/* ── Sales Batches Tab ──────────────────────────── */}
      {activeTab === 'sales' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={16} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '0.9375rem' }}>Sales Batches</h3>
            <span className="badge badge-muted" style={{ marginLeft: 'auto' }}>{salesBatches.length} batches</span>
          </div>

          {salesLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: 8, fontSize: '0.8125rem' }}>Loading sales batches...</p>
            </div>
          ) : salesError ? (
            <div style={{ padding: '20px', color: 'var(--danger)', fontSize: '0.8125rem' }}>{salesError}</div>
          ) : salesBatches.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No sales batches found. Click "Open Sales Batch" to create one.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.855rem' }}>
              <thead>
                <tr style={{ background: 'var(--content-bg)' }}>
                  {['BATCH ID', 'VENDOR', 'STATUS', 'TRANSACTIONS', 'TOTAL AMOUNT', 'OPENED', 'CLOSED', 'ACTIONS'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px',
                      textAlign: h === 'ACTIONS' ? 'center' : 'left',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {salesBatches.map((batch) => (
                  <tr key={batch.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="mono" style={{ padding: '11px 16px', fontWeight: 500 }}>{batch.id}</td>
                    <td style={{ padding: '11px 16px' }}>{batch.vendorName || batch.vendorId}</td>
                    <td style={{ padding: '11px 16px' }}>{statusBadge(batch.status)}</td>
                    <td className="mono" style={{ padding: '11px 16px' }}>{batch.transactionCount ?? '-'}</td>
                    <td className="mono" style={{ padding: '11px 16px' }}>{fmt(batch.totalAmount)}</td>
                    <td style={{ padding: '11px 16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {batch.openedAt ? new Date(batch.openedAt).toLocaleString('en-GB') : '-'}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {batch.closedAt ? new Date(batch.closedAt).toLocaleString('en-GB') : '-'}
                    </td>
                    <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                      {String(batch.status).toLowerCase() === 'open' ? (
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                          onClick={() => handleCloseBatch(batch.id)}
                          disabled={closingId === batch.id}
                        >
                          {closingId === batch.id ? (
                            <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <><Lock size={12} style={{ marginRight: 4 }} /> Close</>
                          )}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Banking Batches Tab ────────────────────────── */}
      {activeTab === 'banking' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Landmark size={16} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '0.9375rem' }}>Banking Batches</h3>
            <span className="badge badge-muted" style={{ marginLeft: 'auto' }}>{bankingBatches.length} batches</span>
          </div>

          {bankingLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: 8, fontSize: '0.8125rem' }}>Loading banking batches...</p>
            </div>
          ) : bankingError ? (
            <div style={{ padding: '20px', color: 'var(--danger)', fontSize: '0.8125rem' }}>{bankingError}</div>
          ) : bankingBatches.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No banking batches found. Close a sales batch first, then create a banking batch.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.855rem' }}>
              <thead>
                <tr style={{ background: 'var(--content-bg)' }}>
                  {['BATCH ID', 'SALES BATCH', 'BANK REFERENCE', 'STATUS', 'TOTAL AMOUNT', 'CREATED'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bankingBatches.map((batch) => (
                  <tr key={batch.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="mono" style={{ padding: '11px 16px', fontWeight: 500 }}>{batch.id}</td>
                    <td className="mono" style={{ padding: '11px 16px' }}>{batch.salesBatchId}</td>
                    <td className="mono" style={{ padding: '11px 16px' }}>{batch.bankReference}</td>
                    <td style={{ padding: '11px 16px' }}>{statusBadge(batch.status || 'banked')}</td>
                    <td className="mono" style={{ padding: '11px 16px' }}>{fmt(batch.totalAmount)}</td>
                    <td style={{ padding: '11px 16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {batch.createdAt ? new Date(batch.createdAt).toLocaleString('en-GB') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Modal Overlay ──────────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => !formSubmitting && setShowModal(false)}>
          <div
            className="card"
            style={{ width: '460px', maxWidth: '90vw', padding: '24px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                {modalType === 'sales' ? 'Open Sales Batch' : 'Open Banking Batch'}
              </h3>
              <button
                className="btn-icon"
                onClick={() => setShowModal(false)}
                disabled={formSubmitting}
                style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {modalType === 'sales' ? (
              <>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Vendor <span className="required">*</span></label>
                  <select className="form-input" value={formVendor} onChange={e => setFormVendor(e.target.value)}>
                    <option value="">Select a vendor...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.location})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Notes (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Morning shift batch"
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Sales Batch (Closed) <span className="required">*</span></label>
                  <select className="form-input" value={formSalesBatch} onChange={e => setFormSalesBatch(e.target.value)}>
                    <option value="">Select a closed sales batch...</option>
                    {closedSalesBatches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.id} - {b.vendorName || b.vendorId} ({fmt(b.totalAmount)})
                      </option>
                    ))}
                  </select>
                  {closedSalesBatches.length === 0 && (
                    <p style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--warning)' }}>
                      No closed sales batches available. Close a sales batch first.
                    </p>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Bank Reference <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. FNB-DEP-20260312-001"
                    value={formBankRef}
                    onChange={e => setFormBankRef(e.target.value)}
                  />
                </div>
              </>
            )}

            {formError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: '12px' }}>{formError}</p>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={formSubmitting}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={formSubmitting}>
                {formSubmitting ? (
                  <><Loader size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} /> Creating...</>
                ) : (
                  <><Plus size={14} style={{ marginRight: 4 }} /> Create Batch</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
