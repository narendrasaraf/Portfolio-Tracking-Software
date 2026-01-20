import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PasswordGate = () => {
    const { login } = useAuth();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/login', { password });
            if (response.data.success) {
                login();
            }
        } catch (err) {
            setError('Incorrect password');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 p-4 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl dark:shadow-2xl w-full max-w-md border border-gray-100 dark:border-slate-800 transition-colors duration-300">
                <h2 className="text-3xl font-bold mb-2 text-center text-gray-800 dark:text-white">Portfolio Tracker</h2>
                <p className="text-gray-500 dark:text-slate-400 text-center mb-6">Enter password to access</p>
                {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm text-center animate-shake">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            className="w-full p-4 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 transition-all duration-200"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            autoFocus
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 dark:bg-blue-600 text-white py-4 px-4 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-500 transition-all duration-200 font-semibold text-lg shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
                    >
                        Access
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PasswordGate;
