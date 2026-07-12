import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { BlockchainLog } from '../types';
import { Database, ShieldCheck, Cpu, Clock, Key, ArrowRight, Eye } from 'lucide-react';

export const Explorer: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockchainLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocks = async () => {
    try {
      const list = await dbService.getBlockchainLogs();
      setBlocks(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
    // Refresh ledger logs every 4 seconds in demo mode
    const interval = setInterval(fetchBlocks, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading && blocks.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        Loading Trust Ledger Blocks...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Page Title */}
      <div className="flex justify-between items-center border-b border-slate-850 pb-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white flex items-center space-x-2.5">
            <Database className="h-7 w-7 text-emerald-500" />
            <span>Cardano Trust Ledger</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Immutable transaction audit blocks verified on Cardano preview testnet</p>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Height</span>
          <span className="text-lg font-black text-emerald-400">#{blocks[0]?.block_number || 100} Blocks</span>
        </div>
      </div>

      {/* Blocks Vertical Timeline */}
      <div className="relative border-l border-slate-800 ml-4 pl-8 space-y-8 py-2">
        {blocks.map((block, idx) => {
          return (
            <div key={block.id} className="relative group">
              
              {/* Pulsing indicator node */}
              <span className={`absolute -left-[45px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full border bg-slate-950 font-mono text-[10px] font-bold transition duration-300 ${
                idx === 0 
                  ? 'border-emerald-500 text-emerald-400 animate-pulse-ring' 
                  : 'border-slate-800 text-slate-500 group-hover:border-slate-600'
              }`}>
                #{block.block_number.toString().slice(-3)}
              </span>

              {/* Block Card */}
              <div className="glass-card rounded-2xl p-5 border-slate-855 hover:border-slate-800 transition duration-300 space-y-4">
                
                {/* Block header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-900 pb-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">BLOCK TRANSACTION EVENT</span>
                    <h3 className="text-sm font-extrabold text-white mt-0.5">{block.action.replace(/_/g, ' ')}</h3>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{new Date(block.created_at).toLocaleString([], { timeStyle: 'medium', dateStyle: 'short' })}</span>
                  </div>
                </div>

                {/* Block Payload Data details */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-4 space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Decoded Payload</span>
                  
                  {Object.entries(block.data || {}).map(([key, val]: [string, any]) => {
                    const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
                    return (
                      <div key={key} className="flex justify-between items-start py-0.5">
                        <span className="text-slate-400 font-semibold capitalize pr-4">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="font-mono text-slate-300 text-[11px] break-all max-w-xs sm:max-w-md text-right">{stringVal}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Cryptographic hashes links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[9px] font-mono text-slate-500 pt-2 border-t border-slate-900/60">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-600 uppercase tracking-wider">Block Hash</p>
                    <p className="text-slate-400 truncate leading-none mt-1">{block.tx_hash}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-600 uppercase tracking-wider">Previous Hash</p>
                    <p className="text-slate-500 truncate leading-none mt-1">{block.prev_hash}</p>
                  </div>
                </div>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
export default Explorer;
