-- Phase 6: Cardano Blockchain Integration
-- Adds wallet profile fields, blockchain transaction proofs, and NFT certificate storage

-- ==========================================
-- 1. Profile wallet fields
-- ==========================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wallet_address TEXT,
  ADD COLUMN IF NOT EXISTS wallet_provider TEXT,
  ADD COLUMN IF NOT EXISTS wallet_connected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS network TEXT DEFAULT 'preview_testnet',
  ADD COLUMN IF NOT EXISTS last_wallet_sync TIMESTAMP WITH TIME ZONE;

-- ==========================================
-- 2. Wallet table extensions
-- ==========================================
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS wallet_provider TEXT,
  ADD COLUMN IF NOT EXISTS is_connected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_connected TIMESTAMP WITH TIME ZONE;

-- ==========================================
-- 3. Blockchain transaction proofs
-- ==========================================
CREATE TABLE IF NOT EXISTS public.blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    transaction_hash TEXT NOT NULL,
    block_number BIGINT,
    wallet_address TEXT NOT NULL,
    contract_address TEXT,
    status TEXT NOT NULL CHECK (status IN (
        'CREATED', 'FUNDED', 'LOCKED', 'SHIPPED', 'DELIVERED',
        'RELEASED', 'COMPLETED', 'REFUNDED', 'CANCELLED', 'DISPUTE'
    )),
    action TEXT NOT NULL,
    confirmation_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    simulated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blockchain_tx_order ON public.blockchain_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON public.blockchain_transactions(transaction_hash);

-- ==========================================
-- 4. Contract NFT certificate fields
-- ==========================================
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS nft_policy_id TEXT,
  ADD COLUMN IF NOT EXISTS nft_asset_id TEXT,
  ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'CREATED' CHECK (escrow_status IN (
      'CREATED', 'FUNDED', 'LOCKED', 'SHIPPED', 'DELIVERED',
      'RELEASED', 'COMPLETED', 'REFUNDED', 'CANCELLED', 'DISPUTE'
  ));

-- ==========================================
-- 5. Orders verification certificate
-- ==========================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  ADD COLUMN IF NOT EXISTS nft_policy_id TEXT,
  ADD COLUMN IF NOT EXISTS nft_asset_id TEXT;

-- ==========================================
-- 6. RLS for blockchain_transactions
-- ==========================================
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blockchain transactions" ON public.blockchain_transactions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert blockchain transactions" ON public.blockchain_transactions
    FOR INSERT TO authenticated WITH CHECK (true);

-- ==========================================
-- 7. Ensure handle_new_user trigger exists
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, role, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'AgriTrust User')
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.wallets (user_id, address, balance, locked_balance, network)
    VALUES (
        NEW.id,
        'addr_test1' || encode(sha256(NEW.id::text::bytea), 'hex'),
        10000.0,
        0.0,
        'preview_testnet'
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
