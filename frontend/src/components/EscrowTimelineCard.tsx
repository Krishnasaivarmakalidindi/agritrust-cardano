import React from 'react';
import { Order, OrderStatus } from '../types';
import { Check, ShieldAlert, Clock, ArrowRight, Key, Lock, Ship, BadgeCheck, FileText } from 'lucide-react';

interface EscrowTimelineCardProps {
  order: Order;
  onAction?: () => void;
  actionText?: string;
  actionLoading?: boolean;
  onVerify?: () => void;
}

const STAGES: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
  { status: 'negotiated', label: 'Negotiated', desc: 'Price and quantity agreed', icon: FileText },
  { status: 'contract_generated', label: 'Contract Generated', desc: 'Plutus validator address generated', icon: Key },
  { status: 'buyer_signed', label: 'Buyer Signed', desc: 'Buyer authorizes contract code', icon: Key },
  { status: 'funds_locked', label: 'Funds Locked', desc: 'ADA locked in escrow script address', icon: Lock },
  { status: 'farmer_signed', label: 'Farmer Signed', desc: 'Farmer signs contract to accept locking', icon: Key },
  { status: 'shipment_started', label: 'Shipment Started', desc: 'Crop dispatched with transit proof', icon: Ship },
  { status: 'buyer_confirmed', label: 'Buyer Confirms', desc: 'Buyer verifies crop quality and receipt', icon: BadgeCheck },
  { status: 'funds_released', label: 'Funds Released', desc: 'ADA escrow released to farmer wallet', icon: Check },
  { status: 'contract_closed', label: 'Contract Closed', desc: 'Transaction complete, Reputation NFT minted', icon: BadgeCheck }
];

export const EscrowTimelineCard: React.FC<EscrowTimelineCardProps> = ({ 
  order, onAction, actionText, actionLoading, onVerify
}) => {
  
  // Find current stage index
  const currentStageIndex = STAGES.findIndex(s => s.status === order.status);

  return (
    <div className="glass-card rounded-2xl p-5 border-slate-855 space-y-5">
      
      {/* Header Info */}
      <div className="flex justify-between items-start border-b border-slate-900 pb-3">
        <div>
          <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">Escrow Contract Status</span>
          <h4 className="text-sm font-bold text-white mt-0.5">{order.product?.title}</h4>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-emerald-400 block">Total Escrow</span>
          <span className="text-sm font-extrabold text-white">₳ {Math.round(order.total_amount * 0.05)} ADA</span>
        </div>
      </div>

      {/* 9-Stage Visual Vertical Timeline */}
      <div className="space-y-4 pt-1 max-h-72 overflow-y-auto pr-1">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentStageIndex || order.status === 'contract_closed';
          const isActive = idx === currentStageIndex && order.status !== 'contract_closed';
          const Icon = stage.icon;

          return (
            <div key={stage.status} className="relative flex items-start space-x-3.5 group">
              
              {/* Connecting vertical line */}
              {idx < STAGES.length - 1 && (
                <div 
                  className={`absolute left-4 top-8 -bottom-4 w-[2px] transition ${
                    idx < currentStageIndex ? 'bg-emerald-500/80' : 'bg-slate-850'
                  }`} 
                />
              )}

              {/* Circle Badge Indicator */}
              <div 
                className={`flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition duration-300 ${
                  isCompleted 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 glow-emerald' 
                    : isActive 
                    ? 'bg-orange-500/10 border-orange-500 text-orange-400 animate-pulse-ring' 
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              {/* Stage Description content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex justify-between items-baseline">
                  <p className={`text-xs font-bold leading-none ${
                    isCompleted ? 'text-slate-200' : isActive ? 'text-orange-400' : 'text-slate-500'
                  }`}>
                    {stage.label}
                  </p>
                  {isActive && (
                    <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-orange-400 border border-orange-500/20 bg-orange-500/5 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">{stage.desc}</p>
              </div>

            </div>
          );
        })}
      </div>

      {/* Embedded Transaction info */}
      <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-850 text-[10px] text-slate-500 font-mono space-y-1.5">
        <div className="flex justify-between">
          <span>Escrow Account:</span>
          <span className="text-slate-400 truncate w-32 text-right">addr_test1z{order.id.replace(/[^0-9]/g, '').slice(0, 8)}escrow...</span>
        </div>
        <div className="flex justify-between">
          <span>Cardano Network:</span>
          <span className="text-slate-400">preview_testnet</span>
        </div>
      </div>

      {/* Action Buttons footer */}
      <div className="flex space-x-2">
        {onVerify && (
          <button
            onClick={onVerify}
            className="flex-1 flex items-center justify-center space-x-1 border border-slate-800 bg-slate-900 hover:bg-slate-850 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition"
          >
            <span>Verify QR</span>
          </button>
        )}
        
        {onAction && actionText && (
          <button
            onClick={onAction}
            disabled={actionLoading}
            className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-white hover:bg-emerald-600 active:scale-95 transition"
          >
            <span>{actionText}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

    </div>
  );
};
export default EscrowTimelineCard;
