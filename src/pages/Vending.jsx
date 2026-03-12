import { useState, useCallback, useEffect } from 'react';
import { vendingService, customerService, tariffService } from '../services/api';
import { Zap, Search, Printer, Copy, Smartphone, RefreshCw, Loader } from 'lucide-react';

// Sample quick-load presets
const SAMPLES = [
  { label: 'Sample: Shikongo', query: '01234567890' },
  { label: 'Sample: Iiyambo',  query: '01234568230' },
  { label: 'Sample: Arrears',  query: '01234568341' },
];

const QUICK_AMOUNTS = [10, 25, 50, 100, 200, 500];

// Step-tariff kWh calculation
function calcKwh(netEnergy, tariff) {
  if (!tariff || netEnergy <= 0) return 0;
  let remaining = netEnergy;
  let kwh = 0;

  for (const block of tariff.blocks) {
    if (remaining <= 0) break;

    // Parse block upper limit from range string (e.g. "0 – 50 kWh", "51 – 350 kWh", "351+ kWh")
    const rangeText = block.range;
    const dashMatch = rangeText.match(/(\d+)\s*[–-]\s*(\d+)/);
    const plusMatch  = rangeText.match(/(\d+)\+/);

    let blockKwhCapacity;
    if (dashMatch) {
      blockKwhCapacity = parseFloat(dashMatch[2]) - (kwh === 0 ? 0 : parseFloat(dashMatch[1]) - 1);
    } else if (plusMatch) {
      blockKwhCapacity = Infinity;
    } else {
      // Flat rate — all goes to this block
      blockKwhCapacity = Infinity;
    }

    const blockEnergyCapacity = blockKwhCapacity === Infinity
      ? remaining
      : Math.min(remaining, blockKwhCapacity * block.rate);

    const blockKwh = blockEnergyCapacity / block.rate;
    kwh += blockKwh;
    remaining -= blockEnergyCapacity;
  }

  return kwh;
}

function generateTxnRef() {
  return `TXN-${Date.now()}`;
}

export default function Vending() {
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchError, setSearchError]         = useState('');
  const [amount, setAmount]                   = useState('');
  const [generatedToken, setGeneratedToken]   = useState(null);
  const [isGenerating, setIsGenerating]       = useState(false);
  const [txnRef, setTxnRef]                   = useState('');
  const [copied, setCopied]                   = useState(false);
  const [sysConfig, setSysConfig]             = useState({ vatRate: 15, fixedCharge: 8.50, relLevy: 2.40, minPurchase: 10 });
  const [allTariffs, setAllTariffs]           = useState([]);

  // ── Load system config & tariffs on mount ──────────────────────────────────
  useEffect(() => {
    tariffService.getConfig()
      .then(res => {
        if (res.data) {
          const d = res.data;
          setSysConfig({
            vatRate:      d.vatRate      ?? 15,
            fixedCharge:  d.fixedCharge  ?? 8.50,
            relLevy:      d.relLevy      ?? 2.40,
            minPurchase:  d.minPurchase  ?? 10,
          });
        }
      })
      .catch(err => console.error('Failed to load system config:', err));

    tariffService.getAll()
      .then(res => {
        if (res.data) setAllTariffs(res.data);
      })
      .catch(err => console.error('Failed to load tariffs:', err));
  }, []);

  // ── Search ──────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (query) => {
    const q = (query || searchQuery).trim().toLowerCase();
    if (!q || q.length < 2) return;

    try {
      const res = await customerService.search(q);
      const found = res.data && res.data.length > 0 ? res.data[0] : null;

      if (found) {
        setSelectedCustomer(found);
        setSearchError('');
        setAmount('');
        setGeneratedToken(null);
        setTxnRef(generateTxnRef());
      } else {
        setSelectedCustomer(null);
        setSearchError(`No customer found for "${q}"`);
      }
    } catch (err) {
      console.error('Customer search failed:', err);
      setSelectedCustomer(null);
      setSearchError('Search failed. Please try again.');
    }
  }, [searchQuery]);

  const handleSampleLoad = (query) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  // ── Breakdown calculation ────────────────────────────────────────────────────
  const calculateBreakdown = useCallback((amt) => {
    if (!amt || !selectedCustomer) return null;
    const amountNum = parseFloat(amt);
    if (isNaN(amountNum) || amountNum < sysConfig.minPurchase) return null;

    const vat            = amountNum * (sysConfig.vatRate / (100 + sysConfig.vatRate));
    const fixedCharge    = sysConfig.fixedCharge;
    const relLevy        = sysConfig.relLevy;
    let   arrearsDeduction = 0;

    if (selectedCustomer.arrears > 0) {
      arrearsDeduction = Math.min(selectedCustomer.arrears, amountNum * 0.25);
    }

    const netEnergy = amountNum - vat - fixedCharge - relLevy - arrearsDeduction;
    const tariff    = allTariffs.find(t => t.id === selectedCustomer.tariffGroup);
    const kwh       = netEnergy > 0 ? calcKwh(netEnergy, tariff) : 0;

    return {
      amountTendered: amountNum,
      vat,
      fixedCharge,
      relLevy,
      arrearsDeduction,
      netEnergy: Math.max(0, netEnergy),
      kwh: Math.max(0, kwh),
    };
  }, [selectedCustomer]);

  // ── Token generation ─────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedCustomer || !amount) return;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < sysConfig.minPurchase) return;

    setIsGenerating(true);
    setGeneratedToken(null);

    try {
      const breakdown = calculateBreakdown(amount);
      const result    = await vendingService.generateToken(selectedCustomer.meterNo, amountNum);
      setGeneratedToken({ ...result, breakdown, kwh: breakdown ? breakdown.kwh.toFixed(1) : '0.0' });
    } catch (err) {
      console.error('Token generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Copy token to clipboard ───────────────────────────────────────────────────
  const handleCopyToken = () => {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken.token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── New transaction reset ─────────────────────────────────────────────────────
  const handleNewTransaction = () => {
    setGeneratedToken(null);
    setAmount('');
    setTxnRef(generateTxnRef());
  };

  const breakdown = calculateBreakdown(amount);
  const tariff    = selectedCustomer
    ? allTariffs.find(t => t.id === selectedCustomer.tariffGroup)
    : null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="page-content">
      {/* Page header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div className="page-header-left">
          <h1 className="page-title">Vending</h1>
          <p className="page-desc">IEC 62055-41 prepaid electricity token generation</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: '1', minWidth: '240px' }}>
            <span className="search-icon">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Enter meter number or account number"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleSearch()}>
            <Search size={14} /> Search
          </button>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {SAMPLES.map(s => (
              <button
                key={s.query}
                className="btn btn-secondary btn-sm"
                onClick={() => handleSampleLoad(s.query)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {searchError && (
          <p style={{ marginTop: '8px', color: 'var(--danger)', fontSize: '0.8125rem' }}>
            {searchError}
          </p>
        )}
      </div>

      {/* Empty state */}
      {!selectedCustomer && !searchError && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'var(--accent-glow)',
            border: '1px solid rgba(0,180,216,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <Zap size={32} color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Search for a Customer
          </h3>
          <p style={{ fontSize: '0.875rem', maxWidth: '320px' }}>
            Enter a meter number or account ID to load customer details and generate an STS token.
          </p>
        </div>
      )}

      {/* Main vending layout */}
      {selectedCustomer && (
        <div className="vending-layout">

          {/* ── LEFT: Customer Info Panel ─────────────────────────────────────── */}
          <div className="customer-detail-card">
            <p className="customer-card-title">Customer Information</p>

            {/* Name + status */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: '#fff',
                }}>
                  {selectedCustomer.name}
                </span>
                <span className={`badge ${selectedCustomer.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                  {selectedCustomer.status}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                {selectedCustomer.id}
              </p>
            </div>

            {/* Fields */}
            {[
              { label: 'Phone',        value: selectedCustomer.phone,       teal: true },
              { label: 'Address',      value: selectedCustomer.address },
              { label: 'Tariff Group', value: `${selectedCustomer.tariffGroup} — ${tariff ? tariff.name : ''}` },
              { label: 'Supply Group Code', value: selectedCustomer.sgc },
              { label: 'STS Key Revision', value: selectedCustomer.keyRevision },
              { label: 'Meter Make',   value: selectedCustomer.meterMake },
              { label: 'Meter Model',  value: selectedCustomer.meterModel },
            ].map(f => (
              <div className="customer-field" key={f.label}>
                <span className="customer-field-label">{f.label}</span>
                <span
                  className="customer-field-value"
                  style={{
                    fontFamily: f.teal ? 'var(--font-body)' : 'var(--font-mono)',
                    color: f.teal ? 'var(--accent)' : 'rgba(255,255,255,0.85)',
                    cursor: f.teal ? 'pointer' : 'default',
                  }}
                >
                  {f.value}
                </span>
              </div>
            ))}

            {/* Balances */}
            <div className="customer-field">
              <span className="customer-field-label">Current Balance</span>
              <span className="customer-field-value" style={{ color: 'var(--success)' }}>
                N${selectedCustomer.balance.toFixed(2)}
              </span>
            </div>
            <div className="customer-field">
              <span className="customer-field-label">Arrears Balance</span>
              <span
                className="customer-field-value"
                style={{ color: selectedCustomer.arrears > 0 ? 'var(--warning)' : 'rgba(255,255,255,0.5)' }}
              >
                N${selectedCustomer.arrears.toFixed(2)}
              </span>
            </div>

            {/* GPS */}
            <div className="customer-field" style={{ borderBottom: 'none' }}>
              <span className="customer-field-label">GPS Location</span>
              <span className="customer-field-value" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                {selectedCustomer.gps.lat.toFixed(4)}, {selectedCustomer.gps.lng.toFixed(4)}
              </span>
            </div>
          </div>

          {/* ── RIGHT: Token Generation Panel ────────────────────────────────── */}
          <div>
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={16} color="var(--accent)" /> Generate STS Token
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    IEC 62055-41 Compliant Token Generation
                  </p>
                </div>
              </div>

              <div style={{ padding: '0 20px 20px' }}>
                {/* Transaction reference */}
                <div style={{
                  background: 'var(--content-bg)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  marginBottom: '18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Transaction Ref</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {txnRef}
                  </span>
                </div>

                {/* Purchase amount input */}
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">
                    Purchase Amount (N$) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder={`Min N$${sysConfig.minPurchase.toFixed(2)}`}
                    value={amount}
                    min={sysConfig.minPurchase}
                    step="0.01"
                    onChange={e => { setAmount(e.target.value); setGeneratedToken(null); }}
                    disabled={isGenerating}
                  />
                </div>

                {/* Quick amount buttons */}
                <div className="amount-grid" style={{ marginBottom: '18px' }}>
                  {QUICK_AMOUNTS.map(a => (
                    <button
                      key={a}
                      className={`amount-btn${parseFloat(amount) === a ? ' selected' : ''}`}
                      onClick={() => { setAmount(String(a)); setGeneratedToken(null); }}
                      disabled={isGenerating}
                    >
                      N${a}
                    </button>
                  ))}
                </div>

                {/* Transaction breakdown */}
                {breakdown && (
                  <div style={{ marginBottom: '18px' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Transaction Breakdown
                    </p>
                    <table className="transaction-breakdown">
                      <tbody>
                        <tr>
                          <td>Amount Tendered</td>
                          <td>N${breakdown.amountTendered.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>VAT (15%)</td>
                          <td style={{ color: 'var(--danger)' }}>-N${breakdown.vat.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>Fixed Charge</td>
                          <td style={{ color: 'var(--danger)' }}>-N${breakdown.fixedCharge.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>Rural Electrification Levy</td>
                          <td style={{ color: 'var(--danger)' }}>-N${breakdown.relLevy.toFixed(2)}</td>
                        </tr>
                        {breakdown.arrearsDeduction > 0 && (
                          <tr>
                            <td>Arrears Deduction</td>
                            <td style={{ color: 'var(--warning)' }}>-N${breakdown.arrearsDeduction.toFixed(2)}</td>
                          </tr>
                        )}
                        <tr>
                          <td>Net Energy Amount</td>
                          <td>N${breakdown.netEnergy.toFixed(2)}</td>
                        </tr>
                        <tr style={{ background: 'rgba(34,197,94,0.06)' }}>
                          <td style={{ color: 'var(--success)', fontWeight: 700 }}>Energy Units</td>
                          <td style={{ color: 'var(--success)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>
                            {breakdown.kwh.toFixed(1)} kWh
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Generate button */}
                <button
                  className="btn-generate"
                  onClick={handleGenerate}
                  disabled={isGenerating || !amount || parseFloat(amount) < sysConfig.minPurchase || !!generatedToken}
                >
                  {isGenerating ? (
                    <><Loader size={16} className="spinner dark" style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                  ) : (
                    <><Zap size={16} /> Generate Token</>
                  )}
                </button>
              </div>
            </div>

            {/* ── Token Result ────────────────────────────────────────────────── */}
            {(isGenerating || generatedToken) && (
              <div className="token-display-wrapper">
                <div className={`token-display${generatedToken ? ' revealed' : ''}`}>

                  {/* Loading state */}
                  {isGenerating && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '12px 0' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '3px solid rgba(0,180,216,0.2)',
                        borderTopColor: 'var(--accent)',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      <p style={{ color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.04em' }}>
                        Communicating with STS Gateway…
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                        Please wait, do not close this window
                      </p>
                    </div>
                  )}

                  {/* Success state */}
                  {generatedToken && !isGenerating && (
                    <>
                      <p className="token-label">Token Generated Successfully</p>

                      {/* Token display */}
                      <div className="token-value">
                        {generatedToken.token.split('-').map((group, i) => (
                          <span className="token-group" key={i}>{group}</span>
                        ))}
                      </div>

                      {/* Meta info */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '24px',
                        margin: '16px 0',
                        flexWrap: 'wrap',
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                            Reference
                          </p>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)' }}>
                            {txnRef}
                          </p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                            Energy Dispensed
                          </p>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 700 }}>
                            {generatedToken.kwh} kWh
                          </p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                            Amount
                          </p>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)' }}>
                            N${parseFloat(amount).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                        <button className="token-copy-btn" onClick={() => window.print()}>
                          <Printer size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                          Print Receipt
                        </button>
                        <button className="token-copy-btn" onClick={handleCopyToken}>
                          <Copy size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                          {copied ? 'Copied!' : 'Copy Token'}
                        </button>
                        <button className="token-copy-btn" onClick={() => alert('SMS feature requires backend integration.')}>
                          <Smartphone size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                          Send SMS
                        </button>
                        <button
                          className="token-copy-btn"
                          style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)' }}
                          onClick={handleNewTransaction}
                        >
                          <RefreshCw size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                          New Transaction
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spinner keyframe (injected inline to avoid dependency on global.css having it) */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes tokenReveal {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
