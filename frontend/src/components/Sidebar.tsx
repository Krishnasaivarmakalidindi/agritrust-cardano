import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { calculateTrustScore } from '../utils/trustScore';
import { 
  LayoutDashboard, Wallet, Database, 
  ShoppingBag, LogOut, ShieldCheck, UserCheck, MessageSquare, Ship
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, activeRole, logout } = useAuth();
  const location = useLocation();
  const activeTab = new URLSearchParams(location.search).get('tab');

  const navItems = activeRole === 'farmer' ? [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard?tab=products', label: 'My Products', icon: ShoppingBag },
    { to: '/dashboard?tab=negotiations', label: 'Negotiations', icon: MessageSquare },
    { to: '/dashboard?tab=orders', label: 'Orders', icon: Ship },
    { to: '/wallet', label: 'Wallet', icon: Wallet },
    { to: '/ledger', label: 'Trust Ledger', icon: Database },
    { to: '/dashboard?tab=profile', label: 'Profile', icon: UserCheck }
  ] : [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard?tab=products', label: 'Marketplace', icon: ShoppingBag },
    { to: '/dashboard?tab=orders', label: 'Orders', icon: Ship },
    { to: '/dashboard?tab=negotiations', label: 'Negotiations', icon: MessageSquare },
    { to: '/wallet', label: 'Wallet', icon: Wallet },
    { to: '/ledger', label: 'Trust Ledger', icon: Database },
    { to: '/dashboard?tab=profile', label: 'Profile', icon: UserCheck }
  ];

  return (
    <aside className="w-64 border-r border-slate-900 bg-slate-950/40 p-4 hidden md:flex flex-col justify-between shrink-0 h-[calc(100vh-64px)] sticky top-16 font-display">
      <div className="space-y-6">
        
        {/* User Mini Profile */}
        {user && (
          <div className="rounded-xl border border-slate-805 bg-slate-900/40 p-3.5 flex flex-col space-y-2.5">
            <div className="flex items-center space-x-3">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.full_name} 
                  className="h-10 w-10 rounded-full border border-slate-700 object-cover" 
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-slate-850 border border-slate-750 flex items-center justify-center font-bold text-white uppercase text-xs">
                  {user.full_name[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate leading-none">{user.full_name}</p>
                <div className="flex items-center space-x-1.5 mt-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-slate-400 capitalize font-medium">{activeRole}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Trust Score Indicator */}
            <div className="border-t border-slate-850 pt-2.5 space-y-1.5 text-[10px] text-slate-450 font-mono">
              <div className="flex justify-between items-center">
                <span>Trust Score:</span>
                <span className="text-emerald-400 font-bold font-display text-xs">
                  {calculateTrustScore(user, true)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Completed Trades:</span>
                <span className="text-white font-semibold">{user.trades_completed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Network Node:</span>
                <span className="flex items-center space-x-0.5 text-emerald-400">
                  <ShieldCheck className="h-3 w-3 shrink-0 animate-pulse" />
                  <span className="font-semibold text-[9px]">Verified</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            
            // Determine custom active logic based on path name and search query params
            const isTabActive = item.to.includes('?tab=') 
              ? activeTab === new URLSearchParams(item.to.split('?')[1]).get('tab')
              : location.pathname === item.to && !activeTab;

            return (
              <NavLink
                key={idx}
                to={item.to}
                className={`flex items-center space-x-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                  isTabActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 glow-emerald'
                    : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout & Footer */}
      <div className="space-y-3">
        {user && (
          <button
            onClick={logout}
            className="flex w-full items-center space-x-3 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            <span>Logout Profile</span>
          </button>
        )}
        <div className="text-[9px] text-slate-500 space-y-0.5 border-t border-slate-900 pt-3 font-mono">
          <p className="font-semibold">AgriTrust Platform</p>
          <p>Cardano Preview v1.0.2</p>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
