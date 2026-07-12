import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sprout, ShieldCheck, Tractor, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Onboarding: React.FC = () => {
  const { signUp, isDemoMode, seedDemoData } = useAuth();
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'farmer' | 'buyer'>('farmer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      await signUp(fullName.trim(), role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Onboarding failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        
        {/* Logo and pitch */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 glow-emerald">
            <Sprout className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-white">
            Access AgriTrust
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Create your decentralized marketplace identity
          </p>
        </div>

        {/* Auth form card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/15 p-3.5 text-xs text-red-400 font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Full Name / Business Title
              </label>
              <input
                id="name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ram Singh or GreenCorp Ltd"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none transition"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-4">
                
                {/* Farmer Option */}
                <button
                  type="button"
                  onClick={() => setRole('farmer')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${
                    role === 'farmer'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 glow-emerald'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Tractor className="h-6 w-6 mb-2" />
                  <span className="text-sm font-semibold">Farmer</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Sell produce directly</span>
                </button>

                {/* Buyer Option */}
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${
                    role === 'buyer'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400 glow-blue'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <ShoppingBag className="h-6 w-6 mb-2" />
                  <span className="text-sm font-semibold">Buyer</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Discover & purchase</span>
                </button>

              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 hover:opacity-95 active:scale-95 transition-all ${
                loading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <span>{loading ? 'Registering Wallet...' : 'Launch Marketplace'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

          </form>

          {isDemoMode && (
            <div className="mt-6 border-t border-slate-850 pt-4 text-center">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest block mb-2">
                Hackathon Judging Fast Track
              </span>
              <button
                type="button"
                onClick={seedDemoData}
                className="inline-flex items-center space-x-1.5 text-xs text-orange-400 font-semibold hover:text-orange-300 transition"
              >
                <span>Reset & Seed Prepopulated Demo Personas</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
export default Onboarding;
