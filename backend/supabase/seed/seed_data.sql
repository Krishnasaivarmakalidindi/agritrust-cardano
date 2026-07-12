-- AgriTrust Mock Database Seeding Script
-- Target: PostgreSQL (Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Seed Test User Profiles
-- ==========================================

-- Note: In Supabase, auth.users has foreign keys.
-- For a standalone SQL script running on Supabase SQL Editor, we assume user IDs exist.
-- We seed profiles directly for mock testing. If auth.users are not registered yet,
-- these profiles map to dummy UUIDs that can be claimed by developers.

INSERT INTO public.profiles (id, role, full_name, avatar_url, trust_score, trades_completed, is_verified)
VALUES
    (
        'f0000000-0000-0000-0000-000000000001',
        'farmer',
        'Ram Singh',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        97,
        25,
        true
    ),
    (
        'b0000000-0000-0000-0000-000000000001',
        'buyer',
        'Priya Patel (Organic Foods Ltd)',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        99,
        42,
        true
    )
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 2. Seed Cardano Wallets
-- ==========================================
INSERT INTO public.wallets (id, user_id, address, balance, locked_balance, network)
VALUES
    (
        'w0000000-0000-0000-0000-000000000001',
        'f0000000-0000-0000-0000-000000000001',
        'addr_test1vrm785k3a8cqu2h8d84mclm7q2shf80a4m0s9lqc7spclqglvjsd3',
        4500.0,
        0.0,
        'preview_testnet'
    ),
    (
        'w0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000001',
        'addr_test1vp7d29h6s4pq8e2mc8mlmq9j3shf20a2m3s9lqc2spclqgq4hjwd2',
        15200.0,
        0.0,
        'preview_testnet'
    )
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 3. Seed Marketplace Crops
-- ==========================================
INSERT INTO public.products (id, farmer_id, title, description, category, grade, price_per_unit, unit_type, quantity_available, image_url, is_published)
VALUES
    (
        'p0000000-0000-0000-0000-000000000001',
        'f0000000-0000-0000-0000-000000000001',
        'Organic Vine-Ripened Tomatoes',
        'Freshly harvested organic tomatoes, rich red, perfect grade, pesticide-free. Harvested directly from the fertile soils of Punjab plains.',
        'Vegetables',
        'Grade A (Premium)',
        28.0,
        'kg',
        850,
        'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=600&q=80',
        true
    ),
    (
        'p0000000-0000-0000-0000-000000000002',
        'f0000000-0000-0000-0000-000000000001',
        'Golden Sharbati Wheat grains',
        'Highly premium wheat grains with a rich golden sheen and maximum gluten strength. Cultivated under natural, eco-friendly conditions.',
        'Grains',
        'Grade A+',
        34.0,
        'kg',
        2400,
        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 4. Seed Trust Ledger Blocks
-- ==========================================
INSERT INTO public.blockchain_logs (id, block_number, tx_hash, action, data, prev_hash)
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        100,
        '0x3a4b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
        'GENESIS_BLOCK',
        '{"message": "AgriTrust Trust Ledger Initialized on Cardano Preview Testnet"}'::jsonb,
        '0x0000000000000000000000000000000000000000000000000000000000000000'
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        101,
        '0xe5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4',
        'FARMER_VERIFIED',
        '{"farmer_name": "Ram Singh", "wallet": "addr_test1vrm785k3a8cqu2h8d84mclm7q2shf80a4m0s9lqc7spclqglvjsd3"}'::jsonb,
        '0x3a4b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b'
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        102,
        '0xb2f4d6a8c0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4',
        'PRODUCT_LISTED',
        '{"productId": "p0000000-0000-0000-0000-000000000001", "title": "Organic Tomatoes", "quantity": 850, "pricePerUnit": 28}'::jsonb,
        '0xe5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4'
    )
ON CONFLICT (id) DO NOTHING;
