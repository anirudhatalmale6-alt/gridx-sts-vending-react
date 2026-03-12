import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// Login — Full-screen dark entry page for GRIDx STS Vending System
// ---------------------------------------------------------------------------
export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Subtle animated grid overlay */}
      <div style={styles.gridOverlay} aria-hidden="true" />
      {/* Radial glow behind card */}
      <div style={styles.glow} aria-hidden="true" />

      <form style={styles.card} onSubmit={handleLogin} noValidate>

        {/* ---- Brand / Logo ---- */}
        <div style={styles.logoBlock}>
          <div style={styles.brandName}>
            <span style={styles.brandGrid}>GRID</span>
            <span style={styles.brandX}>x</span>
          </div>
          <div style={styles.tagline}>BY PULSAR ELECTRONIC SOLUTIONS</div>
          <div style={styles.procurementRef}>
            Procurement No:&nbsp;<strong style={styles.procurementNum}>NCS/ONB/NPWR-03/2026</strong>
          </div>
        </div>

        {/* ---- System Info Banner ---- */}
        <div style={styles.infoBanner}>
          <p style={styles.infoBannerTitle}>NamPower STS Prepaid Electricity Vending System</p>
          <p style={styles.infoBannerSub}>
            IEC 62055-41 Compliant&nbsp;&nbsp;|&nbsp;&nbsp;Web-Based&nbsp;&nbsp;|&nbsp;&nbsp;24/7 Real-Time Operations
          </p>
        </div>

        {/* ---- Divider ---- */}
        <div style={styles.divider} />

        {/* ---- Form Heading ---- */}
        <p style={styles.formHeading}>OPERATOR SIGN IN</p>

        {/* ---- Username ---- */}
        <div style={styles.fieldGroup}>
          <label style={styles.fieldLabel} htmlFor="lp-username">USERNAME</label>
          <input
            id="lp-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            style={styles.input}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => Object.assign(e.target.style, styles.input)}
            disabled={loading}
            required
          />
        </div>

        {/* ---- Password ---- */}
        <div style={styles.fieldGroup}>
          <label style={styles.fieldLabel} htmlFor="lp-password">PASSWORD</label>
          <input
            id="lp-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={styles.input}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => Object.assign(e.target.style, styles.input)}
            disabled={loading}
            required
          />
        </div>

        {/* ---- Error Message ---- */}
        {error && (
          <div style={styles.errorBox} role="alert">
            <span style={styles.errorIcon}>!</span>
            {error}
          </div>
        )}

        {/* ---- Submit ---- */}
        <button
          type="submit"
          style={loading ? { ...styles.submitBtn, ...styles.submitBtnDisabled } : styles.submitBtn}
          disabled={loading}
        >
          {loading ? (
            <>
              <span style={styles.spinner} />
              Authenticating...
            </>
          ) : (
            <>
              <span style={styles.boltIcon}>&#9889;</span>
              Sign In to Vending System
            </>
          )}
        </button>

        {/* ---- Compliance Badges ---- */}
        <div style={styles.badgeRow}>
          <span style={styles.badge}>&#10003;&nbsp;IEC 62055-41</span>
          <span style={styles.badge}>&#10003;&nbsp;STS Compliant</span>
          <span style={styles.badge}>&#128274;&nbsp;SSL Secured</span>
        </div>

        {/* ---- Footer ---- */}
        <div style={styles.cardFooter}>
          <p style={styles.cardFooterMain}>
            GRIDx Vending Platform v3.2.1&nbsp;&bull;&nbsp;&copy; 2026 Pulsar Electronic Solutions
          </p>
          <p style={styles.cardFooterSub}>
            All access is logged and monitored. Unauthorized access is prohibited.
          </p>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline styles — isolated to Login so they don't pollute global scope
// ---------------------------------------------------------------------------
const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
    background: 'linear-gradient(135deg, #040d1a 0%, #071428 40%, #0a1e3a 70%, #060f20 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
  },

  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(0, 180, 216, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 180, 216, 0.04) 1px, transparent 1px)
    `,
    backgroundSize: '48px 48px',
    pointerEvents: 'none',
    zIndex: 0,
  },

  glow: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '400px',
    background: 'radial-gradient(ellipse at center, rgba(0, 180, 216, 0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '460px',
    background: 'rgba(10, 22, 48, 0.82)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(0, 180, 216, 0.18)',
    borderRadius: '16px',
    padding: '40px 36px',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0px',
  },

  // Brand
  logoBlock: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  brandName: {
    fontSize: '3rem',
    fontWeight: 800,
    letterSpacing: '-1px',
    lineHeight: 1,
    marginBottom: '6px',
  },
  brandGrid: {
    background: 'linear-gradient(135deg, #00b4d8 0%, #00e5ff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  brandX: {
    color: '#ffffff',
    WebkitTextFillColor: '#ffffff',
  },
  tagline: {
    fontSize: '0.625rem',
    fontWeight: 700,
    letterSpacing: '2.5px',
    color: 'rgba(0, 180, 216, 0.75)',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  procurementRef: {
    fontSize: '0.72rem',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.3px',
  },
  procurementNum: {
    color: 'rgba(255,255,255,0.65)',
    fontWeight: 600,
  },

  // Info Banner
  infoBanner: {
    background: 'rgba(37, 99, 235, 0.18)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    textAlign: 'center',
    marginBottom: '20px',
  },
  infoBannerTitle: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#93c5fd',
    letterSpacing: '0.3px',
    marginBottom: '4px',
  },
  infoBannerSub: {
    fontSize: '0.7rem',
    color: 'rgba(147, 197, 253, 0.7)',
    letterSpacing: '0.2px',
  },

  // Divider
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(0,180,216,0.2), transparent)',
    marginBottom: '20px',
  },

  // Form
  formHeading: {
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '2px',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginBottom: '18px',
  },

  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '14px',
  },
  fieldLabel: {
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '1.5px',
    color: 'rgba(0, 180, 216, 0.75)',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  inputFocus: {
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(0, 180, 216, 0.07)',
    border: '1px solid rgba(0, 180, 216, 0.5)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '0.9rem',
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(0, 180, 216, 0.12)',
    boxSizing: 'border-box',
  },

  // Error
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '14px',
    fontSize: '0.82rem',
    color: '#fca5a5',
  },
  errorIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: 'rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    fontSize: '0.75rem',
    fontWeight: 700,
    flexShrink: 0,
  },

  // Submit button
  submitBtn: {
    width: '100%',
    padding: '13px 20px',
    background: 'linear-gradient(135deg, #0096c7 0%, #00b4d8 50%, #48cae4 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '0.9rem',
    fontWeight: 700,
    letterSpacing: '0.5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '20px',
    boxShadow: '0 4px 20px rgba(0, 180, 216, 0.35)',
    transition: 'opacity 0.2s, transform 0.1s',
    fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  boltIcon: {
    fontSize: '1.05rem',
  },
  spinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  },

  // Badges
  badgeRow: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '24px',
  },
  badge: {
    padding: '4px 12px',
    border: '1px solid rgba(0, 180, 216, 0.3)',
    borderRadius: '20px',
    fontSize: '0.68rem',
    fontWeight: 600,
    color: 'rgba(0, 180, 216, 0.8)',
    letterSpacing: '0.4px',
    whiteSpace: 'nowrap',
  },

  // Footer
  cardFooter: {
    textAlign: 'center',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    paddingTop: '18px',
  },
  cardFooterMain: {
    fontSize: '0.72rem',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '4px',
  },
  cardFooterSub: {
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.22)',
    lineHeight: 1.5,
  },
};
