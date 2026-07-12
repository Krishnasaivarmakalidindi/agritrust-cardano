import React from 'react';
import { Milestone, ShieldAlert, Cpu, Leaf, Radio, CloudRain, Plane, Globe2, WalletCards } from 'lucide-react';

interface RoadmapItem {
  icon: any;
  title: string;
  phase: string;
  description: string;
  status: 'research' | 'pipeline' | 'long-term';
  color: string;
}

const ROADMAP: RoadmapItem[] = [
  {
    icon: Radio,
    title: 'IoT Soil & Climate Sensors',
    phase: 'Phase 2: Upcoming',
    description: 'Hardware sensors deployed on farms to feed temperature, moisture, and crop health metrics to smart contracts, triggering auto-payouts in crop damage events.',
    status: 'research',
    color: 'border-l-emerald-500 hover:border-emerald-500/30'
  },
  {
    icon: Plane,
    title: 'Drone Monitoring Quality Verification',
    phase: 'Phase 2: Upcoming',
    description: 'Autonomous drones audit farm acreage to verify harvest yields, quality scores, and grade authenticity, committing cryptographic proof to the Cardano ledger before sale.',
    status: 'research',
    color: 'border-l-blue-500 hover:border-blue-500/30'
  },
  {
    icon: Leaf,
    title: 'Carbon Credit Tokenization',
    phase: 'Phase 3: Pipeline',
    description: 'Tokenizing sustainable farming offsets (e.g. organic tillage, reduced water use) to generate tradeable carbon credit NFTs on Cardano, creating new farmer revenue streams.',
    status: 'pipeline',
    color: 'border-l-teal-500 hover:border-teal-500/30'
  },
  {
    icon: Cpu,
    title: 'AI Disease & Yield Prediction',
    phase: 'Phase 3: Pipeline',
    description: 'Advanced computer vision models analyzing leaf photos to instantly detect pests and crop disease, recommending preventative actions and updating yield expectations.',
    status: 'pipeline',
    color: 'border-l-purple-500 hover:border-purple-500/30'
  },
  {
    icon: CloudRain,
    title: 'Parametric Crop Insurance',
    phase: 'Phase 4: Future',
    description: 'Weather and drought insurance policies secured by Cardano multi-signature escrow. Payouts execute automatically if regional satellite rain data falls below threshold indexes.',
    status: 'long-term',
    color: 'border-l-orange-500 hover:border-orange-500/30'
  },
  {
    icon: Globe2,
    title: 'Multi-Modal Warehouse & Export Logistics',
    phase: 'Phase 4: Future',
    description: 'Integration of shipping and cold-storage tracking, locking funds across global container logistics, and releasing export customs clearance certificates on-chain.',
    status: 'long-term',
    color: 'border-l-indigo-500 hover:border-indigo-500/30'
  }
];

export const Roadmap: React.FC = () => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 relative">
      
      {/* Background radial highlight */}
      <div className="absolute top-1/3 left-1/3 w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-3xl" />

      {/* Page Title */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white flex items-center space-x-2.5">
          <Milestone className="h-7 w-7 text-emerald-500 animate-pulse-ring" />
          <span>AgriTrust Ecosystem Roadmap</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Foundational Cardano Preview features paving the way for advanced IoT and Agritech integration</p>
      </div>

      {/* Intro info box */}
      <div className="rounded-2xl border border-slate-805 bg-slate-900/40 p-5 flex items-start space-x-3.5">
        <ShieldAlert className="h-5.5 w-5.5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">MVP Trust Layer Foundation</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            By proving that direct peer-to-peer commerce can be secured using Cardano smart contracts and AI price analytics, we establish the core trust network. The modules below detail how future releases will scale this trust across sensory and environmental vectors.
          </p>
        </div>
      </div>

      {/* Roadmap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {ROADMAP.map((item) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.title}
              className={`glass-card rounded-2xl p-5 border-l-4 ${item.color} flex flex-col justify-between space-y-4 transition duration-300`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-350">
                      <Icon className="h-4.5 w-4.5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{item.title}</h3>
                      <span className="text-[10px] text-slate-500">{item.phase}</span>
                    </div>
                  </div>
                  
                  {/* Status pills */}
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase border ${
                    item.status === 'research' 
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : item.status === 'pipeline'
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}>
                    {item.status.replace('-', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              </div>
              
              <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase border-t border-slate-900 pt-3">
                AgriTrust DAO Core Scope
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
export default Roadmap;
