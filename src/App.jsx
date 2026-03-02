import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/Layout';
import OverviewPage from './pages/OverviewPage';
import DatabasesPage from './pages/DatabasesPage';
import CollectionsPage from './pages/CollectionsPage';
import RecordsPage from './pages/RecordsPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { connected } = useAuth();
  return connected ? children : <Navigate to="/settings" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/settings" element={<SettingsPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="databases" element={<DatabasesPage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="records" element={<RecordsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
