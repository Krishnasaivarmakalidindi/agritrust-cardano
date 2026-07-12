-- AgriTrust Complete Supabase SQL Migration
-- Target: PostgreSQL (Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Trigger: Auto-Update timestamps
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 2. Profiles Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('farmer', 'buyer', 'admin')),
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    trust_score NUMERIC DEFAULT 100 CHECK (trust_score >= 0 AND trust_score <= 100),
    trades_completed INT DEFAULT 0 CHECK (trades_completed >= 0),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ==========================================
-- 3. Wallets Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    address TEXT UNIQUE NOT NULL,
    balance NUMERIC DEFAULT 10000.0 CHECK (balance >= 0),
    locked_balance NUMERIC DEFAULT 0.0 CHECK (locked_balance >= 0),
    network TEXT DEFAULT 'preview_testnet' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER update_wallets_modtime
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ==========================================
-- 4. Products Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    grade TEXT NOT NULL,
    price_per_unit NUMERIC NOT NULL CHECK (price_per_unit > 0),
    unit_type TEXT NOT NULL DEFAULT 'kg',
    quantity_available NUMERIC NOT NULL CHECK (quantity_available >= 0),
    image_url TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_farmer_id ON public.products(farmer_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

CREATE TRIGGER update_products_modtime
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ==========================================
-- 5. Offers Table (Negotiations)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    offer_price NUMERIC NOT NULL CHECK (offer_price > 0),
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'countered', 'cancelled')),
    counter_price NUMERIC CHECK (counter_price IS NULL OR counter_price > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_offers_product_id ON public.offers(product_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id ON public.offers(buyer_id);

CREATE TRIGGER update_offers_modtime
    BEFORE UPDATE ON public.offers
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ==========================================
-- 6. Orders Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
    total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
    status TEXT DEFAULT 'negotiated' CHECK (status IN (
        'negotiated', 'contract_generated', 'buyer_signed', 'funds_locked', 
        'farmer_signed', 'shipment_started', 'buyer_confirmed', 'funds_released', 'contract_closed'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_farmer_id ON public.orders(farmer_id);

CREATE TRIGGER update_orders_modtime
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ==========================================
-- 7. Contracts Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
    contract_address TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'funded', 'released', 'refunded', 'closed')),
    tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER update_contracts_modtime
    BEFORE UPDATE ON public.contracts
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ==========================================
-- 8. Wallet Transactions Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'escrow_lock', 'escrow_release', 'fee')),
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed')),
    tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);

-- ==========================================
-- 9. Reviews Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 10. Trust Ledger Table (Blockchain_logs)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.blockchain_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_number BIGINT NOT NULL UNIQUE,
    tx_hash TEXT NOT NULL UNIQUE,
    action TEXT NOT NULL CHECK (action IN (
        'FARMER_VERIFIED', 'PRODUCT_LISTED', 'OFFER_ACCEPTED', 
        'ESCROW_LOCKED', 'PRODUCT_SHIPPED', 'DELIVERY_CONFIRMED', 'FUNDS_RELEASED', 'FAUCET_CLAIMED', 'GENESIS_BLOCK', 'NFT_MINTED', 'BUYER_VERIFIED'
    )),
    data JSONB,
    prev_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blockchain_logs_block ON public.blockchain_logs(block_number);

-- ==========================================
-- 11. Notifications Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('offer', 'shipment', 'escrow', 'payment', 'verification')),
    read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ==========================================
-- 12. Row Level Security (RLS) Rules
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 12.1 Profiles Policies
CREATE POLICY "Allow read access to profiles for authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to create their own profile" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 12.2 Wallets Policies
CREATE POLICY "Users can select own wallet" ON public.wallets
    FOR SELECT TO authenticated USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can update own wallet" ON public.wallets
    FOR UPDATE TO authenticated USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "System can insert wallets" ON public.wallets
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 12.3 Products Policies
CREATE POLICY "Anyone can view products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Farmers can insert own products" ON public.products
    FOR INSERT TO authenticated WITH CHECK (
        (auth.uid() = farmer_id AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'farmer')
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Farmers can update own products" ON public.products
    FOR UPDATE TO authenticated USING (
        auth.uid() = farmer_id 
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Farmers can delete own products" ON public.products
    FOR DELETE TO authenticated USING (
        auth.uid() = farmer_id 
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- 12.4 Offers Policies
CREATE POLICY "Involved parties can view offers" ON public.offers
    FOR SELECT TO authenticated USING (
        auth.uid() = buyer_id 
        OR auth.uid() = (SELECT farmer_id FROM public.products WHERE id = product_id)
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Buyers can create offers" ON public.offers
    FOR INSERT TO authenticated WITH CHECK (
        (auth.uid() = buyer_id AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'buyer')
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Involved parties can update offers" ON public.offers
    FOR UPDATE TO authenticated USING (
        auth.uid() = buyer_id 
        OR auth.uid() = (SELECT farmer_id FROM public.products WHERE id = product_id)
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- 12.5 Orders Policies
CREATE POLICY "Parties involved can view orders" ON public.orders
    FOR SELECT TO authenticated USING (
        auth.uid() = buyer_id 
        OR auth.uid() = farmer_id
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Buyers/Farmers can update/insert orders" ON public.orders
    FOR ALL TO authenticated USING (
        auth.uid() = buyer_id 
        OR auth.uid() = farmer_id
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- 12.6 Contracts Policies
CREATE POLICY "Involved parties can select contracts" ON public.contracts
    FOR SELECT TO authenticated USING (
        auth.uid() = (SELECT buyer_id FROM public.orders WHERE id = order_id) 
        OR auth.uid() = (SELECT farmer_id FROM public.orders WHERE id = order_id)
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Involved parties can edit/insert contracts" ON public.contracts
    FOR ALL TO authenticated USING (true);

-- 12.7 Wallet Transactions Policies
CREATE POLICY "Users view transaction history of own wallet" ON public.wallet_transactions
    FOR SELECT TO authenticated USING (
        auth.uid() = (SELECT user_id FROM public.wallets WHERE id = wallet_id)
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "System/Users can insert transaction logs" ON public.wallet_transactions
    FOR INSERT TO authenticated WITH CHECK (true);

-- 12.8 Reviews Policies
CREATE POLICY "Anyone can view ratings" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Buyers can submit reviews" ON public.reviews
    FOR INSERT TO authenticated WITH CHECK (
        (auth.uid() = buyer_id AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'buyer')
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- 12.9 Blockchain Logs (Trust Ledger) Policies
CREATE POLICY "Anyone can read Trust Ledger blocks" ON public.blockchain_logs
    FOR SELECT USING (true);

CREATE POLICY "System/Authenticated users can mine blocks" ON public.blockchain_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- 12.10 Notifications Policies
CREATE POLICY "Users can access own alerts" ON public.notifications
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can edit read status of own alerts" ON public.notifications
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can notify users" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (true);

-- ==========================================
-- 13. Initialize Storage Buckets
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('product-images', 'product-images', true),
    ('profile-images', 'profile-images', true),
    ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Rules
CREATE POLICY "Allow public read access to product-images" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Allow public read access to profile-images" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Allow private read access to verification-documents" ON storage.objects
    FOR SELECT TO authenticated USING (bucket_id = 'verification-documents' AND (owner = auth.uid()::text OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'));

CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('product-images', 'profile-images', 'verification-documents') AND owner = auth.uid()::text);
