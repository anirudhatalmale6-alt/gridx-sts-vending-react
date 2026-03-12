import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Zap, Users, Receipt, Store,
  Gauge, BarChart3, Settings, LogOut,
  Wrench, Package, MapPin, Radio,
} from 'lucide-react';

const navItems = [
  {
    section: 'MAIN',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/vending', label: 'Vend Token', icon: Zap, live: true },
    ],
  },
  {
    section: 'MANAGEMENT',
    items: [
      { path: '/customers', label: 'Customers', icon: Users },
      { path: '/transactions', label: 'Transactions', icon: Receipt },
      { path: '/vendors', label: 'Vendors', icon: Store },
    ],
  },
  {
    section: 'OPERATIONS',
    items: [
      { path: '/engineering', label: 'Engineering', icon: Wrench },
      { path: '/batches', label: 'Batches', icon: Package },
      { path: '/map', label: 'Meter Map', icon: MapPin },
      { path: '/meter-monitor', label: 'Meter Monitor', icon: Radio },
    ],
  },
  {
    section: 'CONFIGURATION',
    items: [
      { path: '/tariffs', label: 'Tariff Management', icon: Gauge },
      { path: '/reports', label: 'Reports', icon: BarChart3 },
      { path: '/admin', label: 'System Admin', icon: Settings },
    ],
  },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      setClock(
        new Date().toLocaleString('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2) || 'SA';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-text">
            <span className="brand-grid">GRID</span>
            <span className="brand-x">x</span>
          </div>
          <div className="brand-tagline">STS VENDING PLATFORM</div>
        </div>

        <div className="sidebar-client">
          <strong>NamPower</strong>
          <span>Namibia Power Corporation • 3,000 Meters</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div key={section.section} className="nav-section">
              <div className="nav-section-label">{section.section}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `nav-item${isActive ? ' active' : ''}`
                  }
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                  {item.live && <span className="live-badge">LIVE</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'System Admin'}</div>
            <div className="user-role">{user?.role || 'Administrator'}</div>
          </div>
          <button className="btn-icon" onClick={logout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-left" />
          <div className="header-right">
            <div className="status-pill online">
              <span className="status-dot" />
              STS Gateway: Connected
            </div>
            <div className="status-pill online">
              <span className="status-dot" />
              Server: Online
            </div>
            <div className="header-clock mono">{clock}</div>
          </div>
        </header>

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
