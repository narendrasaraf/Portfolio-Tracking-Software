import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const PasswordGate = () => {
    const { login } = useAuth();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'Narendra16@') {
            login();
        } else {
            setError('Incorrect password');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">Portfolio Tracker</h2>
                <p className="text-gray-500 text-center mb-6">Enter password to access</p>
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            autoFocus
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-4 px-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg shadow-blue-200"
                    >
                        Access
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PasswordGate;
