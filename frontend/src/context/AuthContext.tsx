import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Wallet } from '../types';
import { dbService, initLocalDatabase } from '../services/dbService';

interface AuthContextType {
  user: Profile | null;
  wallet: Wallet | null;
  activeRole: 'farmer' | 'buyer' | null;
  isDemoMode: boolean;
  loading: boolean;
  signUp: (fullName: string, role: 'farmer' | 'buyer') => Promise<Profile>;
  login: (userId: string) => Promise<Profile>;
  logout: () => void;
  switchRole: (role: 'farmer' | 'buyer') => void;
  toggleDemoMode: () => void;
  refreshWallet: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  seedDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [activeRole, setActiveRole] = useState<'farmer' | 'buyer' | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true); // Default to true for easy hackathon demo!
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize Auth State
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const storedUserId = localStorage.getItem('agritrust_current_user_id');
        const storedRole = localStorage.getItem('agritrust_active_role');
        const storedDemoMode = localStorage.getItem('agritrust_demo_mode');
        
        if (storedDemoMode !== null) {
          setIsDemoMode(storedDemoMode === 'true');
        }

        if (storedUserId) {
          const profile = await dbService.getProfile(storedUserId);
          if (profile) {
            setUser(profile);
            const userWallet = await dbService.getWallet(profile.id);
            setWallet(userWallet);
            setActiveRole((storedRole as 'farmer' | 'buyer') || profile.role);
          } else {
            // Clean up if profile not found
            localStorage.removeItem('agritrust_current_user_id');
          }
        } else {
          // If in Demo Mode and no user, auto-select Farmer Ram Singh as default
          const profiles = await dbService.getProfiles();
          const defaultUser = profiles.find(p => p.role === 'farmer');
          if (defaultUser) {
            setUser(defaultUser);
            const userWallet = await dbService.getWallet(defaultUser.id);
            setWallet(userWallet);
            setActiveRole('farmer');
            localStorage.setItem('agritrust_current_user_id', defaultUser.id);
            localStorage.setItem('agritrust_active_role', 'farmer');
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const refreshWallet = async () => {
    if (user) {
      const userWallet = await dbService.getWallet(user.id);
      setWallet(userWallet);
    }
  };

  const signUp = async (fullName: string, role: 'farmer' | 'buyer'): Promise<Profile> => {
    setLoading(true);
    try {
      const newUserId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      const newProfile: Profile = {
        id: newUserId,
        role,
        full_name: fullName,
        trust_score: 100,
        trades_completed: 0,
        is_verified: true, // Auto-verify in demo
        created_at: new Date().toISOString()
      };

      const newWallet: Wallet = {
        id: `wallet-${newUserId}`,
        user_id: newUserId,
        address: `addr_test1v${Math.random().toString(36).substring(2, 12)}...`,
        balance: 10000.0,
        locked_balance: 0.0,
        network: 'preview_testnet',
        created_at: new Date().toISOString()
      };

      const createdProfile = await dbService.createProfile(newProfile);
      await dbService.createWallet(newWallet);
      
      // Log block to Trust Ledger
      await dbService.createBlockchainLog({
        action: role === 'farmer' ? 'FARMER_VERIFIED' : 'BUYER_VERIFIED',
        data: { name: fullName, wallet: newWallet.address }
      });

      setUser(createdProfile);
      setWallet(newWallet);
      setActiveRole(role);
      localStorage.setItem('agritrust_current_user_id', createdProfile.id);
      localStorage.setItem('agritrust_active_role', role);
      
      return createdProfile;
    } finally {
      setLoading(false);
    }
  };

  const login = async (userId: string): Promise<Profile> => {
    setLoading(true);
    try {
      const profile = await dbService.getProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }
      const userWallet = await dbService.getWallet(profile.id);
      setUser(profile);
      setWallet(userWallet);
      setActiveRole(profile.role as 'farmer' | 'buyer');
      localStorage.setItem('agritrust_current_user_id', profile.id);
      localStorage.setItem('agritrust_active_role', profile.role);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setWallet(null);
    setActiveRole(null);
    localStorage.removeItem('agritrust_current_user_id');
    localStorage.removeItem('agritrust_active_role');
  };

  const switchRole = (role: 'farmer' | 'buyer') => {
    setActiveRole(role);
    localStorage.setItem('agritrust_active_role', role);
  };

  const switchUser = async (userId: string) => {
    setLoading(true);
    try {
      const profile = await dbService.getProfile(userId);
      if (profile) {
        setUser(profile);
        const userWallet = await dbService.getWallet(profile.id);
        setWallet(userWallet);
        setActiveRole(profile.role as 'farmer' | 'buyer');
        localStorage.setItem('agritrust_current_user_id', profile.id);
        localStorage.setItem('agritrust_active_role', profile.role);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleDemoMode = () => {
    const nextVal = !isDemoMode;
    setIsDemoMode(nextVal);
    localStorage.setItem('agritrust_demo_mode', String(nextVal));
  };

  const seedDemoData = () => {
    initLocalDatabase(true); // Force reset localstorage database
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        activeRole,
        isDemoMode,
        loading,
        signUp,
        login,
        logout,
        switchRole,
        toggleDemoMode,
        refreshWallet,
        switchUser,
        seedDemoData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default useAuth;
