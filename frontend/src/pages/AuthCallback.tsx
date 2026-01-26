import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const { checkAuth } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('token', token);
            checkAuth().then(() => {
                navigate('/');
            });
        } else {
            navigate('/login');
        }
    }, [searchParams, checkAuth, navigate]);

    return (
        <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
            <div className="text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
                <p className="mt-4 text-gray-400">Completing login...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
