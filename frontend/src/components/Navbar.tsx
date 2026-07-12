import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { Profile, Notification } from '../types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bell, ChevronDown, Check, Users, Globe, Wallet as WalletIcon 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    user, wallet, activeRole, 
    switchRole, switchUser 
  } = useAuth();
  
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [syncTime, setSyncTime] = useState<string>('Just Now');

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const list = await dbService.getProfiles();
      setAllUsers(list);
    };
    fetchUsers();
  }, [user]);

  // Notifications (Activity Center) listener
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const list = await dbService.getNotifications(user.id);
      setNotifications(list);
    };
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Live Sync time simulator
  useEffect(() => {
    const timer = setInterval(() => {
      const rand = Math.random();
      if (rand > 0.7) {
        setSyncTime('Just Now');
      } else if (rand > 0.4) {
        setSyncTime('1s ago');
      } else {
        setSyncTime('3s ago');
      }
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleUserChange = async (userId: string) => {
    await switchUser(userId);
    setShowUserDropdown(false);
    navigate('/dashboard');
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await dbService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-display text-lg font-black tracking-tight text-white uppercase">
              Agri<span className="text-emerald-400">Trust</span>
            </span>
          </Link>
        </div>

        {/* Right Nav Menu items */}
        <div className="flex items-center space-x-4">
          
          {/* Real Network Status Badge */}
          <div className="hidden md:flex items-center space-x-2.5 rounded-xl border border-slate-805 bg-slate-900/40 px-3.5 py-1.5 text-[11px] font-semibold text-slate-300">
            <Globe className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span>Cardano Preview Testnet</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-slate-500 font-mono">Sync: {syncTime}</span>
          </div>

          {/* Connected Wallet Address & Balance */}
          {wallet && (
            <Link 
              to="/wallet" 
              className="flex items-center space-x-2.5 rounded-xl border border-slate-805 bg-slate-900/60 px-3 py-1.5 hover:border-emerald-500/30 hover:bg-slate-850 transition"
            >
              <WalletIcon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono text-[10px] text-slate-400 hidden lg:inline">
                {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
              </span>
              <span className="font-display text-xs font-bold text-emerald-400 shrink-0">
                ₳ {wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ADA
              </span>
            </Link>
          )}

          {/* Quick Profile switcher (Clean team/role toggler format) */}
          {allUsers.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowNotifications(false);
                }}
                className="flex items-center space-x-2 rounded-xl border border-slate-805 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition"
              >
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-semibold hidden sm:inline">{user?.full_name} ({activeRole === 'farmer' ? 'Farmer' : 'Buyer'})</span>
                <span className="font-semibold sm:hidden">{activeRole === 'farmer' ? 'Farmer' : 'Buyer'}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl glow-emerald ring-1 ring-black/5">
                  <div className="px-3 py-2 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Switch Profile
                  </div>
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleUserChange(u.id)}
                      className={`flex w-full items-center justify-between rounded-lg p-2 text-left hover:bg-slate-900 transition ${
                        user?.id === u.id ? 'bg-slate-900/60' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full border border-slate-700 object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                            {u.full_name[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-white leading-tight">{u.full_name}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{u.role} • Trust {u.trust_score}%</p>
                        </div>
                      </div>
                      {user?.id === u.id && <Check className="h-4 w-4 text-emerald-400" />}
                    </button>
                  ))}
                  
                  {/* Quick role toggle */}
                  <div className="border-t border-slate-850 mt-2 pt-2 flex space-x-1 justify-center">
                    <button 
                      onClick={() => { switchRole('farmer'); setShowUserDropdown(false); }}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition ${
                        activeRole === 'farmer' 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Farmer View
                    </button>
                    <button 
                      onClick={() => { switchRole('buyer'); setShowUserDropdown(false); }}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition ${
                        activeRole === 'buyer' 
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Buyer View
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity Center */}
          {user && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserDropdown(false);
                }}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-slate-950">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl glow-blue ring-1 ring-black/5">
                  <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Activity Center</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto pt-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500">
                        No recent activity alerts.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`group flex items-start justify-between rounded-lg p-2.5 hover:bg-slate-900 transition ${
                            !n.read ? 'bg-slate-900/40 border-l-2 border-emerald-500' : ''
                          }`}
                        >
                          <div className="flex flex-col space-y-0.5">
                            <span className="text-[11px] font-medium text-slate-300 pr-3">{n.message}</span>
                            <span className="text-[9px] text-slate-500">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!n.read && (
                            <button
                              onClick={(e) => handleMarkRead(n.id, e)}
                              className="opacity-0 group-hover:opacity-100 flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-emerald-500 hover:text-white transition"
                              title="Mark read"
                            >
                              <Check className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
export default Navbar;
