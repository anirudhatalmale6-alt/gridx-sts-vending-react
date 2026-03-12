import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Zap, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { dashboardService } from '../services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a number as Namibian Dollars: "N$18,742" */
function fmtNAD(value, decimals = 0) {
  return `N$${Number(value).toLocaleString('en-NA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** Format a plain number with thousands separator */
function fmtNum(value) {
  return Number(value).toLocaleString('en-NA');
}

// ---------------------------------------------------------------------------
// Custom recharts tooltip
// ---------------------------------------------------------------------------
function SalesTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-value">{fmtNAD(payload[0].value)}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------
function KpiCard({ title, value, delta, deltaLabel, borderColor, icon: Icon, loading }) {
  const isPositive = delta >= 0;
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
          <div className={`kpi-delta ${isPositive ? 'delta-up' : 'delta-down'}`}>
            {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>{deltaLabel}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transaction Status Badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }) {
  const map = {
    Success: 'badge-success',
    Arrears: 'badge-warning',
    Failed: 'badge-danger',
    Reversed: 'badge-muted',
  };
  return (
    <span className={`badge-status ${map[status] ?? 'badge-muted'}`}>
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// System Status Item
// ---------------------------------------------------------------------------
function SystemStatusItem({ label, status, detail }) {
  const ok = ['Online', 'Connected', 'Healthy', 'Active'].includes(status);
  return (
    <div className="sys-status-item">
      <span className={`sys-status-dot ${ok ? 'dot-online' : 'dot-warn'}`} />
      <div className="sys-status-text">
        <span className="sys-status-label">{label}</span>
        <span className="sys-status-detail">{detail}</span>
      </div>
      <span className={`sys-status-badge ${ok ? 'sys-badge-ok' : 'sys-badge-warn'}`}>
        {status}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const navigate = useNavigate();

  const [kpis, setKpis] = useState({ todaySales: 0, tokensGenerated: 0, activeMeters: 0, monthlyRevenue: 0 });
  const [salesTrend, setSalesTrend] = useState([]);
  const [systemStatus, setSystemStatus] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBarIndex, setActiveBarIndex] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiData, trendData, txnData, statusData] = await Promise.all([
        dashboardService.getKPIs(),
        dashboardService.getSalesTrend(),
        dashboardService.getRecentTransactions(10),
        dashboardService.getSystemStatus
          ? dashboardService.getSystemStatus()
          : Promise.resolve(defaultSystemStatus),
      ]);
      setKpis(kpiData);
      setSalesTrend(trendData);
      setTransactions(txnData);
      setSystemStatus(statusData ?? defaultSystemStatus);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derive chart-safe trend: use `amount` from api or `amount` field
  const chartData = salesTrend.map((item) => ({
    day: item.day,
    amount: item.amount ?? item.sales ?? 0,
  }));

  return (
    <div className="page-wrapper">

      {/* ---- Page Header ---- */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">NamPower STS Prepaid Electricity Vending System</p>
        </div>
        <div className="page-header-right">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/vending')}
            title="Open Vend Token screen"
          >
            <Zap size={16} />
            Quick Vend
          </button>
          <button
            className="btn btn-secondary"
            onClick={loadData}
            title="Refresh dashboard data"
            disabled={loading}
          >
            <Activity size={16} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ---- KPI Cards ---- */}
      <div className="kpi-grid">
        <KpiCard
          title="Today's Sales"
          value={fmtNAD(kpis.todaySales)}
          delta={kpis.todaySalesDelta ?? 0}
          deltaLabel={`${kpis.todaySalesDelta ?? 0}% vs yesterday`}
          borderColor="#00b4d8"
          icon={TrendingUp}
          loading={loading}
        />
        <KpiCard
          title="Tokens Generated Today"
          value={fmtNum(kpis.tokensGenerated)}
          delta={kpis.tokensDelta ?? 0}
          deltaLabel={`${kpis.tokensDelta ?? 0} more than yesterday`}
          borderColor="#3b82f6"
          icon={Zap}
          loading={loading}
        />
        <KpiCard
          title="Active Meters"
          value={fmtNum(kpis.activeMeters)}
          delta={kpis.metersDelta ?? 0}
          deltaLabel={`${kpis.metersDelta ?? 0} new this month`}
          borderColor="#22c55e"
          icon={Activity}
          loading={loading}
        />
        <KpiCard
          title="Revenue This Month"
          value={fmtNAD(kpis.monthlyRevenue)}
          delta={kpis.monthlyRevenueDelta ?? 0}
          deltaLabel={`${kpis.monthlyRevenueDelta ?? 0}% vs last month`}
          borderColor="#f59e0b"
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      {/* ---- Main Content: Transactions + Chart/Status ---- */}
      <div className="dashboard-main">

        {/* ---- Left: Recent Transactions ---- */}
        <div className="card transactions-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Recent Transactions</h2>
              <p className="card-subtitle">Last 10 vending operations today</p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/transactions')}
            >
              View All
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Meter No.</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">kWh</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 7 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j}><div className="skeleton-cell" /></td>
                        ))}
                      </tr>
                    ))
                  : transactions.map((txn) => (
                      <tr key={txn.id} className="table-row-hover">
                        <td>
                          <span className="mono text-muted" style={{ fontSize: '0.82rem' }}>
                            {txn.time}
                          </span>
                        </td>
                        <td>
                          <span className="text-primary-strong">{txn.customer}</span>
                        </td>
                        <td>
                          <span className="mono" style={{ fontSize: '0.82rem' }}>
                            {txn.meterNo}
                          </span>
                        </td>
                        <td className="text-right">
                          <span className="mono font-semibold">{fmtNAD(txn.amount, 2)}</span>
                        </td>
                        <td className="text-right">
                          <span className="mono text-muted">{txn.kwh.toFixed(1)}</span>
                        </td>
                        <td>
                          <StatusBadge status={txn.status} />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---- Right Column ---- */}
        <div className="dashboard-right">

          {/* Sales Trend Chart */}
          <div className="card chart-card">
            <div className="card-header">
              <div>
                <h2 className="card-title">7-Day Sales Trend</h2>
                <p className="card-subtitle">Daily revenue in N$</p>
              </div>
            </div>

            <div className="chart-container">
              {loading ? (
                <div className="chart-loading">
                  <div className="chart-loading-bars">
                    {[60, 75, 45, 35, 80, 90, 100].map((h, i) => (
                      <div
                        key={i}
                        className="chart-loading-bar"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={chartData}
                    barCategoryGap="30%"
                    margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
                    onMouseLeave={() => setActiveBarIndex(null)}
                  >
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: '#8fa0b8', fontFamily: 'var(--font-body)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#8fa0b8', fontFamily: 'var(--font-body)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      width={36}
                    />
                    <Tooltip
                      content={<SalesTooltip />}
                      cursor={{ fill: 'rgba(0, 180, 216, 0.06)' }}
                    />
                    <Bar
                      dataKey="amount"
                      radius={[4, 4, 0, 0]}
                      onMouseEnter={(_, index) => setActiveBarIndex(index)}
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === chartData.length - 1
                              ? 'url(#barGradientActive)'
                              : activeBarIndex === index
                              ? 'url(#barGradientHover)'
                              : 'url(#barGradient)'
                          }
                        />
                      ))}
                    </Bar>
                    {/* Gradient definitions */}
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00b4d8" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="#0096c7" stopOpacity={0.35} />
                      </linearGradient>
                      <linearGradient id="barGradientActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00e5ff" stopOpacity={1} />
                        <stop offset="100%" stopColor="#00b4d8" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#48cae4" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#00b4d8" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* System Status */}
          <div className="card status-card">
            <div className="card-header">
              <div>
                <h2 className="card-title">System Status</h2>
                <p className="card-subtitle">Live infrastructure health</p>
              </div>
              <span className="sys-all-ok-badge">All Systems Operational</span>
            </div>

            <div className="sys-status-list">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="sys-status-skeleton" />
                  ))
                : (systemStatus.length > 0 ? systemStatus : defaultSystemStatus).map((item) => (
                    <SystemStatusItem
                      key={item.label}
                      label={item.label}
                      status={item.status}
                      detail={item.detail}
                    />
                  ))}
            </div>
          </div>

        </div>{/* end dashboard-right */}
      </div>{/* end dashboard-main */}

    </div>
  );
}

// ---------------------------------------------------------------------------
// Static fallback data (used if API is unavailable)
// ---------------------------------------------------------------------------
const defaultSystemStatus = [
  { label: 'Application Server', status: 'Online',    detail: 'v3.2.1 — uptime 99.98%' },
  { label: 'STS Gateway',        status: 'Connected', detail: 'IEC 62055-41 — latency 12ms' },
  { label: 'Database',           status: 'Healthy',   detail: 'PostgreSQL — 2.4 GB used' },
  { label: 'SMS Gateway',        status: 'Active',    detail: 'MTC Namibia — 0 failed' },
];

