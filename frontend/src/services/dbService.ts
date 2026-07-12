import { supabase } from './supabaseClient';
import { 
  Profile, Wallet, Product, Offer, Order, 
  Contract, WalletTransaction, Review, BlockchainLog, Notification 
} from '../types';

// Mock Database Initial State
const MOCK_PROFILES: Profile[] = [
  {
    id: 'farmer-ram-singh-id',
    role: 'farmer',
    full_name: 'Ram Singh',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    trust_score: 97,
    trades_completed: 25,
    is_verified: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'buyer-organic-id',
    role: 'buyer',
    full_name: 'Priya Patel (Organic Foods Ltd)',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    trust_score: 99,
    trades_completed: 42,
    is_verified: true,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_WALLETS: Wallet[] = [
  {
    id: 'wallet-farmer-id',
    user_id: 'farmer-ram-singh-id',
    address: 'addr_test1vrm785k3a8cqu2h8d84mclm7q2shf80a4m0s9lqc7spclqglvjsd3',
    balance: 4500.0, // ADA
    locked_balance: 0.0,
    network: 'preview_testnet',
    created_at: new Date().toISOString()
  },
  {
    id: 'wallet-buyer-id',
    user_id: 'buyer-organic-id',
    address: 'addr_test1vp7d29h6s4pq8e2mc8mlmq9j3shf20a2m3s9lqc2spclqgq4hjwd2',
    balance: 15200.0, // ADA
    locked_balance: 0.0,
    network: 'preview_testnet',
    created_at: new Date().toISOString()
  }
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-tomatoes-id',
    farmer_id: 'farmer-ram-singh-id',
    title: 'Organic Vine-Ripened Tomatoes',
    description: 'Freshly harvested organic tomatoes, rich red, perfect grade, pesticide-free. Harvested directly from soil of Punjab plains.',
    category: 'Vegetables',
    grade: 'Grade A (Premium)',
    price_per_unit: 28, // INR per kg
    unit_type: 'kg',
    quantity_available: 850,
    image_url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=600&q=80',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-wheat-id',
    farmer_id: 'farmer-ram-singh-id',
    title: 'Golden Sharbati Wheat grains',
    description: 'Highly premium wheat grains with rich golden sheen and maximum gluten strength. Cultivated under natural conditions.',
    category: 'Grains',
    grade: 'Grade A+',
    price_per_unit: 34, // INR per kg
    unit_type: 'kg',
    quantity_available: 2400,
    image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_LEDGERS: BlockchainLog[] = [
  {
    id: 'block-genesis-id',
    block_number: 100,
    tx_hash: '0x3a4b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
    action: 'GENESIS_BLOCK',
    data: { message: 'AgriTrust Trust Ledger Initialized on Cardano Preview Testnet' },
    prev_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'block-farmer-id',
    block_number: 101,
    tx_hash: '0xe5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4',
    action: 'FARMER_VERIFIED',
    data: { farmer_name: 'Ram Singh', wallet: 'addr_test1vrm785k3a8cqu...' },
    prev_hash: '0x3a4b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
    created_at: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Helper to check if Supabase is alive and tables exist
let isSupabaseWorking = true;

const checkSupabase = async (): Promise<boolean> => {
  if (!isSupabaseWorking) return false;
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      isSupabaseWorking = false;
      return false;
    }
    return true;
  } catch (e) {
    isSupabaseWorking = false;
    return false;
  }
};

// LocalStorage helpers
const getLocal = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(`agritrust_${key}`);
  if (!data) {
    localStorage.setItem(`agritrust_${key}`, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(data);
};

const setLocal = <T>(key: string, value: T): void => {
  localStorage.setItem(`agritrust_${key}`, JSON.stringify(value));
};

// Initialize Local Mock DB
export const initLocalDatabase = (force = false) => {
  if (force || !localStorage.getItem('agritrust_profiles')) {
    setLocal('profiles', MOCK_PROFILES);
    setLocal('wallets', MOCK_WALLETS);
    setLocal('products', MOCK_PRODUCTS);
    setLocal('offers', []);
    setLocal('orders', []);
    setLocal('contracts', []);
    setLocal('wallet_transactions', []);
    setLocal('reviews', []);
    setLocal('blockchain_logs', MOCK_LEDGERS);
    setLocal('notifications', []);
  }
};

// Auto-run on load
initLocalDatabase();

export const dbService = {
  // Profiles
  async getProfiles(): Promise<Profile[]> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) return data as Profile[];
    }
    return getLocal<Profile[]>('profiles', []);
  },

  async getProfile(id: string): Promise<Profile | null> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (!error && data) return data as Profile;
    }
    const list = getLocal<Profile[]>('profiles', []);
    return list.find(p => p.id === id) || null;
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
      if (!error && data) return data as Profile;
    }
    const list = getLocal<Profile[]>('profiles', []);
    const idx = list.findIndex(p => p.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      setLocal('profiles', list);
      return list[idx];
    }
    return null;
  },

  async createProfile(profile: Profile): Promise<Profile> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('profiles').insert(profile).select().single();
      if (!error && data) return data as Profile;
    }
    const list = getLocal<Profile[]>('profiles', []);
    if (!list.some(p => p.id === profile.id)) {
      list.push(profile);
      setLocal('profiles', list);
    }
    return profile;
  },

  // Wallets
  async getWallet(userId: string): Promise<Wallet | null> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId).single();
      if (!error && data) return data as Wallet;
    }
    const list = getLocal<Wallet[]>('wallets', []);
    return list.find(w => w.user_id === userId) || null;
  },

  async createWallet(wallet: Wallet): Promise<Wallet> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('wallets').insert(wallet).select().single();
      if (!error && data) return data as Wallet;
    }
    const list = getLocal<Wallet[]>('wallets', []);
    if (!list.some(w => w.user_id === wallet.user_id)) {
      list.push(wallet);
      setLocal('wallets', list);
    }
    return wallet;
  },

  async updateWallet(id: string, updates: Partial<Wallet>): Promise<Wallet | null> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('wallets').update(updates).eq('id', id).select().single();
      if (!error && data) return data as Wallet;
    }
    const list = getLocal<Wallet[]>('wallets', []);
    const idx = list.findIndex(w => w.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      setLocal('wallets', list);
      return list[idx];
    }
    return null;
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('products').select('*, farmer:profiles(*)');
      if (!error && data) return data as Product[];
    }
    const products = getLocal<Product[]>('products', []);
    const profiles = getLocal<Profile[]>('profiles', []);
    return products.map(p => ({
      ...p,
      farmer: profiles.find(f => f.id === p.farmer_id)
    }));
  },

  async createProduct(product: Product): Promise<Product> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('products').insert(product).select().single();
      if (!error && data) return data as Product;
    }
    const list = getLocal<Product[]>('products', []);
    list.push(product);
    setLocal('products', list);
    return product;
  },

  // Offers
  async getOffers(userId: string): Promise<Offer[]> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase
        .from('offers')
        .select('*, product:products(*, farmer:profiles(*)), buyer:profiles(*)')
        .or(`buyer_id.eq.${userId},product.farmer_id.eq.${userId}`);
      if (!error && data) return data as unknown as Offer[];
    }
    const offers = getLocal<Offer[]>('offers', []);
    const products = await this.getProducts();
    const profiles = getLocal<Profile[]>('profiles', []);
    
    return offers
      .filter(o => {
        const prod = products.find(p => p.id === o.product_id);
        return o.buyer_id === userId || (prod && prod.farmer_id === userId);
      })
      .map(o => {
        const prod = products.find(p => p.id === o.product_id);
        return {
          ...o,
          product: prod,
          buyer: profiles.find(p => p.id === o.buyer_id)
        };
      });
  },

  async createOffer(offer: Offer): Promise<Offer> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('offers').insert(offer).select().single();
      if (!error && data) return data as Offer;
    }
    const list = getLocal<Offer[]>('offers', []);
    list.push(offer);
    setLocal('offers', list);
    return offer;
  },

  async updateOffer(id: string, updates: Partial<Offer>): Promise<Offer | null> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('offers').update(updates).eq('id', id).select().single();
      if (!error && data) return data as Offer;
    }
    const list = getLocal<Offer[]>('offers', []);
    const idx = list.findIndex(o => o.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      setLocal('offers', list);
      return list[idx];
    }
    return null;
  },

  // Orders
  async getOrders(userId: string): Promise<Order[]> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, product:products(*), buyer:profiles(*), farmer:profiles(*)')
        .or(`buyer_id.eq.${userId},farmer_id.eq.${userId}`);
      if (!error && data) return data as unknown as Order[];
    }
    const orders = getLocal<Order[]>('orders', []);
    const products = await this.getProducts();
    const profiles = getLocal<Profile[]>('profiles', []);

    return orders
      .filter(o => o.buyer_id === userId || o.farmer_id === userId)
      .map(o => ({
        ...o,
        product: products.find(p => p.id === o.product_id),
        buyer: profiles.find(p => p.id === o.buyer_id),
        farmer: profiles.find(p => p.id === o.farmer_id)
      }));
  },

  async getOrder(id: string): Promise<Order | null> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, product:products(*), buyer:profiles(*), farmer:profiles(*)')
        .eq('id', id)
        .single();
      if (!error && data) return data as unknown as Order;
    }
    const orders = getLocal<Order[]>('orders', []);
    const order = orders.find(o => o.id === id);
    if (!order) return null;
    const products = await this.getProducts();
    const profiles = getLocal<Profile[]>('profiles', []);
    return {
      ...order,
      product: products.find(p => p.id === order.product_id),
      buyer: profiles.find(p => p.id === order.buyer_id),
      farmer: profiles.find(p => p.id === order.farmer_id)
    };
  },

  async createOrder(order: Order): Promise<Order> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('orders').insert(order).select().single();
      if (!error && data) return data as Order;
    }
    const list = getLocal<Order[]>('orders', []);
    list.push(order);
    setLocal('orders', list);
    return order;
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
      if (!error && data) return data as Order;
    }
    const list = getLocal<Order[]>('orders', []);
    const idx = list.findIndex(o => o.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      setLocal('orders', list);
      return list[idx];
    }
    return null;
  },

  // Contracts
  async getContractForOrder(orderId: string): Promise<Contract | null> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('contracts').select('*').eq('order_id', orderId).single();
      if (!error && data) return data as Contract;
    }
    const list = getLocal<Contract[]>('contracts', []);
    return list.find(c => c.order_id === orderId) || null;
  },

  async createContract(contract: Contract): Promise<Contract> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('contracts').insert(contract).select().single();
      if (!error && data) return data as Contract;
    }
    const list = getLocal<Contract[]>('contracts', []);
    list.push(contract);
    setLocal('contracts', list);
    return contract;
  },

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract | null> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('contracts').update(updates).eq('id', id).select().single();
      if (!error && data) return data as Contract;
    }
    const list = getLocal<Contract[]>('contracts', []);
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      setLocal('contracts', list);
      return list[idx];
    }
    return null;
  },

  // Wallet Transactions
  async getWalletTransactions(walletId: string): Promise<WalletTransaction[]> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('wallet_transactions').select('*').eq('wallet_id', walletId).order('created_at', { ascending: false });
      if (!error && data) return data as WalletTransaction[];
    }
    const list = getLocal<WalletTransaction[]>('wallet_transactions', []);
    return list
      .filter(t => t.wallet_id === walletId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createWalletTransaction(tx: WalletTransaction): Promise<WalletTransaction> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('wallet_transactions').insert(tx).select().single();
      if (!error && data) return data as WalletTransaction;
    }
    const list = getLocal<WalletTransaction[]>('wallet_transactions', []);
    list.push(tx);
    setLocal('wallet_transactions', list);
    return tx;
  },

  // Reviews
  async getReviewsForFarmer(farmerId: string): Promise<Review[]> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('reviews').select('*, buyer:profiles(*)').eq('farmer_id', farmerId);
      if (!error && data) return data as Review[];
    }
    const reviews = getLocal<Review[]>('reviews', []);
    const profiles = getLocal<Profile[]>('profiles', []);
    return reviews
      .filter(r => r.farmer_id === farmerId)
      .map(r => ({
        ...r,
        buyer: profiles.find(p => p.id === r.buyer_id)
      }));
  },

  async createReview(review: Review): Promise<Review> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('reviews').insert(review).select().single();
      if (!error && data) return data as Review;
    }
    const list = getLocal<Review[]>('reviews', []);
    list.push(review);
    setLocal('reviews', list);

    // Update farmer trust score and trade count dynamically
    const orders = getLocal<Order[]>('orders', []);
    const farmerId = review.farmer_id;
    const farmerReviews = list.filter(r => r.farmer_id === farmerId);
    const avgRating = farmerReviews.reduce((sum, r) => sum + r.rating, 0) / farmerReviews.length;
    
    // Simple trust score calculation: (avgRating / 5) * 60 + 40 (bonus for completes)
    const baseScore = Math.round((avgRating / 5) * 50 + 50); 
    const finalScore = Math.min(100, Math.max(50, baseScore));

    const profiles = getLocal<Profile[]>('profiles', []);
    const fIdx = profiles.findIndex(p => p.id === farmerId);
    if (fIdx !== -1) {
      profiles[fIdx].trust_score = finalScore;
      profiles[fIdx].trades_completed += 1;
      setLocal('profiles', profiles);
    }

    return review;
  },

  // Blockchain logs / Trust Ledger
  async getBlockchainLogs(): Promise<BlockchainLog[]> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('blockchain_logs').select('*').order('block_number', { ascending: false });
      if (!error && data) return data as BlockchainLog[];
    }
    const logs = getLocal<BlockchainLog[]>('blockchain_logs', []);
    return [...logs].sort((a, b) => b.block_number - a.block_number);
  },

  async createBlockchainLog(log: Omit<BlockchainLog, 'id' | 'block_number' | 'prev_hash' | 'created_at' | 'tx_hash'>): Promise<BlockchainLog> {
    const logs = getLocal<BlockchainLog[]>('blockchain_logs', []);
    const lastBlock = logs.sort((a, b) => b.block_number - a.block_number)[0];
    const newBlockNumber = lastBlock ? lastBlock.block_number + 1 : 100;
    const prevHash = lastBlock ? lastBlock.tx_hash : '0x0000000000000000000000000000000000000000000000000000000000000000';
    
    // Hash generator mock
    const sha256Mock = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return '0x' + Math.abs(hash).toString(16).padStart(8, '0') + Math.random().toString(36).substring(2, 10);
    };

    const finalLog: BlockchainLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      block_number: newBlockNumber,
      tx_hash: sha256Mock(log.action + JSON.stringify(log.data) + prevHash),
      action: log.action,
      data: log.data,
      prev_hash: prevHash,
      created_at: new Date().toISOString()
    };

    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('blockchain_logs').insert(finalLog).select().single();
      if (!error && data) return data as BlockchainLog;
    }

    logs.push(finalLog);
    setLocal('blockchain_logs', logs);
    return finalLog;
  },

  // Notifications / Activity
  async getNotifications(userId: string): Promise<Notification[]> {
    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) return data as Notification[];
    }
    const list = getLocal<Notification[]>('notifications', []);
    return list
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createNotification(notification: Omit<Notification, 'id' | 'read' | 'created_at'>): Promise<Notification> {
    const finalNotification: Notification = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      user_id: notification.user_id,
      message: notification.message,
      type: notification.type,
      read: false,
      created_at: new Date().toISOString()
    };

    const live = await checkSupabase();
    if (live) {
      const { data, error } = await supabase.from('notifications').insert(finalNotification).select().single();
      if (!error && data) return data as Notification;
    }

    const list = getLocal<Notification[]>('notifications', []);
    list.push(finalNotification);
    setLocal('notifications', list);
    return finalNotification;
  },

  async markNotificationRead(id: string): Promise<void> {
    const live = await checkSupabase();
    if (live) {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    }
    const list = getLocal<Notification[]>('notifications', []);
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx].read = true;
      setLocal('notifications', list);
    }
  }
};
export default dbService;
