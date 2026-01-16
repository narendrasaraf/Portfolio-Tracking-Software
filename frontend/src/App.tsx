import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PasswordGate from './pages/PasswordGate';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import AddAsset from './pages/AddAsset';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
    if (!isAuthenticated) return <PasswordGate />;
    return children;
};

import EditAsset from './pages/EditAsset';
import SellAsset from './pages/SellAsset';
import History from './pages/History';
import AssetDetails from './pages/AssetDetails';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Insights from './pages/Insights';

function App() {
    return (
        <Routes>
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="assets" element={<Assets />} />
                <Route path="assets/:id" element={<AssetDetails />} />
                <Route path="add" element={<AddAsset />} />
                <Route path="edit/:id" element={<EditAsset />} />
                <Route path="sell/:id" element={<SellAsset />} />
                <Route path="history" element={<History />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="insights" element={<Insights />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default App;
