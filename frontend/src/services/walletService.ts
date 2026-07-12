import { supabase } from './supabaseClient';
import { Wallet } from '../types';
import { ServiceResponse, makeResponse, makeErrorResponse } from '../types/api';

export const walletService = {
  // Create a new wallet record (called automatically during signup handle_new_user)
  async createWallet(userId: string, address: string): Promise<ServiceResponse<Wallet>> {
    try {
      const newWallet = {
        user_id: userId,
        address,
        balance: 10000.0,
        locked_balance: 0.0,
        network: 'preview_testnet'
      };

      const { data, error } = await supabase
        .from('wallets')
        .insert(newWallet)
        .select()
        .single();

      if (error) {
        return makeErrorResponse(`Failed to create wallet: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Wallet created successfully.', data as Wallet);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error creating wallet: ${err.message}`, err.message);
    }
  },

  // Retrieve wallet details for a user
  async getWallet(userId: string): Promise<ServiceResponse<Wallet>> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        return makeErrorResponse(`Failed to retrieve wallet: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Wallet retrieved successfully.', data as Wallet);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error fetching wallet: ${err.message}`, err.message);
    }
  },

  // Credit funds to a wallet address
  async credit(walletId: string, amount: number): Promise<ServiceResponse<Wallet>> {
    try {
      // Fetch current balance
      const { data: wallet, error: fetchErr } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', walletId)
        .single();

      if (fetchErr || !wallet) {
        return makeErrorResponse('Wallet not found to credit.', fetchErr?.message);
      }

      const { data, error } = await supabase
        .from('wallets')
        .update({ balance: Number(wallet.balance) + amount })
        .eq('id', walletId)
        .select()
        .single();

      if (error) {
        return makeErrorResponse(`Failed to credit wallet: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Funds credited successfully.', data as Wallet);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error crediting wallet: ${err.message}`, err.message);
    }
  },

  // Debit funds from a wallet balance
  async debit(walletId: string, amount: number): Promise<ServiceResponse<Wallet>> {
    try {
      // Fetch current balance
      const { data: wallet, error: fetchErr } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', walletId)
        .single();

      if (fetchErr || !wallet) {
        return makeErrorResponse('Wallet not found to debit.', fetchErr?.message);
      }

      if (Number(wallet.balance) < amount) {
        return makeErrorResponse('Insufficient available balance.');
      }

      const { data, error } = await supabase
        .from('wallets')
        .update({ balance: Number(wallet.balance) - amount })
        .eq('id', walletId)
        .select()
        .single();

      if (error) {
        return makeErrorResponse(`Failed to debit wallet: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Funds debited successfully.', data as Wallet);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error debiting wallet: ${err.message}`, err.message);
    }
  },

  // Lock available funds into escrow balance (Buyer locks payment)
  async lockFunds(walletId: string, amount: number): Promise<ServiceResponse<Wallet>> {
    try {
      const { data: wallet, error: fetchErr } = await supabase
        .from('wallets')
        .select('balance, locked_balance')
        .eq('id', walletId)
        .single();

      if (fetchErr || !wallet) {
        return makeErrorResponse('Wallet not found to lock funds.', fetchErr?.message);
      }

      if (Number(wallet.balance) < amount) {
        return makeErrorResponse('Insufficient funds to lock in escrow contract.');
      }

      const { data, error } = await supabase
        .from('wallets')
        .update({
          balance: Number(wallet.balance) - amount,
          locked_balance: Number(wallet.locked_balance) + amount
        })
        .eq('id', walletId)
        .select()
        .single();

      if (error) {
        return makeErrorResponse(`Failed to lock funds: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Funds locked in escrow contract address.', data as Wallet);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected lock funds error: ${err.message}`, err.message);
    }
  },

  // Release locked escrow funds to the seller's wallet balance
  async releaseFunds(buyerWalletId: string, farmerWalletId: string, amount: number): Promise<ServiceResponse<boolean>> {
    try {
      // 1. Deduct locked balance from buyer
      const { data: buyerWallet, error: buyerErr } = await supabase
        .from('wallets')
        .select('locked_balance')
        .eq('id', buyerWalletId)
        .single();

      if (buyerErr || !buyerWallet) {
        return makeErrorResponse('Buyer wallet not found.', buyerErr?.message);
      }

      await supabase
        .from('wallets')
        .update({
          locked_balance: Math.max(0, Number(buyerWallet.locked_balance) - amount)
        })
        .eq('id', buyerWalletId);

      // 2. Add balance to farmer
      const { data: farmerWallet, error: farmerErr } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', farmerWalletId)
        .single();

      if (farmerErr || !farmerWallet) {
        return makeErrorResponse('Farmer wallet not found.', farmerErr?.message);
      }

      await supabase
        .from('wallets')
        .update({
          balance: Number(farmerWallet.balance) + amount
        })
        .eq('id', farmerWalletId);

      return makeResponse(true, 'Funds released from escrow script successfully.', true);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error releasing funds: ${err.message}`, err.message);
    }
  },

  // Simulated Cardano Faucet increment
  async simulateFaucet(walletId: string, amount = 1000.0): Promise<ServiceResponse<Wallet>> {
    return this.credit(walletId, amount);
  }
};
export default walletService;
