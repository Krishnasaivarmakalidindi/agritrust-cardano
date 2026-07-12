import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sprout, Tractor, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Onboarding: React.FC = () => {
  const { switchUser } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinueAsFarmer = async () => {
    setLoading(true);
    setError('');
    try {
      await switchUser('farmer-ram-singh-id');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Onboarding switch failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsBuyer = async () => {
    setLoading(true);
    setError('');
    try {
      await switchUser('buyer-priya-patel-id');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Onboarding switch failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden font-display">
      
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        
        {/* Logo and pitch */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 glow-emerald">
            <Sprout className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="mt-6 text-3xl font-black tracking-tight text-white">
            Access AgriTrust
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in instantly using pre-configured network personas
          </p>
        </div>

        {/* Action card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl space-y-6">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/15 p-3.5 text-xs text-red-400 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            
            {/* Farmer Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleContinueAsFarmer}
              disabled={loading}
              className="w-full flex items-center justify-between p-5 rounded-xl border border-slate-805 bg-slate-900/60 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-left text-white transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Tractor className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">Continue as Farmer</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ram Singh • Punjab Farms</p>
                </div>
              </div>
              <ArrowRight className="h-4.5 w-4.5 text-slate-500" />
            </motion.button>

            {/* Buyer Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleContinueAsBuyer}
              disabled={loading}
              className="w-full flex items-center justify-between p-5 rounded-xl border border-slate-805 bg-slate-900/60 hover:border-blue-500/40 hover:bg-blue-500/5 text-left text-white transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-450 text-blue-400">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">Continue as Buyer</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Priya Patel • GreenCorp Retail</p>
                </div>
              </div>
              <ArrowRight className="h-4.5 w-4.5 text-slate-500" />
            </motion.button>

          </div>

          <div className="text-[10px] text-slate-500 text-center font-mono pt-2 border-t border-slate-900">
            Cardano Web3 escrow credentials pre-loaded.
          </div>

        </div>
      </div>
    </div>
  );
};
export default Onboarding;
