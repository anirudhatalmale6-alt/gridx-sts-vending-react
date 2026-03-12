import { useState } from 'react';
import { Wrench, Zap, Key, RefreshCw, Gift, Loader, Copy } from 'lucide-react';
import { engineeringService } from '../services/api';

const TOKEN_TYPES = [
  { value: 'set-maximum-power', label: 'Set Maximum Power Limit' },
  { value: 'clear-credit', label: 'Clear Credit' },
  { value: 'set-tariff-rate', label: 'Set Tariff Rate' },
  { value: 'decoder-key-change', label: 'Decoder Key Change' },
  { value: 'clear-tamper', label: 'Clear Tamper Condition' },
  { value: 'meter-test', label: 'Meter Test Display' },
];

function TokenResult({ token, label, onCopy, copied }) {
  if (!token) return null;
  return (
    <div style={{
      marginTop: '20px',
      background: 'linear-gradient(135deg, rgba(0,180,216,0.08), rgba(34,197,94,0.06))',
      border: '1px solid rgba(0,180,216,0.25)',
      borderRadius: '10px',
      padding: '24px',
      textAlign: 'center',
    }}>
      <p style={{
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--accent)',
        fontWeight: 600,
        marginBottom: '12px',
      }}>
        {label || 'Token Generated Successfully'}
      </p>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '1.5rem',
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: '#fff',
        marginBottom: '16px',
        wordBreak: 'break-all',
      }}>
        {typeof token === 'string' ? token.replace(/(.{4})/g, '$1 ').trim() : token}
      </div>
      <button
        className="btn btn-secondary"
        onClick={() => {
          navigator.clipboard.writeText(token);
          if (onCopy) onCopy();
        }}
        style={{ fontSize: '0.8125rem' }}
      >
        <Copy size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
        {copied ? 'Copied!' : 'Copy Token'}
      </button>
    </div>
  );
}

export default function Engineering() {
  // ---- Engineering Token state ----
  const [engMeter, setEngMeter] = useState('');
  const [engType, setEngType] = useState(TOKEN_TYPES[0].value);
  const [engParams, setEngParams] = useState('');
  const [engResult, setEngResult] = useState(null);
  const [engLoading, setEngLoading] = useState(false);
  const [engError, setEngError] = useState('');
  const [engCopied, setEngCopied] = useState(false);

  // ---- Free Units state ----
  const [freeMeter, setFreeMeter] = useState('');
  const [freeKwh, setFreeKwh] = useState('');
  const [freeReason, setFreeReason] = useState('');
  const [freeResult, setFreeResult] = useState(null);
  const [freeLoading, setFreeLoading] = useState(false);
  const [freeError, setFreeError] = useState('');
  const [freeCopied, setFreeCopied] = useState(false);

  // ---- Key Change state ----
  const [keyMeter, setKeyMeter] = useState('');
  const [keyRevision, setKeyRevision] = useState('');
  const [keyResult, setKeyResult] = useState(null);
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);

  // ---- Replacement Token state ----
  const [replRef, setReplRef] = useState('');
  const [replResult, setReplResult] = useState(null);
  const [replLoading, setReplLoading] = useState(false);
  const [replError, setReplError] = useState('');
  const [replCopied, setReplCopied] = useState(false);

  // ---- Handlers ----
  const handleEngGenerate = async () => {
    if (!engMeter.trim()) return;
    setEngLoading(true);
    setEngError('');
    setEngResult(null);
    try {
      let params = {};
      if (engParams.trim()) {
        try { params = JSON.parse(engParams); } catch { params = { raw: engParams }; }
      }
      const res = await engineeringService.generateEngineeringToken(engMeter.trim(), engType, params);
      setEngResult(res.data || res);
    } catch (err) {
      setEngError(err.message || 'Failed to generate engineering token');
    } finally {
      setEngLoading(false);
    }
  };

  const handleFreeGenerate = async () => {
    if (!freeMeter.trim() || !freeKwh) return;
    setFreeLoading(true);
    setFreeError('');
    setFreeResult(null);
    try {
      const res = await engineeringService.generateFreeUnits(freeMeter.trim(), Number(freeKwh), freeReason);
      setFreeResult(res.data || res);
    } catch (err) {
      setFreeError(err.message || 'Failed to generate free units token');
    } finally {
      setFreeLoading(false);
    }
  };

  const handleKeyGenerate = async () => {
    if (!keyMeter.trim() || !keyRevision) return;
    setKeyLoading(true);
    setKeyError('');
    setKeyResult(null);
    try {
      const res = await engineeringService.generateKeyChangeToken(keyMeter.trim(), Number(keyRevision));
      setKeyResult(res.data || res);
    } catch (err) {
      setKeyError(err.message || 'Failed to generate key change token');
    } finally {
      setKeyLoading(false);
    }
  };

  const handleReplGenerate = async () => {
    if (!replRef.trim()) return;
    setReplLoading(true);
    setReplError('');
    setReplResult(null);
    try {
      const res = await engineeringService.generateReplacementToken(replRef.trim());
      setReplResult(res.data || res);
    } catch (err) {
      setReplError(err.message || 'Failed to generate replacement token');
    } finally {
      setReplLoading(false);
    }
  };

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="page-header-left">
          <h1 className="page-title">Engineering Tokens</h1>
          <p className="page-desc">
            Generate STS engineering, free-units, key-change, and replacement tokens
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>

        {/* ── Engineering Token Card ──────────────────────── */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 8,
              background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Wrench size={18} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Engineering Token</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Set power limits, clear tampers, test displays
              </p>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Meter Number <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 01234567890"
              value={engMeter}
              onChange={e => setEngMeter(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Token Type <span className="required">*</span></label>
            <select className="form-input" value={engType} onChange={e => setEngType(e.target.value)}>
              {TOKEN_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Parameters (optional JSON)</label>
            <input
              type="text"
              className="form-input"
              placeholder='e.g. {"maxPower": 60}'
              value={engParams}
              onChange={e => setEngParams(e.target.value)}
            />
          </div>

          {engError && (
            <p style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: '10px' }}>{engError}</p>
          )}

          <button
            className="btn btn-primary"
            onClick={handleEngGenerate}
            disabled={engLoading || !engMeter.trim()}
            style={{ width: '100%' }}
          >
            {engLoading ? (
              <><Loader size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} /> Generating...</>
            ) : (
              <><Wrench size={14} style={{ marginRight: 6 }} /> Generate Engineering Token</>
            )}
          </button>

          <TokenResult
            token={engResult?.token}
            label="Engineering Token Generated"
            onCopy={() => { setEngCopied(true); setTimeout(() => setEngCopied(false), 2000); }}
            copied={engCopied}
          />
        </div>

        {/* ── Free Units Card ────────────────────────────── */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 8,
              background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Gift size={18} color="var(--success)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Free Units</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Issue complimentary kWh to a meter
              </p>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Meter Number <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 01234567890"
              value={freeMeter}
              onChange={e => setFreeMeter(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">kWh to Issue <span className="required">*</span></label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 50"
              min="1"
              value={freeKwh}
              onChange={e => setFreeKwh(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Reason</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Service restoration compensation"
              value={freeReason}
              onChange={e => setFreeReason(e.target.value)}
            />
          </div>

          {freeError && (
            <p style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: '10px' }}>{freeError}</p>
          )}

          <button
            className="btn btn-primary"
            onClick={handleFreeGenerate}
            disabled={freeLoading || !freeMeter.trim() || !freeKwh}
            style={{ width: '100%' }}
          >
            {freeLoading ? (
              <><Loader size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} /> Generating...</>
            ) : (
              <><Gift size={14} style={{ marginRight: 6 }} /> Generate Free Units Token</>
            )}
          </button>

          <TokenResult
            token={freeResult?.token}
            label="Free Units Token Generated"
            onCopy={() => { setFreeCopied(true); setTimeout(() => setFreeCopied(false), 2000); }}
            copied={freeCopied}
          />
        </div>

        {/* ── Key Change Card ────────────────────────────── */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 8,
              background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Key size={18} color="var(--warning)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Key Change Token</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Rotate STS decoder key revision on a meter
              </p>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Meter Number <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 01234567890"
              value={keyMeter}
              onChange={e => setKeyMeter(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">New Key Revision <span className="required">*</span></label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 2"
              min="1"
              value={keyRevision}
              onChange={e => setKeyRevision(e.target.value)}
            />
          </div>

          {keyError && (
            <p style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: '10px' }}>{keyError}</p>
          )}

          <button
            className="btn btn-primary"
            onClick={handleKeyGenerate}
            disabled={keyLoading || !keyMeter.trim() || !keyRevision}
            style={{ width: '100%' }}
          >
            {keyLoading ? (
              <><Loader size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} /> Generating...</>
            ) : (
              <><Key size={14} style={{ marginRight: 6 }} /> Generate Key Change Token</>
            )}
          </button>

          <TokenResult
            token={keyResult?.token}
            label="Key Change Token Generated"
            onCopy={() => { setKeyCopied(true); setTimeout(() => setKeyCopied(false), 2000); }}
            copied={keyCopied}
          />
        </div>

        {/* ── Replacement Token Card ──────────────────────── */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 8,
              background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <RefreshCw size={18} color="#8b5cf6" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Replacement Token</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Re-issue a previously generated token by reference
              </p>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Original Transaction Reference <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. TXN-1710000000000"
              value={replRef}
              onChange={e => setReplRef(e.target.value)}
            />
          </div>

          {replError && (
            <p style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: '10px' }}>{replError}</p>
          )}

          <button
            className="btn btn-primary"
            onClick={handleReplGenerate}
            disabled={replLoading || !replRef.trim()}
            style={{ width: '100%' }}
          >
            {replLoading ? (
              <><Loader size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} /> Generating...</>
            ) : (
              <><RefreshCw size={14} style={{ marginRight: 6 }} /> Generate Replacement Token</>
            )}
          </button>

          <TokenResult
            token={replResult?.token}
            label="Replacement Token Generated"
            onCopy={() => { setReplCopied(true); setTimeout(() => setReplCopied(false), 2000); }}
            copied={replCopied}
          />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
