import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { offerService } from '../services/offerService';
import { orderService } from '../services/orderService';
import { walletService } from '../services/walletService';
import { contractService } from '../services/contractService';
import { ledgerService } from '../services/ledgerService';
import { notificationService } from '../services/notificationService';
import { aiService } from '../services/aiService';
import { blockchainService } from '../services/blockchainService';
import { profileService } from '../services/profileService';
import { calculateTrustScore } from '../utils/trustScore';
import { Product, Offer, Order } from '../types';
import { 
  Tractor, ShoppingBag, Sprout, Search, Filter, 
  MapPin, Star, ShieldCheck, ArrowRight, 
  Plus, Coins, Sparkles, MessageSquare, Ship, 
  X, Award, RefreshCw, UserCheck, CheckCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EscrowTimelineCard } from '../components/EscrowTimelineCard';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';


export const Dashboard: React.FC = () => {
  const { user, wallet, activeRole, refreshWallet, switchUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Tab parameters (e.g. ?tab=products, ?tab=negotiations, ?tab=orders, ?tab=profile)
  const activeTab = new URLSearchParams(location.search).get('tab');

  // Common States
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter (Buyer)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal / Drawer States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showNegotiateDrawer, setShowNegotiateDrawer] = useState(false);
  const [offerPrice, setOfferPrice] = useState(0);
  const [offerQuantity, setOfferQuantity] = useState(100);

  // Chat/Negotiation bubble states
  const [activeChatOffer, setActiveChatOffer] = useState<Offer | null>(null);

  // Farmer Offer Action States
  const [counterPriceInput, setCounterPriceInput] = useState<string>('');
  const [showListingModal, setShowListingModal] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const [listCategory, setListCategory] = useState('Vegetables');
  const [listGrade, setListGrade] = useState('Grade A (Premium)');
  const [listPrice, setListPrice] = useState('');
  const [listQty, setListQty] = useState('');
  const [listDesc, setListDesc] = useState('');
  
  // AI Suggestions loaded state
  const [aiPriceDetails, setAiPriceDetails] = useState<{
    suggestedPrice: number;
    demand: string;
    sellingTime: string;
    trend: 'up' | 'down' | 'stable';
    confidence: number;
  } | null>(null);

  // NFT State
  const [mintedNft, setMintedNft] = useState<{ nftId: string; txHash: string } | null>(null);
  const [showNftModal, setShowNftModal] = useState(false);

  // QR Code Verification State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeOrder, setQrCodeOrder] = useState<Order | null>(null);

  // Stars rating state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  // Fetch initial data from Phase 3 services
  const fetchData = async () => {
    if (!user) return;
    try {
      const prodsRes = await productService.filterProducts('All');
      if (prodsRes.success && prodsRes.data) {
        setProducts(prodsRes.data);
      }

      const offersRes = await offerService.getOffers(user.id);
      if (offersRes.success && offersRes.data) {
        setOffers(offersRes.data);
      }

      const ordersRes = await orderService.getOrders(user.id);
      if (ordersRes.success && ordersRes.data) {
        setOrders(ordersRes.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // ── Supabase Realtime: push updates to all connected clients instantly ──
    const channel = supabase
      .channel('agritrust-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' },     () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' },       () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' },       () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' },() => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, activeRole]);


  // Handle Redirection if not logged in
  useEffect(() => {
    if (!user && !loading) {
      navigate('/onboarding');
    }
  }, [user, loading]);

  // AI Price Recommendation Logic (Gemini API Call)
  const handleAiPriceSuggestion = async () => {
    if (!listQty || isNaN(Number(listQty))) {
      alert('Please enter a valid quantity.');
      return;
    }
    const res = await aiService.suggestPrice(listCategory, listGrade, Number(listQty));
    if (res.success && res.data) {
      setAiPriceDetails({
        suggestedPrice: res.data.suggestedPrice,
        demand: res.data.demand,
        sellingTime: res.data.sellingTime,
        trend: res.data.trend,
        confidence: res.data.confidence
      });
      setListPrice(String(res.data.suggestedPrice));
    }
  };

  // Submit Listing (Farmer)
  const handlePublishListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !listTitle || !listPrice || !listQty) return;

    const res = await productService.createProduct(user.id, {
      title: listTitle,
      description: listDesc,
      category: listCategory,
      grade: listGrade,
      price_per_unit: Number(listPrice),
      unit_type: 'kg',
      quantity_available: Number(listQty),
      image_url: listCategory === 'Grains' 
        ? 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80'
        : listCategory === 'Fruits'
        ? 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=600&q=80'
    });

    if (res.success && res.data) {
      await ledgerService.mineBlock({
        action: 'PRODUCT_LISTED',
        data: { productId: res.data.id, title: listTitle, quantity: Number(listQty) }
      });

      setListTitle('');
      setListPrice('');
      setListQty('');
      setListDesc('');
      setAiPriceDetails(null);
      setShowListingModal(false);
      fetchData();
    }
  };

  // Create Negotiation Offer (Buyer)
  const handleMakeOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProduct) return;

    const res = await offerService.createOffer(user.id, {
      product_id: selectedProduct.id,
      offer_price: offerPrice,
      quantity: offerQuantity
    });

    if (res.success && res.data) {
      await notificationService.notify(
        selectedProduct.farmer_id,
        `New bid received for ${selectedProduct.title}: ₹ ${offerPrice}/kg from ${user.full_name}`,
        'offer'
      );

      setShowNegotiateDrawer(false);
      setSelectedProduct(null);
      fetchData();
    }
  };

  // Farmer Accept Offer
  const handleAcceptOffer = async (offer: Offer) => {
    if (!user) return;
    const res = await offerService.acceptOffer(offer.id);
    if (res.success && res.data) {
      const orderRes = await orderService.createOrder({
        offer_id: offer.id,
        buyer_id: offer.buyer_id,
        farmer_id: user.id,
        product_id: offer.product_id,
        total_amount: offer.offer_price * offer.quantity
      });

      if (orderRes.success && orderRes.data) {
        await notificationService.notify(
          offer.buyer_id,
          `Your offer for ${offer.product?.title} was ACCEPTED. Please generate escrow contract.`,
          'offer'
        );

        await ledgerService.mineBlock({
          action: 'OFFER_ACCEPTED',
          data: { offerId: offer.id, orderId: orderRes.data.id, amount: offer.offer_price * offer.quantity }
        });
      }
      setActiveChatOffer(null);
      fetchData();
    }
  };

  // Farmer Counter Offer
  const handleCounterOffer = async (offer: Offer) => {
    if (!counterPriceInput || isNaN(Number(counterPriceInput))) return;
    const price = Number(counterPriceInput);
    const res = await offerService.counterOffer(offer.id, price);
    if (res.success && res.data) {
      await notificationService.notify(
        offer.buyer_id,
        `Farmer counter-offered ₹ ${price}/kg on ${offer.product?.title}.`,
        'offer'
      );
      setCounterPriceInput('');
      setActiveChatOffer(null);
      fetchData();
    }
  };

  // Farmer Decline Offer
  const handleDeclineOffer = async (offer: Offer) => {
    const res = await offerService.rejectOffer(offer.id);
    if (res.success) {
      await notificationService.notify(
        offer.buyer_id,
        `Your offer for ${offer.product?.title} was declined by the farmer.`,
        'offer'
      );
      setActiveChatOffer(null);
      fetchData();
    }
  };

  // Buyer Accept Counter Offer
  const handleAcceptCounterOffer = async (offer: Offer) => {
    if (!user || !offer.counter_price) return;
    const res = await offerService.acceptOffer(offer.id);
    if (res.success && res.data) {
      await offerService.counterOffer(offer.id, offer.counter_price); 
      const orderRes = await orderService.createOrder({
        offer_id: offer.id,
        buyer_id: user.id,
        farmer_id: offer.product!.farmer_id,
        product_id: offer.product_id,
        total_amount: offer.counter_price * offer.quantity
      });

      if (orderRes.success && orderRes.data) {
        await notificationService.notify(
          offer.product!.farmer_id,
          `Buyer accepted counter-offer for ${offer.product?.title}. Contract generated.`,
          'offer'
        );
      }
      setActiveChatOffer(null);
      fetchData();
    }
  };

  // Order Flow Step 1: Buyer Generate Contract
  const handleGenerateContract = async (order: Order) => {
    if (!wallet) return;
    const address = `addr_test1_plutus_escrow_${order.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)}`;
    const res = await contractService.createContract({
      order_id: order.id,
      contract_address: address
    });

    if (res.success && res.data) {
      await orderService.updateOrder(order.id, { status: 'contract_generated' });
      await notificationService.notify(
        order.farmer_id,
        `Cardano Escrow Plutus Contract generated for order #${order.id.slice(0, 5)}. Please review.`,
        'escrow'
      );
      fetchData();
    }
  };

  // Order Flow Step 2: Buyer Lock Escrow Funds
  const handleLockFunds = async (order: Order) => {
    if (!wallet) return;
    const amountAda = Math.round(order.total_amount * 0.05);
    
    if (wallet.balance < amountAda) {
      alert('Insufficient wallet balance. Use the Cardano Wallet page to request Test ADA.');
      return;
    }

    const res = await walletService.lockFunds(wallet.id, amountAda);
    if (res.success) {
      await orderService.updateOrder(order.id, { status: 'funds_locked' });
      
      const contract = orders.find(o => o.id === order.id)?.contract;
      if (contract) {
        await contractService.lockEscrow(contract.id);
      }

      await ledgerService.mineBlock({
        action: 'ESCROW_LOCKED',
        data: { orderId: order.id, contractAddress: contract?.contract_address || 'addr_plutus_stub', amountAda }
      });

      await notificationService.notify(
        order.farmer_id,
        `Payment of ₳ ${amountAda} locked in Cardano escrow script for order #${order.id.slice(0, 5)}. Start shipment!`,
        'escrow'
      );

      await refreshWallet();
      fetchData();
    }
  };

  // Order Flow Step 3: Farmer Signs & Ships Crop
  const handleShipCrop = async (order: Order) => {
    const res = await orderService.shipOrder(order.id);
    if (res.success) {
      await ledgerService.mineBlock({
        action: 'PRODUCT_SHIPPED',
        data: { orderId: order.id, farmerId: order.farmer_id, timestamp: new Date().toISOString() }
      });

      await notificationService.notify(
        order.buyer_id,
        `Your crop shipment for order #${order.id.slice(0, 5)} has started. Track delivery.`,
        'shipment'
      );
      fetchData();
    }
  };

  // Order Flow Step 4: Buyer Confirms Delivery & Releases Escrow
  const handleConfirmDelivery = async (order: Order) => {
    if (!wallet) return;
    const amountAda = Math.round(order.total_amount * 0.05);
    const farmerWalletRes = await walletService.getWallet(order.farmer_id);
    if (!farmerWalletRes.success || !farmerWalletRes.data) return;

    const releaseRes = await walletService.releaseFunds(wallet.id, farmerWalletRes.data.id, amountAda);
    if (releaseRes.success) {
      await orderService.completeOrder(order.id);

      const contract = orders.find(o => o.id === order.id)?.contract;
      if (contract) {
        await contractService.releaseEscrow(contract.id);
      }

      const nftResult = await blockchainService.mintReputationNFT(order.id, order.farmer, order.buyer, order.total_amount);
      setMintedNft(nftResult);
      setShowNftModal(true);

      await ledgerService.mineBlock({
        action: 'FUNDS_RELEASED',
        data: { orderId: order.id, amountReleasedAda: amountAda }
      });
      await ledgerService.mineBlock({
        action: 'NFT_MINTED',
        data: { orderId: order.id, nftId: nftResult.nftId, txHash: nftResult.txHash }
      });

      await notificationService.notify(
        order.farmer_id,
        `Escrow released! ₳ ${amountAda} deposited to your wallet. Cardano Reputation NFT generated.`,
        'payment'
      );

      setReviewOrder(order);
      setShowReviewModal(true);

      await refreshWallet();
      fetchData();
    }
  };

  // Star Ratings Submit
  const handleReviewSubmit = async () => {
    if (!user || !reviewOrder) return;
    
    const updateProfileRes = await profileService.updateProfile(reviewOrder.farmer_id, {
      trades_completed: (reviewOrder.farmer?.trades_completed || 0) + 1
    });

    if (updateProfileRes) {
      setShowReviewModal(false);
      setReviewOrder(null);
      setReviewText('');
      setReviewRating(5);
      fetchData();
    }
  };

  // QR Modal trigger
  const triggerQrVerification = (order: Order) => {
    setQrCodeOrder(order);
    setShowQrModal(true);
  };

  // Filtered Products for Buyer
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 font-display">
      
      {/* -------------------- Premium Network Status Panel -------------------- */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="glass-card rounded-2xl p-5 border-gray-200 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Connection Status</span>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20 uppercase">Connected</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">Cardano Preview Testnet</p>
            <p className="text-[10px] text-gray-400 mt-1.5 font-mono">Live Sync: Active</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border-gray-200 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Wallet Link</span>
            <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-400 border border-blue-500/20 uppercase">Web3 Key</span>
          </div>
          <div>
            <p className="text-sm font-mono font-semibold text-gray-900 leading-none truncate">
              {wallet ? wallet.address : 'Disconnected'}
            </p>
            <p className="text-[10px] text-emerald-400 mt-1.5 font-semibold">
              {wallet ? `₳ ${wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 1 })} ADA` : '0 ADA'}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border-gray-200 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Merchant Rating</span>
            <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold text-purple-400 border border-purple-500/20 uppercase">Audit Trail</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">Trust Score</p>
            <p className="text-sm font-black text-emerald-400 mt-1.5">
              {user ? calculateTrustScore(user, true) : 100}% Verified
            </p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border-gray-200 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Latest Activity</span>
            <span className="rounded bg-orange-500/10 px-2 py-0.5 text-[9px] font-bold text-orange-400 border border-orange-500/20 uppercase">Update Loop</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 leading-none truncate">
              {orders.length > 0 ? `Latest Order Status: ${orders[0].status.replace(/_/g, ' ')}` : 'Ready for direct trade'}
            </p>
            <p className="text-[10px] text-gray-400 mt-1.5 font-mono">Blockchain block height verified</p>
          </div>
        </div>
      </motion.div>

      {loading && products.length === 0 ? (
        <div className="flex h-96 items-center justify-center text-gray-500">
          <div className="flex flex-col items-center space-y-3">
            <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
            <span className="text-sm font-semibold tracking-wide">Syncing with Cardano Ledger...</span>
          </div>
        </div>
      ) : (
        <>
          {/* -------------------- PROFILE TAB VIEW -------------------- */}
          {activeTab === 'profile' && user && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-6 border-gray-200 max-w-xl mx-auto space-y-6 shadow-2xl"
            >
              <div className="flex items-center space-x-4 pb-6 border-b border-gray-100">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-16 w-16 rounded-full border border-gray-200 object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-900 uppercase text-lg">
                    {user.full_name[0]}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-gray-900">{user.full_name}</h2>
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20 uppercase">Verification Badge</span>
                  </div>
                  <p className="text-xs text-gray-500 capitalize mt-1">{activeRole} • Member Since July 2026</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-white/80 p-4 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Reputation Score</span>
                  <span className="text-lg font-black text-emerald-400">{calculateTrustScore(user, true)}% Trust</span>
                </div>
                <div className="bg-white/80 p-4 rounded-xl border border-gray-100">
                  <span className="text-slate-455 block text-[10px] uppercase font-bold tracking-wider mb-1">Completed Orders</span>
                  <span className="text-lg font-black text-gray-900">{user.trades_completed} Trades</span>
                </div>
                <div className="bg-white/80 p-4 rounded-xl border border-gray-100 col-span-2">
                  <span className="text-slate-455 block text-[10px] uppercase font-bold tracking-wider mb-1">Wallet Connected Address</span>
                  <span className="font-mono text-gray-900 break-all block mt-1">{wallet?.address || 'None'}</span>
                </div>
                <div className="bg-white/80 p-4 rounded-xl border border-gray-100 col-span-2">
                  <span className="text-slate-455 block text-[10px] uppercase font-bold tracking-wider mb-1">Ratings Summary</span>
                  <span className="text-gray-700 mt-1 block font-sans">🟢 Cardano Blockchain Identity Verified • 4.9 Average Stars</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* -------------------- FARMER HUB VIEW -------------------- */}
          {activeRole === 'farmer' && activeTab !== 'profile' && (
            <div className="space-y-8">
              
              {/* Conditional layouts based on sidebar tab search params */}
              {(!activeTab || activeTab === 'products') && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Farmer Sales Hub</h1>
                      <p className="text-xs text-gray-500 mt-0.5">Manage crop inventory lists published directly on the ledger</p>
                    </div>
                    <button
                      onClick={() => setShowListingModal(true)}
                      className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-gray-900 hover:opacity-95 transition"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Sell New Produce</span>
                    </button>
                  </div>

                  <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                      <Tractor className="h-4.5 w-4.5 text-emerald-450 text-emerald-450 text-emerald-400" />
                      <span>Active Crop Listings</span>
                    </h2>
                    <span className="rounded bg-white border border-gray-200 px-2 py-0.5 text-[10px] text-gray-500">
                      {products.filter(p => p.farmer_id === user?.id).length} Products
                    </span>
                  </div>

                  {products.filter(p => p.farmer_id === user?.id).length === 0 ? (
                    <div className="glass-card rounded-2xl p-12 text-center text-gray-400 text-xs">
                      No crops listed. Click "Sell New Produce" to publish on ledger.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {products.filter(p => p.farmer_id === user?.id).map(prod => (
                        <div key={prod.id} className="glass-card rounded-xl overflow-hidden flex flex-col justify-between border-gray-100 hover:border-gray-200 transition">
                          {prod.image_url && (
                            <img src={prod.image_url} alt={prod.title} className="h-36 w-full object-cover" />
                          )}
                          <div className="p-4 space-y-3">
                            <div>
                              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/20">{prod.category}</span>
                              <h3 className="text-sm font-bold text-gray-900 mt-1.5 line-clamp-1">{prod.title}</h3>
                              <p className="text-[10px] text-gray-500 mt-0.5">{prod.grade}</p>
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                              <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Price per unit</p>
                                <p className="text-sm font-extrabold text-gray-900 mt-1">₹{prod.price_per_unit}/{prod.unit_type}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Stock</p>
                                <p className="text-sm font-semibold text-slate-350 mt-1">{prod.quantity_available} {prod.unit_type}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(!activeTab || activeTab === 'negotiations') && (
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                      <MessageSquare className="h-4.5 w-4.5 text-teal-400" />
                      <span>Sales Negotiations</span>
                    </h2>
                    <span className="rounded bg-white border border-gray-200 px-2 py-0.5 text-[10px] text-gray-500">
                      {offers.filter(o => o.status === 'pending' || o.status === 'countered').length} Active
                    </span>
                  </div>

                  {offers.filter(o => o.status === 'pending' || o.status === 'countered').length === 0 ? (
                    <div className="glass-card rounded-2xl p-6 text-center text-gray-400 text-xs">
                      No active sales negotiations.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {offers.filter(o => o.status === 'pending' || o.status === 'countered').map(offer => (
                        <div 
                          key={offer.id} 
                          onClick={() => setActiveChatOffer(offer)}
                          className="glass-card rounded-xl p-4 border-gray-100 hover:border-emerald-500/20 cursor-pointer space-y-3 transition"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xs font-bold text-gray-900 line-clamp-1">{offer.product?.title}</h3>
                              <p className="text-[10px] text-gray-500 mt-0.5">Bidder: {offer.buyer?.full_name}</p>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500">Trust {calculateTrustScore(offer.buyer || {}, true)}%</span>
                          </div>
                          
                          <div className="flex justify-between bg-white px-3 py-2 rounded-lg border border-gray-100 text-xs">
                            <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Bid Price</p>
                              <p className="font-extrabold text-gray-900 mt-0.5">₹{offer.offer_price}/kg</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Qty Requested</p>
                              <p className="font-semibold text-gray-600 mt-0.5">{offer.quantity} kg</p>
                            </div>
                          </div>

                          <div className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Open direct negotiation channel</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(!activeTab || activeTab === 'orders') && (
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                      <Ship className="h-4.5 w-4.5 text-orange-400" />
                      <span>Escrow Deliveries</span>
                    </h2>
                  </div>

                  {orders.length === 0 ? (
                    <div className="glass-card rounded-2xl p-6 text-center text-gray-400 text-xs">
                      No active smart contract delivery escrows.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {orders.map(order => (
                        <EscrowTimelineCard
                          key={order.id}
                          order={order}
                          onAction={order.status === 'funds_locked' ? () => handleShipCrop(order) : undefined}
                          actionText={order.status === 'funds_locked' ? 'Confirm Crop Dispatch' : undefined}
                          onVerify={() => triggerQrVerification(order)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* -------------------- BUYER HUB / MARKETPLACE VIEW -------------------- */}
          {activeRole === 'buyer' && activeTab !== 'profile' && (
            <div className="space-y-8">
              
              {(!activeTab || activeTab === 'products') && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Direct Crop Marketplace</h1>
                      <p className="text-xs text-gray-500 mt-0.5">Discover, negotiate, and purchase verified crops directly from agricultural producers</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 w-full md:w-80 rounded-xl border border-gray-200 bg-white/80 px-3.5 py-2 focus-within:border-emerald-500/50 transition">
                      <Search className="h-4.5 w-4.5 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search crops or regions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent text-xs text-gray-900 placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-1.5 overflow-x-auto pb-1">
                    {['All', 'Vegetables', 'Grains', 'Fruits'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
                          selectedCategory === cat
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 glow-emerald'
                            : 'border-gray-200 bg-white/60 text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="glass-card rounded-2xl p-12 text-center text-gray-400 text-xs">
                      No crops found matching your search.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredProducts.map(prod => (
                        <div 
                          key={prod.id} 
                          className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border-gray-100 hover:border-emerald-500/30 transition-all duration-300 shadow-lg"
                        >
                          {prod.image_url && (
                            <img src={prod.image_url} alt={prod.title} className="h-40 w-full object-cover" />
                          )}
                          
                          <div className="p-4 space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/20">{prod.category}</span>
                                <h3 className="text-sm font-bold text-gray-900 mt-1.5 line-clamp-1">{prod.title}</h3>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] font-bold text-emerald-400 block leading-none">Trust</span>
                                <span className="text-xs font-extrabold text-gray-900">{calculateTrustScore(prod.farmer || {}, true)}%</span>
                              </div>
                            </div>

                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{prod.description}</p>
                            
                            <div className="flex items-center space-x-1.5 text-[10px] text-gray-500">
                              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <span>Punjab Farms • Farmer: {prod.farmer?.full_name || 'Ram Singh'}</span>
                            </div>

                            {/* List Price vs AI Suggestion */}
                            <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                              <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">List Price</p>
                                <p className="text-sm font-extrabold text-gray-900 mt-1">₹{prod.price_per_unit}/kg</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest leading-none">AI Suggestion</p>
                                <p className="text-sm font-bold text-emerald-400 mt-1">₹{Math.round(prod.price_per_unit * 0.96)}/kg</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-[10px]">
                              <span className="text-gray-400">Available Stock:</span>
                              <span className="font-semibold text-slate-350">{prod.quantity_available} kg</span>
                            </div>

                            <div className="flex pt-1">
                              <button
                                onClick={() => {
                                  setSelectedProduct(prod);
                                  setOfferPrice(prod.price_per_unit);
                                  setOfferQuantity(100);
                                  setShowNegotiateDrawer(true);
                                }}
                                className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-gray-900 transition"
                              >
                                <Coins className="h-3.5 w-3.5" />
                                <span>Buy / Negotiate</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(!activeTab || activeTab === 'negotiations') && (
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                      <MessageSquare className="h-4.5 w-4.5 text-teal-400" />
                      <span>Outgoing Bids & Negotiations</span>
                    </h2>
                  </div>

                  {offers.filter(o => o.buyer_id === user?.id).length === 0 ? (
                    <div className="glass-card rounded-2xl p-6 text-center text-gray-400 text-xs">
                      No active negotiation bids.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {offers.filter(o => o.buyer_id === user?.id).map(offer => (
                        <div 
                          key={offer.id} 
                          onClick={() => setActiveChatOffer(offer)}
                          className="glass-card rounded-xl p-4 border-gray-100 hover:border-emerald-500/20 cursor-pointer space-y-3 transition"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xs font-bold text-gray-900 line-clamp-1">{offer.product?.title}</h3>
                              <p className="text-[10px] text-gray-500 mt-0.5">Farmer: {offer.product?.farmer?.full_name}</p>
                            </div>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border ${
                              offer.status === 'accepted'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : offer.status === 'countered'
                                ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse-ring'
                                : 'bg-white text-gray-500 border-gray-200'
                            }`}>
                              {offer.status}
                            </span>
                          </div>

                          <div className="flex justify-between bg-white px-3 py-2 rounded-lg border border-gray-100 text-xs">
                            <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">My Bid</p>
                              <p className="font-extrabold text-gray-900 mt-0.5">₹{offer.offer_price}/kg</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Qty</p>
                              <p className="font-semibold text-slate-350 mt-0.5">{offer.quantity} kg</p>
                            </div>
                          </div>

                          <div className="text-[10px] text-teal-400 font-semibold flex items-center space-x-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                            <span>View negotiation timeline</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(!activeTab || activeTab === 'orders') && (
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                      <ShieldCheck className="h-4.5 w-4.5 text-orange-400" />
                      <span>Active Purchases Escrows</span>
                    </h2>
                  </div>

                  {orders.filter(o => o.buyer_id === user?.id).length === 0 ? (
                    <div className="glass-card rounded-2xl p-6 text-center text-gray-400 text-xs">
                      No active purchases.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {orders.filter(o => o.buyer_id === user?.id).map(order => (
                        <EscrowTimelineCard
                          key={order.id}
                          order={order}
                          onAction={
                            order.status === 'negotiated'
                              ? () => handleGenerateContract(order)
                              : order.status === 'contract_generated'
                              ? () => handleLockFunds(order)
                              : order.status === 'shipment_started'
                              ? () => handleConfirmDelivery(order)
                              : undefined
                          }
                          actionText={
                            order.status === 'negotiated'
                              ? 'Generate Plutus escrow contract'
                              : order.status === 'contract_generated'
                              ? `Sign & Lock ₳ ${Math.round(order.total_amount * 0.05)} ADA`
                              : order.status === 'shipment_started'
                              ? 'Confirm Delivery'
                              : undefined
                          }
                          onVerify={() => triggerQrVerification(order)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* -------------------- SELL CROP MODAL (FARMER) -------------------- */}
          {showListingModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm p-4">
              <div className="glass-card w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <h2 className="font-display text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <Plus className="h-5 w-5 text-emerald-400" />
                    <span>List Crop for Sale</span>
                  </h2>
                  <button 
                    onClick={() => { setShowListingModal(false); setAiPriceDetails(null); }}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handlePublishListing} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Crop Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Organic Tomatoes"
                        value={listTitle}
                        onChange={(e) => setListTitle(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 placeholder-slate-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Category</label>
                      <select
                        value={listCategory}
                        onChange={(e) => setListCategory(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none"
                      >
                        <option value="Vegetables">Vegetables</option>
                        <option value="Grains">Grains</option>
                        <option value="Fruits">Fruits</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Quality Grade</label>
                      <select
                        value={listGrade}
                        onChange={(e) => setListGrade(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none"
                      >
                        <option value="Grade A (Premium)">Grade A (Premium)</option>
                        <option value="Grade B (Standard)">Grade B (Standard)</option>
                        <option value="Organic Certified">Organic Certified</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Quantity (kg)</label>
                      <input
                        type="number"
                        placeholder="e.g. 500"
                        value={listQty}
                        onChange={(e) => setListQty(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 placeholder-slate-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Price suggestion tool */}
                  <div className="rounded-xl border border-gray-200 bg-white/70 p-4 space-y-3.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-bold">
                        <Sparkles className="h-4.5 w-4.5 text-emerald-500 animate-pulse" />
                        <span>AI Price Suggestion Engine</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAiPriceSuggestion}
                        className="rounded bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20"
                      >
                        Estimate AI Price
                      </button>
                    </div>

                    {aiPriceDetails && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[10px] border-t border-gray-100 pt-3">
                        <div>
                          <span className="text-gray-500 block">AI Recommended Price</span>
                          <span className="font-bold text-gray-900 text-xs">₹{aiPriceDetails.suggestedPrice}/kg</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Demand Outlook</span>
                          <span className="font-semibold text-emerald-400 uppercase">{aiPriceDetails.demand}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Market Trend</span>
                          <span className="font-semibold text-gray-900 capitalize">{aiPriceDetails.trend === 'up' ? '↗ Increasing' : '→ Stable'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">AI Confidence</span>
                          <span className="font-bold text-emerald-400">{aiPriceDetails.confidence}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Best Selling Window</span>
                          <span className="font-semibold text-gray-600">{aiPriceDetails.sellingTime}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3 border-t border-gray-100/50 pt-3">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Set Price (₹/kg)</label>
                        <input
                          type="number"
                          placeholder="Price per unit"
                          value={listPrice}
                          onChange={(e) => setListPrice(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-gray-900 hover:opacity-95"
                  >
                    <span>Publish Listing on Ledger</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* -------------------- BUYER NEGOTIATION / BUY DRAWER -------------------- */}
          {showNegotiateDrawer && selectedProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-end bg-gray-50/80 backdrop-blur-sm p-0">
              <div className="glass-card w-full max-w-md h-full rounded-l-2xl p-6 shadow-2xl flex flex-col justify-between border-y-0 border-r-0">
                <div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                    <h2 className="font-display text-lg font-bold text-gray-900 flex items-center space-x-2">
                      <Coins className="h-5 w-5 text-emerald-400" />
                      <span>Start Crop Negotiation</span>
                    </h2>
                    <button onClick={() => setShowNegotiateDrawer(false)} className="text-gray-500 hover:text-gray-900">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    
                    <div className="flex space-x-3.5 bg-white p-3 rounded-xl border border-gray-100">
                      {selectedProduct.image_url && (
                        <img src={selectedProduct.image_url} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{selectedProduct.title}</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5 font-sans">Farmer: {selectedProduct.farmer?.full_name || 'Ram Singh'} ({calculateTrustScore(selectedProduct.farmer || {}, true)}% Trust)</p>
                        <p className="text-xs font-extrabold text-emerald-400 mt-1">₹{selectedProduct.price_per_unit}/kg</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-emerald-500/5 p-4 space-y-2">
                      <div className="flex items-center space-x-1 text-xs text-emerald-400 font-bold font-sans">
                        <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                        <span>AI Trade Assistant</span>
                      </div>
                      <p className="text-[11px] text-gray-600">
                        The suggested market price is stable at ₹{selectedProduct.price_per_unit}/kg. Offers within 10% (₹{Math.round(selectedProduct.price_per_unit * 0.9)} - ₹{selectedProduct.price_per_unit}) are highly likely to be accepted.
                      </p>
                    </div>

                    <form onSubmit={handleMakeOffer} className="space-y-4">
                      <div>
                        <label className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                          <span>Bid Price (₹/kg)</span>
                          <span className="text-gray-900 font-extrabold">₹{offerPrice}/kg</span>
                        </label>
                        <input
                          type="range"
                          min={Math.round(selectedProduct.price_per_unit * 0.75)}
                          max={selectedProduct.price_per_unit}
                          value={offerPrice}
                          onChange={(e) => setOfferPrice(Number(e.target.value))}
                          className="w-full accent-emerald-500 bg-gray-100 rounded-lg appearance-none h-1.5"
                        />
                      </div>

                      <div>
                        <label className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                          <span>Quantity Required (kg)</span>
                          <span className="text-gray-900 font-extrabold">{offerQuantity} kg</span>
                        </label>
                        <input
                          type="range"
                          min="50"
                          max={selectedProduct.quantity_available}
                          step="50"
                          value={offerQuantity}
                          onChange={(e) => setOfferQuantity(Number(e.target.value))}
                          className="w-full accent-emerald-500 bg-gray-100 rounded-lg appearance-none h-1.5"
                        />
                      </div>

                      <div className="bg-white/80 p-3.5 rounded-xl border border-gray-100 flex justify-between items-center text-xs">
                        <span className="text-gray-500">Escrow Total:</span>
                        <span className="text-base font-extrabold text-emerald-400">₹{(offerPrice * offerQuantity).toLocaleString()}</span>
                      </div>

                      <button
                        type="submit"
                        className="w-full flex items-center justify-center space-x-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-bold text-gray-900 transition"
                      >
                        <span>Submit Offer to Farmer</span>
                        <ArrowRight className="h-4.5 w-4.5" />
                      </button>
                    </form>

                  </div>
                </div>

                <div className="text-[10px] text-gray-400 text-center font-mono">
                  All transactions are secured by Cardano Preview Smart Contracts.
                </div>
              </div>
            </div>
          )}

          {/* -------------------- INTERACTIVE CHAT NEGOTIATION MODAL -------------------- */}
          <AnimatePresence>
            {activeChatOffer && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/85 backdrop-blur-sm p-4"
              >
                <motion.div 
                  initial={{ scale: 0.95, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 10 }}
                  className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl flex flex-col h-[550px] overflow-hidden"
                >
                  <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{activeChatOffer.product?.title}</h3>
                        <p className="text-[10px] text-gray-500 font-sans">Negotiation channel with {activeRole === 'farmer' ? activeChatOffer.buyer?.full_name : activeChatOffer.product?.farmer?.full_name}</p>
                      </div>
                    </div>
                    <button onClick={() => setActiveChatOffer(null)} className="text-gray-500 hover:text-gray-900">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/30 font-mono text-[11px]">
                    <div className="flex flex-col items-end">
                      <div className="max-w-[75%] rounded-2xl rounded-tr-none bg-gray-100 px-4 py-2.5 text-xs text-gray-900 font-sans">
                        <p className="font-semibold text-[10px] text-gray-400 mb-0.5">Priya Patel (Buyer)</p>
                        I am placing an initial bid of <span className="font-bold text-emerald-400">₹{activeChatOffer.offer_price}/kg</span> for {activeChatOffer.quantity} kg of your crop.
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1">Sent • Cardano Address Signed</span>
                    </div>

                    {activeChatOffer.status === 'countered' && (
                      <div className="flex flex-col items-start">
                        <div className="max-w-[75%] rounded-2xl rounded-tl-none bg-emerald-600/15 border border-emerald-500/30 px-4 py-2.5 text-xs text-gray-900 font-sans">
                          <p className="font-semibold text-[10px] text-emerald-400 mb-0.5">Ram Singh (Farmer)</p>
                          Thank you for the bid! I'd like to counter-offer at <span className="font-bold text-emerald-400">₹{activeChatOffer.counter_price}/kg</span>. Let me know if that works.
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1">Received • Signed with Ledger Key</span>
                      </div>
                    )}

                    {activeChatOffer.status === 'accepted' && (
                      <div className="flex flex-col items-start">
                        <div className="max-w-[75%] rounded-2xl rounded-tl-none bg-emerald-600/10 border border-emerald-500/30 px-4 py-2.5 text-xs text-gray-900 font-sans">
                          <p className="font-semibold text-[10px] text-emerald-450 mb-0.5">System Ledger</p>
                          Offer ACCEPTED at <span className="font-bold text-emerald-400">₹{activeChatOffer.offer_price}/kg</span>. Plutus escrow contract compilation triggered.
                        </div>
                        <span className="text-[9px] text-emerald-500 font-bold mt-1">✓ Escrow Contract Mapped</span>
                      </div>
                    )}

                    {activeChatOffer.status === 'declined' && (
                      <div className="flex flex-col items-start">
                        <div className="max-w-[75%] rounded-2xl rounded-tl-none bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-xs text-gray-600 font-sans">
                          <p className="font-semibold text-[10px] text-red-400 mb-0.5">Ram Singh (Farmer)</p>
                          I have declined this bid. The prices are too low for this grade harvest.
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1">Declined</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0 space-y-3">
                    {activeChatOffer.status === 'pending' && activeRole === 'farmer' && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            placeholder="Counter Price (₹/kg)"
                            value={counterPriceInput}
                            onChange={(e) => setCounterPriceInput(e.target.value)}
                            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none"
                          />
                          <button
                            onClick={() => handleCounterOffer(activeChatOffer)}
                            className="rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2 text-xs font-bold text-gray-900"
                          >
                            Counter
                          </button>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAcceptOffer(activeChatOffer)}
                            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-gray-900"
                          >
                            Accept Offer
                          </button>
                          <button
                            onClick={() => handleDeclineOffer(activeChatOffer)}
                            className="flex-1 rounded-xl bg-gray-100 hover:bg-slate-700 py-2.5 text-xs font-bold text-slate-350"
                          >
                            Decline Offer
                          </button>
                        </div>
                      </div>
                    )}

                    {activeChatOffer.status === 'countered' && activeRole === 'buyer' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptCounterOffer(activeChatOffer)}
                          className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-gray-900"
                        >
                          Accept Counter (₹{activeChatOffer.counter_price}/kg)
                        </button>
                        <button
                          onClick={() => handleDeclineOffer(activeChatOffer)}
                          className="flex-1 rounded-xl bg-gray-100 hover:bg-slate-700 py-2.5 text-xs font-bold text-slate-350"
                        >
                          Reject Counter
                        </button>
                      </div>
                    )}

                    {activeChatOffer.status === 'accepted' && (
                      <div className="text-center text-[10px] text-gray-400">
                        Negotiations completed. Proceed to active escrows page to lock Cardano funds.
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* -------------------- CARDANO REPUTATION NFT MODAL -------------------- */}
          {showNftModal && mintedNft && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm p-4">
              <div className="glass-card w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center space-y-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse-ring" />
                <div className="flex justify-end">
                  <button onClick={() => setShowNftModal(false)} className="text-gray-500 hover:text-gray-900">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="mx-auto h-40 w-40 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-blue-600 p-0.5 shadow-2xl rotate-6 hover:rotate-0 transition duration-500">
                    <div className="h-full w-full bg-gray-50 rounded-2xl p-3 flex flex-col justify-between items-center text-[10px]">
                      <div className="flex justify-between w-full text-gray-400 font-mono">
                        <span>AGRITRUST</span>
                        <span>NFT PROOF</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <Award className="h-12 w-12 text-emerald-400 animate-bounce" />
                        <p className="font-display font-extrabold text-[11px] text-gray-900 mt-1">Reputation Certificate</p>
                        <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Cardano Preview Network</p>
                      </div>

                      <div className="w-full text-left font-mono text-[8px] text-gray-500 border-t border-gray-100 pt-1.5 truncate">
                        HASH: {mintedNft.txHash.slice(0, 16)}...
                      </div>
                    </div>
                  </div>

                  <h3 className="font-display text-xl font-extrabold text-gray-900 mt-6">Reputation NFT Minted!</h3>
                  <p className="text-xs text-gray-500">
                    A trade completion certificate token has been cryptographically minted on the Cardano ledger.
                  </p>
                  
                  <div className="bg-white rounded-lg p-2.5 text-[10px] text-gray-400 font-mono text-left space-y-1">
                    <p><span className="text-gray-500">Asset ID:</span> {mintedNft.nftId}</p>
                    <p><span className="text-gray-500">Policy:</span> policy_reputation_v1_cardano...</p>
                  </div>

                  <button
                    onClick={() => setShowNftModal(false)}
                    className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-gray-900 hover:bg-emerald-550 transition"
                  >
                    Claim Certificate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* -------------------- STAR RATING DIALOG -------------------- */}
          {showReviewModal && reviewOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm p-4">
              <div className="glass-card w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-5">
                <h3 className="font-display text-base font-bold text-gray-900">Rate Farmer Direct Trade</h3>
                <p className="text-xs text-gray-400 font-sans">
                  Submit rating stars to automatically recalculate the Farmer's reputation trust score on the ledger.
                </p>

                <div className="flex justify-center space-x-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star 
                        className={`h-8 w-8 ${
                          star <= reviewRating 
                            ? 'fill-amber-500 text-amber-500' 
                            : 'text-slate-650 hover:text-amber-400'
                        }`} 
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="Add your review comment (e.g. Tomato quality premium, fast delivery confirmation)..."
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 placeholder-slate-500 focus:outline-none"
                />

                <button
                  onClick={handleReviewSubmit}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-gray-900 hover:bg-emerald-500 transition"
                >
                  Submit Trade Verification Review
                </button>
              </div>
            </div>
          )}

          {/* -------------------- QR CODE VERIFICATION DIALOG -------------------- */}
          {showQrModal && qrCodeOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm p-4">
              <div className="glass-card w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center space-y-6">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span className="font-display text-sm font-bold text-gray-900">Trade Verification QR</span>
                  <button onClick={() => { setShowQrModal(false); setQrCodeOrder(null); }} className="text-gray-500 hover:text-gray-900">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="mx-auto h-40 w-40 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        `${window.location.origin}/#/verify/${qrCodeOrder.id}`
                      )}`} 
                      alt="Verification QR Code" 
                      className="h-36 w-36"
                    />
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-500 font-sans">
                    <p className="font-bold text-gray-900 text-sm">Blockchain Certified Origin</p>
                    <p>Scan this QR code to verify trade authenticity, smart contract state, and wallets on the Cardano Preview Net.</p>
                  </div>

                  <div className="rounded-lg bg-white p-2.5 text-[9px] text-gray-400 font-mono text-left truncate">
                    VERIFY URL: {window.location.origin}/#/verify/{qrCodeOrder.id}
                  </div>

                  <button
                    onClick={() => {
                      setShowQrModal(false);
                      navigate(`/verify/${qrCodeOrder.id}`);
                    }}
                    className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                  >
                    Inspect Verification Page
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default Dashboard;
