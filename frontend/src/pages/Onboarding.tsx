import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sprout, Tractor, ShoppingBag, ArrowRight, UserPlus, Mail, Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Onboarding: React.FC = () => {
  const { switchUser, signUp, login } = useAuth();
  const navigate = useNavigate();

  const [activeTab,     setActiveTab]     = useState<'quick' | 'register' | 'login'>('quick');
  const [registerRole,  setRegisterRole]  = useState<'farmer' | 'buyer'>('farmer');
  const [fullName,      setFullName]      = useState('');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [statusMsg,     setStatusMsg]     = useState('');

  const reset = () => { setError(''); setStatusMsg(''); };

  // ── Quick Access ──────────────────────────────────────────────────────────
  const handleQuickAccess = async (role: 'farmer' | 'buyer') => {
    setLoading(true); reset();
    setStatusMsg(role === 'farmer' ? 'Logging in as Ram Singh…' : 'Logging in as Priya Patel…');
    try {
      await switchUser(role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return setError('Please enter your full name.');
    if (!email.trim())    return setError('Please enter your email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true); reset();
    try {
      await signUp(fullName.trim(), registerRole, email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim())    return setError('Please enter your email address.');
    if (!password)        return setError('Please enter your password.');
    setLoading(true); reset();
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-12 relative overflow-hidden">

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <Sprout className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="mt-6 text-3xl font-black tracking-tight text-gray-900">Access AgriTrust</h2>
          <p className="mt-1.5 text-xs text-gray-400">Secure agricultural commerce powered by Cardano</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm p-8 shadow-2xl space-y-6">

          {/* Tabs */}
          <div className="flex border-b border-gray-200 gap-1">
            {(['quick', 'login', 'register'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); reset(); }}
                className={`pb-2.5 px-1 text-[11px] font-bold transition-all border-b-2 capitalize ${
                  activeTab === tab
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab === 'quick' ? 'Quick Access' : tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Error / Status */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-medium">{error}</div>
          )}
          {statusMsg && !error && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-medium flex items-center gap-2">
              <div className="h-3 w-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              {statusMsg}
            </div>
          )}

          {/* ── Quick Access ─────────────────────────────────────────────── */}
          {activeTab === 'quick' && (
            <div className="space-y-3">
              <p className="text-[10px] text-gray-400 text-center mb-4">
                One-click access with pre-configured demo identities
              </p>

              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => handleQuickAccess('farmer')}
                disabled={loading}
                className="w-full flex items-center justify-between p-5 rounded-xl border border-gray-200 bg-gray-50 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-left transition-all duration-200 disabled:opacity-60"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <Tractor className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Continue as Farmer</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Ram Singh · Punjab Farms · 97 Trust</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => handleQuickAccess('buyer')}
                disabled={loading}
                className="w-full flex items-center justify-between p-5 rounded-xl border border-gray-200 bg-gray-50 hover:border-blue-500/50 hover:bg-blue-500/5 text-left transition-all duration-200 disabled:opacity-60"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Continue as Buyer</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Priya Patel · Organic Foods Ltd · 99 Trust</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </motion.button>

              <p className="text-[10px] text-gray-500 text-center pt-1">
                First access auto-creates accounts & seeds marketplace data
              </p>
            </div>
          )}

          {/* ── Sign In ───────────────────────────────────────────────────── */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-200 bg-gray-100 pl-9 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-200 bg-gray-100 pl-9 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-xs font-bold text-gray-900 shadow-lg hover:opacity-90 transition disabled:opacity-60"
              >
                {loading ? <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                Sign In
              </button>
            </form>
          )}

          {/* ── Create Account ────────────────────────────────────────────── */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Gurpreet Singh"
                    className="w-full rounded-lg border border-gray-200 bg-gray-100 pl-9 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-200 bg-gray-100 pl-9 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full rounded-lg border border-gray-200 bg-gray-100 pl-9 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['farmer', 'buyer'] as const).map(r => (
                    <button
                      key={r} type="button" onClick={() => setRegisterRole(r)}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold transition ${
                        registerRole === r
                          ? r === 'farmer' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                                           : 'bg-blue-500/10 text-blue-400 border-blue-500/40'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {r === 'farmer' ? <Tractor className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-xs font-bold text-gray-900 shadow-lg hover:opacity-90 transition disabled:opacity-60"
              >
                {loading
                  ? <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <UserPlus className="h-4 w-4" />
                }
                Register &amp; Connect Wallet
              </button>
            </form>
          )}

          <p className="text-[10px] text-gray-500 text-center pt-1 font-mono border-t border-gray-200/60">
            Cardano Preview Testnet · 10,000 ₳ starting balance
          </p>
        </div>
      </div>
    </div>
  );
};
export default Onboarding;
