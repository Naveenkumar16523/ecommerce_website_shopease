import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  LogOut, 
  Heart, 
  Package, 
  Gift, 
  Globe, 
  CreditCard, 
  MapPin, 
  Phone, 
  Edit3, 
  ChevronRight, 
  Trash2,
  Lock,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Profile() {
  const { user, logout, checkAuth } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();

  // Local State
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  
  const [supportMessages, setSupportMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Load orders and wishlist on mount
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setAddress(user.address || '');
    setPhone(user.phone || '');
    fetchOrders();
    fetchWishlist();
    fetchMessages();
  }, [user]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data || data || []);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchWishlist = async () => {
    setLoadingWishlist(true);
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.data || data || []);
      }
    } catch (err) {
      console.error("Failed to load wishlist:", err);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const res = await fetch('/api/user/messages');
      if (res.ok) {
        const data = await res.json();
        setSupportMessages(data || []);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, phone })
      });
      if (res.ok) {
        await checkAuth(); // Refresh global user context
        setIsEditing(false);
      } else {
        alert("Failed to update profile details.");
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT'
      });
      if (res.ok) {
        fetchOrders();
      } else {
        alert("Failed to cancel order.");
      }
    } catch (err) {
      console.error("Error cancelling order:", err);
    }
  };

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2MB.");
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target.result;
      try {
        const res = await fetch('/api/profile/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: base64String })
        });
        if (res.ok) {
          await checkAuth(); // Refresh profile state to fetch new avatar URL
        } else {
          alert("Could not save new avatar.");
        }
      } catch (err) {
        console.error(err);
        alert("Network error.");
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };

  const memberSinceDate = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 text-left transition-colors duration-300">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        
        {/* Left Side: Brand Panel Card */}
        <div className="md:col-span-2 bg-gray-50/50 dark:bg-[#0A0E17] border border-gray-150 dark:border-gray-800/80 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden shadow-sm">
          {/* Floating cosmic orbs background effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-[10%] -left-[10%] w-[150px] h-[150px] bg-purple-500/5 rounded-full filter blur-2xl animate-pulse" />
            <div className="absolute -bottom-[10%] -right-[10%] w-[120px] h-[120px] bg-blue-500/5 rounded-full filter blur-2xl" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* User Avatar */}
            <div className="relative group mb-6">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-md relative bg-gray-150 dark:bg-gray-900">
                <img 
                  src={user?.avatar || "https://i.pravatar.cc/150?img=3"} 
                  alt="Avatar" 
                  className={`w-full h-full object-cover ${uploadingAvatar ? 'opacity-30' : ''}`}
                />
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-neonCyan border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <button 
                onClick={() => document.getElementById('avatar-upload-input').click()} 
                className="absolute bottom-1 right-1 bg-purple-600 dark:bg-neonCyan text-white dark:text-black p-2 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
                title="Change Profile Picture"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <input 
                type="file" 
                id="avatar-upload-input" 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarChange}
              />
            </div>

            <h2 className="text-2xl font-bold dark:text-white font-syne">{user?.name || 'Loading...'}</h2>
            <p className="text-xs text-gray-400 font-semibold font-mono mt-1">{user?.email}</p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mt-3">
              {t('profile_member_since', 'Member since')} {memberSinceDate}
            </p>
            
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="mt-6 border bg-white dark:bg-black hover:opacity-85 border-gray-200 dark:border-gray-800 px-8 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm dark:text-white"
            >
              {isEditing ? t('profile_title', 'View Profile') : t('profile_edit', 'Edit Profile')}
            </button>
          </div>

          {/* Activity Links */}
          <div className="relative z-10 space-y-2">
            <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mb-4 px-2">
              {t('profile_activity', 'My Activity')}
            </span>

            <Link 
              to="/wishlist" 
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/40 dark:bg-black/20 hover:bg-white dark:hover:bg-black/45 border border-transparent hover:border-gray-100 dark:hover:border-gray-900 text-sm font-medium text-gray-700 dark:text-gray-200 transition-all group"
            >
              <span className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-purple-600 dark:text-neonCyan group-hover:scale-110 transition-transform" /> 
                {t('profile_wishlist', 'Wishlist')}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>

            <Link 
              to="/orders" 
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/40 dark:bg-black/20 hover:bg-white dark:hover:bg-black/45 border border-transparent hover:border-gray-100 dark:hover:border-gray-900 text-sm font-medium text-gray-700 dark:text-gray-200 transition-all group"
            >
              <span className="flex items-center gap-3">
                <Package className="w-4 h-4 text-purple-600 dark:text-neonCyan group-hover:scale-110 transition-transform" /> 
                {t('profile_orders', 'My Orders')}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>

            {/* Language Selection */}
            <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/40 dark:bg-black/20 border border-transparent text-sm font-medium text-gray-700 dark:text-gray-200">
              <span className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-purple-600 dark:text-neonCyan" /> 
                {t('profile_language', 'Language')}
              </span>
              <select 
                value={language} 
                onChange={handleLanguageChange}
                className="bg-transparent focus:outline-none text-xs font-bold text-right cursor-pointer text-gray-700 dark:text-gray-200 dark:bg-[#0c101d] rounded px-1"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="te">తెలుగు (Telugu)</option>
              </select>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="relative z-10 pt-4">
            <button 
              onClick={handleLogout} 
              className="w-full py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              {t('profile_signout', 'Sign Out')}
            </button>
          </div>
        </div>

        {/* Right Side: Content Panels */}
        <div className="md:col-span-3 space-y-8">
          
          {/* Wishlist Preview */}
          <div className="bg-gray-50/30 dark:bg-[#0A0D14]/50 border border-gray-150/80 dark:border-gray-800/80 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-xl font-bold font-syne dark:text-white uppercase tracking-wider">{t('profile_wishlist', 'My Wishlist')}</h3>
              <Link to="/wishlist" className="text-xs font-bold text-purple-600 dark:text-neonCyan hover:underline">
                {t('view_all', 'View All')}
              </Link>
            </div>
            
            {loadingWishlist ? (
              <p className="text-sm italic text-gray-400">Loading your wishlist...</p>
            ) : wishlist.length === 0 ? (
              <p className="text-sm italic text-gray-400">Your wishlist is empty.</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {wishlist.slice(0, 3).map((item) => (
                  <Link 
                    key={item.id} 
                    to={`/product/${item.slug}`} 
                    className="group cursor-pointer block text-left"
                  >
                    <div className="rounded-2xl overflow-hidden aspect-[4/5] mb-3 bg-white dark:bg-[#070A11]">
                      <img 
                        src={item.image || null} 
                        alt={item.name} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="font-bold text-[10px] sm:text-xs truncate dark:text-white mb-0.5">{item.name}</div>
                    <div className="font-black text-xs sm:text-sm dark:text-white">₹{item.price}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-gray-50/30 dark:bg-[#0A0D14]/50 border border-gray-150/80 dark:border-gray-800/80 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-xl font-bold font-syne dark:text-white uppercase tracking-wider">{t('profile_orders', 'Recent Orders')}</h3>
              <Link to="/orders" className="text-xs font-bold text-purple-600 dark:text-neonCyan hover:underline">
                {t('view_all', 'View All')}
              </Link>
            </div>

            {loadingOrders ? (
              <p className="text-sm italic text-gray-400">Loading your orders...</p>
            ) : orders.length === 0 ? (
              <p className="text-sm italic text-gray-400">No orders placed yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 3).map((order) => {
                  const itemCount = order.items ? order.items.length : 0;
                  const orderDate = new Date(order.created_at).toLocaleDateString();
                  const isPending = (order.status || "").toLowerCase() === 'pending';
                  
                  let statusBg = 'bg-yellow-500/10 text-yellow-500';
                  if (order.status === 'Delivered') statusBg = 'bg-green-500/10 text-green-500';
                  if (order.status === 'Cancelled') statusBg = 'bg-red-500/10 text-red-500';

                  return (
                    <div 
                      key={order.id} 
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center border border-gray-100 dark:border-gray-900 rounded-2xl p-4 bg-white dark:bg-[#0A0E17]"
                    >
                      <div className="mb-3 sm:mb-0">
                        <p className="font-bold text-sm dark:text-white">Order #{order.id}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {itemCount} Items • <span className="font-bold text-gray-700 dark:text-gray-200">₹{order.total}</span> • {orderDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-extrabold tracking-wider uppercase ${statusBg}`}>
                          {order.status}
                        </span>
                        {isPending && (
                          <button 
                            onClick={() => handleCancelOrder(order.id)}
                            className="px-3.5 py-1.5 border border-red-500 text-red-500 text-[10px] font-bold rounded-md hover:bg-red-500/5 transition-colors"
                          >
                            {t('profile_cancel', 'Cancel')}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Support Tickets */}
          <div className="bg-gray-50/30 dark:bg-[#0A0D14]/50 border border-gray-150/80 dark:border-gray-800/80 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-xl font-bold font-syne dark:text-white uppercase tracking-wider flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                Support Tickets
              </h3>
            </div>

            {loadingMessages ? (
              <p className="text-sm italic text-gray-400">Loading your support tickets...</p>
            ) : supportMessages.length === 0 ? (
              <p className="text-sm italic text-gray-400">You haven't submitted any support requests.</p>
            ) : (
              <div className="space-y-4">
                {supportMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className="border border-gray-100 dark:border-gray-900 rounded-2xl overflow-hidden bg-white dark:bg-[#0A0E17]"
                  >
                    <div className="p-4 border-b border-gray-100 dark:border-gray-900 flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm dark:text-white">Order #{msg.order_number || 'N/A'}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-md text-[10px] font-extrabold tracking-wider uppercase ${msg.admin_reply ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {msg.admin_reply ? 'Replied' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">Your Message:</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{msg.message}</p>
                    </div>

                    {msg.admin_reply && (
                      <div className="p-4 bg-purple-50 dark:bg-[#0f1423] border-t border-purple-100 dark:border-white/5">
                        <p className="text-sm font-bold text-purple-700 dark:text-neonCyan mb-1 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" /> Admin Reply:
                        </p>
                        <p className="text-xs text-purple-900 dark:text-gray-300 whitespace-pre-wrap">{msg.admin_reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shipping Information & Edit Form */}
          <div className="bg-gray-50/30 dark:bg-[#0A0D14]/50 border border-gray-150/80 dark:border-gray-800/80 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
            <h3 className="text-xl font-bold font-syne dark:text-white uppercase tracking-wider mb-6">
              {t('profile_shipping', 'Shipping Information')}
            </h3>

            {!isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-[100px_1fr] gap-2 items-start text-sm">
                  <span className="font-medium text-gray-400">{t('profile_address', 'Address')}</span>
                  <span className="font-medium dark:text-white">{user?.address || 'Not set'}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 items-center text-sm">
                  <span className="font-medium text-gray-400">{t('profile_phone', 'Phone')}</span>
                  <span className="font-medium dark:text-white">{user?.phone || 'Not set'}</span>
                </div>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="mt-4 border border-gray-200 dark:border-gray-800 px-6 py-2.5 rounded-xl text-xs font-bold transition-all bg-white dark:bg-black dark:text-white hover:opacity-85"
                >
                  {t('profile_edit', 'Edit Information')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {t('profile_address', 'Shipping Address')}
                  </label>
                  <textarea 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3} 
                    className="w-full bg-white dark:bg-[#070A11] border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-sm focus:outline-none focus:border-purple-500 dark:focus:border-neonCyan transition-all text-gray-700 dark:text-gray-200"
                    placeholder="Enter your full address"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {t('profile_phone', 'Phone Number')}
                  </label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white dark:bg-[#070A11] border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-sm focus:outline-none focus:border-purple-500 dark:focus:border-neonCyan transition-all text-gray-700 dark:text-gray-200" 
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="submit" 
                    disabled={savingProfile}
                    className="bg-black dark:bg-white text-white dark:text-black hover:opacity-90 px-8 py-3 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {savingProfile ? 'Saving...' : t('profile_save', 'Save Changes')}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setAddress(user?.address || '');
                      setPhone(user?.phone || '');
                      setIsEditing(false);
                    }} 
                    className="border border-gray-200 dark:border-gray-800 px-8 py-3 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors dark:text-white"
                  >
                    {t('profile_cancel', 'Cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Payment Methods */}
          <div className="bg-gray-50/30 dark:bg-[#0A0D14]/50 border border-gray-150/80 dark:border-gray-800/80 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
            <h3 className="text-xl font-bold font-syne dark:text-white uppercase tracking-wider mb-6">
              {t('profile_payment', 'Payment Methods')}
            </h3>
            
            <button 
              onClick={() => setShowPayments(!showPayments)} 
              className="flex items-center justify-between w-full px-5 py-4 rounded-2xl bg-white dark:bg-[#0A0E17] border border-gray-100 dark:border-gray-900 hover:opacity-85 transition-colors group"
            >
              <span className="flex items-center gap-3 font-bold text-xs dark:text-white uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-purple-600 dark:text-neonCyan group-hover:scale-110 transition-transform" />
                {t('profile_my_payments', 'My Payments')}
              </span>
              <span className="text-gray-400 group-hover:translate-x-0.5 transition-transform">
                {showPayments ? '▼' : '▶'}
              </span>
            </button>

            {showPayments && (
              <div className="flex flex-col mt-4 space-y-2 pl-4 border-l border-gray-100 dark:border-gray-900 animate-fadeIn">
                <a href="#" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-gray-500 hover:text-purple-600 dark:hover:text-neonCyan transition-all">
                  <Lock className="w-3.5 h-3.5" /> Pay Later Spec
                </a>
                <a href="#" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-gray-500 hover:text-purple-600 dark:hover:text-neonCyan transition-all">
                  <CreditCard className="w-3.5 h-3.5" /> Bank & UPI Details
                </a>
                <a href="#" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-gray-500 hover:text-purple-600 dark:hover:text-neonCyan transition-all">
                  <DollarSign className="w-3.5 h-3.5" /> Payments & Refunds
                </a>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
