import { Profile, Wallet, Product, Offer, Order, Contract, BlockchainLog } from '../types';

export const demoService = {
  // Check if demo is currently active
  isDemoActive(): boolean {
    return localStorage.getItem('agritrust_demo_active') === 'true';
  },

  // Clear demo data and restore initial clean state
  clearDemo(): void {
    localStorage.removeItem('agritrust_demo_active');
    localStorage.removeItem('agritrust_profiles');
    localStorage.removeItem('agritrust_wallets');
    localStorage.removeItem('agritrust_products');
    localStorage.removeItem('agritrust_offers');
    localStorage.removeItem('agritrust_orders');
    localStorage.removeItem('agritrust_contracts');
    localStorage.removeItem('agritrust_blockchain_logs');
    localStorage.removeItem('agritrust_notifications');
    localStorage.removeItem('agritrust_wallet_transactions');
  },

  // Seed the entire marketplace sandbox in local storage
  seedMarketplace(): void {
    this.clearDemo();
    localStorage.setItem('agritrust_demo_active', 'true');

    this.seedProfiles();
    this.seedWallets();
    this.seedProducts();
    this.seedOffers();
    this.seedOrders();
    this.seedContracts();
    this.seedLedger();
    this.seedNotifications();
  },

  // 1. Seed Farmer and Buyer Profiles
  seedProfiles(): void {
    const profiles: Profile[] = [
      {
        id: 'farmer-ram-singh-id',
        role: 'farmer',
        full_name: 'Ram Singh',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        trust_score: 97,
        trades_completed: 25,
        is_verified: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'buyer-priya-patel-id',
        role: 'buyer',
        full_name: 'Priya Patel (Organic Foods Ltd)',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        trust_score: 99,
        trades_completed: 42,
        is_verified: true,
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem('agritrust_profiles', JSON.stringify(profiles));
  },

  // 2. Seed Wallets
  seedWallets(): void {
    const wallets: Wallet[] = [
      {
        id: 'wallet-farmer-id',
        user_id: 'farmer-ram-singh-id',
        address: 'addr_test1vrm785k3a8cqu2h8d84mclm7q2shf80a4m0s9lqc7spclqglvjsd3',
        balance: 4500.0,
        locked_balance: 0.0,
        network: 'preview_testnet',
        created_at: new Date().toISOString()
      },
      {
        id: 'wallet-buyer-id',
        user_id: 'buyer-priya-patel-id',
        address: 'addr_test1vp7d29h6s4pq8e2mc8mlmq9j3shf20a2m3s9lqc2spclqgq4hjwd2',
        balance: 13700.0,
        locked_balance: 1500.0, // ₳ 1500 locked for Order 1 (30000 INR * 0.05 ADA rate)
        network: 'preview_testnet',
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem('agritrust_wallets', JSON.stringify(wallets));
  },

  // 3. Seed 5 crop listings
  seedProducts(): void {
    const products: Product[] = [
      {
        id: 'p1',
        farmer_id: 'farmer-ram-singh-id',
        title: 'Punjab Sharbati Organic Wheat',
        description: 'Premium quality Sharbati wheat grains harvested directly from the fertile soils of Punjab plains. Rich in protein and completely pesticide-free.',
        category: 'Grains',
        grade: 'Grade A+',
        price_per_unit: 32.0,
        unit_type: 'kg',
        quantity_available: 1500,
        image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
        created_at: new Date().toISOString()
      },
      {
        id: 'p2',
        farmer_id: 'farmer-ram-singh-id',
        title: 'Vine-Ripened Organic Tomatoes',
        description: 'Freshly plucked vine-ripened tomatoes. Rich crimson red, firm texture, perfect for retail and salads.',
        category: 'Vegetables',
        grade: 'Grade A (Premium)',
        price_per_unit: 28.0,
        unit_type: 'kg',
        quantity_available: 800,
        image_url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=600&q=80',
        created_at: new Date().toISOString()
      },
      {
        id: 'p3',
        farmer_id: 'farmer-ram-singh-id',
        title: 'Premium Long-Grain Basmati Rice',
        description: 'Super fine long-grain traditional Basmati rice. Handpicked, aged, and milled under pristine conditions. Rich aroma.',
        category: 'Grains',
        grade: 'Grade A',
        price_per_unit: 85.0,
        unit_type: 'kg',
        quantity_available: 2000,
        image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
        created_at: new Date().toISOString()
      },
      {
        id: 'p4',
        farmer_id: 'farmer-ram-singh-id',
        title: 'Devgad Organic Alphonso Mangoes',
        description: 'Indulge in sweet, pulpy Alphonso mangoes direct from Devgad orchards. 100% organic carbon-certified harvesting.',
        category: 'Fruits',
        grade: 'Grade A++ (Premium)',
        price_per_unit: 120.0,
        unit_type: 'kg',
        quantity_available: 400,
        image_url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
        created_at: new Date().toISOString()
      },
      {
        id: 'p5',
        farmer_id: 'farmer-ram-singh-id',
        title: 'Nagpur Fresh Sweet Oranges',
        description: 'Fresh, juicy, seedless Nagpur sweet oranges. High vitamin C content, thin peel, rich sweet juice.',
        category: 'Fruits',
        grade: 'Grade A',
        price_per_unit: 55.0,
        unit_type: 'kg',
        quantity_available: 1200,
        image_url: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=600&q=80',
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem('agritrust_products', JSON.stringify(products));
  },

  // 4. Seed 2 Active Negotiations
  seedOffers(): void {
    const offers: Offer[] = [
      {
        id: 'offer-tomatoes-negotiation',
        product_id: 'p2',
        buyer_id: 'buyer-priya-patel-id',
        offer_price: 26.0,
        quantity: 500,
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 'offer-wheat-accepted',
        product_id: 'p1',
        buyer_id: 'buyer-priya-patel-id',
        offer_price: 30.0, // Farmer accepted counter or initial 30 INR bid
        quantity: 1000,
        status: 'accepted',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    localStorage.setItem('agritrust_offers', JSON.stringify(offers));
  },

  // 5. Seed Orders (1 active order in escrow locking stage)
  seedOrders(): void {
    const orders: Order[] = [
      {
        id: 'order-wheat-escrow-id',
        offer_id: 'offer-wheat-accepted',
        buyer_id: 'buyer-priya-patel-id',
        farmer_id: 'farmer-ram-singh-id',
        product_id: 'p1',
        total_amount: 30000.0, // 30 INR * 1000 kg
        status: 'funds_locked',
        created_at: new Date(Date.now() - 1800000).toISOString()
      }
    ];
    localStorage.setItem('agritrust_orders', JSON.stringify(orders));
  },

  // 6. Seed Smart Contract
  seedContracts(): void {
    const contracts: Contract[] = [
      {
        id: 'contract-wheat-plutus-id',
        order_id: 'order-wheat-escrow-id',
        contract_address: 'addr_test1_plutus_escrow_order_wheat',
        status: 'funded',
        tx_hash: '0x9fb8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8',
        created_at: new Date(Date.now() - 900000).toISOString()
      }
    ];
    localStorage.setItem('agritrust_contracts', JSON.stringify(contracts));
  },

  // 7. Seed 6 blocks on Trust Ledger
  seedLedger(): void {
    const logs: BlockchainLog[] = [
      {
        id: 'block-id-1',
        block_number: 100,
        tx_hash: '0x3a4b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
        action: 'GENESIS_BLOCK',
        data: { message: 'AgriTrust Trust Ledger Genesis Block successfully mined.' },
        prev_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'block-id-2',
        block_number: 101,
        tx_hash: '0xe5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4',
        action: 'FARMER_VERIFIED',
        data: { farmer_name: 'Ram Singh', identity_hash: '0xabcde12345' },
        prev_hash: '0x3a4b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
        created_at: new Date(Date.now() - 72000000).toISOString()
      },
      {
        id: 'block-id-3',
        block_number: 102,
        tx_hash: '0xd6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5',
        action: 'BUYER_VERIFIED',
        data: { buyer_name: 'Priya Patel (Organic Foods Ltd)', identity_hash: '0xxyz9876' },
        prev_hash: '0xe5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4',
        created_at: new Date(Date.now() - 57600000).toISOString()
      },
      {
        id: 'block-id-4',
        block_number: 103,
        tx_hash: '0xb2f4d6a8c0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4',
        action: 'PRODUCT_LISTED',
        data: { productId: 'p1', cropName: 'Punjab Sharbati Organic Wheat', quantity: 1500, pricePerUnit: 32 },
        prev_hash: '0xd6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'block-id-5',
        block_number: 104,
        tx_hash: '0x1a3b5c7d9e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b',
        action: 'OFFER_ACCEPTED',
        data: { offerId: 'offer-wheat-accepted', orderId: 'order-wheat-escrow-id', amount: 30000 },
        prev_hash: '0xb2f4d6a8c0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4',
        created_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'block-id-6',
        block_number: 105,
        tx_hash: '0x9fb8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8',
        action: 'ESCROW_LOCKED',
        data: { orderId: 'order-wheat-escrow-id', contract: 'addr_test1_plutus_escrow_order_wheat', amountAda: 1500 },
        prev_hash: '0x1a3b5c7d9e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b',
        created_at: new Date(Date.now() - 900000).toISOString()
      }
    ];
    localStorage.setItem('agritrust_blockchain_logs', JSON.stringify(logs));
  },

  // 8. Seed notifications
  seedNotifications(): void {
    const notifications = [
      {
        id: 'notif-1',
        user_id: 'farmer-ram-singh-id',
        message: 'New bid received for Vine-Ripened Tomatoes: ₳ 26/kg from Priya Patel',
        type: 'offer',
        read: false,
        created_at: new Date().toISOString()
      },
      {
        id: 'notif-2',
        user_id: 'farmer-ram-singh-id',
        message: 'Escrow payment locked! ₳ 1500 has been staked in Plutus validator address for Sharbati Wheat.',
        type: 'escrow',
        read: false,
        created_at: new Date(Date.now() - 900000).toISOString()
      },
      {
        id: 'notif-3',
        user_id: 'buyer-priya-patel-id',
        message: 'Congratulations! Your offer for Sharbati Organic Wheat was ACCEPTED by Ram Singh.',
        type: 'offer',
        read: false,
        created_at: new Date(Date.now() - 1800000).toISOString()
      }
    ];
    localStorage.setItem('agritrust_notifications', JSON.stringify(notifications));
  }
};
export default demoService;
