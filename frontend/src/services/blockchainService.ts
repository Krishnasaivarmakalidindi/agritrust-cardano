import { dbService } from './dbService';
import { Wallet, Order } from '../types';

export const blockchainService = {
  // Generate a mock Plutus Validator Address for Cardano
  generateContractAddress(orderId: string): string {
    return `addr_test1z${orderId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}escrowhash381`;
  },

  // Mines an event on our Trust Ledger
  async mineBlock(action: string, data: any): Promise<string> {
    const log = await dbService.createBlockchainLog({
      action,
      data
    });
    return log.tx_hash;
  },

  // 1. Contract Generated
  async createContract(order: Order, buyerWallet: Wallet, farmerWallet: Wallet): Promise<{ contractAddress: string; txHash: string }> {
    const contractAddress = this.generateContractAddress(order.id);
    
    // Create Cardano tx hash
    const txHash = '0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Save Contract record
    await dbService.createContract({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      order_id: order.id,
      contract_address: contractAddress,
      status: 'active',
      tx_hash: txHash,
      created_at: new Date().toISOString()
    });

    // Mine block
    await this.mineBlock('CONTRACT_GENERATED', {
      orderId: order.id,
      contractAddress,
      buyerAddress: buyerWallet.address,
      farmerAddress: farmerWallet.address,
      amountAda: Math.round(order.total_amount * 0.05) // 1 INR = ~0.05 ADA in demo
    });

    return { contractAddress, txHash };
  },

  // 2. Lock Funds in Escrow Contract
  async lockFunds(order: Order, buyerWallet: Wallet, amountAda: number): Promise<string> {
    const contract = await dbService.getContractForOrder(order.id);
    if (!contract) throw new Error('Contract not found for order');

    // 1. Deduct ADA from buyer wallet balance, move to locked balance
    const newBuyerBalance = buyerWallet.balance - amountAda;
    const newBuyerLocked = buyerWallet.locked_balance + amountAda;

    await dbService.updateWallet(buyerWallet.id, {
      balance: newBuyerBalance,
      locked_balance: newBuyerLocked
    });

    // 2. Create Wallet Transactions
    await dbService.createWalletTransaction({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      wallet_id: buyerWallet.id,
      amount: amountAda,
      type: 'escrow_lock',
      status: 'confirmed',
      tx_hash: contract.tx_hash,
      created_at: new Date().toISOString()
    });

    // 3. Update contract status
    await dbService.updateContract(contract.id, {
      status: 'funded'
    });

    // 4. Mine block
    const lockTxHash = '0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await this.mineBlock('ESCROW_LOCKED', {
      orderId: order.id,
      contractAddress: contract.contract_address,
      lockedAmountAda: amountAda,
      buyerWalletAddress: buyerWallet.address,
      txHash: lockTxHash
    });

    return lockTxHash;
  },

  // 3. Release Funds to Farmer Wallet
  async releaseFunds(order: Order, buyerWallet: Wallet, farmerWallet: Wallet, amountAda: number): Promise<string> {
    const contract = await dbService.getContractForOrder(order.id);
    if (!contract) throw new Error('Contract not found for order');

    // 1. Release buyer's locked balance
    const newBuyerLocked = Math.max(0, buyerWallet.locked_balance - amountAda);
    await dbService.updateWallet(buyerWallet.id, {
      locked_balance: newBuyerLocked
    });

    // 2. Add ADA to farmer's wallet balance
    const newFarmerBalance = farmerWallet.balance + amountAda;
    await dbService.updateWallet(farmerWallet.id, {
      balance: newFarmerBalance
    });

    // 3. Record transactions
    const releaseTxHash = '0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Farmer transaction (deposit)
    await dbService.createWalletTransaction({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      wallet_id: farmerWallet.id,
      amount: amountAda,
      type: 'escrow_release',
      status: 'confirmed',
      tx_hash: releaseTxHash,
      created_at: new Date().toISOString()
    });

    // Update contract status
    await dbService.updateContract(contract.id, {
      status: 'released'
    });

    // 4. Mine block
    await this.mineBlock('FUNDS_RELEASED', {
      orderId: order.id,
      contractAddress: contract.contract_address,
      releasedAmountAda: amountAda,
      farmerWalletAddress: farmerWallet.address,
      txHash: releaseTxHash
    });

    return releaseTxHash;
  },

  // 4. Mint Reputation NFT
  async mintReputationNFT(orderId: string, farmer: any, buyer: any, totalAmount: number): Promise<{ nftId: string; txHash: string }> {
    const nftId = `nft_reputation_trade_${orderId.replace(/[^0-9]/g, '').slice(0, 4) || '104'}`;
    const txHash = '0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Mine block representing NFT creation
    await this.mineBlock('NFT_MINTED', {
      orderId,
      nftTokenId: nftId,
      policyId: 'policy_reputation_v1_cardano_preview_hash',
      metadata: {
        name: `AgriTrust Trade Certificate #${nftId.split('_').pop()}`,
        farmerName: farmer.full_name,
        buyerName: buyer.full_name,
        tradeValueINR: totalAmount,
        cardanoNetwork: 'preview_testnet',
        verificationAuthority: 'AgriTrust DAO'
      },
      txHash
    });

    return { nftId, txHash };
  }
};
export default blockchainService;
