-- AgriTrust Initial Database Schema Migration

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('farmer', 'buyer', 'admin')),
    full_name TEXT,
    avatar_url TEXT,
    trust_score NUMERIC DEFAULT 100 CHECK (trust_score >= 0 AND trust_score <= 100),
    trades_completed INTEGER DEFAULT 0 CHECK (trades_completed >= 0),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow system/insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (true);


-- 2. Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    address TEXT UNIQUE NOT NULL,
    balance NUMERIC DEFAULT 10000.0 CHECK (balance >= 0),
    locked_balance NUMERIC DEFAULT 0.0 CHECK (locked_balance >= 0),
    network TEXT DEFAULT 'preview_testnet' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet (or during transaction)" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallets" ON public.wallets
    FOR INSERT WITH CHECK (true);


-- 3. Products Table (Marketplace Listings)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    grade TEXT,
    price_per_unit NUMERIC NOT NULL CHECK (price_per_unit > 0),
    unit_type TEXT NOT NULL,
    quantity_available NUMERIC NOT NULL CHECK (quantity_available >= 0),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Farmers can insert their own products" ON public.products
    FOR INSERT WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers can update their own products" ON public.products
    FOR UPDATE USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can delete their own products" ON public.products
    FOR DELETE USING (auth.uid() = farmer_id);


-- 4. Offers Table (Negotiations)
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    offer_price NUMERIC NOT NULL CHECK (offer_price > 0),
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'countered')),
    counter_price NUMERIC CHECK (counter_price IS NULL OR counter_price > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Offers
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users involved in offer can read it" ON public.offers
    FOR SELECT USING (
        auth.uid() = buyer_id OR 
        auth.uid() = (SELECT farmer_id FROM public.products WHERE id = product_id)
    );

CREATE POLICY "Buyers can create offers" ON public.offers
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users involved in offer can update it" ON public.offers
    FOR UPDATE USING (
        auth.uid() = buyer_id OR 
        auth.uid() = (SELECT farmer_id FROM public.products WHERE id = product_id)
    );


-- 5. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
    farmer_id UUID REFERENCES public.profiles(id) NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
    status TEXT DEFAULT 'negotiated' CHECK (status IN (
        'negotiated', 
        'contract_generated', 
        'buyer_signed', 
        'funds_locked', 
        'farmer_signed', 
        'shipment_started', 
        'buyer_confirmed', 
        'funds_released', 
        'contract_closed'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Involved parties can read orders" ON public.orders
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);

CREATE POLICY "System or buyer can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Involved parties can update orders" ON public.orders
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);


-- 6. Smart Contracts Table
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    contract_address TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'funded', 'released', 'refunded', 'closed')),
    tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Involved parties can view contracts" ON public.contracts
    FOR SELECT USING (
        auth.uid() = (SELECT buyer_id FROM public.orders WHERE id = order_id) OR
        auth.uid() = (SELECT farmer_id FROM public.orders WHERE id = order_id)
    );

CREATE POLICY "System or parties can update/insert contracts" ON public.contracts
    FOR ALL USING (true);


-- 7. Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'escrow_lock', 'escrow_release', 'fee')),
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed')),
    tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions of their own wallet" ON public.wallet_transactions
    FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM public.wallets WHERE id = wallet_id)
    );

CREATE POLICY "System or user can create transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (true);


-- 8. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Buyers can write reviews for completed orders" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);


-- 9. Trust Ledger Table (Blockchain Timeline logs)
CREATE TABLE IF NOT EXISTS public.blockchain_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_number BIGINT NOT NULL,
    tx_hash TEXT NOT NULL UNIQUE,
    action TEXT NOT NULL,
    data JSONB,
    prev_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Trust Ledger
ALTER TABLE public.blockchain_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read Trust Ledger" ON public.blockchain_logs
    FOR SELECT USING (true);

CREATE POLICY "System can insert blocks" ON public.blockchain_logs
    FOR INSERT WITH CHECK (true);


-- 10. Notifications / Activity Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g. 'offer_received', 'funds_locked', etc.
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark read)" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);


-- Helper Trigger to create profile when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, avatar_url, trust_score, trades_completed, is_verified)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'buyer'),
    COALESCE(new.raw_user_meta_data->>'full_name', 'Anonymous User'),
    new.raw_user_meta_data->>'avatar_url',
    100,
    0,
    FALSE
  );
  
  -- Create associated wallet
  INSERT INTO public.wallets (user_id, address, balance, locked_balance, network)
  VALUES (
    new.id,
    'addr_test1' || encode(sha256(new.id::text::bytea), 'hex'), -- Seed Cardano Address
    10000.0,
    0.0,
    'preview_testnet'
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
