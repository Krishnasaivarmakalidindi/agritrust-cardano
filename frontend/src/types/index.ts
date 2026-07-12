export type UserRole = 'farmer' | 'buyer' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  trust_score: number;
  trades_completed: number;
  is_verified: boolean;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  address: string;
  balance: number;
  locked_balance: number;
  network: string;
  created_at: string;
}

export interface Product {
  id: string;
  farmer_id: string;
  title: string;
  description: string;
  category: string;
  grade: string;
  price_per_unit: number;
  unit_type: string;
  quantity_available: number;
  image_url?: string;
  created_at: string;
  farmer?: Profile;
}

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered';

export interface Offer {
  id: string;
  product_id: string;
  buyer_id: string;
  offer_price: number;
  quantity: number;
  status: OfferStatus;
  counter_price?: number;
  created_at: string;
  product?: Product;
  buyer?: Profile;
}

export type OrderStatus =
  | 'negotiated'
  | 'contract_generated'
  | 'buyer_signed'
  | 'funds_locked'
  | 'farmer_signed'
  | 'shipment_started'
  | 'buyer_confirmed'
  | 'funds_released'
  | 'contract_closed';

export interface Order {
  id: string;
  offer_id?: string;
  buyer_id: string;
  farmer_id: string;
  product_id: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  product?: Product;
  buyer?: Profile;
  farmer?: Profile;
  contract?: Contract;
}

export interface Contract {
  id: string;
  order_id: string;
  contract_address: string;
  status: 'active' | 'funded' | 'released' | 'refunded' | 'closed';
  tx_hash?: string;
  created_at: string;
}

export type WalletTransactionType = 'deposit' | 'withdrawal' | 'escrow_lock' | 'escrow_release' | 'fee';

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: WalletTransactionType;
  status: 'pending' | 'confirmed';
  tx_hash?: string;
  created_at: string;
}

export interface Review {
  id: string;
  farmer_id: string;
  buyer_id: string;
  rating: number;
  review?: string;
  order_id: string;
  created_at: string;
  buyer?: Profile;
}

export interface BlockchainLog {
  id: string;
  block_number: number;
  tx_hash: string;
  action: string;
  data: any;
  prev_hash?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}
