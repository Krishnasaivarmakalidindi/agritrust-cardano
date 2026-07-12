import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { walletService } from '../services/walletService';
import { ledgerService } from '../services/ledgerService';
import { dbService } from '../services/dbService';
import { WalletTransaction } from '../types';
import { 
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, 
  Lock, CheckCircle2, Copy, Check, Landmark, Coins 
} from 'lucide-react';
import { motion } from 'framer-motion';

export const WalletPage: React.FC = () => {
  const { user, wallet, refreshWallet } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [copied, setCopied] = useState(false);
  const [loadingFaucet, setLoadingFaucet] = useState(false);

  const fetchTxs = async () => {
    if (!wallet) return;
    const res = await walletService.getTransactions(wallet.id);
    if (res.success && res.data) {
      setTransactions(res.data);
    }
  };

  useEffect(() => {
    fetchTxs();
  }, [wallet]);

  const copyAddress = () => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaimFaucet = async () => {
    if (!wallet) return;
    setLoadingFaucet(true);
    try {
      const txHash = '0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Call walletService faucet credit
      const res = await walletService.simulateFaucet(wallet.id, 1000.0);
      if (res.success) {
        // Record deposit log in DB
        const newTx = await dbService.createWalletTransaction({
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          wallet_id: wallet.id,
          amount: 1000.0,
          type: 'deposit',
          status: 'confirmed',
          tx_hash: txHash,
          created_at: new Date().toISOString()
        });

        // Mine block in Trust Ledger
        await ledgerService.mineBlock({
          action: 'FAUCET_CLAIMED',
          data: { walletAddress: wallet.address, amountAda: 1000, txHash }
        });

        setTransactions(prev => [newTx, ...prev]);
        await refreshWallet();
      }
    } catch (err) {
      console.error('Error claiming faucet:', err);
    } finally {
      setLoadingFaucet(false);
    }
  };

  if (!user || !wallet) {
    return (
      <div className="flex h-96 items-center justify-center text-gray-500">
        Please connect your wallet or select a persona switch first.
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8"
    >
      {/* Page Title */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Cardano Web3 Wallet</h1>
        <p className="text-sm text-gray-500 mt-1">Manage simulated Ada test assets and track locked smart contract escrow funds</p>
      </div>

      {/* Main Grid: Card Details & Faucet Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Balance Available Card */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-48 border-l-2 border-emerald-500">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Coins className="h-24 w-24 text-emerald-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Available Balance</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">Active</span>
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-gray-900">₳ {wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-xs text-gray-500 font-semibold uppercase">ADA</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">≈ ₹{(wallet.balance * 35).toLocaleString(undefined, { maximumFractionDigits: 2 })} INR</p>
          </div>
          <div className="text-[10px] text-gray-400 font-mono">
            Cardano Preview Network • 1 ADA = ₹35 INR (Estimated rate)
          </div>
        </div>

        {/* Locked Escrow Card */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-48 border-l-2 border-orange-500">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lock className="h-24 w-24 text-orange-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Locked in Escrow</span>
            <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400 border border-orange-500/20">Escrow Locked</span>
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-gray-900">₳ {wallet.locked_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-xs text-gray-500 font-semibold uppercase">ADA</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">≈ ₹{(wallet.locked_balance * 35).toLocaleString(undefined, { maximumFractionDigits: 2 })} INR</p>
          </div>
          <div className="text-[10px] text-gray-400">
            Released to farmer only after buyer confirms delivery.
          </div>
        </div>

        {/* Address and Faucet Action Card */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-48">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Wallet Details</span>
            <div className="mt-2.5 flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 border border-gray-200">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Wallet Address</p>
                <p className="font-mono text-xs text-gray-900 truncate mt-1.5">{wallet.address}</p>
              </div>
              <button 
                onClick={copyAddress}
                className="ml-3 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button
            onClick={handleClaimFaucet}
            disabled={loadingFaucet}
            className={`w-full flex items-center justify-center space-x-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 transition ${
              loadingFaucet ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <Landmark className="h-4 w-4 shrink-0" />
            <span>{loadingFaucet ? 'Claiming ADA...' : 'Request Test ADA'}</span>
          </button>
        </div>

      </div>

      {/* Wallet Transactions History */}
      <div className="glass-card rounded-2xl p-6 shadow-xl">
        <h2 className="font-display text-lg font-bold text-gray-900 mb-6">On-Chain Transaction Log</h2>
        
        {transactions.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            No transactions found on this address.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Transaction ID / Hash</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 font-mono">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/30 transition">
                    
                    {/* Tx Hash */}
                    <td className="py-3.5 px-4 text-gray-600">
                      {tx.tx_hash ? (
                        <span className="flex items-center space-x-1.5">
                          <span className="text-emerald-500/80">#</span>
                          <span>{tx.tx_hash.slice(0, 14)}...{tx.tx_hash.slice(-8)}</span>
                        </span>
                      ) : (
                        'Internal Block Transfer'
                      )}
                    </td>

                    {/* Tx Type */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        tx.type === 'deposit' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : tx.type === 'escrow_lock'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                          : tx.type === 'escrow_release'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-slate-500/10 text-gray-500 border-slate-550/20'
                      }`}>
                        {tx.type === 'deposit' && <ArrowDownLeft className="h-3 w-3" />}
                        {tx.type === 'escrow_lock' && <Lock className="h-3 w-3 animate-pulse" />}
                        {tx.type === 'escrow_release' && <ArrowUpRight className="h-3 w-3" />}
                        <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                      </span>
                    </td>

                    {/* Tx Amount */}
                    <td className="py-3.5 px-4 font-semibold font-display text-sm">
                      <span className={tx.type === 'deposit' || tx.type === 'escrow_release' ? 'text-emerald-400 animate-pulse' : 'text-orange-400'}>
                        {tx.type === 'deposit' || tx.type === 'escrow_release' ? '+' : '-'} ₳ {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-gray-500 font-sans">
                      {new Date(tx.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center space-x-1 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-semibold">{tx.status}</span>
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default WalletPage;
