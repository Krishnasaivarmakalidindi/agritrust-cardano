import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { Profile, BlockchainLog } from '../types';
import { 
  ShieldCheck, ArrowRight, Star, ChevronRight, Activity 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Landing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topFarmers, setTopFarmers] = useState<Profile[]>([]);
  const [latestBlocks, setLatestBlocks] = useState<BlockchainLog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch top farmers
      const profiles = await dbService.getProfiles();
      const farmers = profiles
        .filter(p => p.role === 'farmer')
        .sort((a, b) => b.trust_score - a.trust_score)
        .slice(0, 3);
      setTopFarmers(farmers);

      // Fetch latest blockchain blocks
      const blocks = await dbService.getBlockchainLogs();
      setLatestBlocks(blocks.slice(0, 4));
    };
    fetchData();
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/onboarding');
    }
  };

  return (
    <div className="bg-slate-950 text-white min-h-[calc(100vh-64px)] relative overflow-hidden font-display">
      
      {/* Background blobs */}
      <div className="absolute top-12 left-10 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
 
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto inline-flex items-center space-x-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 glow-emerald"
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Cardano Preview Testnet Verified Trade Protocol</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl font-black tracking-tight leading-tight"
        >
          The First Trust Infrastructure <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 bg-clip-text text-transparent">
            for Agricultural Commerce
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto max-w-2xl text-slate-400 text-base sm:text-lg leading-relaxed"
        >
          Direct farmer-to-buyer trading secured by AI-assisted pricing and Cardano smart contracts.
        </motion.p>
 
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <button
            onClick={handleGetStarted}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-950/20 hover:opacity-95 active:scale-95 transition-all"
          >
            <span>Get Started</span>
            <ArrowRight className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleGetStarted}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl border border-slate-805 bg-slate-900/60 px-8 py-4 text-base font-semibold text-slate-350 hover:bg-slate-850 hover:text-white transition"
          >
            <span>Explore Marketplace</span>
          </button>
        </motion.div>
      </section>
 
      {/* Live Marketplace Statistics */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          
          <div className="glass-card rounded-2xl p-4 border-l-2 border-emerald-500/80">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">Verified Farmers</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">1</div>
            <p className="text-[9px] text-slate-500 mt-0.5 font-mono">Ram Singh</p>
          </div>

          <div className="glass-card rounded-2xl p-4 border-l-2 border-teal-500/80">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">Verified Buyers</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">1</div>
            <p className="text-[9px] text-slate-500 mt-0.5 font-mono">Priya Patel</p>
          </div>

          <div className="glass-card rounded-2xl p-4 border-l-2 border-blue-500/80">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">Crops Listed</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">5</div>
            <p className="text-[9px] text-slate-500 mt-0.5 font-mono">Active stocks</p>
          </div>

          <div className="glass-card rounded-2xl p-4 border-l-2 border-purple-500/80">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">Trades Mapped</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">2</div>
            <p className="text-[9px] text-slate-500 mt-0.5 font-mono">P2P negotiations</p>
          </div>

          <div className="glass-card rounded-2xl p-4 border-l-2 border-amber-500/80">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">Active Escrow</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">1</div>
            <p className="text-[9px] text-slate-500 mt-0.5 font-mono">Cardano contract</p>
          </div>

          <div className="glass-card rounded-2xl p-4 border-l-2 border-pink-500/80">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">Ledger Blocks</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">6</div>
            <p className="text-[9px] text-slate-500 mt-0.5 font-mono">Mined logs</p>
          </div>

        </div>
      </section>
 
      {/* Main split grid: Top Farmers & Latest Block Stream */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
        
        {/* Left Side: Top Verified Farmers */}
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-black text-white">Top Verified Farmers</h2>
            <p className="text-sm text-slate-400 mt-1">Farmers with consistent delivery logs and highest ratings</p>
          </div>

          <div className="space-y-4">
            {topFarmers.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center text-slate-550 text-sm">
                Syncing verified farmers...
              </div>
            ) : (
              topFarmers.map(farmer => (
                <div 
                  key={farmer.id}
                  className="glass-card rounded-2xl p-4 flex items-center justify-between border-slate-805 hover:border-emerald-500/30 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3.5">
                    {farmer.avatar_url ? (
                      <img src={farmer.avatar_url} alt="" className="h-12 w-12 rounded-full border border-slate-700 object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-750 flex items-center justify-center font-bold text-white uppercase">
                        {farmer.full_name[0]}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-white leading-none">{farmer.full_name}</h3>
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/20">Verified</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-slate-400 text-xs mt-1.5">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        <span className="font-semibold text-slate-300">4.9</span>
                        <span>•</span>
                        <span>{farmer.trades_completed} Trades Completed</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Trust Rating</span>
                    <span className="text-lg font-black text-emerald-400">{farmer.trust_score}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Trust Ledger Stream */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-black text-white flex items-center space-x-2">
                <Activity className="h-5.5 w-5.5 text-emerald-500 animate-pulse" />
                <span>Live Trust Ledger Stream</span>
              </h2>
              <p className="text-sm text-slate-400 mt-1">Real-time blocks mined on Cardano preview testnet</p>
            </div>
            <Link to="/ledger" className="text-xs font-semibold text-emerald-400 flex items-center space-x-1 hover:text-emerald-300">
              <span>View Trust Ledger</span>
              <ChevronRight className="h-4.5 w-4.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {latestBlocks.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center text-slate-550 text-sm">
                Syncing blocks...
              </div>
            ) : (
              latestBlocks.map(block => (
                <div 
                  key={block.id}
                  className="glass-card rounded-2xl p-4 flex flex-col justify-between border-slate-805 text-xs hover:border-blue-500/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2 font-mono">
                    <span className="text-emerald-400 font-bold">BLOCK #{block.block_number}</span>
                    <span className="text-slate-500 text-[10px]">{block.tx_hash.slice(0, 16)}...</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="font-bold text-white text-[13px]">{block.action.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-slate-455 mt-0.5">Mined: {new Date(block.created_at).toLocaleTimeString()}</p>
                    </div>
                    <span className="inline-flex items-center space-x-1 rounded bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold text-blue-400 border border-blue-500/20">
                      Immutable Proof
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </section>

    </div>
  );
};
export default Landing;
