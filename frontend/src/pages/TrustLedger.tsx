import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ledgerService } from '../services/ledgerService';
import { BlockchainLog } from '../types';
import { 
  Database, ShieldCheck, RefreshCw, Globe, Play, CheckCircle2, AlertTriangle, Cpu, Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export const TrustLedger: React.FC = () => {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<BlockchainLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchBlocks = async () => {
    try {
      const res = await ledgerService.getBlocks();
      if (res.success && res.data) {
        setBlocks(res.data);
      }
    } catch (err) {
      console.error('Error fetching blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
    const interval = setInterval(fetchBlocks, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyChain = async () => {
    setVerifying(true);
    setVerifyResult(null);
    
    // Simulate auditing delay
    setTimeout(async () => {
      const res = await ledgerService.verifyChain();
      setVerifying(false);
      if (res.success) {
        setVerifyResult({
          success: true,
          message: `Chain Audit Completed: ${blocks.length} blocks validated. Parent hash links intact. Zero modifications detected.`
        });
      } else {
        setVerifyResult({
          success: false,
          message: res.message || 'Audit warning: Chain linkage mismatch.'
        });
      }
    }, 1200);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8"
    >
      
      {/* Header and Integrity Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900 flex items-center space-x-2.5">
            <Database className="h-8 w-8 text-emerald-500 shrink-0" />
            <span>Trust Ledger</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Audit block logs mined on the Cardano Preview Testnet chain</p>
        </div>

        <button
          onClick={handleVerifyChain}
          disabled={verifying || blocks.length === 0}
          className="flex items-center space-x-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-gray-900 px-4 py-2.5 text-xs font-bold transition shadow-lg disabled:opacity-50"
        >
          {verifying ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          <span>Verify Blockchain Integrity</span>
        </button>
      </div>

      {/* Verification Result Banner */}
      <AnimatePresence>
        {verifyResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-xl border flex items-start space-x-3 text-xs ${
              verifyResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {verifyResult.success ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0" />
            )}
            <div>
              <p className="font-bold">Ledger Audit Complete</p>
              <p className="mt-1 leading-relaxed">{verifyResult.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline view */}
      {loading && blocks.length === 0 ? (
        <div className="flex justify-center py-12 text-gray-500">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-500 mr-2" />
          <span>Syncing block headers...</span>
        </div>
      ) : blocks.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-555 text-gray-500 text-sm">
          No ledger blocks mined yet. Syncing with Cardano Network...
        </div>
      ) : (
        <div className="relative border-l-2 border-gray-200 ml-4 pl-8 space-y-8 py-2">
          
          {/* Active mining indicator node at top */}
          <div className="absolute -left-[9px] -top-1.5 h-4.5 w-4.5 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center animate-pulse">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          </div>

          <AnimatePresence>
            {blocks.map((block, idx) => (
              <motion.div
                key={block.id || idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative"
              >
                
                {/* Node icon dot */}
                <div className="absolute -left-[41px] top-1.5 h-6 w-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] text-emerald-400 font-bold shrink-0">
                  {idx === 0 ? <Cpu className="h-3.5 w-3.5 text-blue-400 animate-spin" /> : '✓'}
                </div>

                <div className="glass-card rounded-2xl p-5 border-gray-100 hover:border-gray-200 transition">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3 mb-3 text-[10px]">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-emerald-400 font-extrabold text-xs">BLOCK #{block.block_number}</span>
                      <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-400 border border-blue-500/20">Cardano Preview</span>
                    </div>
                    <span className="font-sans text-gray-500">Mined: {new Date(block.created_at).toLocaleDateString()} {new Date(block.created_at).toLocaleTimeString()}</span>
                  </div>

                  <div className="space-y-3 font-mono text-[11px]">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <span className="text-gray-500 uppercase tracking-widest font-bold">Action Mapped:</span>
                      <span className="text-gray-900 font-extrabold font-sans text-xs">{block.action.replace(/_/g, ' ')}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-gray-500 uppercase tracking-widest font-bold">Transaction Hash:</span>
                      <span className="text-gray-600 break-all select-all">{block.tx_hash}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-gray-500 uppercase tracking-widest font-bold">Parent Hash (prev_hash):</span>
                      <span className="text-gray-400 break-all">{block.prev_hash}</span>
                    </div>

                    <div className="border-t border-gray-100/60 pt-3">
                      <span className="text-gray-500 uppercase tracking-widest font-bold block mb-1">Payload Metadata:</span>
                      <pre className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-[10px] text-gray-600 overflow-x-auto leading-relaxed">
                        {JSON.stringify(block.data, null, 2)}
                      </pre>
                    </div>

                    {block.action === 'TRADE_COMPLETED' && block.data?.orderId && (
                      <div className="pt-3">
                        <Link 
                          to={`/verify/${block.data.orderId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition font-bold"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          View QR Certificate
                        </Link>
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            ))}
          </AnimatePresence>

        </div>
      )}

    </motion.div>
  );
};
export default TrustLedger;
