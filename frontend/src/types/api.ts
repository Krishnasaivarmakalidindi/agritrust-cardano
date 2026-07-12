import { UserRole } from './index';

// Standardized Service Response Envelope
export interface ServiceResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  error: string | null;
}

// Helper to construct standard responses
export const makeResponse = <T>(
  success: boolean,
  message: string,
  data: T | null = null,
  error: string | null = null
): ServiceResponse<T> => {
  return { success, message, data, error };
};

export const makeErrorResponse = <T>(
  message: string,
  error: string | null = null
): ServiceResponse<T> => {
  return { success: false, message, data: null, error };
};

// DTO Interfaces for Service Methods

export interface RegisterDTO {
  fullName: string;
  role: UserRole;
  email?: string;
  password?: string;
}

export interface CreateProductDTO {
  title: string;
  description?: string;
  category: string;
  grade: string;
  price_per_unit: number;
  unit_type: string;
  quantity_available: number;
  image_url?: string;
}

export interface CreateOfferDTO {
  product_id: string;
  offer_price: number;
  quantity: number;
}

export interface CreateOrderDTO {
  offer_id?: string;
  buyer_id: string;
  farmer_id: string;
  product_id: string;
  total_amount: number;
}

export interface CreateContractDTO {
  order_id: string;
  contract_address: string;
  tx_hash?: string;
}

export interface CreateWalletTransactionDTO {
  wallet_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'escrow_lock' | 'escrow_release' | 'fee';
  tx_hash?: string;
}

export interface CreateReviewDTO {
  farmer_id: string;
  rating: number;
  review?: string;
  order_id: string;
}

export interface CreateBlockDTO {
  action: 
    | 'FARMER_VERIFIED' 
    | 'PRODUCT_LISTED' 
    | 'OFFER_ACCEPTED' 
    | 'ESCROW_LOCKED' 
    | 'PRODUCT_SHIPPED' 
    | 'DELIVERY_CONFIRMED' 
    | 'FUNDS_RELEASED' 
    | 'FAUCET_CLAIMED' 
    | 'GENESIS_BLOCK' 
    | 'NFT_MINTED' 
    | 'BUYER_VERIFIED';
  data: any;
}
