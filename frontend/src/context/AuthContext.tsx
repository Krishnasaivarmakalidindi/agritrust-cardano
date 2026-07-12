import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Wallet } from '../types';
import { dbService } from '../services/dbService';
import { demoService } from '../services/demoService';

interface AuthContextType {
  user: Profile | null;
  wallet: Wallet | null;
  activeRole: 'farmer' | 'buyer' | null;
  loading: boolean;
  signUp: (fullName: string, role: 'farmer' | 'buyer') => Promise<Profile>;
  login: (userId: string) => Promise<Profile>;
  logout: () => void;
  switchRole: (role: 'farmer' | 'buyer') => void;
  refreshWallet: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [activeRole, setActiveRole] = useState<'farmer' | 'buyer' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize Auth State (automatically boots with Ram Singh or Priya Patel if offline / sandbox)
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        // Ensure default data is seeded once in background if empty
        if (!localStorage.getItem('agritrust_profiles')) {
          demoService.seedMarketplace();
        }

        const storedUserId = localStorage.getItem('agritrust_current_user_id');
        const storedRole = localStorage.getItem('agritrust_active_role');
        
        if (storedUserId) {
          const profile = await dbService.getProfile(storedUserId);
          if (profile) {
            setUser(profile);
            const userWallet = await dbService.getWallet(profile.id);
            setWallet(userWallet);
            setActiveRole((storedRole as 'farmer' | 'buyer') || profile.role);
          }
        } else {
          // Default to Ram Singh (Farmer) for first boot experience if none set
          const profiles = await dbService.getProfiles();
          const defaultUser = profiles.find(p => p.id === 'farmer-ram-singh-id') || profiles[0];
          if (defaultUser) {
            setUser(defaultUser);
            const userWallet = await dbService.getWallet(defaultUser.id);
            setWallet(userWallet);
            setActiveRole(defaultUser.role as 'farmer' | 'buyer');
            localStorage.setItem('agritrust_current_user_id', defaultUser.id);
            localStorage.setItem('agritrust_active_role', defaultUser.role);
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
        is_verified: true,
        created_at: new Date().toISOString()
      };

      const newWallet: Wallet = {
        id: `wallet-${newUserId}`,
        user_id: newUserId,
        address: `addr_test1v${Math.random().toString(36).substring(2, 12)}`,
        balance: 10000.0,
        locked_balance: 0.0,
        network: 'preview_testnet',
        created_at: new Date().toISOString()
      };

      const createdProfile = await dbService.createProfile(newProfile);
      await dbService.createWallet(newWallet);
      
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

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        activeRole,
        loading,
        signUp,
        login,
        logout,
        switchRole,
        refreshWallet,
        switchUser
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
