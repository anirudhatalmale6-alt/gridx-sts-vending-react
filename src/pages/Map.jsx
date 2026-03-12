import { useState, useEffect, useCallback } from 'react';
import { MapPin, Search, ExternalLink, Loader, X, Zap, Clock } from 'lucide-react';
import { mapService } from '../services/api';

const fmt = (n) => 'N$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusBadge = (status) => {
  const s = String(status).toLowerCase();
  const map = {
    active:     { cls: 'badge-success', label: 'Active' },
    inactive:   { cls: 'badge-muted',   label: 'Inactive' },
    tampered:   { cls: 'badge-danger',  label: 'Tampered' },
    suspended:  { cls: 'badge-warning', label: 'Suspended' },
  };
  const cfg = map[s] || { cls: 'badge-muted', label: status };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
};

export default function MeterMap() {
  // ---- Area summary ----
  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(true);

  // ---- Meter locations ----
  const [meters, setMeters] = useState([]);
  const [metersLoading, setMetersLoading] = useState(true);
  const [metersError, setMetersError] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ---- Detail panel ----
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [meterDetail, setMeterDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ---- Load areas on mount ----
  useEffect(() => {
    setAreasLoading(true);
    mapService.getAreaSummary()
      .then(res => setAreas(res.data || []))
      .catch(() => setAreas([]))
      .finally(() => setAreasLoading(false));
  }, []);

  // ---- Load meters ----
  const loadMeters = useCallback(async () => {
    setMetersLoading(true);
    setMetersError('');
    try {
      const filters = {};
      if (areaFilter) filters.area = areaFilter;
      if (statusFilter) filters.status = statusFilter;
      if (searchFilter.trim()) filters.q = searchFilter.trim();
      const res = await mapService.getMeterLocations(filters);
      setMeters(res.data || []);
    } catch (err) {
      setMetersError(err.message || 'Failed to load meter locations');
    } finally {
      setMetersLoading(false);
    }
  }, [areaFilter, statusFilter, searchFilter]);

  useEffect(() => {
    loadMeters();
  }, [loadMeters]);

  // ---- Load meter detail ----
  const handleMeterClick = async (meter) => {
    setSelectedMeter(meter);
    setDetailLoading(true);
    setMeterDetail(null);
    try {
      const res = await mapService.getMeterDetail(meter.meterNo);
      setMeterDetail(res.data || res);
    } catch {
      setMeterDetail({ error: true });
    } finally {
      setDetailLoading(false);
    }
  };

  // ---- Unique areas for filter ----
  const areaOptions = [...new Set(areas.map(a => a.name || a.area).filter(Boolean))];

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="page-header-left">
          <h1 className="page-title">Meter Map</h1>
          <p className="page-desc">GIS meter locations, area summaries, and meter detail lookup</p>
        </div>
      </div>

      {/* ── Area Summary Cards ──────────────────────────── */}
      {areasLoading ? (
        <div style={{ marginBottom: '24px', padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ marginLeft: 8, fontSize: '0.8125rem' }}>Loading area summary...</span>
        </div>
      ) : areas.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(areas.length, 4)}, 1fr)`, gap: '16px', marginBottom: '24px' }}>
          {areas.map((area, i) => (
            <div key={i} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MapPin size={16} color="var(--accent)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{area.name || area.area}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{area.region || 'Region'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'var(--content-bg)', borderRadius: 6, padding: '6px 10px' }}>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Meters</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: '0.9rem' }}>{(area.meterCount || 0).toLocaleString()}</div>
                </div>
                <div style={{ background: 'var(--content-bg)', borderRadius: 6, padding: '6px 10px' }}>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--success)' }}>{(area.activeCount || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: '1', minWidth: '200px' }}>
            <span className="search-icon"><Search size={15} /></span>
            <input
              type="text"
              placeholder="Search meter number, customer name..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadMeters()}
            />
          </div>

          <select
            className="form-input"
            value={areaFilter}
            onChange={e => setAreaFilter(e.target.value)}
            style={{ width: '180px', padding: '8px 10px' }}
          >
            <option value="">All Areas</option>
            {areaOptions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            className="form-input"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: '150px', padding: '8px 10px' }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="tampered">Tampered</option>
            <option value="suspended">Suspended</option>
          </select>

          <button className="btn btn-primary" onClick={loadMeters}>
            <Search size={14} style={{ marginRight: 4 }} /> Search
          </button>
        </div>
      </div>

      {/* ── Main Content: Table + Detail Panel ─────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedMeter ? '1fr 380px' : '1fr', gap: '20px' }}>

        {/* Meter Locations Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '0.9375rem' }}>Meter Locations</h3>
            <span className="badge badge-muted" style={{ marginLeft: 'auto' }}>{meters.length} meters</span>
          </div>

          {metersLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: 8, fontSize: '0.8125rem' }}>Loading meter locations...</p>
            </div>
          ) : metersError ? (
            <div style={{ padding: '20px', color: 'var(--danger)', fontSize: '0.8125rem' }}>{metersError}</div>
          ) : meters.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No meters found matching your filters.
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: 'var(--content-bg)', position: 'sticky', top: 0, zIndex: 1 }}>
                    {['METER NO', 'CUSTOMER', 'AREA', 'STATUS', 'COORDINATES', 'MAP'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: '0.725rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid var(--border)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {meters.map((meter) => {
                    const lat = meter.gps?.lat ?? meter.lat;
                    const lng = meter.gps?.lng ?? meter.lng;
                    const isSelected = selectedMeter?.meterNo === meter.meterNo;

                    return (
                      <tr
                        key={meter.meterNo}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(0,180,216,0.06)' : 'transparent',
                        }}
                        onClick={() => handleMeterClick(meter)}
                      >
                        <td className="mono" style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--accent)' }}>
                          {meter.meterNo}
                        </td>
                        <td style={{ padding: '10px 14px' }}>{meter.customerName || meter.name || '-'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{meter.area || '-'}</td>
                        <td style={{ padding: '10px 14px' }}>{statusBadge(meter.status)}</td>
                        <td className="mono" style={{ padding: '10px 14px', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                          {lat != null && lng != null ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : '-'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {lat != null && lng != null ? (
                            <a
                              href={`https://maps.google.com/?q=${lat},${lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ color: 'var(--accent)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <ExternalLink size={13} /> View
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>--</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Meter Detail Panel ───────────────────────── */}
        {selectedMeter && (
          <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'start', position: 'sticky', top: '80px' }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={15} color="var(--accent)" /> Meter Detail
              </h3>
              <button
                onClick={() => { setSelectedMeter(null); setMeterDetail(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                  <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: 8, fontSize: '0.8125rem' }}>Loading detail...</p>
                </div>
              ) : meterDetail?.error ? (
                <p style={{ color: 'var(--danger)', fontSize: '0.8125rem' }}>Failed to load meter detail.</p>
              ) : meterDetail ? (
                <>
                  {/* Meter info fields */}
                  {[
                    { label: 'Meter Number', value: meterDetail.meterNo || selectedMeter.meterNo, mono: true, accent: true },
                    { label: 'Customer', value: meterDetail.customerName || meterDetail.name || '-' },
                    { label: 'Status', value: null, badge: meterDetail.status || selectedMeter.status },
                    { label: 'Area', value: meterDetail.area || selectedMeter.area || '-' },
                    { label: 'Address', value: meterDetail.address || '-' },
                    { label: 'Tariff Group', value: meterDetail.tariffGroup || '-' },
                    { label: 'Meter Make', value: meterDetail.meterMake || '-' },
                    { label: 'Last Purchase', value: meterDetail.lastPurchase ? fmt(meterDetail.lastPurchase) : '-' },
                  ].map((f) => (
                    <div key={f.label} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      fontSize: '0.8125rem',
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>{f.label}</span>
                      {f.badge ? statusBadge(f.badge) : (
                        <span style={{
                          fontFamily: f.mono ? 'var(--font-mono)' : 'inherit',
                          color: f.accent ? 'var(--accent)' : 'var(--text-primary)',
                          fontWeight: f.accent ? 600 : 400,
                        }}>
                          {f.value}
                        </span>
                      )}
                    </div>
                  ))}

                  {/* GPS + Google Maps link */}
                  {(() => {
                    const lat = meterDetail.gps?.lat ?? meterDetail.lat ?? selectedMeter.gps?.lat ?? selectedMeter.lat;
                    const lng = meterDetail.gps?.lng ?? meterDetail.lng ?? selectedMeter.gps?.lng ?? selectedMeter.lng;
                    if (lat == null || lng == null) return null;
                    return (
                      <div style={{
                        marginTop: '12px',
                        background: 'var(--content-bg)',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center',
                      }}>
                        <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                          {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
                        </p>
                        <a
                          href={`https://maps.google.com/?q=${lat},${lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                          style={{ fontSize: '0.8rem', padding: '6px 16px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          <ExternalLink size={13} /> Open in Google Maps
                        </a>
                      </div>
                    );
                  })()}

                  {/* Last 5 Transactions */}
                  {meterDetail.recentTransactions && meterDetail.recentTransactions.length > 0 && (
                    <div style={{ marginTop: '18px' }}>
                      <p style={{
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--text-muted)',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <Clock size={12} /> Recent Transactions
                      </p>
                      {meterDetail.recentTransactions.slice(0, 5).map((txn, i) => (
                        <div key={i} style={{
                          padding: '8px 10px',
                          background: 'var(--content-bg)',
                          borderRadius: '6px',
                          marginBottom: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.8rem',
                        }}>
                          <div>
                            <div className="mono" style={{ fontWeight: 500, fontSize: '0.775rem' }}>
                              {txn.reference || txn.id}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                              {txn.date ? new Date(txn.date).toLocaleString('en-GB') : txn.createdAt ? new Date(txn.createdAt).toLocaleString('en-GB') : '-'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="mono" style={{ fontWeight: 600, color: 'var(--success)' }}>
                              {fmt(txn.amount)}
                            </div>
                            <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              {txn.kwh ? `${txn.kwh} kWh` : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
