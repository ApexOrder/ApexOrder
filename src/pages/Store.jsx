import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ShoppingCart, X, Plus, Minus, CreditCard, Wallet, PackageOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const CATEGORIES = ['All', 'Tokens', 'Ranks', 'Cosmetics', 'Bundles', 'Merch', 'Other'];

export default function Store() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [inventory, setInventory] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    base44.entities.StoreItem.list('sort_order').then(data => {
      setItems(data.filter(i => i.available !== false));
      setLoading(false);
    });
    if (user) {
      base44.entities.UserInventory.filter({ user_id: user.id }).then(data => {
        if (data.length > 0) setInventory(data[0]);
      });
    }
  }, [user]);

  const filtered = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQty = Math.max(0, i.quantity + delta);
        return newQty === 0 ? null : { ...i, quantity: newQty };
      }
      return i;
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price_usd || 0) * item.quantity, 0);
  const cartTokenTotal = cart.reduce((sum, item) => sum + (item.token_price || 0) * item.quantity, 0);

  const handleCheckout = async () => {
    if (!user) {
      alert('Please login to make a purchase');
      return;
    }
    setProcessing(true);
    try {
      const discordId = localStorage.getItem('discord_id');
      // Create order record
      const orderData = {
        user_id: user.id,
        discord_id: discordId || null,
        items: cart.map(i => ({ item_id: i.id, name: i.name, quantity: i.quantity, price_usd: i.price_usd })),
        total_usd: cartTotal,
        status: 'pending',
        type: cart.some(i => i.category === 'Merch') ? 'physical' : 'digital'
      };
      const order = await base44.entities.Order.create(orderData);
      
      // TODO: Redirect to Stripe checkout with order.id
      alert('Order created: ' + order.id + (discordId ? ' (Linked to Discord: ' + discordId + ')' : ' - Link Discord for easier tracking'));
      setCart([]);
      setShowCart(false);
    } catch (err) {
      alert('Checkout failed: ' + err.message);
    }
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-24">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-heading font-bold tracking-tight mb-2" style={{ color: '#D4AF37', textShadow: '0 0 30px rgba(212,175,55,0.3)' }}>STORE</h1>
            <div className="h-px w-24" style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.5), transparent)' }} />
          </div>
          <div className="flex items-center gap-4">
            {inventory && (
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded" style={{ background: 'rgba(16,255,139,0.08)', border: '1px solid rgba(16,255,139,0.2)' }}>
                <Wallet size={16} style={{ color: '#10FF8B' }} />
                <div className="text-right">
                  <div className="text-xs font-mono" style={{ color: 'rgba(16,255,139,0.7)' }}>TOKENS</div>
                  <div className="font-black" style={{ color: '#10FF8B' }}>{inventory.tokens?.toLocaleString() || 0}</div>
                </div>
              </div>
            )}
            <a href="/inventory" className="relative p-3 rounded transition-all" style={{ background: 'rgba(16,255,139,0.1)', border: '1px solid rgba(16,255,139,0.3)' }}>
              <PackageOpen size={20} style={{ color: '#10FF8B' }} />
            </a>
            <button onClick={() => setShowCart(true)} className="relative p-3 rounded transition-all" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <ShoppingCart size={20} style={{ color: '#D4AF37' }} />
              {cart.length > 0 && (
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#D4AF37', color: '#050a05' }}>
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {CATEGORIES.filter(c => c === 'All' || items.some(i => i.category === c)).map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="px-4 py-1.5 text-xs font-bold tracking-wider rounded transition-all"
              style={activeCategory === cat
                ? { background: 'rgba(212,175,55,0.2)', border: '1px solid #D4AF37', color: '#D4AF37' }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#888' }
              }>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="group relative rounded overflow-hidden flex flex-col"
              style={{ background: 'rgba(10,20,10,0.7)', border: '1px solid rgba(212,175,55,0.15)' }}>
              {item.badge && (
                <div className="absolute top-2 right-2 z-10 px-2 py-0.5 text-xs font-bold tracking-wider rounded"
                  style={{ background: '#D4AF37', color: '#050a05' }}>{item.badge}</div>
              )}
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.05)' }}>
                  <ShoppingBag size={36} style={{ color: 'rgba(212,175,55,0.3)' }} />
                </div>
              )}
              <div className="p-4 flex flex-col flex-1">
                <div className="text-xs font-bold tracking-wider mb-1" style={{ color: 'rgba(212,175,55,0.6)' }}>{item.category}</div>
                <h3 className="font-bold text-white mb-2 leading-tight">{item.name}</h3>
                {item.description && <p className="text-gray-500 text-xs leading-relaxed mb-3 flex-1">{item.description}</p>}
                <div className="flex items-center justify-between mt-auto pt-3 border-t" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
                  <div className="flex flex-col">
                    {item.price_usd ? (
                      <>
                        <span className="font-black text-lg" style={{ color: '#D4AF37' }}>${item.price_usd}</span>
                        <span className="text-xs font-mono" style={{ color: 'rgba(212,175,55,0.7)' }}>USD</span>
                      </>
                    ) : (
                      <>
                        <span className="font-black text-lg" style={{ color: '#10FF8B' }}>{item.token_price?.toLocaleString()}</span>
                        <span className="text-xs font-mono" style={{ color: 'rgba(16,255,139,0.7)' }}>TOKENS</span>
                      </>
                    )}
                  </div>
                  <button onClick={() => addToCart(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wider rounded transition-all"
                    style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}>
                    <Plus size={12} /> ADD
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded overflow-hidden"
              style={{ background: 'rgba(10,20,10,0.95)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(212,175,55,0.2)' }}>
                <h2 className="text-lg font-bold" style={{ color: '#D4AF37' }}>SHOPPING CART</h2>
                <button onClick={() => setShowCart(false)} className="p-1 hover:bg-white/10 rounded transition-colors">
                  <X size={20} style={{ color: '#888' }} />
                </button>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart size={48} style={{ color: 'rgba(212,175,55,0.2)' }} className="mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.05)' }}>
                            <ShoppingBag size={20} style={{ color: 'rgba(212,175,55,0.3)' }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-white truncate">{item.name}</div>
                          <div className="text-xs" style={{ color: item.price_usd ? '#D4AF37' : '#10FF8B' }}>
                            {item.price_usd ? `$${item.price_usd}` : `${item.token_price} tokens`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded hover:bg-white/10">
                            <Minus size={14} style={{ color: '#888' }} />
                          </button>
                          <span className="text-sm font-bold w-6 text-center text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded hover:bg-white/10">
                            <Plus size={14} style={{ color: '#888' }} />
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="p-1 hover:bg-red-900/30 rounded">
                          <X size={14} style={{ color: '#ff6464' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {cart.length > 0 && (
                <div className="p-4 border-t" style={{ borderColor: 'rgba(212,175,55,0.2)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-400">Total:</span>
                    <span className="text-xl font-black" style={{ color: '#D4AF37' }}>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button onClick={handleCheckout} disabled={processing || !user}
                    className="w-full py-3 font-bold text-sm tracking-wider rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid #D4AF37', color: '#D4AF37' }}>
                    {processing ? 'PROCESSING...' : user ? 'CHECKOUT' : 'LOGIN REQUIRED'}
                  </button>
                  {!user && <p className="text-xs text-gray-500 text-center mt-2">Please login to complete your purchase</p>}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}