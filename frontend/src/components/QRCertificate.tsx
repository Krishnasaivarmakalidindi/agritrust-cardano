import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { ShieldCheck, Calendar, Hash, User, Package } from 'lucide-react';

export interface QRCertificateProps {
  tradeId: string;
  farmerName: string;
  buyerName: string;
  productName: string;
  quantity: string;
  price: number;
  walletAddress: string;
  txHash: string;
  contractAddress: string;
  blockNumber: number;
  timestamp: string;
}

export const QRCertificate: React.FC<QRCertificateProps> = ({
  tradeId, farmerName, buyerName, productName, quantity,
  price, walletAddress, txHash, contractAddress, blockNumber, timestamp
}) => {
  // Generates the URL that the QR code will point to
  const verificationUrl = `${window.location.origin}/#/verify/${tradeId}`;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden relative"
    >
      {/* Top Banner */}
      <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-white" />
          <h2 className="text-white font-display font-bold text-lg">Verified Trade Certificate</h2>
        </div>
        <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
          Preview Testnet
        </span>
      </div>

      <div className="p-6">
        {/* QR Code Section */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-white border-2 border-emerald-100 rounded-2xl shadow-sm">
            <QRCodeSVG 
              value={verificationUrl}
              size={180}
              bgColor="#ffffff"
              fgColor="#111827"
              level="H"
              includeMargin={false}
            />
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-500">
              <Package className="h-4 w-4" />
              <span className="text-xs font-semibold">Product</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{productName} ({quantity})</span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-500">
              <User className="h-4 w-4" />
              <span className="text-xs font-semibold">Parties</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-gray-900">{farmerName} <span className="text-gray-400 font-normal">→</span> {buyerName}</div>
            </div>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-500">
              <Hash className="h-4 w-4" />
              <span className="text-xs font-semibold">Contract / Tx</span>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 truncate w-32 ml-auto">
                {contractAddress}
              </div>
              <div className="text-[10px] font-mono text-gray-500 truncate w-32 ml-auto mt-1">
                {txHash}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pb-1">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-semibold">Block / Time</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-gray-900">Block #{blockNumber}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{new Date(timestamp).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative background logo */}
      <div className="absolute -bottom-10 -right-10 text-emerald-500/5 opacity-20 pointer-events-none">
        <ShieldCheck className="w-48 h-48" />
      </div>
    </motion.div>
  );
};
