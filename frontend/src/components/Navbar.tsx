import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { supabase } from '../services/supabaseClient';
import { Notification } from '../types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Globe, Wallet as WalletIcon, LogOut, ShieldCheck, User, Zap } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, wallet, activeRole, logout } = useAuth();

  const [showUserDropdown,  setShowUserDropdown]  = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications,     setNotifications]     = useState<Notification[]>([]);
  const [syncTime,          setSyncTime]           = useState('Live');

  const navigate = useNavigate();
  const location = useLocation();

  // Notifications + Realtime
  useEffect(() => {
    if (!user) return;
    const fetchN = async () => {
      const list = await dbService.getNotifications(user.id);
      setNotifications(list);
    };
    fetchN();
    const ch = supabase
      .channel(`notif-navbar-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchN)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => {
      setSyncTime(['Live', 'Just now', '1s ago'][Math.floor(Math.random() * 3)]);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await dbService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleLogout = async () => {
    setShowUserDropdown(false);
    await logout();
    navigate('/onboarding');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6">

        {/* Brand */}
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 shadow-sm">
            <span className="text-white font-black text-sm tracking-tight">AT</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-black text-sm tracking-tight text-gray-900">AgriTrust</span>
            <span className="text-emerald-600 font-mono text-[9px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">v1.0</span>
          </div>
        </Link>

        {/* Right */}
        <div className="flex items-center gap-2">

          {/* Network badge */}
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Globe className="h-3 w-3 text-emerald-600" />
              <span className="text-[10px] font-semibold text-emerald-700">Preview Testnet</span>
              <span className="text-[9px] text-emerald-500 font-mono">{syncTime}</span>
            </div>
          )}

          {/* Wallet pill */}
          {wallet && (
            <Link
              to="/wallet"
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm hover:border-emerald-200 hover:shadow transition"
            >
              <WalletIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="font-mono text-[10px] text-gray-500 hidden lg:inline">
                {wallet.address.slice(0, 8)}…{wallet.address.slice(-4)}
              </span>
              <span className="font-bold text-xs text-emerald-600 shrink-0">
                ₳ {Number(wallet.balance).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </Link>
          )}

          {/* User menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => { setShowUserDropdown(v => !v); setShowNotifications(false); }}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-sm hover:border-gray-300 transition"
              >
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black text-white uppercase ${activeRole === 'farmer' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                  {user.full_name[0]}
                </div>
                <span className="font-semibold text-gray-800 hidden sm:inline max-w-[100px] truncate">{user.full_name.split(' ')[0]}</span>
                <span className={`hidden sm:inline text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${
                  activeRole === 'farmer' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>{activeRole}</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden z-50 animate-slide-up">
                  <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900 truncate">{user.full_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize border ${
                        activeRole === 'farmer' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>{activeRole}</span>
                      {user.is_verified && (
                        <span className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold">
                          <ShieldCheck className="h-3 w-3" />Verified
                        </span>
                      )}
                      <span className="text-[9px] text-gray-400 ml-auto">⭐ {user.trust_score}%</span>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <Link to="/dashboard?tab=profile" onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition">
                      <User className="h-3.5 w-3.5 text-gray-400" />View Profile
                    </Link>
                    <Link to="/wallet" onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition">
                      <WalletIcon className="h-3.5 w-3.5 text-gray-400" />Wallet
                    </Link>
                    <div className="my-1 border-t border-gray-100" />
                    <button onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 transition">
                      <LogOut className="h-3.5 w-3.5" />Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          {user && (
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(v => !v); setShowUserDropdown(false); }}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm text-gray-500 hover:text-gray-900 hover:border-gray-300 transition"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-100 bg-white shadow-xl z-50 overflow-hidden animate-slide-up">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-emerald-500" />
                      <p className="text-xs font-bold text-gray-900">Activity Feed</p>
                    </div>
                    <span className="text-[10px] text-gray-400">{unreadCount} unread</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">No activity yet</p>
                      </div>
                    ) : notifications.map(n => (
                      <div key={n.id} onClick={e => handleMarkRead(n.id, e)}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${!n.read ? 'bg-emerald-50/50' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs leading-snug ${!n.read ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{n.message}</p>
                          {!n.read && <div className="h-2 w-2 rounded-full bg-emerald-500 mt-0.5 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleTimeString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!user && location.pathname !== '/onboarding' && (
            <Link to="/onboarding"
              className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 shadow-sm transition">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
