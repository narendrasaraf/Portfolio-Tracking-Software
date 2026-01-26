import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import AddAsset from './pages/AddAsset';
import EditAsset from './pages/EditAsset';
import SellAsset from './pages/SellAsset';
import History from './pages/History';
import AssetDetails from './pages/AssetDetails';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Insights from './pages/Insights';
import Profile from './pages/Profile';
import { useAuth } from './context/AuthContext';
import Splash from './components/Splash';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-gray-900">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
    );
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};

function App() {
    return (
        <>
            <Splash />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth-callback" element={<AuthCallback />} />

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
                    <Route path="profile" element={<Profile />} />
                </Route>

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </>
    );
}

export default App;
