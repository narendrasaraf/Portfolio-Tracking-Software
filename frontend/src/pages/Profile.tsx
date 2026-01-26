import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Key, LogOut, Mail, Fingerprint } from 'lucide-react';
import clsx from 'clsx';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const Profile = () => {
    const { user, logout } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await axios.post(`${API_URL}/auth/change-password`,
                { currentPassword, newPassword },
                { withCredentials: true }
            );
            setMessage({ type: 'success', text: 'Identity credential updated.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Credential update failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div>
                <h2 className="heading-1">Control Center</h2>
                <p className="text-slate-400 font-medium">Manage your identity and high-level security permissions.</p>
            </div>

            <div className="grid gap-10 lg:grid-cols-12">
                {/* User Info Card */}
                <div className="lg:col-span-5 glass-card p-10 flex flex-col h-fit">
                    <div className="flex items-center gap-6 mb-10">
                        <div className="h-20 w-20 rounded-3xl bg-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                            {user?.email[0].toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Identity Profile</h2>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Verified User</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="glass-card bg-white/[0.02] p-5 shadow-none border-white/5 flex items-center gap-4">
                            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                                <Mail size={18} />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-0.5">Primary Link</span>
                                <span className="text-white font-bold">{user?.email}</span>
                            </div>
                        </div>

                        <div className="glass-card bg-white/[0.02] p-5 shadow-none border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-0.5">Link Status</span>
                                    <span className="text-emerald-400 font-bold tracking-tight">ENCRYPTED & ACTIVE</span>
                                </div>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="btn-secondary mt-10 w-full flex items-center justify-center gap-3 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white"
                    >
                        <LogOut size={20} />
                        <span>Sever Session</span>
                    </button>
                </div>

                {/* Change Password Card */}
                <div className="lg:col-span-7 glass-card p-10">
                    <div className="flex items-center gap-3 mb-10 text-blue-400">
                        <Key size={24} />
                        <h2 className="text-2xl font-black text-white tracking-tight">Security Credentials</h2>
                    </div>

                    {message.text && (
                        <div className={clsx(
                            "mb-8 p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300",
                            message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        )}>
                            <Fingerprint size={20} />
                            <span className="text-sm font-bold uppercase tracking-wide">{message.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Current Password Token</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="input-field h-14"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">New Security Token</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="input-field h-14"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Confirm Token</label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input-field h-14"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full h-14 flex items-center justify-center gap-3 text-lg"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <ShieldCheck size={20} />
                                )}
                                <span>{loading ? 'Processing...' : 'Recalibrate Credentials'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
