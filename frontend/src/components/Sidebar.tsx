import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, LayoutDashboard, Wallet, Database, 
  Map, Info, Milestone, UserCheck 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, activeRole } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: activeRole === 'farmer' ? 'Farmer Hub' : 'Marketplace',
      icon: LayoutDashboard,
    },
    {
      to: '/wallet',
      label: 'Cardano Wallet',
      icon: Wallet,
    },
    {
      to: '/explorer',
      label: 'Trust Ledger',
      icon: Database,
    },
    {
      to: '/roadmap',
      label: 'Ecosystem Future',
      icon: Milestone,
    }
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/40 p-4 hidden md:flex flex-col justify-between shrink-0 h-[calc(100vh-64px)] sticky top-16">
      <div className="space-y-6">
        
        {/* User Mini Profile */}
        {user && (
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 flex items-center space-x-3">
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.full_name} 
                className="h-10 w-10 rounded-full border border-slate-700 object-cover" 
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center font-bold text-white uppercase">
                {user.full_name[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate leading-tight">{user.full_name}</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-slate-400 capitalize font-medium">{user.role} • Trust {user.trust_score}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 glow-emerald'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="text-[10px] text-slate-500 space-y-1 border-t border-slate-900 pt-3">
        <p className="font-semibold">AgriTrust Cardano Preview</p>
        <p>© 2026 AgriTrust Corp.</p>
        <p>Smart Contract v1.0.2</p>
      </div>
    </aside>
  );
};
export default Sidebar;
