import { useState, useMemo, useEffect } from 'react';
import { transactionService } from '../services/api';
import { Search, Filter, Download, FileText, Printer, RotateCcw } from 'lucide-react';

const TYPES    = ['All', 'Vend', 'Reversal', 'Free Token', 'Engineering'];
const STATUSES = ['All', 'Success', 'Arrears', 'Failed', 'Reversed'];

function statusBadgeClass(status) {
  switch (status) {
    case 'Success':  return 'badge badge-success';
    case 'Arrears':  return 'badge badge-warning';
    case 'Failed':   return 'badge badge-danger';
    case 'Reversed': return 'badge badge-neutral';
    default:         return 'badge badge-neutral';
  }
}

function truncateToken(token) {
  if (!token) return '—';
  const parts = token.split('-');
  if (parts.length >= 3) return `${parts[0]}-${parts[1]}-···`;
  return token.slice(0, 9) + '···';
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [dateFrom, setDateFrom] = useState('2026-03-01');
  const [dateTo, setDateTo]     = useState('2026-03-12');
  const [searchQuery, setSearchQuery]   = useState('');
  const [typeFilter, setTypeFilter]     = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showReversal, setShowReversal] = useState(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversedIds, setReversedIds] = useState(new Set());

  // Applied filter state (committed on button click)
  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: '2026-03-01',
    dateTo:   '2026-03-12',
    search:   '',
    type:     'All',
    status:   'All',
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      dateFrom,
      dateTo,
      search:  searchQuery,
      type:    typeFilter,
      status:  statusFilter,
    });
  };

  useEffect(() => {
    setLoading(true);
    transactionService.getAll(appliedFilters)
      .then(res => {
        setTransactions(res.data);
        setTotal(res.total);
      })
      .catch(err => console.error('Failed to load transactions:', err))
      .finally(() => setLoading(false));
  }, [appliedFilters]);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = !appliedFilters.search ||
        tx.customer.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
        tx.meterNo.includes(appliedFilters.search) ||
        tx.id.toLowerCase().includes(appliedFilters.search.toLowerCase());
      const matchType   = appliedFilters.type   === 'All' || tx.type   === appliedFilters.type;
      const matchStatus = appliedFilters.status  === 'All' || tx.status === appliedFilters.status;
      const txDate = tx.date;
      const matchDate = txDate >= appliedFilters.dateFrom && txDate <= appliedFilters.dateTo;
      return matchSearch && matchType && matchStatus && matchDate;
    });
  }, [appliedFilters, transactions]);

  const handleReprint = (tx) => {
    // In production this would call a printer service
    alert(`Reprinting receipt for ${tx.id}\n\nCustomer: ${tx.customer}\nMeter: ${tx.meterNo}\nAmount: N$${tx.amount.toFixed(2)}\nToken: ${tx.token}`);
  };

  const handleReversalConfirm = () => {
    if (!showReversal || !reversalReason.trim()) return;
    setReversedIds(prev => new Set([...prev, showReversal.id]));
    setShowReversal(null);
    setReversalReason('');
  };

  const handleExportCSV = () => {
    transactionService.export('csv', appliedFilters)
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `transactions-${appliedFilters.dateFrom}-to-${appliedFilters.dateTo}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(err => console.error('Failed to export CSV:', err));
  };

  const totalAmount = filtered.reduce((sum, tx) => sum + tx.amount, 0);
  const totalKwh    = filtered.reduce((sum, tx) => sum + tx.kwh, 0);

  return (
    <div className="transactions-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Transaction History</h1>
          <p className="page-desc">Full audit trail with reprint and reversal capability</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="date-filter-row" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Date From
          </label>
          <input
            type="date"
            className="form-input"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            style={{ width: 'auto', minWidth: 140 }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Date To
          </label>
          <input
            type="date"
            className="form-input"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            style={{ width: 'auto', minWidth: 140 }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 200px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Customer / Meter
          </label>
          <div className="search-bar">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search customer or meter..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Type
          </label>
          <div className="select-wrapper">
            <select
              className="form-select"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ width: 160 }}
            >
              {TYPES.map(t => (
                <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Status
          </label>
          <div className="select-wrapper">
            <select
              className="form-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: 140 }}
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s === 'All' ? 'All' : s}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleApplyFilters} style={{ alignSelf: 'flex-end' }}>
          <Filter size={14} />
          Apply Filters
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Transactions', value: filtered.length },
          { label: 'Gross Sales',  value: `N$${totalAmount.toLocaleString('en', { minimumFractionDigits: 2 })}` },
          { label: 'Total kWh',    value: `${totalKwh.toFixed(1)} kWh` },
          { label: 'Reversed',     value: reversedIds.size },
        ].map(({ label, value }) => (
          <div key={label} className="stat-tile" style={{ flex: '1 1 130px' }}>
            <div className="stat-tile-value">{value}</div>
            <div className="stat-tile-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Transaction Table */}
      <div className="table-container">
        <div className="card-header" style={{ padding: '14px 16px' }}>
          <div className="card-title">
            Transaction History
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8125rem', marginLeft: 4 }}>
              March 2026 &mdash; 247 transactions today
            </span>
          </div>
          <div className="card-actions">
            <button className="btn btn-ghost btn-sm" onClick={handleExportCSV} title="Export CSV">
              <Download size={14} />
              CSV
            </button>
            <button className="btn btn-ghost btn-sm" title="Export PDF">
              <FileText size={14} />
              PDF
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Reference</th>
                <th>Customer</th>
                <th>Meter No.</th>
                <th>Amount N$</th>
                <th>kWh</th>
                <th>STS Token</th>
                <th>Operator</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No transactions match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(tx => {
                  const isReversed = reversedIds.has(tx.id);
                  return (
                    <tr key={tx.id} style={{ opacity: isReversed ? 0.55 : 1 }}>
                      <td className="cell-mono" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        <div>{tx.date}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{tx.time}</div>
                      </td>
                      <td className="cell-mono" style={{ fontSize: '0.775rem' }}>{tx.id}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {tx.customer}
                      </td>
                      <td className="cell-mono" style={{ color: 'var(--accent-dark)' }}>{tx.meterNo}</td>
                      <td className="cell-mono cell-amount" style={{ whiteSpace: 'nowrap' }}>
                        N${tx.amount.toFixed(2)}
                      </td>
                      <td className="cell-mono">{tx.kwh.toFixed(1)}</td>
                      <td>
                        <span
                          className="cell-mono"
                          style={{ color: 'var(--accent-dark)', fontSize: '0.8rem', letterSpacing: '0.03em', cursor: 'help' }}
                          title={tx.token}
                        >
                          {truncateToken(tx.token)}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{tx.operator}</td>
                      <td>
                        <span className={isReversed ? 'badge badge-neutral' : statusBadgeClass(tx.status)}>
                          {isReversed ? 'Reversed' : tx.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-icon"
                            onClick={() => handleReprint(tx)}
                            title="Reprint receipt"
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            className="btn-icon danger"
                            onClick={() => { setShowReversal(tx); setReversalReason(''); }}
                            title="Reverse transaction"
                            disabled={isReversed}
                            style={{ opacity: isReversed ? 0.35 : 1, cursor: isReversed ? 'not-allowed' : 'pointer' }}
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reversal Confirmation Modal */}
      {showReversal && (
        <div className="modal-overlay" onClick={() => setShowReversal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RotateCcw size={18} style={{ color: 'var(--danger)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Confirm Transaction Reversal
                </h3>
              </div>
              <button className="btn-icon" onClick={() => setShowReversal(null)}>&times;</button>
            </div>

            <div className="modal-body">
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 6 }}>Transaction to reverse:</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: 4 }}>{showReversal.id}</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{showReversal.customer}</div>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger)', fontWeight: 700, marginTop: 4 }}>
                  N${showReversal.amount.toFixed(2)} &mdash; {showReversal.kwh.toFixed(1)} kWh
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Reason for Reversal <span className="required">*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="State the reason for reversing this transaction..."
                  value={reversalReason}
                  onChange={e => setReversalReason(e.target.value)}
                  style={{ resize: 'vertical', minHeight: 80 }}
                />
                {!reversalReason.trim() && (
                  <div className="form-hint">A reason is required before reversing.</div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowReversal(null)}>
                Cancel
              </button>
              <button
                className="btn btn-sm btn-danger filled"
                onClick={handleReversalConfirm}
                disabled={!reversalReason.trim()}
              >
                <RotateCcw size={13} />
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: fadeIn 150ms ease;
        }
        .modal-box {
          background: var(--card-bg);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          width: 100%;
          max-width: 480px;
          animation: slideUp 200ms ease;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }
        .modal-body {
          padding: 20px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 14px 20px;
          border-top: 1px solid var(--border);
          background: var(--content-bg);
          border-radius: 0 0 var(--radius-lg) var(--radius-lg);
        }
      `}</style>
    </div>
  );
}
