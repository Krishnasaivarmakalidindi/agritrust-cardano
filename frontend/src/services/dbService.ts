import { supabase } from './supabaseClient';
import {
  Profile, Wallet, Product, Offer, Order,
  Contract, WalletTransaction, Review, BlockchainLog, Notification
} from '../types';

// ─── Supabase availability (cached per session) ───────────────────────────────
let _available: boolean | null = null;

const isSupabaseAvailable = async (): Promise<boolean> => {
  if (_available !== null) return _available;
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    _available = false;
    return false;
  }
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    _available = !error;
  } catch {
    _available = false;
  }
  return _available!;
};

// Reset cache so next call re-checks (called after auth events)
export const resetSupabaseCache = () => { _available = null; };

// ─── dbService ────────────────────────────────────────────────────────────────
export const dbService = {

  // ── Profiles ──────────────────────────────────────────────────────────────
  async getProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw new Error(error.message);
    return (data ?? []) as Profile[];
  },

  async getProfile(id: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) return null;
    return data as Profile;
  },

  async createProfile(profile: Profile): Promise<Profile> {
    const { data, error } = await supabase.from('profiles').upsert(profile).select().single();
    if (error) throw new Error(error.message);
    return data as Profile;
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
    if (error) return null;
    return data as Profile;
  },

  // ── Wallets ───────────────────────────────────────────────────────────────
  async getWallet(userId: string): Promise<Wallet | null> {
    const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId).single();
    if (error) return null;
    return data as Wallet;
  },

  async getWalletById(walletId: string): Promise<Wallet | null> {
    const { data, error } = await supabase.from('wallets').select('*').eq('id', walletId).single();
    if (error) return null;
    return data as Wallet;
  },

  async createWallet(wallet: Omit<Wallet, 'id'> & { id?: string }): Promise<Wallet> {
    const { data, error } = await supabase.from('wallets').insert(wallet).select().single();
    if (error) throw new Error(error.message);
    return data as Wallet;
  },

  async updateWallet(id: string, updates: Partial<Wallet>): Promise<Wallet | null> {
    const { data, error } = await supabase.from('wallets').update(updates).eq('id', id).select().single();
    if (error) return null;
    return data as Wallet;
  },

  // ── Products ──────────────────────────────────────────────────────────────
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, farmer:profiles!farmer_id(*)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Product[];
  },

  async createProduct(product: Omit<Product, 'id'> & { id?: string }): Promise<Product> {
    const { id: _id, farmer: _farmer, ...insertPayload } = product as any;
    const { data, error } = await supabase.from('products').insert(insertPayload).select().single();
    if (error) throw new Error(error.message);
    return data as Product;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const { farmer: _f, ...rest } = updates as any;
    const { data, error } = await supabase.from('products').update(rest).eq('id', id).select().single();
    if (error) return null;
    return data as Product;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    return !error;
  },

  // ── Offers ────────────────────────────────────────────────────────────────
  async getOffers(userId: string): Promise<Offer[]> {
    // Fetch as buyer
    const { data: asBuyer } = await supabase
      .from('offers')
      .select('*, product:products!product_id(*, farmer:profiles!farmer_id(*)), buyer:profiles!buyer_id(*)')
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    // Fetch as farmer (offers on my products)
    const { data: asFarmer } = await supabase
      .from('offers')
      .select('*, product:products!product_id(*, farmer:profiles!farmer_id(*)), buyer:profiles!buyer_id(*)')
      .eq('products.farmer_id', userId)
      .order('created_at', { ascending: false });

    // Merge and deduplicate
    const all = [...(asBuyer ?? []), ...(asFarmer ?? [])];
    const seen = new Set<string>();
    return all.filter(o => { if (seen.has(o.id)) return false; seen.add(o.id); return true; }) as unknown as Offer[];
  },

  async getOffersForFarmer(farmerId: string): Promise<Offer[]> {
    // Get all products for this farmer
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('farmer_id', farmerId);
    
    if (!products || products.length === 0) return [];
    
    const productIds = products.map(p => p.id);
    const { data, error } = await supabase
      .from('offers')
      .select('*, product:products!product_id(*, farmer:profiles!farmer_id(*)), buyer:profiles!buyer_id(*)')
      .in('product_id', productIds)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return (data ?? []) as unknown as Offer[];
  },

  async createOffer(offer: Omit<Offer, 'id'> & { id?: string }): Promise<Offer> {
    const { id: _id, product: _p, buyer: _b, ...insertPayload } = offer as any;
    const { data, error } = await supabase.from('offers').insert(insertPayload).select().single();
    if (error) throw new Error(error.message);
    return data as Offer;
  },

  async updateOffer(id: string, updates: Partial<Offer>): Promise<Offer | null> {
    const { product: _p, buyer: _b, ...rest } = updates as any;
    const { data, error } = await supabase.from('offers').update(rest).eq('id', id).select().single();
    if (error) return null;
    return data as Offer;
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  async getOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, product:products!product_id(*), buyer:profiles!buyer_id(*), farmer:profiles!farmer_id(*), contract:contracts!order_id(*)')
      .or(`buyer_id.eq.${userId},farmer_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Order[];
  },

  async getOrder(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, product:products!product_id(*), buyer:profiles!buyer_id(*), farmer:profiles!farmer_id(*), contract:contracts!order_id(*)')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as unknown as Order;
  },

  async createOrder(order: Omit<Order, 'id'> & { id?: string }): Promise<Order> {
    const { id: _id, product: _p, buyer: _b, farmer: _f, contract: _c, ...insertPayload } = order as any;
    const { data, error } = await supabase.from('orders').insert(insertPayload).select().single();
    if (error) throw new Error(error.message);
    return data as Order;
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    const { product: _p, buyer: _b, farmer: _f, contract: _c, ...rest } = updates as any;
    const { data, error } = await supabase.from('orders').update(rest).eq('id', id).select().single();
    if (error) return null;
    return data as Order;
  },

  // ── Contracts ─────────────────────────────────────────────────────────────
  async getContractForOrder(orderId: string): Promise<Contract | null> {
    const { data, error } = await supabase.from('contracts').select('*').eq('order_id', orderId).single();
    if (error) return null;
    return data as Contract;
  },

  async createContract(contract: Omit<Contract, 'id'> & { id?: string }): Promise<Contract> {
    const { id: _id, ...insertPayload } = contract as any;
    const { data, error } = await supabase.from('contracts').insert(insertPayload).select().single();
    if (error) throw new Error(error.message);
    return data as Contract;
  },

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract | null> {
    const { data, error } = await supabase.from('contracts').update(updates).eq('id', id).select().single();
    if (error) return null;
    return data as Contract;
  },

  // ── Wallet Transactions ───────────────────────────────────────────────────
  async getWalletTransactions(walletId: string): Promise<WalletTransaction[]> {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as WalletTransaction[];
  },

  async createWalletTransaction(tx: Omit<WalletTransaction, 'id'> & { id?: string }): Promise<WalletTransaction> {
    const { id: _id, ...insertPayload } = tx as any;
    const { data, error } = await supabase.from('wallet_transactions').insert(insertPayload).select().single();
    if (error) throw new Error(error.message);
    return data as WalletTransaction;
  },

  // ── Reviews ───────────────────────────────────────────────────────────────
  async getReviewsForFarmer(farmerId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, buyer:profiles!buyer_id(*)')
      .eq('farmer_id', farmerId);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Review[];
  },

  async createReview(review: Omit<Review, 'id'> & { id?: string }): Promise<Review> {
    const { id: _id, buyer: _b, ...insertPayload } = review as any;
    const { data, error } = await supabase.from('reviews').insert(insertPayload).select().single();
    if (error) throw new Error(error.message);

    // Recalculate trust score
    const allReviews = await this.getReviewsForFarmer(review.farmer_id);
    if (allReviews.length > 0) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      const score = Math.min(100, Math.max(50, Math.round((avg / 5) * 50 + 50)));
      await supabase.from('profiles').update({
        trust_score: score,
        trades_completed: allReviews.length
      }).eq('id', review.farmer_id);
    }

    return data as Review;
  },

  // ── Blockchain Logs ───────────────────────────────────────────────────────
  async getBlockchainLogs(): Promise<BlockchainLog[]> {
    const { data, error } = await supabase
      .from('blockchain_logs')
      .select('*')
      .order('block_number', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as BlockchainLog[];
  },

  async createBlockchainLog(log: Pick<BlockchainLog, 'action' | 'data'>): Promise<BlockchainLog> {
    // Fetch tip block
    const { data: tip } = await supabase
      .from('blockchain_logs')
      .select('block_number, tx_hash')
      .order('block_number', { ascending: false })
      .limit(1)
      .single();

    const prevBlock = tip ?? { block_number: 99, tx_hash: '0x' + '0'.repeat(64) };
    const nextNumber = prevBlock.block_number + 1;
    const prevHash   = prevBlock.tx_hash;

    // Simple deterministic hash
    const raw   = log.action + JSON.stringify(log.data) + prevHash;
    let h = 0;
    for (let i = 0; i < raw.length; i++) { h = (h << 5) - h + raw.charCodeAt(i); h |= 0; }
    const txHash = '0x' + Math.abs(h).toString(16).padStart(8, '0') + Math.random().toString(36).substring(2, 18);

    const payload = { block_number: nextNumber, tx_hash: txHash, action: log.action, data: log.data, prev_hash: prevHash };
    const { data, error } = await supabase.from('blockchain_logs').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as BlockchainLog;
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Notification[];
  },

  async createNotification(notification: Pick<Notification, 'user_id' | 'message' | 'type'>): Promise<Notification> {
    const payload = { ...notification, read: false };
    const { data, error } = await supabase.from('notifications').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as Notification;
  },

  async markNotificationRead(id: string): Promise<void> {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  }
};

export default dbService;
