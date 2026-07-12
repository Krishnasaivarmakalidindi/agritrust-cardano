import { dbService } from './dbService';
import { Wallet, WalletTransaction } from '../types';
import { ServiceResponse, makeResponse, makeErrorResponse } from '../types/api';

export const walletService = {
  // Create a new wallet record
  async createWallet(userId: string, address: string): Promise<ServiceResponse<Wallet>> {
    try {
      const newWallet: Wallet = {
        id: `wallet-${userId}`,
        user_id: userId,
        address,
        balance: 10000.0,
        locked_balance: 0.0,
        network: 'preview_testnet',
        created_at: new Date().toISOString()
      };

      const data = await dbService.createWallet(newWallet);
      return makeResponse(true, 'Wallet created successfully.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error creating wallet: ${err.message}`, err.message);
    }
  },

  // Retrieve wallet details for a user
  async getWallet(userId: string): Promise<ServiceResponse<Wallet>> {
    try {
      const data = await dbService.getWallet(userId);
      if (!data) return makeErrorResponse('Wallet not found.');
      return makeResponse(true, 'Wallet retrieved successfully.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error fetching wallet: ${err.message}`, err.message);
    }
  },

  // Credit funds to a wallet address
  async credit(walletId: string, amount: number): Promise<ServiceResponse<Wallet>> {
    try {
      const wallet = await dbService.getWalletById(walletId);
      if (!wallet) {
        return makeErrorResponse('Wallet not found to credit.');
      }

      const updated = await dbService.updateWallet(wallet.id, {
        balance: Number(wallet.balance) + amount
      });
      if (!updated) return makeErrorResponse('Wallet update failed.');

      // Record transaction
      const newTx: WalletTransaction = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        wallet_id: walletId,
        amount,
        type: 'deposit',
        status: 'confirmed',
        tx_hash: `0x${Math.random().toString(36).substring(2, 18)}`,
        created_at: new Date().toISOString()
      };
      await dbService.createWalletTransaction(newTx);

      return makeResponse(true, 'Funds credited successfully.', updated);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error crediting wallet: ${err.message}`, err.message);
    }
  },

  // Debit funds from a wallet balance
  async debit(walletId: string, amount: number): Promise<ServiceResponse<Wallet>> {
    try {
      const wallet = await dbService.getWalletById(walletId);
      if (!wallet) {
        return makeErrorResponse('Wallet not found to debit.');
      }

      if (Number(wallet.balance) < amount) {
        return makeErrorResponse('Insufficient available balance.');
      }

      const updated = await dbService.updateWallet(wallet.id, {
        balance: Number(wallet.balance) - amount
      });
      if (!updated) return makeErrorResponse('Wallet update failed.');

      return makeResponse(true, 'Funds debited successfully.', updated);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error debiting wallet: ${err.message}`, err.message);
    }
  },

  // Lock available funds into escrow balance (Buyer locks payment)
  async lockFunds(walletId: string, amount: number): Promise<ServiceResponse<Wallet>> {
    try {
      const wallet = await dbService.getWalletById(walletId);
      if (!wallet) {
        return makeErrorResponse('Wallet not found to lock funds.');
      }

      if (Number(wallet.balance) < amount) {
        return makeErrorResponse('Insufficient funds to lock in escrow contract.');
      }

      const updated = await dbService.updateWallet(wallet.id, {
        balance: Number(wallet.balance) - amount,
        locked_balance: Number(wallet.locked_balance) + amount
      });
      if (!updated) return makeErrorResponse('Wallet update failed.');

      // Record lock transaction
      const newTx: WalletTransaction = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        wallet_id: walletId,
        amount,
        type: 'escrow_lock',
        status: 'confirmed',
        tx_hash: `0x${Math.random().toString(36).substring(2, 18)}`,
        created_at: new Date().toISOString()
      };
      await dbService.createWalletTransaction(newTx);

      return makeResponse(true, 'Funds locked in escrow contract address.', updated);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected lock funds error: ${err.message}`, err.message);
    }
  },

  // Release locked escrow funds to the seller's wallet balance
  async releaseFunds(buyerWalletId: string, farmerWalletId: string, amount: number): Promise<ServiceResponse<boolean>> {
    try {
      // 1. Deduct locked balance from buyer
      const buyerWallet = await dbService.getWalletById(buyerWalletId);
      if (!buyerWallet) {
        return makeErrorResponse('Buyer wallet not found.');
      }

      await dbService.updateWallet(buyerWalletId, {
        locked_balance: Math.max(0, Number(buyerWallet.locked_balance) - amount)
      });

      // 2. Add balance to farmer
      const farmerWallet = await dbService.getWalletById(farmerWalletId);
      if (!farmerWallet) {
        return makeErrorResponse('Farmer wallet not found.');
      }

      await dbService.updateWallet(farmerWalletId, {
        balance: Number(farmerWallet.balance) + amount
      });

      // Record transaction for buyer
      const buyerTx: WalletTransaction = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        wallet_id: buyerWalletId,
        amount,
        type: 'escrow_release',
        status: 'confirmed',
        tx_hash: `0x${Math.random().toString(36).substring(2, 18)}`,
        created_at: new Date().toISOString()
      };
      await dbService.createWalletTransaction(buyerTx);

      // Record transaction for farmer
      const farmerTx: WalletTransaction = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        wallet_id: farmerWalletId,
        amount,
        type: 'deposit',
        status: 'confirmed',
        tx_hash: `0x${Math.random().toString(36).substring(2, 18)}`,
        created_at: new Date().toISOString()
      };
      await dbService.createWalletTransaction(farmerTx);

      return makeResponse(true, 'Funds released from escrow script successfully.', true);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error releasing funds: ${err.message}`, err.message);
    }
  },

  // Simulated Cardano Faucet increment
  async simulateFaucet(walletId: string, amount = 1000.0): Promise<ServiceResponse<Wallet>> {
    return this.credit(walletId, amount);
  },

  // Retrieve transaction history for a wallet
  async getTransactions(walletId: string): Promise<ServiceResponse<WalletTransaction[]>> {
    try {
      const data = await dbService.getWalletTransactions(walletId);
      return makeResponse(true, 'Transactions retrieved.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected transaction fetch error: ${err.message}`, err.message);
    }
  }
};
export default walletService;
