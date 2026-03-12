import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Wifi, WifiOff, AlertTriangle, Zap, Send,
  Power, Thermometer, Gauge, RefreshCw, ChevronDown, ChevronUp,
  Radio, Clock, Hash, RotateCcw, Droplets, BatteryCharging,
} from 'lucide-react';
import { meterMonitorService } from '../services/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const REFRESH_INTERVAL_MS = 30_000; // 30 seconds auto-refresh

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Relative time string from a date like "2026-03-12 13:41:40" */
function relativeTime(dateStr) {
  if (!dateStr) return '--';
  const then = new Date(dateStr.replace(' ', 'T'));
  const now = new Date();
  const diffMs = now - then;
  if (diffMs < 0) return 'just now';
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Format a number with fixed decimals, or return '--' if nullish */
function fmtVal(value, decimals = 1, suffix = '') {
  if (value == null || isNaN(value)) return '--';
  return `${Number(value).toFixed(decimals)}${suffix}`;
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------
function MeterStatusBadge({ status }) {
  const map = {
    Online: 'badge-success',
    Offline: 'badge-muted',
    Tampered: 'badge-danger',
    Unregistered: 'badge-warning',
  };
  return (
    <span className={`badge-status ${map[status] ?? 'badge-muted'}`}>
      {status || 'Unknown'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// KPI Card (simplified for meter monitor -- no delta)
// ---------------------------------------------------------------------------
function MeterKpiCard({ title, value, borderColor, icon: Icon, loading, subtitle }) {
  return (
    <div className="kpi-card" style={{ borderTopColor: borderColor }}>
      <div className="kpi-card-header">
        <span className="kpi-title">{title}</span>
        {Icon && (
          <span className="kpi-icon" style={{ color: borderColor }}>
            <Icon size={18} strokeWidth={2} />
          </span>
        )}
      </div>
      {loading ? (
        <div className="kpi-skeleton" />
      ) : (
        <>
          <div className="kpi-value mono">{value}</div>
          {subtitle && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail Panel — Power Readings
// ---------------------------------------------------------------------------
function PowerReadingsGrid({ meter }) {
  const items = [
    { label: 'Current', value: fmtVal(meter.current_a, 2, ' A'), icon: Activity, color: 'var(--accent)' },
    { label: 'Voltage', value: fmtVal(meter.voltage_v, 1, ' V'), icon: Zap, color: 'var(--info, #3b82f6)' },
    { label: 'Active Power', value: fmtVal(meter.active_w, 1, ' W'), icon: Power, color: 'var(--warning)' },
    { label: 'Power Factor', value: fmtVal(meter.power_factor, 3), icon: Gauge, color: 'var(--success)' },
    { label: 'Frequency', value: fmtVal(meter.frequency_hz, 2, ' Hz'), icon: Radio, color: 'var(--accent)' },
    { label: 'Temperature', value: fmtVal(meter.temperature_c, 1, ' C'), icon: Thermometer, color: 'var(--danger)' },
  ];

  return (
    <div>
      <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Power Readings
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              background: 'var(--content-bg)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <item.icon size={13} style={{ color: item.color }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
            </div>
            <span className="mono" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail Panel — Energy Readings
// ---------------------------------------------------------------------------
function EnergyReadingsGrid({ meter }) {
  const items = [
    { label: 'Active Energy', value: fmtVal(meter.active_energy_wh, 1, ' Wh'), icon: BatteryCharging, color: 'var(--accent)' },
    { label: 'Credit', value: fmtVal(meter.credit_kwh, 2, ' kWh'), icon: Zap, color: 'var(--success)' },
    { label: 'Tamper Status', value: meter.tamper_flag ? 'TAMPERED' : 'Clear', icon: AlertTriangle, color: meter.tamper_flag ? 'var(--danger)' : 'var(--success)' },
    { label: 'Reset Count', value: meter.reset_count != null ? String(meter.reset_count) : '--', icon: RotateCcw, color: 'var(--text-secondary)' },
  ];

  return (
    <div>
      <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Energy Readings
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              background: 'var(--content-bg)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <item.icon size={13} style={{ color: item.color }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
            </div>
            <span
              className="mono"
              style={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: item.label === 'Tamper Status' && meter.tamper_flag ? 'var(--danger)' : 'var(--text-primary)',
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail Panel — Command Buttons
// ---------------------------------------------------------------------------
function CommandPanel({ drn, onCommandSent }) {
  const [sending, setSending] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const commands = [
    { key: 'relay_on', label: 'Relay ON', icon: Power, color: 'var(--success)' },
    { key: 'relay_off', label: 'Relay OFF', icon: Power, color: 'var(--danger)' },
    { key: 'geyser_on', label: 'Geyser ON', icon: Droplets, color: 'var(--accent)' },
    { key: 'geyser_off', label: 'Geyser OFF', icon: Droplets, color: 'var(--text-muted)' },
    { key: 'reset', label: 'Reset', icon: RotateCcw, color: 'var(--warning)' },
    { key: 'wake', label: 'Wake', icon: Radio, color: 'var(--info, #3b82f6)' },
  ];

  const handleCommand = async (command) => {
    setSending(command);
    setFeedback(null);
    try {
      await meterMonitorService.sendCommand(drn, command);
      setFeedback({ type: 'success', message: `${command} sent` });
      if (onCommandSent) onCommandSent();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Command failed' });
    } finally {
      setSending(null);
    }
  };

  return (
    <div>
      <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Commands
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {commands.map((cmd) => (
          <button
            key={cmd.key}
            className="btn btn-secondary"
            disabled={sending === cmd.key}
            onClick={() => handleCommand(cmd.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 10px',
              fontSize: '0.8rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--card-bg)',
              color: cmd.color,
              cursor: sending === cmd.key ? 'wait' : 'pointer',
              opacity: sending && sending !== cmd.key ? 0.5 : 1,
              transition: 'var(--transition-fast)',
            }}
          >
            <cmd.icon size={14} />
            {sending === cmd.key ? 'Sending...' : cmd.label}
          </button>
        ))}
      </div>
      {feedback && (
        <div
          style={{
            marginTop: 8,
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem',
            fontWeight: 500,
            background: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: feedback.type === 'success' ? '#15803d' : '#dc2626',
          }}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail Panel — Token History
// ---------------------------------------------------------------------------
function TokenHistory({ tokens }) {
  if (!tokens || tokens.length === 0) {
    return (
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
        No token delivery history for this meter.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table" style={{ fontSize: '0.82rem' }}>
        <thead>
          <tr>
            <th>Token</th>
            <th>Transaction ID</th>
            <th>Status</th>
            <th>Delivered</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t, i) => (
            <tr key={t.transaction_id || i}>
              <td>
                <span className="mono" style={{ fontSize: '0.8rem', letterSpacing: '0.04em' }}>
                  {t.token || '--'}
                </span>
              </td>
              <td>
                <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t.transaction_id || '--'}
                </span>
              </td>
              <td>
                <span className={`badge-status ${t.status === 'delivered' || t.status === 'accepted' ? 'badge-success' : t.status === 'pending' ? 'badge-warning' : 'badge-muted'}`}>
                  {t.status || 'unknown'}
                </span>
              </td>
              <td>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t.delivered_at ? relativeTime(t.delivered_at) : '--'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expandable Meter Detail Panel
// ---------------------------------------------------------------------------
function MeterDetailPanel({ drn, onCommandSent }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await meterMonitorService.getMeterDetail(drn);
      setDetail(data);
    } catch (err) {
      setError(err.message || 'Failed to load meter detail');
    } finally {
      setLoading(false);
    }
  }, [drn]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  if (loading) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8, verticalAlign: 'middle' }} />
        Loading meter detail...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px', color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={16} />
        {error}
        <button className="btn btn-ghost btn-sm" onClick={loadDetail} style={{ marginLeft: 'auto' }}>Retry</button>
      </div>
    );
  }

  const meter = detail?.meter || {};
  const tokens = detail?.tokens || [];

  return (
    <div
      style={{
        padding: '20px 24px',
        background: 'var(--card-bg)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {/* Top row: Power + Energy + Commands */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 20 }}>
        <PowerReadingsGrid meter={meter} />
        <EnergyReadingsGrid meter={meter} />
        <CommandPanel drn={drn} onCommandSent={() => { loadDetail(); if (onCommandSent) onCommandSent(); }} />
      </div>

      {/* Bottom: Token history */}
      <div>
        <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Token Delivery History
        </h4>
        <TokenHistory tokens={tokens} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meter Table Row
// ---------------------------------------------------------------------------
function MeterRow({ meter, isExpanded, onToggle, onCommandSent }) {
  return (
    <>
      <tr
        className="table-row-hover"
        onClick={onToggle}
        style={{ cursor: 'pointer' }}
      >
        <td>
          <span className="mono" style={{ fontSize: '0.82rem', letterSpacing: '0.04em' }}>
            {meter.drn}
          </span>
        </td>
        <td>
          <span className="text-primary-strong">{meter.customer_name || '--'}</span>
          {meter.account_no && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{meter.account_no}</div>
          )}
        </td>
        <td>
          <span style={{ fontSize: '0.85rem' }}>{meter.area || '--'}</span>
        </td>
        <td>
          <MeterStatusBadge status={meter.status} />
        </td>
        <td>
          <span className="mono" style={{ fontSize: '0.82rem' }}>
            {fmtVal(meter.voltage_v, 1)}
          </span>
        </td>
        <td>
          <span className="mono" style={{ fontSize: '0.82rem' }}>
            {fmtVal(meter.active_w, 0)}
          </span>
        </td>
        <td>
          <span className="mono" style={{ fontSize: '0.82rem', color: meter.credit_kwh != null && meter.credit_kwh < 5 ? 'var(--danger)' : 'var(--text-primary)' }}>
            {fmtVal(meter.credit_kwh, 1)}
          </span>
        </td>
        <td>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {meter.operator_name || '--'}
          </span>
        </td>
        <td>
          <span
            className="mono"
            style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}
            title={meter.last_seen || ''}
          >
            {relativeTime(meter.last_seen)}
          </span>
        </td>
        <td>
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            style={{ padding: '4px 8px' }}
            title={isExpanded ? 'Collapse' : 'Expand detail'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={10} style={{ padding: 0 }}>
            <MeterDetailPanel drn={meter.drn} onCommandSent={onCommandSent} />
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Search / Filter Bar
// ---------------------------------------------------------------------------
function FilterBar({ searchTerm, onSearchChange, statusFilter, onStatusChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 360 }}>
        <input
          type="text"
          placeholder="Search DRN, customer, area..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px 8px 36px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: 'var(--card-bg)',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color var(--transition-fast)',
          }}
        />
        <Hash
          size={15}
          style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          background: 'var(--card-bg)',
          fontSize: '0.85rem',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <option value="all">All Statuses</option>
        <option value="Online">Online</option>
        <option value="Offline">Offline</option>
        <option value="Tampered">Tampered</option>
        <option value="Unregistered">Unregistered</option>
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page: Meter Monitor
// ---------------------------------------------------------------------------
export default function MeterMonitor() {
  const [meters, setMeters] = useState([]);
  const [pendingTokens, setPendingTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDrn, setExpandedDrn] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lastRefresh, setLastRefresh] = useState(null);

  // ---- Data loading ----
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meterData, queueData] = await Promise.all([
        meterMonitorService.listMeters(),
        meterMonitorService.getTokenQueue(),
      ]);
      setMeters(meterData?.meters || []);
      setPendingTokens(queueData?.count || 0);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('MeterMonitor data fetch error:', err);
      setError(err.message || 'Failed to load meter data');
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Initial load + auto-refresh ----
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  // ---- Derived counts ----
  const totalMeters = meters.length;
  const onlineMeters = meters.filter((m) => m.status === 'Online').length;
  const tamperedMeters = meters.filter((m) => m.status === 'Tampered').length;

  // ---- Filtering ----
  const filteredMeters = meters.filter((m) => {
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    if (!matchesStatus) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (m.drn && m.drn.toLowerCase().includes(q)) ||
      (m.customer_name && m.customer_name.toLowerCase().includes(q)) ||
      (m.area && m.area.toLowerCase().includes(q)) ||
      (m.account_no && m.account_no.toLowerCase().includes(q)) ||
      (m.phone && m.phone.includes(q))
    );
  });

  // ---- Toggle detail panel ----
  const toggleExpand = (drn) => {
    setExpandedDrn((prev) => (prev === drn ? null : drn));
  };

  return (
    <div className="page-wrapper">

      {/* ---- Page Header ---- */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Meter Monitor</h1>
          <p className="page-subtitle">ESP32 GRIDx Meter Communication</p>
        </div>
        <div className="page-header-right">
          {lastRefresh && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: 8 }}>
              <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Updated {relativeTime(lastRefresh.toISOString().replace('T', ' ').slice(0, 19))}
            </span>
          )}
          <button
            className="btn btn-secondary"
            onClick={loadData}
            title="Refresh meter data"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ---- KPI Cards ---- */}
      <div className="kpi-grid">
        <MeterKpiCard
          title="Total Meters"
          value={totalMeters}
          borderColor="#3b82f6"
          icon={Gauge}
          loading={loading}
          subtitle="Registered devices"
        />
        <MeterKpiCard
          title="Online Meters"
          value={onlineMeters}
          borderColor="#22c55e"
          icon={Wifi}
          loading={loading}
          subtitle={totalMeters > 0 ? `${Math.round((onlineMeters / totalMeters) * 100)}% connected` : 'No meters'}
        />
        <MeterKpiCard
          title="Pending Tokens"
          value={pendingTokens}
          borderColor="#f59e0b"
          icon={Send}
          loading={loading}
          subtitle="Queued for delivery"
        />
        <MeterKpiCard
          title="Tampered Meters"
          value={tamperedMeters}
          borderColor="#ef4444"
          icon={AlertTriangle}
          loading={loading}
          subtitle={tamperedMeters > 0 ? 'Requires attention' : 'All clear'}
        />
      </div>

      {/* ---- Error Banner ---- */}
      {error && !loading && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.85rem',
            color: 'var(--danger)',
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={loadData}
            style={{ marginLeft: 'auto', color: 'var(--danger)' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ---- Meter Table Card ---- */}
      <div className="card" style={{ marginTop: 0 }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="card-title">Meter Fleet</h2>
            <p className="card-subtitle">
              {filteredMeters.length} of {totalMeters} meters
              {statusFilter !== 'all' && ` (${statusFilter})`}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>DRN</th>
                <th>Customer</th>
                <th>Area</th>
                <th>Status</th>
                <th className="text-right">Voltage (V)</th>
                <th className="text-right">Power (W)</th>
                <th className="text-right">Credit (kWh)</th>
                <th>Signal</th>
                <th>Last Seen</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? /* Skeleton loading rows */
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`skel-${i}`}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <td key={j}><div className="skeleton-cell" /></td>
                      ))}
                    </tr>
                  ))
                : filteredMeters.length === 0
                ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                        <WifiOff size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                        <div style={{ fontSize: '0.92rem', fontWeight: 500, marginBottom: 4 }}>
                          {meters.length === 0 ? 'No meters found' : 'No meters match your filter'}
                        </div>
                        <div style={{ fontSize: '0.82rem' }}>
                          {meters.length === 0
                            ? 'Meters will appear once they connect to the GRIDx system.'
                            : 'Try adjusting the search or status filter.'}
                        </div>
                      </td>
                    </tr>
                  )
                : filteredMeters.map((meter) => (
                    <MeterRow
                      key={meter.drn}
                      meter={meter}
                      isExpanded={expandedDrn === meter.drn}
                      onToggle={() => toggleExpand(meter.drn)}
                      onCommandSent={loadData}
                    />
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- Inline keyframe for spinner ---- */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      `}</style>

    </div>
  );
}
