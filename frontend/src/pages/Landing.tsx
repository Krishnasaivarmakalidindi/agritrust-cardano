import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { Profile, BlockchainLog, Product } from '../types';
import { 
  Sprout, ShieldCheck, ArrowRight, Zap, 
  Coins, Star, Globe, ChevronRight, Activity 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Landing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topFarmers, setTopFarmers] = useState<Profile[]>([]);
  const [latestBlocks, setLatestBlocks] = useState<BlockchainLog[]>([]);
  const [productsCount, setProductsCount] = useState(0);

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

      // Fetch crops count
      const list = await dbService.getProducts();
      setProductsCount(list.length);
    };
    fetchData();
  }, []);

  const handleLaunch = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/onboarding');
    }
  };

  return (
    <div className="bg-slate-950 text-white min-h-[calc(100vh-64px)] relative overflow-hidden">
      
      {/* Background blobs */}
      <div className="absolute top-12 left-10 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        <div className="mx-auto inline-flex items-center space-x-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 glow-emerald animate-pulse-ring">
          <ShieldCheck className="h-4 w-4" />
          <span>Cardano Blockchain Verified Trade Protocol</span>
        </div>
        
        <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight leading-tight">
          Trusted Agricultural Commerce <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 bg-clip-text text-transparent">
            Powered by AI & Cardano Blockchain
          </span>
        </h1>
        
        <p className="mx-auto max-w-2xl text-slate-400 text-base sm:text-lg">
          Eliminate middlemen. AgriTrust connects verified farmers and buyers directly, securing payments with Cardano smart contract escrows and recommending fair prices via AI trade assistance.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={handleLaunch}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-950/20 hover:opacity-95 active:scale-95 transition-all"
          >
            <span>Launch Platform</span>
            <ArrowRight className="h-5 w-5" />
          </button>
          
          <Link
            to="/roadmap"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl border border-slate-800 bg-slate-900/60 px-8 py-4 text-base font-semibold text-slate-300 hover:bg-slate-850 hover:text-white transition"
          >
            <span>View Future Roadmap</span>
          </Link>
        </div>
      </section>

      {/* Live Marketplace Statistics */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="glass-card rounded-2xl p-5 border-l-2 border-emerald-500/80">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Trade Volume</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1.5">₳ 245,690</div>
            <p className="text-[10px] text-slate-500 mt-1">On-chain settlement</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border-l-2 border-teal-500/80">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Crop Listings</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1.5">{productsCount || 5} Active</div>
            <p className="text-[10px] text-slate-500 mt-1">Verified supplies</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border-l-2 border-blue-500/80">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Locked Smart Escrows</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1.5">₳ 12,400</div>
            <p className="text-[10px] text-slate-500 mt-1">Secured payments</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border-l-2 border-purple-500/80">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Average Trust Rating</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1.5">97.8%</div>
            <p className="text-[10px] text-slate-500 mt-1">Based on on-chain logs</p>
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
            {topFarmers.map(farmer => (
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
                
                {/* Trust Score badge */}
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Trust Rating</span>
                  <span className="text-lg font-black text-emerald-400">{farmer.trust_score}%</span>
                </div>
              </div>
            ))}
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
            <Link to="/explorer" className="text-xs font-semibold text-emerald-400 flex items-center space-x-1 hover:text-emerald-300">
              <span>View Explorer</span>
              <ChevronRight className="h-4.5 w-4.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {latestBlocks.map(block => (
              <div 
                key={block.id}
                className="glass-card rounded-2xl p-4 flex flex-col justify-between border-slate-805 text-xs hover:border-blue-500/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="font-mono text-emerald-400 font-bold">BLOCK #{block.block_number}</span>
                  <span className="font-mono text-slate-500 text-[10px]">{block.tx_hash.slice(0, 16)}...</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="font-bold text-white text-[13px]">{block.action.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Mined: {new Date(block.created_at).toLocaleTimeString()}</p>
                  </div>
                  <span className="inline-flex items-center space-x-1 rounded bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold text-blue-400 border border-blue-500/20">
                    Immutable Proof
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

    </div>
  );
};
export default Landing;
