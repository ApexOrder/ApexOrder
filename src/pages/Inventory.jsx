import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, Truck, XCircle, Wallet, Link as LinkIcon, ArrowUpRight, ArrowDownRight, Coins } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const STATUS_ICONS = {
  pending: Clock,
  paid: CheckCircle,
  processing: Truck,
  completed: CheckCircle,
  refunded: XCircle,
  cancelled: XCircle
};

const STATUS_COLORS = {
  pending: '#D4AF37',
  paid: '#10FF8B',
  processing: '#3B82F6',
  completed: '#10FF8B',
  refunded: '#ff6464',
  cancelled: '#ff6464'
};

export default function Inventory() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState(null);
  const [orders, setOrders] = useState([]);
  const [subscriptionItems, setSubscriptionItems] = useState([]);
  const [tokenTransactions, setTokenTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discordId, setDiscordId] = useState(null);
  const [linkingDiscord, setLinkingDiscord] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    const discordId = localStorage.getItem('discord_id');
    setDiscordId(discordId);
    
    const query = discordId ? { discord_id: discordId } : { user_id: user.id };
    Promise.all([
      base44.entities.UserInventory.filter(query),
      base44.entities.Order.filter(query, '-created_date')
    ]).then(([invData, orderData]) => {
      if (invData.length > 0) setInventory(invData[0]);
      setOrders(orderData);
      
      // Process orders into subscription items and token transactions
      const subscriptions = [];
      const transactions = [];
      
      orderData.forEach(order => {
        if (order.status === 'completed' || order.status === 'paid') {
          const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
          
          // Check if this order was purchased with tokens
          const boughtWithTokens = order.total_tokens > 0;
          
          orderItems.forEach(item => {
            // Token purchases: buying tokens with USD/donations
            if (item.category === 'Tokens' || item.name.toLowerCase().includes('token')) {
              transactions.push({
                type: 'purchase',
                orderId: order.id,
                date: order.created_date,
                tokens: item.token_price || item.quantity,
                usdAmount: order.total_usd
              });
            }
            // Token redemptions: spending tokens on in-game items
            else if (boughtWithTokens) {
              transactions.push({
                type: 'redemption',
                orderId: order.id,
                date: order.created_date,
                tokens: order.total_tokens,
                itemName: item.name
              });
            }
            
            // Subscription items (ranks with duration)
            if (item.subscription_duration_days) {
              const purchaseDate = new Date(order.created_date);
              const expiryDate = new Date(purchaseDate.getTime() + (item.subscription_duration_days * 24 * 60 * 60 * 1000));
              subscriptions.push({
                ...item,
                orderId: order.id,
                purchaseDate: order.created_date,
                expiryDate: expiryDate.toISOString(),
                type: order.type || 'digital'
              });
            }
          });
        }
      });
      
      // Sort transactions by date (newest first)
      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setSubscriptionItems(subscriptions);
      setTokenTransactions(transactions);
      setLoading(false);
    });
  }, [user, discordId]);

  const handleLinkDiscord = async () => {
    setLinkingDiscord(true);
    const discordId = prompt('Enter your Discord User ID (right-click your profile > Copy ID):');
    if (discordId) {
      localStorage.setItem('discord_id', discordId);
      setDiscordId(discordId);
      // Update existing inventory or create new one linked to Discord
      if (user && !inventory) {
        await base44.entities.UserInventory.create({
          user_id: user.id,
          discord_id: discordId,
          tokens: 0
        });
      } else if (inventory) {
        await base44.entities.UserInventory.update(inventory.id, { discord_id: discordId });
      }
    }
    setLinkingDiscord(false);
  };

  const formatTimeRemaining = (expiryDate) => {
    const diff = new Date(expiryDate).getTime() - now;
    if (diff <= 0) return { expired: true, text: 'EXPIRED' };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { expired: false, text: `${days}d ${hours}h ${minutes}m` };
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <h1 className="text-3xl font-heading font-bold tracking-tight mb-4" style={{ color: '#10FF8B' }}>INVENTORY</h1>
          <p className="text-gray-400 mb-6">Please login to view your inventory and orders.</p>
          <a href="/login" className="inline-block px-6 py-3 rounded font-bold text-sm tracking-wider" style={{ background: 'rgba(16,255,139,0.15)', border: '1px solid #10FF8B', color: '#10FF8B' }}>
            LOGIN
          </a>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-glow/20 border-t-emerald-glow rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-24">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold tracking-tight mb-2" style={{ color: '#10FF8B', textShadow: '0 0 20px rgba(16,255,139,0.3)' }}>INVENTORY</h1>
          <div className="h-px mx-auto w-24 mb-4" style={{ background: 'linear-gradient(to right, transparent, rgba(16,255,139,0.5), transparent)' }} />
          <p className="text-gray-400 text-sm">View your tokens, purchased items, and order history.</p>
        </div>

        {/* Wallet Card */}
        <div className="mb-10">
          <div className="p-6 rounded" style={{ background: 'rgba(16,255,139,0.05)', border: '1px solid rgba(16,255,139,0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,255,139,0.1)', border: '1px solid rgba(16,255,139,0.3)' }}>
                  <Wallet size={24} style={{ color: '#10FF8B' }} />
                </div>
                <div>
                  <div className="text-xs font-mono tracking-wider mb-1" style={{ color: 'rgba(16,255,139,0.7)' }}>TOKEN BALANCE</div>
                  <div className="text-3xl font-black" style={{ color: '#10FF8B' }}>{inventory?.tokens?.toLocaleString() || 0}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono tracking-wider mb-1" style={{ color: 'rgba(212,175,55,0.7)' }}>LIFETIME SPENT</div>
                <div className="text-xl font-bold" style={{ color: '#D4AF37' }}>${inventory?.lifetime_purchased?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgba(16,255,139,0.15)' }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono" style={{ color: '#888' }}>Discord:</span>
                {discordId ? (
                  <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: 'rgba(16,255,139,0.1)', color: '#10FF8B', border: '1px solid rgba(16,255,139,0.3)' }}>
                    {discordId}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">Not linked</span>
                )}
              </div>
              <button
                onClick={handleLinkDiscord}
                disabled={linkingDiscord}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wider rounded transition-all disabled:opacity-50"
                style={{ background: 'rgba(88,101,242,0.15)', border: '1px solid rgba(88,101,242,0.4)', color: '#5865F2' }}>
                <LinkIcon size={12} /> {discordId ? 'CHANGE DISCORD' : 'LINK DISCORD'}
              </button>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="mb-10">
          <h2 className="text-xl font-bold tracking-wider mb-6" style={{ color: '#D4AF37' }}>ORDER HISTORY</h2>
          {orders.length === 0 ? (
            <div className="text-center py-12 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Package size={48} style={{ color: 'rgba(212,175,55,0.2)' }} className="mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => {
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                const StatusIcon = STATUS_ICONS[order.status] || Clock;
                const statusColor = STATUS_COLORS[order.status] || '#888';
                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded" style={{ background: 'rgba(10,20,10,0.6)', border: `1px solid ${statusColor}33` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <StatusIcon size={14} style={{ color: statusColor }} />
                          <span className="font-bold text-sm text-white">Order #{order.id.slice(-6)}</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}44` }}>
                            {order.status?.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">{new Date(order.created_date).toLocaleDateString()}</span>
                        </div>
                        <div className="space-y-1">
                          {items.map((item, idx) => (
                            <div key={idx} className="text-sm text-gray-300">
                              {item.quantity}x {item.name} — ${(item.price_usd * item.quantity).toFixed(2)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{ color: '#D4AF37' }}>${order.total_usd?.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{order.type || 'digital'}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subscription Items (Ranks, etc.) */}
        <div className="mb-10">
          <h2 className="text-xl font-bold tracking-wider mb-6" style={{ color: '#D4AF37' }}>ACTIVE SUBSCRIPTIONS ({subscriptionItems.length})</h2>
          {subscriptionItems.length === 0 ? (
            <div className="text-center py-12 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Package size={48} style={{ color: 'rgba(212,175,55,0.2)' }} className="mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No active subscriptions</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptionItems.map((item, idx) => {
                const { expired, text: timeText } = formatTimeRemaining(item.expiryDate);
                return (
                  <motion.div key={`${item.orderId}-${idx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded" style={{ background: 'rgba(10,20,10,0.6)', border: expired ? '1px solid rgba(255,100,100,0.3)' : '1px solid rgba(212,175,55,0.3)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock size={16} style={{ color: expired ? '#ff6464' : '#D4AF37' }} />
                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: expired ? 'rgba(255,100,100,0.15)' : 'rgba(212,175,55,0.15)', color: expired ? '#ff6464' : '#D4AF37', border: `1px solid ${expired ? 'rgba(255,100,100,0.3)' : 'rgba(212,175,55,0.3)'}` }}>
                          {expired ? 'EXPIRED' : 'ACTIVE'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(item.purchaseDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Package size={20} style={{ color: expired ? '#ff6464' : '#D4AF37' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-white truncate">{item.name}</div>
                        <div className="text-xs text-gray-500">Order #{item.orderId.slice(-6)}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                      <span className="text-xs font-mono" style={{ color: '#888' }}>Duration: {item.subscription_duration_days} days</span>
                      <span className={`font-black text-sm ${expired ? '' : 'animate-pulse'}`} style={{ color: expired ? '#ff6464' : '#D4AF37' }}>{timeText}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Token Transaction History */}
        <div>
          <h2 className="text-xl font-bold tracking-wider mb-6" style={{ color: '#10FF8B' }}>TOKEN TRANSACTION HISTORY ({tokenTransactions.length})</h2>
          {tokenTransactions.length === 0 ? (
            <div className="text-center py-8 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Coins size={32} style={{ color: 'rgba(16,255,139,0.2)' }} className="mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No token transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokenTransactions.map((tx, idx) => (
                <motion.div key={`${tx.orderId}-${idx}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded flex items-center justify-between" style={{ background: tx.type === 'purchase' ? 'rgba(16,255,139,0.05)' : 'rgba(212,175,55,0.05)', border: `1px solid ${tx.type === 'purchase' ? 'rgba(16,255,139,0.2)' : 'rgba(212,175,55,0.2)'}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: tx.type === 'purchase' ? 'rgba(16,255,139,0.1)' : 'rgba(212,175,55,0.1)', border: `1px solid ${tx.type === 'purchase' ? 'rgba(16,255,139,0.3)' : 'rgba(212,175,55,0.3)'}` }}>
                      {tx.type === 'purchase' ? (
                        <ArrowDownRight size={18} style={{ color: '#10FF8B' }} />
                      ) : (
                        <ArrowUpRight size={18} style={{ color: '#D4AF37' }} />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{tx.type === 'purchase' ? 'Token Purchase' : `Purchased: ${tx.itemName}`}</div>
                      <div className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()} · Order #{tx.orderId.slice(-6)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black text-lg ${tx.type === 'purchase' ? '' : ''}`} style={{ color: tx.type === 'purchase' ? '#10FF8B' : '#D4AF37' }}>
                      {tx.type === 'purchase' ? '+' : '-'}{tx.tokens}
                    </div>
                    <div className="text-xs font-mono" style={{ color: tx.type === 'purchase' ? 'rgba(16,255,139,0.7)' : 'rgba(212,175,55,0.7)' }}>TOKENS</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}