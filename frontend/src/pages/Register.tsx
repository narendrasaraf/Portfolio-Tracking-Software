import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1611974717482-58a00f244a3d?auto=format&fit=crop&q=80&w=2670';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            await axios.post(`${API_URL}/auth/register`, { email, password });
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API_URL}/auth/google`;
    };

    return (
        <div
            className="relative flex min-h-screen w-full items-center justify-center p-4"
            style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url(${BACKGROUND_IMAGE})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
            }}
        >
            <div className="w-full max-w-[420px] animate-in fade-in zoom-in duration-500">
                {/* Brand Header */}
                <div className="mb-8 text-center flex flex-col items-center">
                    <div className="h-20 w-20 mb-4">
                        <img src="/assets/logo.svg" alt="InvestView Icon" className="h-full w-full" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">
                        InvestView
                    </h1>
                    <p className="mt-2 text-lg font-medium text-blue-400/90 drop-shadow-md">
                        Track. Analyze. Grow.
                    </p>
                </div>

                {/* Auth Card */}
                <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="mb-6 text-center">
                        <h2 className="text-xl font-semibold text-white">Create Account</h2>
                        <p className="text-sm text-gray-400">Join InvestView today</p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 pl-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 transition-all focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                placeholder="name@example.com"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 pl-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 transition-all focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 pl-1">Confirm Password</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 transition-all focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-blue-500/40"
                        >
                            Register
                        </button>
                    </form>

                    <div className="relative my-7">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-transparent px-3 font-medium uppercase tracking-widest text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/10 active:scale-[0.98]"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Sign up with Google
                    </button>

                    <p className="mt-7 text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-bold text-blue-400 hover:text-blue-300 transition-colors">
                            Sign In
                        </Link>
                    </p>
                </div>

                {/* Disclaimer */}
                <p className="mt-8 text-center text-[11px] leading-relaxed text-gray-500/80">
                    Disclaimer: This app is for personal tracking only. We are not SEBI registered.
                    No investment advice is provided.
                </p>
            </div>
        </div>
    );
};

export default Register;
