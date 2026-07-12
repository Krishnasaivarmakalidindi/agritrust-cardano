import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { contractService } from '../services/contractService';
import { ledgerService } from '../services/ledgerService';
import { Order, Contract, BlockchainLog } from '../types';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { QRCertificate } from '../components/QRCertificate';

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

  if (!order || !contract) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <h2 className="font-display text-xl font-bold text-gray-900">Verification Record Not Found</h2>
        <p className="text-sm text-gray-500">The requested trade ID does not match any smart contract audits on this network.</p>
        <Link to="/" className="inline-flex items-center space-x-2 text-emerald-600 text-xs font-bold hover:underline">
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    );
  }

  // We need the blocks to find txHash and block number for the completion event
  const completionBlock = auditBlocks.find(b => b.action === 'TRADE_COMPLETED') || auditBlocks[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 relative"
    >
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-50 rounded-full blur-3xl -z-10" />

      <div className="relative z-10">
        <Link to="/dashboard" className="inline-flex items-center space-x-1.5 text-gray-500 text-xs font-bold hover:text-gray-900 transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Public Ledger Verification</h1>
        <p className="text-gray-500">Scan or share this certificate to prove the provenance of this agricultural trade.</p>
      </div>

      <QRCertificate 
        tradeId={order.id}
        farmerName={order.farmer?.full_name || 'Verified Farmer'}
        buyerName={order.buyer?.full_name || 'Verified Buyer'}
        productName={order.product?.title || 'Agricultural Produce'}
        quantity={`Total Trade`}
        price={order.total_amount}
        walletAddress={order.buyer_id} // Mock wallet reference
        txHash={contract.tx_hash || 'Simulated On-Chain Transaction'}
        contractAddress={contract.contract_address}
        blockNumber={completionBlock?.block_number || 120485}
        timestamp={completionBlock?.created_at || contract.created_at}
      />
      
    </motion.div>
  );
};
export default Verify;
