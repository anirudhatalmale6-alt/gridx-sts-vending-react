import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vending from './pages/Vending';
import Customers from './pages/Customers';
import Transactions from './pages/Transactions';
import Vendors from './pages/Vendors';
import Tariffs from './pages/Tariffs';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import Engineering from './pages/Engineering';
import Batches from './pages/Batches';
import Map from './pages/Map';
import MeterMonitor from './pages/MeterMonitor';

function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vending" element={<Vending />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/tariffs" element={<Tariffs />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/engineering" element={<Engineering />} />
        <Route path="/batches" element={<Batches />} />
        <Route path="/map" element={<Map />} />
        <Route path="/meter-monitor" element={<MeterMonitor />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

export default App;
