import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile, Wallet } from '../types';
import { supabase } from '../services/supabaseClient';

// ─── Demo account credentials ─────────────────────────────────────────────────
const DEMO_FARMER = { email: 'farmer@agritrust.demo', password: 'AgriTrust2024!', name: 'Ram Singh', role: 'farmer' as const };
const DEMO_BUYER  = { email: 'buyer@agritrust.demo',  password: 'AgriTrust2024!', name: 'Priya Patel (Organic Foods Ltd)', role: 'buyer'  as const };

// ─── Context type ─────────────────────────────────────────────────────────────
interface AuthContextType {
  user:         Profile | null;
  wallet:       Wallet  | null;
  activeRole:   'farmer' | 'buyer' | null;
  loading:      boolean;
  signUp:       (fullName: string, role: 'farmer' | 'buyer', email: string, password: string) => Promise<Profile>;
  login:        (email: string, password: string) => Promise<Profile>;
  logout:       () => Promise<void>;
  switchRole:   (role: 'farmer' | 'buyer') => void;
  refreshWallet:() => Promise<void>;
  switchUser:   (demoRole: 'farmer' | 'buyer') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fetchProfile = async (uid: string): Promise<Profile | null> => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
  if (error || !data) return null;
  return data as Profile;
};

const fetchWallet = async (uid: string): Promise<Wallet | null> => {
  const { data, error } = await supabase.from('wallets').select('*').eq('user_id', uid).single();
  if (error || !data) return null;
  return data as Wallet;
};

// ─── Provider ────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user,       setUser]       = useState<Profile | null>(null);
  const [wallet,     setWallet]     = useState<Wallet  | null>(null);
  const [activeRole, setActiveRole] = useState<'farmer' | 'buyer' | null>(null);
  const [loading,    setLoading]    = useState(true);

  // Load profile + wallet for a given auth uid
  const loadSession = useCallback(async (uid: string) => {
    // Retry up to 3 times – trigger may still be running
    let profile: Profile | null = null;
    for (let i = 0; i < 3; i++) {
      profile = await fetchProfile(uid);
      if (profile) break;
      await new Promise(r => setTimeout(r, 800));
    }
    if (!profile) return;
    const w = await fetchWallet(uid);
    setUser(profile);
    setWallet(w);
    setActiveRole(profile.role as 'farmer' | 'buyer');
  }, []);

  // ── Boot: restore existing Supabase session ───────────────────────────────
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        await loadSession(session.user.id);
      }
      if (mounted) setLoading(false);
    };

    init();

    // Live session listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setLoading(true);
        await loadSession(session.user.id);
        setLoading(false);
      } else {
        setUser(null);
        setWallet(null);
        setActiveRole(null);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [loadSession]);

  // ── refreshWallet ─────────────────────────────────────────────────────────
  const refreshWallet = async () => {
    if (!user) return;
    const w = await fetchWallet(user.id);
    setWallet(w);
  };

  // ── signUp ────────────────────────────────────────────────────────────────
  const signUp = async (
    fullName: string,
    role: 'farmer' | 'buyer',
    email: string,
    password: string
  ): Promise<Profile> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } }
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Signup failed: no user returned.');

      // Wait for trigger to create profile
      let profile: Profile | null = null;
      for (let i = 0; i < 5; i++) {
        profile = await fetchProfile(data.user.id);
        if (profile) break;
        await new Promise(r => setTimeout(r, 800));
      }
      if (!profile) throw new Error('Profile creation timed out. Please refresh.');
      return profile;
    } finally {
      setLoading(false);
    }
  };

  // ── login ─────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<Profile> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Login failed.');
      const profile = await fetchProfile(data.user.id);
      if (!profile) throw new Error('Profile not found.');
      return profile;
    } finally {
      setLoading(false);
    }
  };

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setWallet(null);
    setActiveRole(null);
  };

  // ── switchRole (UI only) ──────────────────────────────────────────────────
  const switchRole = (role: 'farmer' | 'buyer') => setActiveRole(role);

  // ── switchUser: Quick-Access demo login ───────────────────────────────────
  const switchUser = async (demoRole: 'farmer' | 'buyer') => {
    setLoading(true);
    try {
      const creds = demoRole === 'farmer' ? DEMO_FARMER : DEMO_BUYER;

      // Try to sign in
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password
      });

      if (!signInErr && signInData.user) {
        // Account exists – session is set, onAuthStateChange handles the rest
        return;
      }

      // First time: create the demo account
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: creds.email,
        password: creds.password,
        options: { data: { full_name: creds.name, role: creds.role } }
      });
      if (signUpErr) throw new Error(signUpErr.message);
      if (!signUpData.user) throw new Error('Demo account creation failed.');

      // Wait for trigger
      await new Promise(r => setTimeout(r, 1200));

      // Patch demo profile with realistic trust score / verification
      const demoMeta = demoRole === 'farmer'
        ? { trust_score: 97, trades_completed: 25, is_verified: true }
        : { trust_score: 99, trades_completed: 42, is_verified: true };

      await supabase.from('profiles').update(demoMeta).eq('id', signUpData.user.id);

      // Seed 2 demo products for the farmer
      if (demoRole === 'farmer') {
        await supabase.from('products').insert([
          {
            farmer_id: signUpData.user.id,
            title: 'Organic Vine-Ripened Tomatoes',
            description: 'Freshly harvested organic tomatoes, rich red, Grade A, pesticide-free. Punjab plains.',
            category: 'Vegetables',
            grade: 'Grade A (Premium)',
            price_per_unit: 28,
            unit_type: 'kg',
            quantity_available: 850,
            image_url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=600&q=80'
          },
          {
            farmer_id: signUpData.user.id,
            title: 'Golden Sharbati Wheat Grains',
            description: 'Premium wheat grains with rich golden sheen and maximum gluten strength.',
            category: 'Grains',
            grade: 'Grade A+',
            price_per_unit: 34,
            unit_type: 'kg',
            quantity_available: 2400,
            image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80'
          }
        ]);
      }

      // Sign in after creation
      await supabase.auth.signInWithPassword({ email: creds.email, password: creds.password });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, wallet, activeRole, loading,
      signUp, login, logout, switchRole, refreshWallet, switchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
export default useAuth;
