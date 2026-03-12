import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { customers } from '../data/mockData';
import { Search, Users, Zap, Edit, Clock, MessageSquare, Ban } from 'lucide-react';

const AREAS = ['All', 'Grunau', 'Noordoewer', 'Groot Aub', 'Dordabis', 'Seeis', 'Stampriet'];
const STATUSES = ['All', 'Active', 'Arrears', 'Suspended'];

function statusBadgeClass(status) {
  switch (status) {
    case 'Active':    return 'badge badge-success';
    case 'Arrears':   return 'badge badge-warning';
    case 'Suspended': return 'badge badge-danger';
    default:          return 'badge badge-neutral';
  }
}

export default function Customers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const filtered = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.meterNo.includes(search) ||
        c.id.toLowerCase().includes(search.toLowerCase());
      const matchArea   = areaFilter   === 'All' || c.area   === areaFilter;
      const matchStatus = statusFilter  === 'All' || c.status === statusFilter;
      return matchSearch && matchArea && matchStatus;
    });
  }, [search, areaFilter, statusFilter]);

  const totalArrears = customers.reduce((sum, c) => sum + c.arrears, 0);

  const handleVend = (customer, e) => {
    e.stopPropagation();
    navigate('/vending', { state: { customer } });
  };

  const handleRowClick = (customer) => {
    setSelectedCustomer(prev => prev?.id === customer.id ? null : customer);
  };

  return (
    <div className="customers-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Customer Management</h1>
          <p className="page-desc">Register, search and manage STS prepaid meter accounts</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary btn-sm">
            <Users size={15} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-bar">
        <div className="search-bar" style={{ flex: '1 1 260px', maxWidth: '360px' }}>
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search name, account ID or meter number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="select-wrapper">
          <select
            className="form-select"
            value={areaFilter}
            onChange={e => setAreaFilter(e.target.value)}
            style={{ width: '160px' }}
          >
            {AREAS.map(a => (
              <option key={a} value={a}>{a === 'All' ? 'All Areas' : a}</option>
            ))}
          </select>
        </div>

        <div className="select-wrapper">
          <select
            className="form-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: '140px' }}
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main layout: table + optional detail panel */}
      <div className={`customers-layout${selectedCustomer ? ' with-panel' : ''}`}>
        {/* Customer Registry Table */}
        <div className="table-container">
          <div className="card-header" style={{ padding: '14px 16px' }}>
            <div className="card-title">
              <Users size={16} />
              Customer Registry
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8125rem', marginLeft: 4 }}>
                3,000 registered meters &mdash; showing 1&ndash;{filtered.length}
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Total Arrears:&nbsp;
              <span style={{ color: totalArrears > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                N${totalArrears.toFixed(2)}
              </span>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Customer Name</th>
                <th>Meter No.</th>
                <th>Area</th>
                <th>Tariff</th>
                <th>Arrears</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No customers match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(customer => (
                  <tr
                    key={customer.id}
                    onClick={() => handleRowClick(customer)}
                    style={{
                      cursor: 'pointer',
                      background: selectedCustomer?.id === customer.id ? 'rgba(0,180,216,0.05)' : undefined,
                      outline: selectedCustomer?.id === customer.id ? '2px solid rgba(0,180,216,0.25)' : undefined,
                      outlineOffset: '-2px',
                    }}
                  >
                    <td className="cell-mono" style={{ fontSize: '0.8rem' }}>{customer.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{customer.name}</td>
                    <td className="cell-mono">{customer.meterNo}</td>
                    <td>{customer.area}</td>
                    <td>
                      <span className="badge badge-teal">{customer.tariffGroup}</span>
                    </td>
                    <td className="cell-mono" style={{ color: customer.arrears > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {customer.arrears > 0 ? `N$${customer.arrears.toFixed(2)}` : '—'}
                    </td>
                    <td>
                      <span className={statusBadgeClass(customer.status)}>{customer.status}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={e => handleVend(customer, e)}
                          title="Vend token"
                        >
                          <Zap size={13} />
                          Vend
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right Detail Panel */}
        {selectedCustomer && (
          <aside className="customer-detail-panel">
            <div className="customer-detail-card" style={{ height: '100%' }}>
              <div className="customer-card-title">SELECTED CUSTOMER</div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                  {selectedCustomer.name}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                  {selectedCustomer.id}
                </div>
                <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--accent)', letterSpacing: '0.05em' }}>
                  {selectedCustomer.meterNo}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                {[
                  { label: 'ID Number',         value: 'N/A' },
                  { label: 'Phone',              value: selectedCustomer.phone },
                  { label: 'Tariff Group',       value: selectedCustomer.tariffGroup },
                  { label: 'Supply Group Code',  value: selectedCustomer.sgc },
                  { label: 'Key Revision No.',   value: selectedCustomer.keyRevision },
                  { label: 'Token Technology',   value: 'STS' },
                  { label: 'Meter Make',         value: selectedCustomer.meterMake },
                  { label: 'Meter Model',        value: selectedCustomer.meterModel },
                  { label: 'GPS',                value: `${selectedCustomer.gps.lat}, ${selectedCustomer.gps.lng}` },
                ].map(({ label, value }) => (
                  <div className="customer-field" key={label}>
                    <span className="customer-field-label">{label}</span>
                    <span className="customer-field-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={e => handleVend(selectedCustomer, e)}
                >
                  <Zap size={14} /> Vend Token
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'center' }}>
                    <Edit size={13} /> Edit
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'center' }}>
                    <Clock size={13} /> History
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'center' }}>
                    <MessageSquare size={13} /> SMS
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{
                      justifyContent: 'center',
                      border: '1.5px solid var(--danger)',
                      color: 'var(--danger)',
                      background: 'transparent',
                    }}
                  >
                    <Ban size={13} /> Suspend
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      <style>{`
        .filter-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          padding: 14px 16px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          margin-bottom: 20px;
          box-shadow: var(--shadow-sm);
        }
        .customers-layout {
          display: block;
        }
        .customers-layout.with-panel {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 20px;
          align-items: start;
        }
        .customer-detail-panel {
          position: sticky;
          top: 88px;
        }
        @media (max-width: 1100px) {
          .customers-layout.with-panel {
            grid-template-columns: 1fr;
          }
          .customer-detail-panel {
            position: static;
          }
        }
      `}</style>
    </div>
  );
}
