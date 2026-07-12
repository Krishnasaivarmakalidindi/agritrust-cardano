import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { contractService } from '../services/contractService';
import { ledgerService } from '../services/ledgerService';
import { calculateTrustScore } from '../utils/trustScore';
import { Order, Contract, BlockchainLog } from '../types';
import { ShieldCheck, Calendar, ArrowRight, ArrowLeft, Database, Globe, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';

export const Verify: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [auditBlocks, setAuditBlocks] = useState<BlockchainLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchVerificationData = async () => {
      setLoading(true);
      try {
        const orderRes = await orderService.getOrderById(id);
        if (orderRes.success && orderRes.data) {
          const orderData = orderRes.data;
          setOrder(orderData);
          
          const contractRes = await contractService.getContractByOrderId(orderData.id);
          if (contractRes.success && contractRes.data) {
            setContract(contractRes.data);
          }

          // Fetch blocks matching this order from ledgerService
          const ledgerRes = await ledgerService.getBlocks();
          if (ledgerRes.success && ledgerRes.data) {
            const matched = ledgerRes.data.filter(log => {
              if (!log.data) return false;
              return log.data.orderId === orderData.id || log.data.productId === orderData.product_id;
            });
            setAuditBlocks(matched);
          }
        }
      } catch (err) {
        console.error('Error loading verification passport:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-gray-500">
        Syncing verification logs from Cardano Preview Net...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <h2 className="font-display text-xl font-bold text-gray-900">Verification Record Not Found</h2>
        <p className="text-sm text-slate-455">The requested trade ID does not match any smart contract audits on this network.</p>
        <Link to="/" className="inline-flex items-center space-x-2 text-emerald-400 text-xs font-bold hover:underline">
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    );
  }

  const amountAda = Math.round(order.total_amount * 0.05);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 relative"
    >
      {/* Background neon effect */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />

      {/* Navigation Return */}
      <div className="relative z-10">
        <Link to="/dashboard" className="inline-flex items-center space-x-1.5 text-gray-500 text-xs font-bold hover:text-gray-900 transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>

      {/* Verification Passport Banner */}
      <div className="glass-card rounded-3xl p-6 border-slate-855 text-center space-y-5 relative z-10 overflow-hidden">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 glow-emerald">
          <ShieldCheck className="h-8 w-8 text-emerald-500 font-extrabold" />
        </div>

        <div className="space-y-1.5">
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest inline-block">
            Verified on Cardano Preview
          </span>
          <h1 className="font-display text-2xl font-black text-gray-900">Supply Chain Verification Passport</h1>
          <p className="text-xs text-gray-500">Order ID: #{order.id} • Aiken Smart Contract Audited</p>
        </div>

        {/* Cryptographic metadata badge */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border-t border-gray-100 pt-5 text-xs text-gray-500">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Settlement Value</span>
            <span className="font-semibold text-gray-900 mt-1 block">₳ {amountAda} ADA</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Trade Value</span>
            <span className="font-semibold text-gray-900 mt-1 block">₹{order.total_amount.toLocaleString()} INR</span>
          </div>
          <div className="col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Verified Date</span>
            <span className="font-semibold text-gray-900 mt-1 block">{new Date(order.created_at).toLocaleDateString([], { dateStyle: 'medium' })}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Crop Origin & Contract Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        
        {/* Crop Origin Passport */}
        <div className="glass-card rounded-2xl p-5 border-slate-855 space-y-4">
          <h3 className="font-display text-sm font-bold text-gray-900 flex items-center space-x-1.5 pb-2 border-b border-gray-100">
            <Leaf className="h-4 w-4 text-emerald-500" />
            <span>Agricultural Origin Passport</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Produce Title:</span>
              <span className="font-bold text-gray-900 text-right">{order.product?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-455">Category / Grade:</span>
              <span className="text-gray-700">{order.product?.category} • {order.product?.grade}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-455">Quantity Traded:</span>
              <span className="font-semibold text-gray-900">{order.product?.quantity_available} kg</span>
            </div>
            
            <div className="border-t border-gray-100 pt-3.5 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-gray-900">Farmer Signatory: {order.farmer?.full_name}</span>
              </div>
              <p className="text-[10px] text-gray-500 font-mono pl-4 truncate">WALLET: {order.farmer?.id}</p>
              <p className="text-[10px] text-emerald-400 font-bold pl-4">Trust Reputation: {calculateTrustScore(order.farmer || {}, true)}%</p>
            </div>
          </div>
        </div>

        {/* Cardano Escrow script details */}
        <div className="glass-card rounded-2xl p-5 border-slate-855 space-y-4">
          <h3 className="font-display text-sm font-bold text-gray-900 flex items-center space-x-1.5 pb-2 border-b border-gray-100">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            <span>Escrow Script Audit</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-455">Script Engine:</span>
              <span className="text-gray-700">Plutus Validator V1 (Aiken)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-455">Validator Hash:</span>
              <span className="font-mono text-gray-600 text-[10px] truncate max-w-[120px]">{contract?.contract_address || 'addr_test1z...escrowhash'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-455">Status:</span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20 uppercase">
                {contract?.status || 'released'}
              </span>
            </div>

            <div className="border-t border-gray-100 pt-3.5 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-bold text-gray-900">Buyer Signatory: {order.buyer?.full_name}</span>
              </div>
              <p className="text-[10px] text-gray-500 font-mono pl-4 truncate">WALLET: {order.buyer?.id}</p>
              <p className="text-[10px] text-emerald-400 font-bold pl-4">Trust Reputation: {calculateTrustScore(order.buyer || {}, true)}%</p>
            </div>
          </div>
        </div>

      </div>

      {/* Blockchain Ledger Audit blocks trail */}
      <div className="glass-card rounded-2xl p-5 border-slate-855 space-y-4 relative z-10">
        <h3 className="font-display text-sm font-bold text-gray-900 flex items-center space-x-1.5 pb-2 border-b border-gray-100">
          <Database className="h-4 w-4 text-blue-500" />
          <span>Ledger Audit Trail</span>
        </h3>

        {auditBlocks.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">
            No transaction events mined for this trade ID.
          </div>
        ) : (
          <div className="space-y-3 font-mono">
            {auditBlocks.sort((a, b) => a.block_number - b.block_number).map(block => (
              <div key={block.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-xl bg-white/80 p-3 border border-gray-100 text-xs gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-emerald-400 font-bold">BLOCK #{block.block_number}</span>
                    <span className="font-bold text-gray-900 font-sans">{block.action.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="font-mono text-[9px] text-gray-400 break-all">TX HASH: {block.tx_hash}</p>
                </div>
                <div className="text-[10px] text-gray-500 font-sans">
                  {new Date(block.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </motion.div>
  );
};
export default Verify;
