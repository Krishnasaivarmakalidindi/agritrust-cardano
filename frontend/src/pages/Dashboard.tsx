import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { blockchainService } from '../services/blockchainService';
import { Product, Offer, Order } from '../types';
import { 
  Tractor, ShoppingBag, Sprout, Search, Filter, 
  MapPin, UserCheck, Star, ShieldCheck, ArrowRight, 
  Plus, Tag, Coins, Sparkles, MessageSquare, Ship, 
  CheckCircle, ArrowUpRight, X, ChevronRight, Award,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EscrowTimelineCard } from '../components/EscrowTimelineCard';

export const Dashboard: React.FC = () => {
  const { user, wallet, activeRole, isDemoMode, refreshWallet } = useAuth();
  const navigate = useNavigate();

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
  const [offerQuantity, setOfferQuantity] = useState(1);

  // Farmer Offer Action States
  const [counterPriceInput, setCounterPriceInput] = useState<string>('');
  const [activeCounterOfferId, setActiveCounterOfferId] = useState<string | null>(null);

  // AI Price suggestion modal state (Farmer)
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
    buyersCount: number;
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

  // Fetch initial data
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const prods = await dbService.getProducts();
      setProducts(prods);

      const offs = await dbService.getOffers(user.id);
      setOffers(offs);

      const ords = await dbService.getOrders(user.id);
      setOrders(ords);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-update every 5 seconds for live simulation updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [user, activeRole]);

  // Handle Redirection if not logged in
  useEffect(() => {
    if (!user && !loading) {
      navigate('/onboarding');
    }
  }, [user, loading]);

  // AI Price Recommendation Logic (Mock Gemini API call)
  const handleAiPriceSuggestion = () => {
    if (!listQty || isNaN(Number(listQty))) {
      alert('Please enter a valid quantity to estimate demand.');
      return;
    }

    // Deterministic suggestions based on crop category and details
    let basePrice = 25;
    let demand = 'Stable';
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let confidence = 95;
    let buyers = 8;
    let sellingTime = 'Next 48 Hours';

    if (listCategory === 'Vegetables') {
      basePrice = listGrade.includes('Premium') ? 28 : 22;
      demand = 'High';
      trend = 'up';
      buyers = 12;
      confidence = 97;
    } else if (listCategory === 'Grains') {
      basePrice = listGrade.includes('Premium') ? 32 : 26;
      demand = 'Stable';
      trend = 'stable';
      buyers = 5;
      confidence = 94;
    } else if (listCategory === 'Fruits') {
      basePrice = listGrade.includes('Premium') ? 75 : 55;
      demand = 'High';
      trend = 'up';
      buyers = 18;
      confidence = 96;
      sellingTime = 'Next 24 Hours';
    }

    setAiPriceDetails({
      suggestedPrice: basePrice,
      demand,
      sellingTime,
      buyersCount: buyers,
      trend,
      confidence
    });

    // Auto set the price input to suggestion
    setListPrice(String(basePrice));
  };

  // Submit Listing (Farmer)
  const handlePublishListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !listTitle || !listPrice || !listQty) {
      alert('Please fill out all fields.');
      return;
    }

    try {
      const newProduct: Product = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        farmer_id: user.id,
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
          : 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=600&q=80',
        created_at: new Date().toISOString()
      };

      await dbService.createProduct(newProduct);
      
      // Mine Listing block
      await blockchainService.mineBlock('CROP_LISTED', {
        productId: newProduct.id,
        farmerId: user.id,
        title: listTitle,
        quantity: Number(listQty),
        pricePerUnit: Number(listPrice)
      });

      // Clear states
      setListTitle('');
      setListPrice('');
      setListQty('');
      setListDesc('');
      setAiPriceDetails(null);
      setShowListingModal(false);
      
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Create Negotiation Offer (Buyer)
  const handleMakeOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProduct) return;

    try {
      const newOffer: Offer = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        product_id: selectedProduct.id,
        buyer_id: user.id,
        offer_price: offerPrice,
        quantity: offerQuantity,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      await dbService.createOffer(newOffer);

      // Create notification for Farmer
      await dbService.createNotification({
        user_id: selectedProduct.farmer_id,
        message: `New bid received for ${selectedProduct.title}: ₳ ${offerPrice}/kg from ${user.full_name}`,
        type: 'offer_received'
      });

      // Mine negotiation offer block
      await blockchainService.mineBlock('OFFER_CREATED', {
        offerId: newOffer.id,
        buyerId: user.id,
        productId: selectedProduct.id,
        offerPrice,
        quantity: offerQuantity
      });

      setShowNegotiateDrawer(false);
      setSelectedProduct(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Farmer Accept Offer
  const handleAcceptOffer = async (offer: Offer) => {
    if (!user) return;
    try {
      // Update offer status to accepted
      await dbService.updateOffer(offer.id, { status: 'accepted' });

      // Create Order
      const newOrder: Order = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        offer_id: offer.id,
        buyer_id: offer.buyer_id,
        farmer_id: user.id,
        product_id: offer.product_id,
        total_amount: offer.offer_price * offer.quantity,
        status: 'negotiated',
        created_at: new Date().toISOString()
      };

      await dbService.createOrder(newOrder);

      // Create notification for Buyer
      await dbService.createNotification({
        user_id: offer.buyer_id,
        message: `Your offer for ${offer.product?.title} was ACCEPTED. Contract generated. Please lock escrow.`,
        type: 'offer_accepted'
      });

      // Mine offer accepted block
      await blockchainService.mineBlock('OFFER_ACCEPTED', {
        offerId: offer.id,
        orderId: newOrder.id,
        farmerId: user.id,
        buyerId: offer.buyer_id
      });

      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Farmer Counter Offer
  const handleCounterOffer = async (offer: Offer) => {
    if (!counterPriceInput || isNaN(Number(counterPriceInput))) return;
    try {
      const price = Number(counterPriceInput);
      await dbService.updateOffer(offer.id, {
        status: 'countered',
        counter_price: price
      });

      // Notify Buyer
      await dbService.createNotification({
        user_id: offer.buyer_id,
        message: `Farmer counter-offered ₳ ${price}/kg on ${offer.product?.title}.`,
        type: 'offer_countered'
      });

      setActiveCounterOfferId(null);
      setCounterPriceInput('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Farmer Decline Offer
  const handleDeclineOffer = async (offer: Offer) => {
    try {
      await dbService.updateOffer(offer.id, { status: 'declined' });
      await dbService.createNotification({
        user_id: offer.buyer_id,
        message: `Your offer for ${offer.product?.title} was declined by the farmer.`,
        type: 'offer_declined'
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Buyer Accept Counter Offer
  const handleAcceptCounterOffer = async (offer: Offer) => {
    if (!user || !offer.counter_price) return;
    try {
      await dbService.updateOffer(offer.id, {
        status: 'accepted',
        offer_price: offer.counter_price,
        counter_price: undefined
      });

      const newOrder: Order = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        offer_id: offer.id,
        buyer_id: user.id,
        farmer_id: offer.product!.farmer_id,
        product_id: offer.product_id,
        total_amount: offer.counter_price * offer.quantity,
        status: 'negotiated',
        created_at: new Date().toISOString()
      };

      await dbService.createOrder(newOrder);

      // Notify Farmer
      await dbService.createNotification({
        user_id: offer.product!.farmer_id,
        message: `Buyer accepted your counter-offer for ${offer.product?.title}. Contract generated.`,
        type: 'offer_accepted'
      });

      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Order Flow Step 1: Buyer Generate Contract
  const handleGenerateContract = async (order: Order) => {
    if (!wallet) return;
    try {
      // Get farmer wallet details
      const farmerWallet = await dbService.getWallet(order.farmer_id);
      if (!farmerWallet) return;

      // Update Order Status
      await dbService.updateOrder(order.id, { status: 'contract_generated' });
      
      // Call blockchain creation script
      await blockchainService.createContract(order, wallet, farmerWallet);

      // Notify Farmer
      await dbService.createNotification({
        user_id: order.farmer_id,
        message: `Cardano Escrow Plutus Contract generated for order #${order.id.slice(0, 5)}. Please review.`,
        type: 'contract_generated'
      });

      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Order Flow Step 2: Buyer Lock Escrow Funds
  const handleLockFunds = async (order: Order) => {
    if (!wallet) return;
    try {
      const amountAda = Math.round(order.total_amount * 0.05); // 1 INR = ~0.05 ADA in demo
      
      if (wallet.balance < amountAda) {
        alert('Insufficient wallet balance. Use the Cardano Wallet page to request Test ADA.');
        return;
      }

      await blockchainService.lockFunds(order, wallet, amountAda);
      await dbService.updateOrder(order.id, { status: 'funds_locked' });

      // Notify Farmer
      await dbService.createNotification({
        user_id: order.farmer_id,
        message: `Payment of ₳ ${amountAda} locked in Cardano escrow script for order #${order.id.slice(0, 5)}. Start shipment!`,
        type: 'funds_locked'
      });

      await refreshWallet();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Order Flow Step 3: Farmer Signs & Ships Crop
  const handleShipCrop = async (order: Order) => {
    try {
      await dbService.updateOrder(order.id, { status: 'shipment_started' });

      // Mine block
      await blockchainService.mineBlock('SHIPMENT_STARTED', {
        orderId: order.id,
        farmerId: order.farmer_id,
        buyerId: order.buyer_id,
        timestamp: new Date().toISOString()
      });

      // Notify Buyer
      await dbService.createNotification({
        user_id: order.buyer_id,
        message: `Your crop shipment for order #${order.id.slice(0, 5)} has started. Track delivery.`,
        type: 'shipment_started'
      });

      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Order Flow Step 4: Buyer Confirms Delivery & Releases Escrow
  const handleConfirmDelivery = async (order: Order) => {
    if (!wallet) return;
    try {
      const amountAda = Math.round(order.total_amount * 0.05);
      const farmerWallet = await dbService.getWallet(order.farmer_id);
      if (!farmerWallet) return;

      // Release ADA to farmer
      await blockchainService.releaseFunds(order, wallet, farmerWallet, amountAda);

      // Update Order Status
      await dbService.updateOrder(order.id, { status: 'contract_closed' });

      // Mint reputation NFT
      const nftResult = await blockchainService.mintReputationNFT(order.id, order.farmer, order.buyer, order.total_amount);
      setMintedNft(nftResult);
      setShowNftModal(true);

      // Notify Farmer
      await dbService.createNotification({
        user_id: order.farmer_id,
        message: `Escrow released! ₳ ${amountAda} deposited to your wallet. Cardano Reputation NFT generated.`,
        type: 'funds_released'
      });

      // Open reviews dialog
      setReviewOrder(order);
      setShowReviewModal(true);

      await refreshWallet();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Star Ratings Submit
  const handleReviewSubmit = async () => {
    if (!user || !reviewOrder) return;
    try {
      const reviewObj = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        farmer_id: reviewOrder.farmer_id,
        buyer_id: user.id,
        rating: reviewRating,
        review: reviewText,
        order_id: reviewOrder.id,
        created_at: new Date().toISOString()
      };

      await dbService.createReview(reviewObj);

      setShowReviewModal(false);
      setReviewOrder(null);
      setReviewText('');
      setReviewRating(5);
      fetchData();
    } catch (err) {
      console.error(err);
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

  if (loading && products.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Syncing with Cardano Ledger...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* -------------------- FARMER HUB VIEW -------------------- */}
      {activeRole === 'farmer' && (
        <div className="space-y-8">
          
          {/* Header Panel */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-white">Farmer Sales Center</h1>
              <p className="text-sm text-slate-400 mt-1">Manage listings, accept buyer offers, and confirm smart contract shipments</p>
            </div>
            
            <button
              onClick={() => setShowListingModal(true)}
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4.5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 hover:opacity-95 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Sell New Produce</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Active Listings */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-white flex items-center space-x-2">
                  <Tractor className="h-5 w-5 text-emerald-400" />
                  <span>My Active Crop Listings</span>
                </h2>
                <span className="rounded-full bg-slate-900 border border-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {products.filter(p => p.farmer_id === user?.id).length} Active
                </span>
              </div>

              {products.filter(p => p.farmer_id === user?.id).length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center text-slate-500 text-sm">
                  You haven't listed any crops yet. Click "Sell New Produce" to start.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.filter(p => p.farmer_id === user?.id).map(prod => (
                    <div key={prod.id} className="glass-card rounded-xl overflow-hidden flex flex-col justify-between border-slate-850 hover:border-slate-800 transition">
                      {prod.image_url && (
                        <img src={prod.image_url} alt={prod.title} className="h-32 w-full object-cover" />
                      )}
                      <div className="p-4 space-y-3">
                        <div>
                          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/20">{prod.category}</span>
                          <h3 className="text-sm font-bold text-white mt-1.5 line-clamp-1">{prod.title}</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">{prod.grade}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-900 pt-3">
                          <div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Price per unit</p>
                            <p className="text-sm font-extrabold text-white mt-1">₹{prod.price_per_unit}/{prod.unit_type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Stock</p>
                            <p className="text-sm font-semibold text-slate-300 mt-1">{prod.quantity_available} {prod.unit_type}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side: Active Offers & Escrow Tracker */}
            <div className="space-y-8">
              
              {/* Offers/Negotiations */}
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-white flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-teal-400" />
                    <span>Sales Negotiations</span>
                  </h2>
                  <span className="rounded-full bg-slate-900 border border-slate-800 px-2 py-0.5 text-xs text-slate-400">
                    {offers.filter(o => o.status === 'pending' || o.status === 'countered').length} Bids
                  </span>
                </div>

                {offers.filter(o => o.status === 'pending' || o.status === 'countered').length === 0 ? (
                  <div className="glass-card rounded-2xl p-6 text-center text-slate-500 text-xs">
                    No active negotiations or counter-bids.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {offers.filter(o => o.status === 'pending' || o.status === 'countered').map(offer => (
                      <div key={offer.id} className="glass-card rounded-xl p-4 border-slate-850 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xs font-bold text-white line-clamp-1">{offer.product?.title}</h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">Bidder: {offer.buyer?.full_name}</p>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">Trust {offer.buyer?.trust_score}%</span>
                        </div>
                        
                        <div className="flex justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-850 text-xs">
                          <div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Bid Price</p>
                            <p className="font-extrabold text-white mt-0.5">₹{offer.offer_price}/kg</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Qty Requested</p>
                            <p className="font-semibold text-slate-300 mt-0.5">{offer.quantity} kg</p>
                          </div>
                        </div>

                        {offer.status === 'countered' && (
                          <div className="text-[10px] text-orange-400 font-semibold border border-orange-500/20 bg-orange-500/5 px-2 py-1 rounded">
                            Waiting for buyer review (Counter: ₹{offer.counter_price}/kg)
                          </div>
                        )}

                        {offer.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAcceptOffer(offer)}
                              className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-600 transition"
                            >
                              Accept Bid
                            </button>
                            
                            {activeCounterOfferId === offer.id ? (
                              <div className="flex items-center space-x-1.5 w-full bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                                <input
                                  type="text"
                                  placeholder="Counter Price"
                                  value={counterPriceInput}
                                  onChange={(e) => setCounterPriceInput(e.target.value)}
                                  className="w-full bg-transparent px-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                                />
                                <button
                                  onClick={() => handleCounterOffer(offer)}
                                  className="rounded bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-600"
                                >
                                  Submit
                                </button>
                                <button
                                  onClick={() => setActiveCounterOfferId(null)}
                                  className="rounded bg-slate-800 p-1 text-slate-400 hover:text-white"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => setActiveCounterOfferId(offer.id)}
                                  className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-[11px] font-bold text-slate-300 hover:bg-slate-850"
                                >
                                  Counter
                                </button>
                                <button
                                  onClick={() => handleDeclineOffer(offer)}
                                  className="rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Escrow Shipments Tracker */}
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="font-display text-lg font-bold text-white flex items-center space-x-2">
                    <Ship className="h-5 w-5 text-orange-400" />
                    <span>Escrow Deliveries</span>
                  </h2>
                </div>

                {orders.length === 0 ? (
                  <div className="glass-card rounded-2xl p-6 text-center text-slate-500 text-xs">
                    No active contract sales.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map(order => (
                      <EscrowTimelineCard
                        key={order.id}
                        order={order}
                        onAction={order.status === 'funds_locked' ? () => handleShipCrop(order) : undefined}
                        actionText={order.status === 'funds_locked' ? 'Mark Crop as Shipped' : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      )}


      {/* -------------------- BUYER HUB / MARKETPLACE VIEW -------------------- */}
      {activeRole === 'buyer' && (
        <div className="space-y-8">
          
          {/* Marketplace Browse Search */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-850 pb-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-white">Direct Crop Marketplace</h1>
              <p className="text-sm text-slate-400 mt-1">Discover, negotiate, and purchase verified crops directly from agricultural producers</p>
            </div>
            
            <div className="flex items-center space-x-2 w-full md:w-80 rounded-xl border border-slate-805 bg-slate-900/60 px-3.5 py-2.5 focus-within:border-emerald-500/50 transition">
              <Search className="h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search crops or regions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Product List */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Category tabs */}
              <div className="flex space-x-1.5 overflow-x-auto pb-2">
                {['All', 'Vegetables', 'Grains', 'Fruits'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
                      selectedCategory === cat
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 glow-emerald'
                        : 'border-slate-805 bg-slate-900/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {filteredProducts.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center text-slate-500 text-sm">
                  No crops found matching your selection.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts.map(prod => (
                    <div 
                      key={prod.id} 
                      className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border-slate-850 hover:border-emerald-500/30 transition-all duration-300"
                    >
                      {prod.image_url && (
                        <img src={prod.image_url} alt={prod.title} className="h-40 w-full object-cover" />
                      )}
                      
                      <div className="p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/20">{prod.category}</span>
                            <h3 className="text-sm font-bold text-white mt-1.5 line-clamp-1">{prod.title}</h3>
                          </div>
                          
                          {/* Trust rating overlay */}
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-emerald-400 block leading-none">Trust</span>
                            <span className="text-xs font-extrabold text-white">{prod.farmer?.trust_score || 95}%</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2">{prod.description}</p>
                        
                        <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          <span>Punjab Farms • Farmer: {prod.farmer?.full_name}</span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-900 pt-3">
                          <div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Price per unit</p>
                            <p className="text-base font-extrabold text-white mt-1">₹{prod.price_per_unit}/kg</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Available</p>
                            <p className="text-sm font-semibold text-slate-300 mt-1">{prod.quantity_available} kg</p>
                          </div>
                        </div>

                        {/* Trade actions */}
                        <div className="flex space-x-2 pt-1.5">
                          <button
                            onClick={() => {
                              setSelectedProduct(prod);
                              setOfferPrice(prod.price_per_unit);
                              setOfferQuantity(100);
                              setShowNegotiateDrawer(true);
                            }}
                            className="flex-1 flex items-center justify-center space-x-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition"
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

            {/* Right Side: Buyer Bids & Escrow tracking */}
            <div className="space-y-8">
              
              {/* Active Negotiations */}
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="font-display text-lg font-bold text-white flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-teal-400" />
                    <span>My Outgoing Bids</span>
                  </h2>
                </div>

                {offers.filter(o => o.buyer_id === user?.id).length === 0 ? (
                  <div className="glass-card rounded-2xl p-6 text-center text-slate-500 text-xs">
                    You haven't submitted any offers yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {offers.filter(o => o.buyer_id === user?.id).map(offer => (
                      <div key={offer.id} className="glass-card rounded-xl p-4 border-slate-850 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xs font-bold text-white line-clamp-1">{offer.product?.title}</h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">Farmer: {offer.product?.farmer?.full_name}</p>
                          </div>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border ${
                            offer.status === 'accepted'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : offer.status === 'countered'
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse-ring'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}>
                            {offer.status}
                          </span>
                        </div>

                        <div className="flex justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-850 text-xs">
                          <div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">My Bid</p>
                            <p className="font-extrabold text-white mt-0.5">₹{offer.offer_price}/kg</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Qty</p>
                            <p className="font-semibold text-slate-300 mt-0.5">{offer.quantity} kg</p>
                          </div>
                        </div>

                        {offer.status === 'countered' && (
                          <div className="space-y-2 border-t border-slate-850 pt-2">
                            <p className="text-[11px] text-orange-400 font-semibold">
                              Farmer counter-offer: ₹{offer.counter_price}/kg
                            </p>
                            <button
                              onClick={() => handleAcceptCounterOffer(offer)}
                              className="w-full rounded bg-emerald-500 px-2 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-600 transition"
                            >
                              Accept Counter Offer
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Purchases Escrow Manager */}
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="font-display text-lg font-bold text-white flex items-center space-x-2">
                    <ShieldCheck className="h-5 w-5 text-orange-400 animate-pulse" />
                    <span>My Active Purchases</span>
                  </h2>
                </div>

                {orders.filter(o => o.buyer_id === user?.id).length === 0 ? (
                  <div className="glass-card rounded-2xl p-6 text-center text-slate-500 text-xs">
                    No active escrow purchases.
                  </div>
                ) : (
                  <div className="space-y-3">
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
                            ? 'Generate Cardano Script'
                            : order.status === 'contract_generated'
                            ? `Sign & Lock ₳ ${Math.round(order.total_amount * 0.05)} ADA`
                            : order.status === 'shipment_started'
                            ? 'Confirm Delivery & Release'
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      )}


      {/* -------------------- SELL CROP MODAL (FARMER) -------------------- */}
      {showListingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="font-display text-lg font-bold text-white flex items-center space-x-2">
                <Plus className="h-5 w-5 text-emerald-400" />
                <span>List Crop for Sale</span>
              </h2>
              <button 
                onClick={() => { setShowListingModal(false); setAiPriceDetails(null); }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePublishListing} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Crop Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Organic Tomatoes"
                    value={listTitle}
                    onChange={(e) => setListTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-805 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Category</label>
                  <select
                    value={listCategory}
                    onChange={(e) => setListCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-805 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Grains">Grains</option>
                    <option value="Fruits">Fruits</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Quality Grade</label>
                  <select
                    value={listGrade}
                    onChange={(e) => setListGrade(e.target.value)}
                    className="w-full rounded-lg border border-slate-805 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Grade A (Premium)">Grade A (Premium)</option>
                    <option value="Grade B (Standard)">Grade B (Standard)</option>
                    <option value="Organic Certified">Organic Certified</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Quantity (kg)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={listQty}
                    onChange={(e) => setListQty(e.target.value)}
                    className="w-full rounded-lg border border-slate-805 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Price suggestion tool */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-bold">
                    <Sparkles className="h-4.5 w-4.5 text-emerald-500 animate-pulse-ring" />
                    <span>AI Pricing & Demand Assistant</span>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[10px] border-t border-slate-850 pt-3">
                    <div>
                      <span className="text-slate-400 block">AI Recommended Price</span>
                      <span className="font-bold text-white text-xs">₹{aiPriceDetails.suggestedPrice}/kg</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Demand Outlook</span>
                      <span className="font-semibold text-emerald-400 uppercase">{aiPriceDetails.demand}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Nearby Buyers</span>
                      <span className="font-semibold text-white">{aiPriceDetails.buyersCount} buyers active</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Market Trend</span>
                      <span className="font-semibold text-white capitalize">{aiPriceDetails.trend === 'up' ? '↗ Increasing' : '→ Stable'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">AI Confidence</span>
                      <span className="font-bold text-emerald-400">{aiPriceDetails.confidence}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Best Selling Window</span>
                      <span className="font-semibold text-slate-300">{aiPriceDetails.sellingTime}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 border-t border-slate-850/50 pt-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Set Price (₹/kg)</label>
                    <input
                      type="number"
                      placeholder="Price per unit"
                      value={listPrice}
                      onChange={(e) => setListPrice(e.target.value)}
                      className="w-full rounded-lg border border-slate-805 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
                <textarea
                  placeholder="Tell buyers about harvest date, shipping arrangements..."
                  rows={2}
                  value={listDesc}
                  onChange={(e) => setListDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-805 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:opacity-95"
              >
                <span>Publish Listing on Ledger</span>
              </button>
            </form>
          </div>
        </div>
      )}


      {/* -------------------- BUYER NEGOTIATION / BUY DRAWER -------------------- */}
      {showNegotiateDrawer && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-sm p-0">
          <div className="glass-card w-full max-w-md h-full rounded-l-2xl p-6 shadow-2xl flex flex-col justify-between border-y-0 border-r-0">
            <div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                <h2 className="font-display text-lg font-bold text-white flex items-center space-x-2">
                  <Coins className="h-5 w-5 text-emerald-400" />
                  <span>Start Crop Negotiation</span>
                </h2>
                <button onClick={() => setShowNegotiateDrawer(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                
                {/* Crop details mini summary */}
                <div className="flex space-x-3.5 bg-slate-900 p-3 rounded-xl border border-slate-850">
                  {selectedProduct.image_url && (
                    <img src={selectedProduct.image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedProduct.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Farmer: {selectedProduct.farmer?.full_name} ({selectedProduct.farmer?.trust_score}% Trust)</p>
                    <p className="text-xs font-extrabold text-emerald-400 mt-1">₹{selectedProduct.price_per_unit}/kg</p>
                  </div>
                </div>

                {/* AI Guidance panel */}
                <div className="rounded-xl border border-slate-800/80 bg-emerald-500/5 p-4 space-y-2">
                  <div className="flex items-center space-x-1 text-xs text-emerald-400 font-bold">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Deal Assistant</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    The current market price is stable at ₹{selectedProduct.price_per_unit}/kg. Offers within 10% of the list price (₹{Math.round(selectedProduct.price_per_unit * 0.9)} - ₹{selectedProduct.price_per_unit}) are highly likely to be accepted.
                  </p>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                    <span>AI Confidence: 96%</span>
                    <span>Demand Level: High</span>
                  </div>
                </div>

                {/* Slider Inputs */}
                <form onSubmit={handleMakeOffer} className="space-y-4">
                  <div>
                    <label className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      <span>Bid Price (₹/kg)</span>
                      <span className="text-white font-extrabold">₹{offerPrice}/kg</span>
                    </label>
                    <input
                      type="range"
                      min={Math.round(selectedProduct.price_per_unit * 0.75)}
                      max={selectedProduct.price_per_unit}
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(Number(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-800 rounded-lg appearance-none h-1.5"
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      <span>Quantity Required (kg)</span>
                      <span className="text-white font-extrabold">{offerQuantity} kg</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max={selectedProduct.quantity_available}
                      step="50"
                      value={offerQuantity}
                      onChange={(e) => setOfferQuantity(Number(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-800 rounded-lg appearance-none h-1.5"
                    />
                  </div>

                  <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Escrow Total:</span>
                    <span className="text-base font-extrabold text-emerald-400">₹{(offerPrice * offerQuantity).toLocaleString()}</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center space-x-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition"
                  >
                    <span>Submit Offer to Farmer</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </form>

              </div>
            </div>

            <div className="text-[10px] text-slate-500 text-center">
              All transactions are secured by Cardano preview Smart Contracts.
            </div>
          </div>
        </div>
      )}


      {/* -------------------- CARDANO REPUTATION NFT MODAL -------------------- */}
      {showNftModal && mintedNft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center space-y-6 relative overflow-hidden">
            
            {/* Spinning background light */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse-ring" />

            <div className="flex justify-end">
              <button onClick={() => setShowNftModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 relative z-10">
              
              {/* Spinning Web3 NFT Badge */}
              <div className="mx-auto h-40 w-40 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-blue-600 p-0.5 shadow-2xl rotate-6 hover:rotate-0 transition duration-500">
                <div className="h-full w-full bg-slate-950 rounded-2xl p-3 flex flex-col justify-between items-center text-[10px]">
                  <div className="flex justify-between w-full text-slate-500 font-mono">
                    <span>AGRITRUST</span>
                    <span>NFT PROOF</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <Award className="h-12 w-12 text-emerald-400 animate-bounce" />
                    <p className="font-display font-extrabold text-[11px] text-white mt-1">Reputation Certificate</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Cardano Preview Net</p>
                  </div>

                  <div className="w-full text-left font-mono text-[8px] text-slate-400 border-t border-slate-900 pt-1.5 truncate">
                    HASH: {mintedNft.txHash.slice(0, 16)}...
                  </div>
                </div>
              </div>

              <h3 className="font-display text-xl font-extrabold text-white mt-6">Reputation NFT Minted!</h3>
              <p className="text-xs text-slate-400">
                A trade completion token has been cryptographically minted on the Cardano ledger.
              </p>
              
              <div className="bg-slate-900 rounded-lg p-2.5 text-[10px] text-slate-500 font-mono text-left space-y-1">
                <p><span className="text-slate-400">Asset ID:</span> {mintedNft.nftId}</p>
                <p><span className="text-slate-400">Policy:</span> policy_reputation_v1_cardano...</p>
              </div>

              <button
                onClick={() => setShowNftModal(false)}
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 transition"
              >
                Claim Certificate
              </button>
            </div>
          </div>
        </div>
      )}


      {/* -------------------- STAR RATING DIALOG -------------------- */}
      {showReviewModal && reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-5">
            <h3 className="font-display text-base font-bold text-white">Rate Farmer Direct Trade</h3>
            <p className="text-xs text-slate-400">
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
                        : 'text-slate-600 hover:text-amber-400'
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
              className="w-full rounded-lg border border-slate-805 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />

            <button
              onClick={handleReviewSubmit}
              className="w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 transition"
            >
              Submit Trade Verification Review
            </button>
          </div>
        </div>
      )}


      {/* -------------------- QR CODE VERIFICATION DIALOG -------------------- */}
      {showQrModal && qrCodeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-display text-sm font-bold text-white">Trade Verification QR</span>
              <button onClick={() => { setShowQrModal(false); setQrCodeOrder(null); }} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Dynamic QR code renderer calling public generator API */}
              <div className="mx-auto h-40 w-40 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    `${window.location.origin}/#/verify/${qrCodeOrder.id}`
                  )}`} 
                  alt="Verification QR Code" 
                  className="h-36 w-36"
                />
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                <p className="font-bold text-white text-sm">Blockchain Certified Origin</p>
                <p>Scan this QR code with any device to verify trade authenticity, smart contract state, and wallets on the ledger.</p>
              </div>

              <div className="rounded-lg bg-slate-900 p-2.5 text-[9px] text-slate-500 font-mono text-left truncate">
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

    </div>
  );
};
export default Dashboard;
