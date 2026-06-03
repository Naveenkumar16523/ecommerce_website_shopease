import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  TrendingUp, Package, ShoppingBag, Users, Plus, 
  Trash2, RefreshCw, X, Shield, ChevronRight, Edit2,
  ExternalLink, Clock, Server, Star, MessageSquare,
  Activity, Tag, Lock, Bell, LineChart, ClipboardList,
  Download, LogOut, Menu, UserCheck, ShieldAlert,
  Search, Check, AlertTriangle, Layers, Upload, Truck,
  RotateCcw, Eye, CreditCard, Send, Calendar, ArrowUpRight, Grid, Sliders, Filter, Sparkles, Printer
} from 'lucide-react';

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Navigation and State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());

  // Data States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Chat States
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [chatReplyText, setChatReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Review States
  const [reviews, setReviews] = useState([]);

  // Analytics States
  const [stats, setStats] = useState(null);

  // Promotions & Coupon States
  const [coupons, setCoupons] = useState([
    { id: 1, code: 'SUMMER20', type: 'Percentage', value: 20, status: 'Active' },
    { id: 2, code: 'WELCOME10', type: 'Percentage', value: 10, status: 'Active' },
    { id: 3, code: 'FREESHIP', type: 'Free Shipping', value: 0, status: 'Active' },
  ]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState('Percentage');
  const [newCouponValue, setNewCouponValue] = useState('');

  // Team Role States
  const [teamRoles, setTeamRoles] = useState([
    { id: 1, name: 'System Administrator', email: 'admin@shopease.com', role: 'Super Admin', active: true },
    { id: 2, name: 'George Support', email: 'george@shopease.com', role: 'Support Rep', active: true },
    { id: 3, name: 'Jane Inventory', email: 'jane@shopease.com', role: 'Inventory Manager', active: true }
  ]);

  // API Config States
  const [apiSandbox, setApiSandbox] = useState(true);
  const [showApiSecret, setShowApiSecret] = useState(false);

  // Notifications preferences States
  const [notifyStock, setNotifyStock] = useState(true);
  const [notifyMsg, setNotifyMsg] = useState(true);
  const [notifyWebhooks, setNotifyWebhooks] = useState(false);
  const [notifyFailure, setNotifyFailure] = useState(true);

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('mens-shirts');
  const [newImage, setNewImage] = useState('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80');
  const [newRating, setNewRating] = useState('4.5');
  const [newStock, setNewStock] = useState('50');

  // Media Upload States
  const [uploadProductId, setUploadProductId] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Bulk Ingest States
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkProducts, setBulkProducts] = useState([]);
  const [bulkError, setBulkError] = useState('');
  const [submittingBulk, setSubmittingBulk] = useState(false);

  // Refunds States
  const [refundedOrders, setRefundedOrders] = useState({});

  // Live Activity Log Mock Events
  const [logs, setLogs] = useState([
    { id: 1, time: '13:42:01', type: 'SYS', text: 'Administrative terminal connection established successfully.' },
    { id: 2, time: '13:42:15', type: 'DB', text: 'Synced 18 active product models from primary catalog.' },
    { id: 3, time: '13:42:30', type: 'AUTH', text: 'Admin session verified for node admin@shopease.com.' }
  ]);

  // Update Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Products
      const prodRes = await fetch('/api/products');
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        const items = prodData.data || prodData.products || (Array.isArray(prodData) ? prodData : []);
        setProducts(items);
        if (items.length > 0 && !uploadProductId) {
          setUploadProductId(items[0].id.toString());
        }
      }

      // Fetch Orders
      const orderRes = await fetch('/api/admin/orders');
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrders(orderData.data || orderData.orders || (Array.isArray(orderData) ? orderData : []));
      }

      // Fetch Users
      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData.data || usersData.users || (Array.isArray(usersData) ? usersData : []));
      }

      // Fetch System Health
      const healthRes = await fetch('/api/admin/system/health');
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setSystemHealth(healthData);
      }

      // Fetch Conversations
      const msgRes = await fetch('/api/admin/messages');
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setConversations(msgData.conversations || []);
      }

      // Fetch Reviews
      const revRes = await fetch('/api/admin/reviews');
      if (revRes.ok) {
        const revData = await revRes.json();
        setReviews(revData.data || []);
      }

      // Fetch Stats
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Disconnect security terminal and log out?")) {
      await logout();
      navigate('/admin-login');
    }
  };

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!chatReplyText.trim() || !selectedConvId) return;

    setSendingReply(true);
    try {
      const res = await fetch('/api/admin/messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedConvId,
          message: chatReplyText
        })
      });
      if (res.ok) {
        setChatReplyText('');
        // Reload conversations to see our message and simulated customer response
        const msgRes = await fetch('/api/admin/messages');
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setConversations(msgData.conversations || []);
        }
      }
    } catch (err) {
      console.error("Failed to send message reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateReviewStatus = async (reviewId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const revRes = await fetch('/api/admin/reviews');
        if (revRes.ok) {
          const revData = await revRes.json();
          setReviews(revData.data || []);
        }
      }
    } catch (err) {
      console.error("Failed to update review status:", err);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to permanently delete this customer review?")) return;
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const revRes = await fetch('/api/admin/reviews');
        if (revRes.ok) {
          const revData = await revRes.json();
          setReviews(revData.data || []);
        }
      }
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-3.5 h-3.5 ${i < fullStars ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} 
          />
        ))}
        <span className="text-[10px] text-slate-500 font-mono ml-1">({rating})</span>
      </div>
    );
  };

  const handleExportData = async (exportType, filename) => {
    try {
      const res = await fetch(`/api/admin/export/${exportType}`);
      if (!res.ok) {
        alert("Failed to export data. Please verify session authorization.");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Export ${exportType} failed:`, err);
    }
  };

  const renderSalesTrendsChart = () => {
    const data = getMockOrRealDailySales();
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 40;
    const chartWidth = 600;
    const chartHeight = 240;
    
    const maxVal = Math.max(...data.map(d => d.revenue), 100);
    const minVal = 0;
    const valRange = maxVal - minVal;

    const points = data.map((d, index) => {
      const x = paddingLeft + (index / (data.length - 1 || 1)) * (chartWidth - paddingLeft - paddingRight);
      const y = chartHeight - paddingBottom - ((d.revenue - minVal) / valRange) * (chartHeight - paddingTop - paddingBottom);
      return { x, y, ...d };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;

    return (
      <div className="space-y-4 text-left">
        <div className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] font-mono text-admin-600 uppercase tracking-widest block">Gross Sales Graph (UTC Chronology)</span>
              <h4 className="text-sm font-semibold text-slate-800 mt-1">30-Day Sales Trend</h4>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-admin-600"></span>
                <span className="text-slate-600">Daily Revenue</span>
              </div>
            </div>
          </div>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1085FF" stopOpacity="0.15"/>
                <stop offset="100%" stopColor="#1085FF" stopOpacity="0.0"/>
              </linearGradient>
            </defs>
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = paddingTop + ratio * (chartHeight - paddingTop - paddingBottom);
              const val = maxVal - ratio * valRange;
              return (
                <g key={i}>
                  <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#E2E8F0" strokeWidth="0.75" strokeDasharray="2,4" />
                  <text x={paddingLeft - 8} y={y + 3} fill="#64748B" fontSize="8.5" fontFamily="monospace" textAnchor="end">${Math.round(val)}</text>
                </g>
              );
            })}
            
            {/* X-Axis line */}
            <line 
              x1={paddingLeft} 
              y1={chartHeight - paddingBottom} 
              x2={chartWidth - paddingRight} 
              y2={chartHeight - paddingBottom} 
              stroke="#CBD5E1" 
              strokeWidth="0.75" 
            />

            {/* Area Fill */}
            <path d={areaPath} fill="url(#chartGrad)" />
            
            {/* Path Line */}
            <path d={linePath} fill="none" stroke="#1085FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* X-axis labels */}
            {points.map((p, i) => {
              if (i % 5 !== 0 && i !== points.length - 1) return null;
              return (
                <g key={i}>
                  <line 
                    x1={p.x} 
                    y1={chartHeight - paddingBottom} 
                    x2={p.x} 
                    y2={chartHeight - paddingBottom + 3} 
                    stroke="#CBD5E1" 
                    strokeWidth="0.75" 
                  />
                  <text 
                    x={p.x} 
                    y={chartHeight - paddingBottom + 12} 
                    fill="#64748B" 
                    fontSize="7.5" 
                    fontFamily="monospace" 
                    textAnchor="middle"
                  >
                    {p.date}
                  </text>
                </g>
              );
            })}

            {/* Data Points */}
            {points.map((p, i) => (
              <g key={i} className="group cursor-pointer">
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="3.5" 
                  className="fill-white stroke-admin-600 stroke-[2px] hover:fill-admin-100 hover:r-[5px] transition-all" 
                />
                <title>{`${p.date}: ₹${p.revenue.toFixed(2)} (${p.orders} orders)`}</title>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const getMockOrRealDailySales = () => {
    const data = [];
    const baseDate = new Date();
    
    // Create a map of existing real sales by date (formatted consistently as MMM DD)
    const salesMap = {};
    if (stats && stats.daily_sales && stats.daily_sales.length > 0) {
      stats.daily_sales.forEach(day => {
        let key = day.date;
        if (day.date && typeof day.date === 'string' && day.date.includes('-')) {
          const parts = day.date.split('-');
          if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            const dt = new Date(y, m, d);
            key = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          }
        }
        salesMap[key] = day;
      });
    }

    // Generate exactly 30 days of data ending today
    for (let i = 29; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      if (salesMap[dateStr]) {
        data.push({
          date: dateStr,
          revenue: salesMap[dateStr].revenue,
          orders: salesMap[dateStr].orders
        });
      } else {
        // If we have NO real data at all, generate mock data.
        // Otherwise, pad with 0 revenue / 0 orders.
        if (!stats || !stats.daily_sales || stats.daily_sales.length === 0) {
          // Seeded random mock generator
          let seed = i + 4.5;
          const pseudoRandom = () => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
          };
          const dayOfWeek = d.getDay();
          const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 150 : 0;
          const trend = (30 - i) * 8;
          const noise = pseudoRandom() * 80;
          const revenue = Math.max(50, Math.round(120 + weekendBoost + trend + noise));
          data.push({
            date: dateStr,
            revenue: revenue,
            orders: Math.max(1, Math.round(revenue / 45))
          });
        } else {
          // Pad with 0 for days without orders
          data.push({
            date: dateStr,
            revenue: 0,
            orders: 0
          });
        }
      }
    }
    return data;
  };

  const renderDashboardChart = () => {
    const data = getMockOrRealDailySales();
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;
    
    const chartWidth = 500;
    const chartHeight = 180;
    
    const maxVal = Math.max(...data.map(d => d.revenue), 100);
    const minVal = 0;
    const valRange = maxVal - minVal;

    // Calculate screen points
    const points = data.map((d, index) => {
      const x = paddingLeft + (index / (data.length - 1 || 1)) * (chartWidth - paddingLeft - paddingRight);
      const y = chartHeight - paddingBottom - ((d.revenue - minVal) / valRange) * (chartHeight - paddingTop - paddingBottom);
      return { x, y, ...d };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;

    return (
      <div className="w-full">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible select-none">
          <defs>
            <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1085FF" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="#1085FF" stopOpacity="0.0"/>
            </linearGradient>
          </defs>
          
          {/* Horizontal Grid Lines & Y-axis Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + ratio * (chartHeight - paddingTop - paddingBottom);
            const val = maxVal - ratio * valRange;
            return (
              <g key={i}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={chartWidth - paddingRight} 
                  y2={y} 
                  stroke="#E2E8F0" 
                  strokeWidth="0.75" 
                  strokeDasharray="2,4" 
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 3} 
                  fill="#64748B" 
                  fontSize="7.5" 
                  fontFamily="monospace" 
                  textAnchor="end"
                >
                  ${Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* X-Axis line */}
          <line 
            x1={paddingLeft} 
            y1={chartHeight - paddingBottom} 
            x2={chartWidth - paddingRight} 
            y2={chartHeight - paddingBottom} 
            stroke="#CBD5E1" 
            strokeWidth="0.75" 
          />

          {/* Area Fill */}
          <path d={areaPath} fill="url(#glowGradient)" />
          
          {/* Path Line */}
          <path d={linePath} fill="none" stroke="#1085FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* X-axis labels */}
          {points.map((p, i) => {
            if (i % 6 !== 0 && i !== points.length - 1) return null;
            return (
              <g key={i}>
                <line 
                  x1={p.x} 
                  y1={chartHeight - paddingBottom} 
                  x2={p.x} 
                  y2={chartHeight - paddingBottom + 3} 
                  stroke="#CBD5E1" 
                  strokeWidth="0.75" 
                />
                <text 
                  x={p.x} 
                  y={chartHeight - paddingBottom + 12} 
                  fill="#64748B" 
                  fontSize="7" 
                  fontFamily="monospace" 
                  textAnchor="middle"
                >
                  {p.date}
                </text>
              </g>
            );
          })}

          {/* Interactive nodes */}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="3" 
                className="fill-white stroke-admin-600 stroke-[1.5px] hover:fill-admin-100 hover:r-[4px] transition-all" 
              />
              <title>{`${p.date}: ₹${p.revenue.toFixed(2)} (${p.orders} orders)`}</title>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Update order status via PUT /api/admin/orders/<id>/status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        addLog('SYS', `Order #${orderId} status updated to ${newStatus}.`);
        fetchData();
      } else {
        alert("Could not update order status.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  };

  // Toggle user admin status via PUT /api/admin/users/<id>/toggle-admin
  const handleToggleAdmin = async (userId) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        addLog('AUTH', `Admin privileges toggled for user ID ${userId}.`);
        fetchData();
      } else {
        alert("Could not toggle admin status.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  };

  // Add Product via POST /api/products
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newName || !newPrice) {
      alert("Please provide name and price.");
      return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          price: parseFloat(newPrice),
          category: newCategory,
          image: newImage,
          rating: parseFloat(newRating),
          stock: parseInt(newStock || 50)
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewName('');
        setNewPrice('');
        addLog('DB', `Created new catalog item: "${newName}".`);
        fetchData();
      } else {
        alert("Failed to append product to inventory.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  };

  // Delete Product via DELETE /api/products/<id>
  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm("Are you sure you want to remove this item?")) return;

    try {
      const res = await fetch(`/api/products/${prodId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        addLog('DB', `Removed catalog item ID: ${prodId}.`);
        fetchData();
      } else {
        alert("Could not delete product.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  };

  // Add log entry dynamically
  const addLog = (type, text) => {
    const time = new Date().toTimeString().split(' ')[0];
    setLogs(prev => [
      { id: Date.now(), time, type, text },
      ...prev.slice(0, 19)
    ]);
  };

  // AI draft generator for chat messages
  const handleAIDraft = (activeConv) => {
    const customerName = activeConv.user_name || "Customer";
    const answers = [
      `Hi ${customerName}, thank you for reaching out! I've checked our system registry, and your recent request has been successfully assigned to our operations node. Is there anything else I can assist you with?`,
      `Hello ${customerName}! Your message has been received. I've flagged this thread for our specialized support team, and they will process it shortly. Thank you for choosing ShopEase!`,
      `Greetings ${customerName}! Our warehouse queue is currently preparing the catalog adjustments. Your shipment will be dispatched with expedited priority!`,
      `Hi ${customerName}, I have checked the payment telemetry logs. Your transaction is fully secure and verified. We appreciate your partnership with ShopEase!`
    ];
    const randomAnswer = answers[Math.floor(Math.random() * answers.length)];
    setChatReplyText(randomAnswer);
    addLog('SYS', `AI Copilot drafted a dynamic support response for client ${customerName}.`);
  };

  // Automated Invoice and Print Dispatch Generator
  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = order.items && order.items.length > 0 
      ? order.items.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px; text-align: left;">${item.name || ('Product #' + item.product_id)}</td>
          <td style="padding: 10px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; text-align: right;">$${parseFloat(item.unit_price).toFixed(2)}</td>
          <td style="padding: 10px; text-align: right;">$${(item.quantity * item.unit_price).toFixed(2)}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="4" style="text-align: center; padding: 20px;">No items registered.</td></tr>';

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - REF #${order.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 14px; line-height: 24px; color: #555; }
            .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .invoice-logo { font-size: 24px; font-weight: bold; color: #2563EB; }
            .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .details-table td { padding: 5px; vertical-align: top; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th { background: #f8f9fa; border-bottom: 2px solid #dee2e6; padding: 10px; font-weight: bold; text-align: left; }
            .total-row td { padding: 10px; text-align: right; font-weight: bold; font-size: 16px; border-top: 2px solid #dee2e6; }
            @media print {
              body { margin: 0; }
              .invoice-box { border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="invoice-header">
              <div>
                <div class="invoice-logo">ShopEase Enterprise</div>
                <div>Operational Logistics Hub</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: bold; font-size: 18px;">INVOICE</div>
                <div>REF #${order.id}</div>
                <div>Date: ${new Date(order.created_at || Date.now()).toLocaleDateString()}</div>
              </div>
            </div>
            
            <table class="details-table">
              <tr>
                <td>
                  <strong>Billing Client:</strong><br>
                  ${order.shipping_name || 'Anonymous Customer'}<br>
                  Phone: ${order.shipping_phone || 'N/A'}<br>
                  Email: ${order.user_email || 'N/A'}
                </td>
                <td style="text-align: right;">
                  <strong>Shipping Address:</strong><br>
                  ${order.shipping_address || 'No address specified'}<br>
                  Method: ${order.shipping_method || 'Standard Transport'}
                </td>
              </tr>
            </table>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Product Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr class="total-row">
                  <td colspan="2"></td>
                  <td>Grand Total:</td>
                  <td>₹${parseFloat(order.total || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            <div style="text-align: center; margin-top: 50px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px;">
              Thank you for choosing ShopEase! System Telemetry Invoice Automated Dispatch.
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    addLog('SYS', `Printed invoice layout for Order REF #${order.id}.`);
  };

  // Coupons & Promotions handlers
  const handleCreateCoupon = (e) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const newCoupon = {
      id: Date.now(),
      code: newCouponCode.trim().toUpperCase(),
      type: newCouponType,
      value: newCouponType === 'Free Shipping' ? 0 : parseFloat(newCouponValue) || 0,
      status: 'Active'
    };
    setCoupons(prev => [...prev, newCoupon]);
    addLog('DB', `Created promotional coupon code: "${newCoupon.code}" (${newCoupon.type}: ${newCoupon.value}).`);
    setNewCouponCode('');
    setNewCouponValue('');
  };

  const handleToggleRole = (id, newRole) => {
    setTeamRoles(prev => prev.map(member => 
      member.id === id ? { ...member, role: newRole } : member
    ));
    const member = teamRoles.find(m => m.id === id);
    addLog('AUTH', `Updated permissions profile for ${member.name} to "${newRole}".`);
  };

  const handleToggleMemberActive = (id) => {
    setTeamRoles(prev => prev.map(member => 
      member.id === id ? { ...member, active: !member.active } : member
    ));
    const member = teamRoles.find(m => m.id === id);
    addLog('AUTH', `Toggled dashboard operational status for staff ${member.name}.`);
  };

  const handleSaveNotifications = () => {
    addLog('SYS', `Saved telemetry and communication alerts preferences.`);
  };

  // Image upload handling
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadPreview(URL.createObjectURL(file));
    }
  };

  const handleMediaUpload = async () => {
    if (!uploadProductId) {
      alert("Please select a target product first.");
      return;
    }
    if (!uploadFile) {
      alert("Please choose an image file to upload.");
      return;
    }
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('image', uploadFile);
      const uploadRes = await fetch('/api/admin/products/upload-image', {
        method: 'POST',
        body: formData
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        const imageUrl = uploadData.image_url;

        // Fetch selected product specs
        const selectedProd = products.find(p => p.id === parseInt(uploadProductId));
        if (selectedProd) {
          // Update the product on backend with new image URL
          const updateRes = await fetch(`/api/admin/products/${uploadProductId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: selectedProd.name,
              price: selectedProd.price,
              category: selectedProd.category,
              rating: selectedProd.rating,
              stock: selectedProd.stock || 50,
              image: imageUrl
            })
          });
          if (updateRes.ok) {
            addLog('DB', `Media associated successfully: linked image ${imageUrl} to product "${selectedProd.name}".`);
            alert("Product image associated successfully!");
            // Reset media states
            setUploadFile(null);
            setUploadPreview('');
            fetchData();
          } else {
            alert("Could not update product details with new image.");
          }
        }
      } else {
        alert("Image upload failed on the server.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setUploadingMedia(false);
    }
  };

  const clearMediaUpload = () => {
    setUploadFile(null);
    setUploadPreview('');
  };

  // Restock handler
  const handleQuickRestock = async (productId, name) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 50 })
      });
      if (res.ok) {
        const data = await res.json();
        addLog('DB', `Restocked product "${name}" by +50 units (New Stock: ${data.new_stock}).`);
        fetchData();
      } else {
        alert("Restock transaction rejected by server.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  };

  // Bulk CSV parser
  const handleValidateCsv = () => {
    setBulkError('');
    if (!bulkCsvText.trim()) {
      setBulkError("CSV text area is empty.");
      return;
    }
    const lines = bulkCsvText.trim().split('\n');
    const parsed = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length < 3) {
        setBulkError(`Line ${i + 1} does not have minimum fields (Name, Price, Category required).`);
        return;
      }
      const name = parts[0].trim();
      const price = parseFloat(parts[1].trim());
      const category = parts[2].trim();
      const image = parts[3] ? parts[3].trim() : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80';
      const rating = parts[4] ? parseFloat(parts[4].trim()) : 4.5;
      const stock = parts[5] ? parseInt(parts[5].trim()) : 50;

      if (!name || isNaN(price) || !category) {
        setBulkError(`Line ${i + 1} has invalid parameters (name: "${name}", price: "${price}", category: "${category}").`);
        return;
      }
      parsed.push({ name, price, category, image, rating, stock });
    }
    setBulkProducts(parsed);
  };

  const handleBulkUploadSubmit = async () => {
    if (bulkProducts.length === 0) {
      alert("Please validate CSV entries before processing ingestion.");
      return;
    }
    setSubmittingBulk(true);
    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: bulkProducts })
      });
      if (res.ok) {
        const data = await res.json();
        addLog('DB', `Bulk Ingested ${bulkProducts.length} new product items.`);
        alert(data.message || "Bulk upload completed successfully!");
        setBulkCsvText('');
        setBulkProducts([]);
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.message || "Bulk upload failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setSubmittingBulk(false);
    }
  };

  const clearBulkIngest = () => {
    setBulkCsvText('');
    setBulkProducts([]);
    setBulkError('');
  };

  // Process manual refund action
  const handleProcessRefund = (orderId, total, clientName) => {
    setRefundedOrders(prev => ({
      ...prev,
      [orderId]: true
    }));
    addLog('FIN', `Credit Refund of ₹${total} processed for Order #${orderId} (${clientName}).`);
    alert(`Refund of ₹${total} successfully credited to ${clientName}!`);
  };

  // Computations
  const totalSales = orders
    .filter(o => o.status === 'Delivered' || o.status === 'Processing' || o.status === 'Shipped')
    .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.category.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategory ? p.category === productCategory : true;
    return matchesSearch && matchesCategory;
  });

  const filteredOrders = orders.filter(o => {
    return (o.shipping_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
           o.id.toString().includes(orderSearch) ||
           (o.status || '').toLowerCase().includes(orderSearch.toLowerCase());
  });

  const filteredUsers = usersList.filter(u => {
    return u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
           u.email.toLowerCase().includes(userSearch.toLowerCase());
  });

  // Filter low stock products (< 15 units)
  const lowStockProducts = products.filter(p => p.stock !== undefined && p.stock !== null && p.stock < 15);

  // Shipping active dispatches (Processing or Shipped status)
  const activeDispatches = orders.filter(o => o.status === 'Processing' || o.status === 'Shipped');

  // Cancelled returns
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled');
  const totalRefundValue = cancelledOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

  // Sidebar button helper
  const renderSidebarButton = (tabId, label, icon) => {
    const isActive = activeTab === tabId;
    return (
      <button
        onClick={() => {
          setActiveTab(tabId);
          if (window.innerWidth < 1024) setSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 text-left border ${
          isActive 
            ? 'text-admin-700 bg-admin-50 border-admin-200 shadow-sm' 
            : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'
        }`}
      >
        <span className={`${isActive ? 'text-admin-600' : 'text-slate-400'} transition-colors`}>{icon}</span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex font-sans overflow-x-hidden">

      {/* SIDEBAR */}
      <aside 
        className={`fixed inset-y-0 left-0 lg:static bg-white flex flex-col h-screen transition-all duration-300 z-50 overflow-hidden shrink-0 ${
          sidebarOpen 
            ? 'w-64 translate-x-0 border-r border-slate-200 opacity-100' 
            : 'w-64 -translate-x-full border-r-0 opacity-0 pointer-events-none lg:w-0 lg:translate-x-0 lg:opacity-0'
        }`}
      >
        <div className="w-64 flex flex-col h-full shrink-0">
        {/* Sidebar Header */}
        <div className="h-20 shrink-0 flex items-center px-6 gap-3 border-b border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-admin-600 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.003 9.003 0 008.354-5.646z" />
              <circle cx="12" cy="12" r="4" fill="currentColor" />
            </svg>
          </div>
          <span className="font-syne font-bold text-slate-900 text-base tracking-wide">ShopEase</span>
          <span className="text-[9px] font-medium text-admin-600 bg-admin-50 border border-admin-200 px-1.5 py-0.5 rounded-full ml-auto">Admin</span>
        </div>


        {/* Sidebar Nav */}
        <div className="grow overflow-y-auto py-4 px-3 space-y-3 custom-scrollbar text-left">
          {renderSidebarButton('dashboard', 'Dashboard Console', <Shield className="w-4 h-4 text-admin-600" />)}

          {/* Product Management */}
          <div className="space-y-1">
            <div className="px-4 py-1 text-[9px] font-semibold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-500" />
              <span>Catalog Management</span>
            </div>
            <div className="space-y-0.5">
              {renderSidebarButton('inventory', 'Inventory Manager', <Layers className="w-4 h-4 text-emerald-400" />)}
              {renderSidebarButton('media-upload', 'Image Upload Center', <Upload className="w-4 h-4 text-indigo-400" />)}
              {renderSidebarButton('low-stock', 'Low Stock Alerts', <AlertTriangle className="w-4 h-4 text-amber-400" />)}
              {renderSidebarButton('bulk-upload', 'Bulk CSV Upload', <Plus className="w-4 h-4 text-purple-400" />)}
            </div>
          </div>

          {/* Order Management */}
          <div className="space-y-1">
            <div className="px-4 py-1 text-[9px] font-semibold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
              <span>Order Fulfillments</span>
            </div>
            <div className="space-y-0.5">
              {renderSidebarButton('orders', 'Fulfillments Queue', <ClipboardList className="w-4 h-4 text-rose-400" />)}
              {renderSidebarButton('logistics', 'Shipping & Logistics', <Truck className="w-4 h-4 text-cyan-400" />)}
              {renderSidebarButton('refunds', 'Returns & Refunds', <RotateCcw className="w-4 h-4 text-red-400" />)}
            </div>
          </div>

          {/* Customer Management */}
          <div className="space-y-1">
            <div className="px-4 py-1 text-[9px] font-semibold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Customer Center</span>
            </div>
            <div className="space-y-0.5">
              {renderSidebarButton('users', 'Full Customer List', <UserCheck className="w-4 h-4 text-blue-400" />)}
              {renderSidebarButton('reviews', 'Reviews & Ratings', <Star className="w-4 h-4 text-yellow-400" />)}
              {renderSidebarButton('messages', 'Customer Messaging', <MessageSquare className="w-4 h-4 text-cyan-400" />)}
            </div>
          </div>

          {/* Infrastructure */}
          <div className="space-y-1">
            <div className="px-4 py-1 text-[9px] font-semibold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>System & API</span>
            </div>
            <div className="space-y-0.5">
              {renderSidebarButton('system', 'System Tools', <ShieldAlert className="w-4 h-4 text-orange-400" />)}
              {renderSidebarButton('seller-api', 'API & Integrations', <Server className="w-4 h-4 text-teal-400" />)}
            </div>
          </div>

          {/* Seller Tools */}
          <div className="space-y-1">
            <div className="px-4 py-1 text-[9px] font-semibold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Seller Tools</span>
            </div>
            <div className="space-y-0.5">
              {renderSidebarButton('seller-promotions', 'Coupons & Promos', <Tag className="w-4 h-4 text-pink-400" />)}
              {renderSidebarButton('seller-roles', 'Role-Based Access', <Lock className="w-4 h-4 text-red-500" />)}
              {renderSidebarButton('seller-notifications', 'Alerts Settings', <Bell className="w-4 h-4 text-yellow-500" />)}
            </div>
          </div>

          {/* Analytics */}
          <div className="space-y-1">
            <div className="px-4 py-1 text-[9px] font-semibold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
              <LineChart className="w-3.5 h-3.5 text-slate-400" />
              <span>Analytics & Reports</span>
            </div>
            <div className="space-y-0.5">
              {renderSidebarButton('revenue-dash', 'Revenue Dashboard', <TrendingUp className="w-4 h-4 text-purple-400" />)}
              {renderSidebarButton('sales-charts', 'Sales Trends & Charts', <LineChart className="w-4 h-4 text-indigo-400" />)}
              {renderSidebarButton('business-reports', 'Business Reports', <ClipboardList className="w-4 h-4 text-emerald-400" />)}
              {renderSidebarButton('export-data', 'Export Data Center', <Download className="w-4 h-4 text-cyan-400" />)}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 shrink-0 bg-white">
          <div className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl p-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-admin-600 flex items-center justify-center text-white font-bold text-xs uppercase">
                {user ? user.name.slice(0, 2) : 'AD'}
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-xs font-semibold text-slate-900 truncate">{user ? user.name : 'George'}</p>
                <p className="text-[9px] text-slate-500 truncate">{user ? user.email : 'george@shopease.com'}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer" 
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        </div>
      </aside>

      {/* MOBILE BACKDROP */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN VIEWPORT CONTAINER */}
      <div className="grow flex flex-col min-w-0 z-10 relative">
        
        {/* HEADER */}
        <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(prev => !prev)}
              className="text-slate-500 hover:text-slate-900 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors duration-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-syne font-bold text-lg text-slate-900 uppercase tracking-wider">
              {activeTab === 'dashboard' && 'Dashboard Console'}
              {activeTab === 'inventory' && 'Inventory Manager'}
              {activeTab === 'media-upload' && 'Image Upload Center'}
              {activeTab === 'low-stock' && 'Low-Stock Alerts RESTOCK'}
              {activeTab === 'bulk-upload' && 'Bulk CSV Ingestion'}
              {activeTab === 'orders' && 'Fulfillments Queue'}
              {activeTab === 'logistics' && 'Shipping Dispatch Hub'}
              {activeTab === 'refunds' && 'Returns Queue & Refunds'}
              {activeTab === 'users' && 'Full Customer List'}
              {activeTab === 'system' && 'System Health Tools'}
              {activeTab === 'messages' && 'Customer Support Chat'}
              {activeTab === 'reviews' && 'Reviews & Ratings Moderator'}
              {activeTab === 'revenue-dash' && 'Revenue Dashboard & Metrics'}
              {activeTab === 'sales-charts' && 'Sales Trends & Chart Analytics'}
              {activeTab === 'business-reports' && 'Business Performance Reports'}
              {activeTab === 'export-data' && 'Database Export Utilities'}
              {activeTab === 'seller-promotions' && 'Coupons & Promos Engine'}
              {activeTab === 'seller-roles' && 'Staff Access & Role Management'}
              {activeTab === 'seller-notifications' && 'System Alert Configurations'}
              {activeTab === 'seller-api' && 'Secure API & Webhook Node'}
              {!([
                'dashboard', 'inventory', 'media-upload', 'low-stock', 
                'bulk-upload', 'orders', 'logistics', 'refunds', 'users', 'system', 'messages', 'reviews',
                'revenue-dash', 'sales-charts', 'business-reports', 'export-data',
                'seller-promotions', 'seller-roles', 'seller-notifications', 'seller-api'
              ].includes(activeTab)) && 'Console Terminal'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Database Engine Status Indicator */}
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-semibold text-green-700">Online</span>
            </div>

            {/* Current UTC Clock */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTime}</span>
            </div>

            {/* Back to site link */}
            <Link 
              to="/"
              className="flex items-center gap-1.5 text-xs text-admin-600 border border-admin-200 bg-admin-100 hover:bg-admin-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Site</span>
            </Link>
          </div>
        </header>

        {/* CONTENT PANELS */}
        <main className="p-8 grow overflow-y-auto text-left">
          
          {loading ? (
            <div className="min-h-100 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-admin-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-mono text-admin-600 uppercase tracking-widest animate-pulse">Syncing catalog parameters...</p>
            </div>
          ) : (
            <>
              {/* A. DASHBOARD Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  {/* Top Dashboard Actions Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-admin-200 pb-4">
                    <div className="text-left">
                      <h3 className="font-display font-bold text-sm tracking-wider uppercase text-slate-900">Enterprise Overview</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Control Centre Active Telemetry • UTC: {currentTime}</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button 
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2.5 bg-admin-50 border border-admin-200 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh Telemetry</span>
                      </button>
                    </div>
                  </div>

                  {/* Metrics Row (4 Cards) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Gross Revenue Card */}
                    <div className="relative bg-white border border-admin-200 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl min-h-35 group hover:border-blue-500/30 transition-all duration-300">
                      <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-blue-500/5 rounded-full filter blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                      <div className="flex items-center justify-between z-10">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Revenue</span>
                        <span className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                          <TrendingUp className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="text-left mt-4 z-10">
                        <h2 className="text-3xl font-semibold font-mono tracking-tight text-slate-900">₹{(stats?.metrics?.total_revenue || totalSales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                        <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                          <span>↑ 18.4% vs last week</span>
                        </p>
                      </div>
                    </div>

                    {/* Total Orders Card */}
                    <div className="relative bg-white border border-admin-200 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl min-h-35 group hover:border-emerald-500/30 transition-all duration-300">
                      <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-emerald-500/5 rounded-full filter blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
                      <div className="flex items-center justify-between z-10">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Processed Orders</span>
                        <span className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                          <ShoppingBag className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="text-left mt-4 z-10">
                        <h2 className="text-3xl font-semibold font-mono tracking-tight text-slate-900">{(stats?.metrics?.total_orders || orders.length)}</h2>
                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 bg-[#171A2C] border border-[#252A44] rounded-full text-[9px] text-[#989EB0]">
                            ⇄ {orders.filter(o => o.status === 'Pending').length} pending queue
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Average Order Value Card */}
                    <div className="relative bg-white border border-admin-200 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl min-h-35 group hover:border-purple-500/30 transition-all duration-300">
                      <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-purple-500/5 rounded-full filter blur-2xl group-hover:bg-purple-500/10 transition-all"></div>
                      <div className="flex items-center justify-between z-10">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Order Value</span>
                        <span className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                          <Check className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="text-left mt-4 z-10">
                        <h2 className="text-3xl font-semibold font-mono tracking-tight text-slate-900">${(stats?.metrics?.aov || (totalSales / (orders.length || 1))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                        <p className="text-[10px] text-blue-400 font-semibold flex items-center gap-1 mt-1">
                          <span>AOV stability high</span>
                        </p>
                      </div>
                    </div>

                    {/* Conversion Rate Card */}
                    <div className="relative bg-white border border-admin-200 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl min-h-35 group hover:border-amber-500/30 transition-all duration-300">
                      <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-amber-500/5 rounded-full filter blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
                      <div className="flex items-center justify-between z-10">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversion Rate</span>
                        <span className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                          <Users className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="text-left mt-4 z-10">
                        <h2 className="text-3xl font-semibold font-mono tracking-tight text-slate-900">{(stats?.metrics?.conversion_rate || 5.4)}%</h2>
                        <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                          <span>↑ 0.8% dynamic uplift</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main Grid: Visual Analytics Chart & Low Stock Alerts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Time Series Monitor (2/3 width) */}
                    <div className="lg:col-span-2 bg-white border border-admin-200 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl min-h-95">
                      <div className="flex items-center justify-between mb-4 border-b border-admin-200 pb-4">
                        <div className="text-left">
                          <h4 className="font-syne font-bold text-sm tracking-wider uppercase text-slate-900">SALES & UPTIME MONITOR</h4>
                          <p className="text-[10px] text-slate-500">Chronological daily gross sales registry</p>
                        </div>
                        <span className="px-3 py-1 bg-[#171A2C] border border-[#252A44] rounded-full text-[9px] font-mono text-blue-400 font-bold uppercase tracking-wider">
                          30 Days Active
                        </span>
                      </div>
                      
                      {/* Real dynamic interactive chart */}
                      <div className="grow flex items-center justify-center min-h-55">
                        {renderDashboardChart()}
                      </div>
                    </div>

                    {/* Low Stock Restock Checklist (1/3 width) */}
                    <div className="bg-white border border-admin-200 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl min-h-95">
                      <div className="flex items-center justify-between mb-4 border-b border-admin-200 pb-4">
                        <div className="text-left">
                          <h4 className="font-syne font-bold text-sm tracking-wider uppercase text-slate-900">LOW STOCK CHECKLIST</h4>
                          <p className="text-[10px] text-slate-500">Products under critical limit (&lt; 15 units)</p>
                        </div>
                        <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-mono rounded-full font-bold">
                          {products.filter(p => p.stock < 15).length} Alerts
                        </span>
                      </div>

                      {/* Low Stock Items List */}
                      <div className="grow overflow-y-auto max-h-70 space-y-3 custom-scrollbar text-left pr-1">
                        {products.filter(p => p.stock < 15).length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 font-mono text-xs py-12">
                            <Check className="w-8 h-8 text-emerald-500 mb-2" />
                            <span>Catalog stock levels healthy</span>
                          </div>
                        ) : (
                          products.filter(p => p.stock < 15).slice(0, 5).map(prod => {
                            const stockPercent = Math.min(100, Math.max(0, (prod.stock / 15) * 100));
                            return (
                              <div key={prod.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2 hover:bg-slate-100/50 transition-colors font-sans">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-xs">
                                      📦
                                    </div>
                                    <div className="overflow-hidden">
                                      <span className="text-xs font-semibold text-slate-900 truncate block">{prod.name}</span>
                                      <span className="text-[9px] text-slate-500 font-mono block">{prod.category}</span>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg shrink-0">
                                    {prod.stock} units
                                  </span>
                                </div>
                                {/* Progress Bar */}
                                <div className="space-y-1">
                                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${prod.stock < 5 ? 'bg-red-500' : 'bg-amber-500'}`}
                                      style={{ width: `${stockPercent}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-between text-[8px] font-mono text-slate-500">
                                    <span>Stock Level</span>
                                    <span>Threshold: 15</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Main Grid: Recent Orders & Activity Log */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Orders List (2/3 width) */}
                    <div className="lg:col-span-2 bg-white border border-admin-200 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl min-h-100">
                      <div className="flex items-center justify-between mb-4 border-b border-admin-200 pb-4">
                        <div className="text-left">
                          <h4 className="font-syne font-bold text-sm tracking-wider uppercase text-slate-900">RECENT ORDERS REGISTRY</h4>
                          <p className="text-[10px] text-slate-500">Latest captured store transactions</p>
                        </div>
                        <button 
                          onClick={() => setActiveTab('orders')}
                          className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                        >
                          View Fulfillments Queue →
                        </button>
                      </div>

                      {/* Orders Entries list */}
                      <div className="space-y-3 grow overflow-y-auto max-h-75 custom-scrollbar pr-1">
                        {orders.length === 0 ? (
                          <div className="h-48 flex items-center justify-center text-slate-500 font-mono text-xs">
                            NO CAPTURED TRANSACTIONS REGISTERED IN DATABASE
                          </div>
                        ) : (
                          orders.slice(0, 5).map((order) => {
                            const dateObj = new Date(order.created_at || Date.now());
                            const isPending = order.status === 'Pending';
                            
                            return (
                              <div 
                                key={order.id} 
                                className="flex items-center justify-between py-2.5 border-b border-admin-200 last:border-b-0 hover:bg-white/2 transition-all px-3 rounded-2xl"
                              >
                                <div className="flex items-center gap-3">
                                  {/* Thumbnail representation */}
                                  <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-sm shrink-0 text-blue-400 font-semibold font-mono">
                                    {order.user_name ? order.user_name.slice(0, 2).toUpperCase() : 'US'}
                                  </div>
                                  <div className="text-left overflow-hidden">
                                    <span className="font-semibold text-slate-900 text-xs block truncate">{order.user_name || order.client_name || 'Anonymous Customer'}</span>
                                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                                      REF #{(order.id.toString().padStart(6, '0'))}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 sm:gap-8">
                                  {/* Timestamp */}
                                  <span className="hidden sm:inline text-[10px] text-slate-500 font-mono text-right">
                                    {dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, {dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                  </span>

                                  {/* Status */}
                                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase ${
                                    isPending 
                                      ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20' 
                                      : order.status === 'Cancelled' 
                                        ? 'text-red-400 bg-red-500/10 border border-red-500/20' 
                                        : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                                  }`}>
                                    {order.status}
                                  </span>

                                  {/* Amount & Inspect */}
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs font-bold text-slate-900 text-right w-16">
                                      ₹{parseFloat(order.total || 0).toFixed(2)}
                                    </span>
                                    <button 
                                      onClick={() => setSelectedOrder(order)}
                                      className="p-1.5 bg-slate-50 border border-slate-200 hover:border-admin-600/40 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer transition-all"
                                      title="Inspect Order"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Operational Activity Logs (1/3 width) */}
                    <div className="bg-white border border-admin-200 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl min-h-100">
                      <div className="flex items-center justify-between mb-4 border-b border-admin-200 pb-4">
                        <div className="text-left">
                          <h4 className="font-syne font-bold text-sm tracking-wider uppercase text-slate-900">SYSTEM TELEMETRY</h4>
                          <p className="text-[10px] text-slate-500">Administrative action records</p>
                        </div>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                        </span>
                      </div>

                      {/* Log Screen */}
                      <div className="grow bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[9px] text-emerald-400 text-left overflow-y-auto max-h-75 space-y-2.5 custom-scrollbar">
                        {logs.map((log) => (
                          <div key={log.id} className="leading-relaxed hover:bg-white/2 p-1 rounded transition-colors">
                            <span className="text-slate-500">[{log.time}]</span>{' '}
                            <span className={log.type === 'SYS' ? 'text-blue-400 font-bold' : log.type === 'AUTH' ? 'text-amber-400' : 'text-emerald-400'}>
                              [{log.type}]
                            </span>{' '}
                            <span className="text-gray-300">{log.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* B. INVENTORY Tab */}
              {activeTab === 'inventory' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
                    <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                        <input 
                          type="text" 
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search product items..." 
                          className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-admin-600 focus:ring-1 focus:ring-admin-600 transition-all"
                        />
                      </div>
                      
                      <select 
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-admin-600 focus:ring-1 focus:ring-admin-600 outline-none transition-all"
                      >
                        <option value="">All Categories</option>
                        <option value="mens-shirts">Men Shirts</option>
                        <option value="mens-tshirts">Men T-Shirts</option>
                        <option value="womens-dresses">Women Dresses</option>
                        <option value="womens-tshirts">Women T-Shirts</option>
                        <option value="footwear-sneakers">Sneakers</option>
                        <option value="watches-analog">Watches</option>
                      </select>
                    </div>

                    <button 
                      onClick={() => setShowAddModal(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-admin-600 hover:bg-admin-700 text-white font-semibold shadow-sm transition-all text-xs px-5 py-3 rounded-lg hover:shadow-md cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Product</span>
                    </button>
                  </div>

                  {/* Product Grid Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-mono tracking-widest text-slate-600 font-semibold">
                            <th className="p-4">Thumbnail</th>
                            <th className="p-4">Garment Specs</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Stock</th>
                            <th className="p-4 text-center">Fulfillments</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredProducts.map(prod => (
                            <tr key={prod.id} className="hover:bg-slate-50 transition-all">
                              <td className="p-4">
                                <div className="w-10 h-12 bg-gray-100 border border-slate-200 rounded overflow-hidden">
                                  <img 
                                    src={prod.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80'} 
                                    alt={prod.name} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80';
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="p-4 font-bold text-slate-900">{prod.name}</td>
                              <td className="p-4 capitalize text-slate-800 font-medium">{prod.category}</td>
                              <td className="p-4 font-mono font-bold text-slate-900">₹{prod.price}</td>
                              <td className="p-4 font-mono text-slate-800 font-medium">{prod.stock || 50} units</td>
                              <td className="p-4 text-center">
                                <button 
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredProducts.length === 0 && (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-slate-500 font-mono">
                                No inventory records matching search query.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* MEDIA UPLOAD TAB */}
              {activeTab === 'media-upload' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 font-sans">
                    <h3 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider">Product Media & Image Upload Center</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Upload custom product photos to ShopEase local directories and associate them to existing product listings.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-sans">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6 flex flex-col justify-between">
                      <div className="space-y-4">
                        <h4 className="font-syne font-bold text-xs tracking-wider uppercase text-slate-900">Upload Media Assets</h4>
                        
                        <div className="space-y-2">
                          <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Select Target Product</label>
                          <select 
                            value={uploadProductId} 
                            onChange={(e) => setUploadProductId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-admin-600 outline-none transition-colors"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Select Image File</label>
                          <div 
                            onClick={() => document.getElementById('product-media-file').click()} 
                            className="border-2 border-dashed border-admin-200 hover:border-admin-600/40 bg-slate-50 hover:bg-slate-100/70 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group"
                          >
                            <input 
                              type="file" 
                              id="product-media-file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={handleFileChange}
                            />
                            <Upload className="w-8 h-8 text-slate-500 group-hover:text-admin-600 mx-auto mb-2 transition-colors" />
                            <p className="text-xs font-semibold text-slate-900 leading-none">Drag & drop files or click to browse</p>
                            <span className="text-[9px] text-slate-500 font-mono block mt-1">Supports PNG, JPG, JPEG, WEBP files</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between min-h-87.5">
                      <div className="border-b border-slate-200 pb-4 mb-4">
                        <h4 className="font-syne font-bold text-xs tracking-wider uppercase text-slate-900">Live Media Preview</h4>
                        <p className="text-[10px] text-slate-500">Preview selected asset coordinates before server upload</p>
                      </div>

                      <div className="grow flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-4 min-h-50 relative">
                        {uploadPreview ? (
                          <img src={uploadPreview} className="max-h-45 max-w-full object-contain rounded-lg shadow-lg" alt="Upload preview" />
                        ) : (
                          <div className="text-center text-xs text-slate-500 font-mono">
                            <Eye className="w-6 h-6 mx-auto text-gray-600 mb-2" />
                            <span>No media file currently loaded.</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex justify-end gap-3">
                        <button 
                          onClick={clearMediaUpload} 
                          className="border border-admin-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleMediaUpload} 
                          disabled={uploadingMedia || !uploadFile}
                          className="bg-admin-600 hover:bg-admin-700 text-white font-semibold shadow-sm transition-all text-xs px-5 py-2.5 rounded-lg hover:shadow-md cursor-pointer disabled:opacity-50"
                        >
                          {uploadingMedia ? 'Uploading...' : 'Save Media Association'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LOW STOCK ALERTS TAB */}
              {activeTab === 'low-stock' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 font-sans">
                    <h3 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider">Low-Stock Notifications & Restock Console</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Warehouse status updates. Real-time checklist of products with quantities lower than standard threshold (&lt; 15 units).</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                      <span className="text-[10px] font-mono text-red-600 uppercase tracking-widest block mb-1">Active Shortages Identified</span>
                      <h4 className="text-2xl font-bold font-mono text-red-600">{lowStockProducts.length} Items</h4>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                      <span className="text-[10px] font-mono text-yellow-700 uppercase tracking-widest block mb-1">Stock Threshold Value</span>
                      <h4 className="text-2xl font-bold font-mono text-yellow-700">15 Units</h4>
                    </div>
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Restock Action Unit</span>
                      <h4 className="text-2xl font-bold font-mono text-green-600">+50 Items</h4>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-slate-200 bg-slate-50">
                      <h4 className="font-syne font-bold text-sm tracking-wider uppercase text-slate-900 font-syne">Active Alert Feed</h4>
                      <p className="text-[10px] text-slate-500">Immediate operations needed for out-of-stock or low-capacity products.</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-mono tracking-widest text-slate-600 font-semibold">
                            <th className="p-4">Product Detail</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Remaining Units</th>
                            <th className="p-4">Critical Status</th>
                            <th className="p-4 text-right">Quick Restock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {lowStockProducts.map(prod => (
                            <tr key={prod.id} className="hover:bg-slate-50 transition-all">
                              <td className="p-4 font-bold text-slate-900">{prod.name}</td>
                              <td className="p-4 capitalize">{prod.category}</td>
                              <td className="p-4 font-mono font-bold text-red-600">{prod.stock || 0} units</td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded text-[9px] font-bold uppercase tracking-wider font-mono">
                                  CRITICAL STOCK
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => handleQuickRestock(prod.id, prod.name)}
                                  className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer"
                                >
                                  +50 Units
                                </button>
                              </td>
                            </tr>
                          ))}
                          {lowStockProducts.length === 0 && (
                            <tr>
                              <td colSpan="5" className="p-8 text-center text-slate-500 font-mono">
                                All warehouse inventory items exceed minimum capacity threshold.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* BULK UPLOAD TAB */}
              {activeTab === 'bulk-upload' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 font-sans">
                    <h3 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider">Bulk Product Ingestion Ledger (CSV)</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Ingest raw product records directly. Upload structured comma-separated files or paste CSV rows into the console.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6 flex flex-col justify-between">
                      <div className="space-y-4">
                        <h4 className="font-syne font-bold text-xs tracking-wider uppercase text-slate-900">Paste Raw CSV Records</h4>
                        <div className="space-y-2 text-left">
                          <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block leading-relaxed">
                            CSV Format:<br/>Name, Price, Category, Image, Rating, Stock
                          </label>
                          <textarea 
                            value={bulkCsvText}
                            onChange={(e) => setBulkCsvText(e.target.value)}
                            rows="8" 
                            placeholder="e.g.&#10;Cyber Shirt,29.99,mens-shirts,https://picsum.photos/200,4.5,75&#10;Space T-Shirt,19.99,mens-tshirts,https://picsum.photos/200,4.8,12" 
                            className="w-full bg-white border border-slate-200 rounded-lg p-4 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-admin-600 transition-all resize-none outline-none"
                          />
                        </div>
                      </div>
                      
                      {bulkError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-2.5 rounded text-[10px] font-mono">
                          {bulkError}
                        </div>
                      )}

                      <button 
                        onClick={handleValidateCsv} 
                        className="w-full bg-admin-50 border border-admin-200 text-admin-700 font-semibold text-xs px-4 py-2.5 rounded-lg hover:bg-admin-100 transition-all cursor-pointer"
                      >
                        Validate Records
                      </button>
                    </div>

                    <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between min-h-75">
                      <div className="border-b border-slate-200 pb-4 mb-4">
                        <h4 className="font-syne font-bold text-xs tracking-wider uppercase text-slate-900">Validated Products Preview</h4>
                        <p className="text-[10px] text-slate-500">Ingested entries validated and parsed from CSV inputs</p>
                      </div>

                      <div className="grow overflow-auto max-h-55 border border-slate-200 rounded-xl bg-slate-50">
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 font-mono text-slate-600 font-semibold text-[11px] uppercase">
                              <th className="p-2.5">Name</th>
                              <th className="p-2.5">Category</th>
                              <th className="p-2.5">Price</th>
                              <th className="p-2.5">Stock</th>
                              <th className="p-2.5">Rating</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {bulkProducts.map((p, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2.5 font-bold text-slate-900">{p.name}</td>
                                <td className="p-2.5 capitalize">{p.category}</td>
                                <td className="p-2.5 font-mono">₹{p.price}</td>
                                <td className="p-2.5 font-mono">{p.stock} units</td>
                                <td className="p-2.5 font-mono">{p.rating}★</td>
                              </tr>
                            ))}
                            {bulkProducts.length === 0 && (
                              <tr>
                                <td colSpan="5" className="p-6 text-center text-slate-500 font-mono">
                                  No products validated. Paste CSV rows and press validate!
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-6 flex justify-end gap-3">
                        <button 
                          onClick={clearBulkIngest}
                          className="border border-admin-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                        <button 
                          onClick={handleBulkUploadSubmit} 
                          disabled={submittingBulk || bulkProducts.length === 0}
                          className="bg-admin-600 hover:bg-admin-700 text-white font-semibold shadow-sm transition-all text-xs px-5 py-2.5 rounded-lg hover:shadow-md cursor-pointer disabled:opacity-50"
                        >
                          {submittingBulk ? 'Processing Ingestion...' : 'Process Bulk Ingestion'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* C. ORDERS Tab */}
              {activeTab === 'orders' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="flex items-center justify-between gap-4 bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
                    <div className="relative w-full max-w-md">
                      <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                      <input 
                        type="text" 
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search fulfillments by client or status..." 
                        className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-admin-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-mono tracking-widest text-slate-600 font-semibold">
                            <th className="p-4">Ref</th>
                            <th className="p-4">Billing Client</th>
                            <th className="p-4">Address Details</th>
                            <th className="p-4">Receipt</th>
                            <th className="p-4">Fulfillment Steps</th>
                            <th className="p-4 text-center">Inspect</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredOrders.map(order => (
                            <tr key={order.id} className="hover:bg-slate-50 transition-all">
                              <td className="p-4 font-mono font-bold text-slate-900">#{order.id}</td>
                              <td className="p-4">
                                <div className="font-bold text-slate-900">{order.shipping_name || 'Customer'}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{order.shipping_phone}</div>
                              </td>
                              <td className="p-4 max-w-xs truncate">{order.shipping_address}</td>
                              <td className="p-4 font-mono font-bold text-slate-900">₹{order.total}</td>
                              <td className="p-4">
                                <select
                                  value={order.status || 'Processing'}
                                  onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                  className="bg-white border border-slate-200 text-xs rounded-xl outline-none focus:border-admin-600 text-slate-800 font-medium px-3 py-1.5"
                                >
                                  <option value="Processing">Processing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="p-2 bg-admin-100 hover:bg-admin-200 text-admin-600 border border-admin-200 hover:border-admin-600/40 rounded-lg transition-all duration-300 cursor-pointer"
                                  title="Inspect Order Items"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredOrders.length === 0 && (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-slate-500 font-mono">
                                No fulfillment logs matching search query.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SHIPPING & LOGISTICS TAB */}
              {activeTab === 'logistics' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 font-sans">
                    <h3 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider">Shipping Dispatch & Logistics Hub</h3>
                    <p className="text-xs text-slate-500 mt-1">Manage carrier dispatches, shipping types, and active shipping orders.</p>
                  </div>

                  {/* Carrier cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Primary Partner</span>
                        <div className="p-2 bg-admin-100 border border-admin-200 rounded-xl text-admin-600">
                          <Truck className="w-5 h-5" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Cyber Courier</h3>
                      <p className="text-xs text-emerald-600 font-semibold">99.4% On-Time Delivery</p>
                    </div>

                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Standard Transit Speed</span>
                        <div className="p-2 bg-purple-50 border border-purple-200 rounded-xl text-purple-600">
                          <Clock className="w-5 h-5" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">2-3 Business Days</h3>
                      <p className="text-xs text-slate-500">Fully tracked express delivery</p>
                    </div>

                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Shipments</span>
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
                          <Package className="w-5 h-5" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-900 mb-1">{activeDispatches.length}</h3>
                      <p className="text-xs text-admin-600 font-semibold">Ready for dispatch or in transit</p>
                    </div>
                  </div>

                  {/* Active dispatches table */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-slate-200 bg-slate-50">
                      <h4 className="font-syne font-bold text-sm tracking-wider uppercase text-slate-900 font-syne">Active Fulfillment Dispatch List</h4>
                      <p className="text-xs text-slate-500">Orders marked as 'Processing' or 'Shipped' awaiting delivery dispatch updates.</p>
                    </div>

                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-mono tracking-widest text-slate-600 font-semibold">
                            <th className="p-4">Order ID</th>
                            <th className="p-4">Destination</th>
                            <th className="p-4">Carrier Code</th>
                            <th className="p-4">Method</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Dispatch Control</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {activeDispatches.map(order => (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-all border-b border-slate-100">
                              <td className="p-4 font-mono font-bold text-slate-900">#{order.id}</td>
                              <td className="p-4 truncate max-w-xs text-slate-700">{order.shipping_address}</td>
                              <td className="p-4 font-mono text-admin-600">CYB-{order.id + 1940}</td>
                              <td className="p-4 capitalize text-slate-700">{order.shipping_method || 'Standard Courier'}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                                  order.status === 'Shipped' 
                                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                {order.status === 'Processing' ? (
                                  <button 
                                    onClick={() => handleUpdateStatus(order.id, 'Shipped')}
                                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 hover:border-purple-300 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer"
                                  >
                                    Mark Shipped
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer"
                                  >
                                    Mark Delivered
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {activeDispatches.length === 0 && (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-slate-500 font-mono text-xs">
                                No active dispatches in queue.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* RETURNS & REFUNDS TAB */}
              {activeTab === 'refunds' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 font-sans">
                    <h3 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider">Returns Queue & Customer Refunds</h3>
                    <p className="text-xs text-slate-500 mt-1">Review cancelled transactions, request return logs, and process ledger refunds.</p>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                      <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Total Cancelled Transactions</span>
                      <h4 className="text-2xl font-bold font-mono text-red-600">{cancelledOrders.length}</h4>
                    </div>
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                      <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Total Refund Value</span>
                      <h4 className="text-2xl font-bold font-mono text-slate-900">₹{totalRefundValue.toFixed(2)}</h4>
                    </div>
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                      <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Refund Return Coefficient</span>
                      <h4 className="text-2xl font-bold font-mono text-admin-600">1.4%</h4>
                    </div>
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                      <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Audit Status</span>
                      <h4 className="text-xl font-bold font-display text-emerald-600 uppercase">Fully Audited</h4>
                    </div>
                  </div>

                  {/* Refunds Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-slate-200 bg-slate-50">
                      <h4 className="font-syne font-bold text-sm tracking-wider uppercase text-slate-900 font-syne">Refunds Queue</h4>
                      <p className="text-xs text-slate-500">Transactions eligible for manual or automated credit refunds.</p>
                    </div>

                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-mono tracking-widest text-slate-600 font-semibold">
                            <th className="p-4">Order ID</th>
                            <th className="p-4">Client Detail</th>
                            <th className="p-4">Total Amount</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                            <th className="p-4 text-right">Refund Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {cancelledOrders.map(order => (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-all border-b border-slate-100">
                              <td className="p-4 font-mono font-bold text-slate-900">#{order.id}</td>
                              <td className="p-4">
                                <div className="font-bold text-slate-900">{order.shipping_name || 'Customer'}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{order.shipping_phone}</div>
                              </td>
                              <td className="p-4 font-mono font-bold text-red-600">₹{order.total}</td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded text-[10px] font-bold uppercase tracking-wider font-mono">
                                  Cancelled
                                </span>
                              </td>
                              <td className="p-4 font-mono text-slate-700">
                                {refundedOrders[order.id] ? 'Credit Settled' : 'Awaiting Processing'}
                              </td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => handleProcessRefund(order.id, order.total, order.shipping_name)}
                                  disabled={refundedOrders[order.id]}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer disabled:opacity-40"
                                >
                                  {refundedOrders[order.id] ? 'Refunded' : 'Process Credit Refund'}
                                </button>
                              </td>
                            </tr>
                          ))}
                          {cancelledOrders.length === 0 && (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-slate-500 font-mono text-xs">
                                No cancellation refund files in queue.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* D. USERS Tab */}
              {activeTab === 'users' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="flex items-center justify-between gap-4 bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
                    <div className="relative w-full max-w-md">
                      <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input 
                        type="text" 
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search users by name or email..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-admin-600 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-mono tracking-widest text-slate-600 font-semibold">
                            <th className="p-4">User ID</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4 text-center">Admin Node</th>
                            <th className="p-4">Created Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredUsers.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-all border-b border-slate-100">
                              <td className="p-4 font-mono font-semibold text-slate-900">#{u.id}</td>
                              <td className="p-4 font-bold text-slate-900">{u.name}</td>
                              <td className="p-4 font-mono text-slate-600">{u.email}</td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => handleToggleAdmin(u.id)}
                                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                    u.is_admin === 1 
                                      ? 'bg-admin-50 text-admin-700 border border-admin-200' 
                                      : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 hover:text-slate-700'
                                  }`}
                                >
                                  {u.is_admin === 1 ? 'Admin' : 'Toggle User'}
                                </button>
                              </td>
                              <td className="p-4 font-mono text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                          {filteredUsers.length === 0 && (
                            <tr>
                              <td colSpan="5" className="p-8 text-center text-slate-500 font-mono text-xs">
                                No user nodes matching search query.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* E. SYSTEM HEALTH Tab */}
              {activeTab === 'system' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  {systemHealth ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono text-xs">
                      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
                        <h4 className="font-syne font-bold text-sm tracking-wider uppercase text-slate-900 pb-2 border-b border-slate-200">
                          Database Configuration
                        </h4>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Database Engine:</span>
                          <span className="text-admin-600 font-bold">{systemHealth.database?.engine || 'SQLite'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Version:</span>
                          <span className="text-slate-900">{systemHealth.database?.version || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Active Connections:</span>
                          <span className="text-slate-900">{systemHealth.database?.active_connections || '1'}</span>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
                        <h4 className="font-syne font-bold text-sm tracking-wider uppercase text-slate-900 pb-2 border-b border-slate-200">
                          Pool Statistics
                        </h4>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pool Size Limit:</span>
                          <span className="text-slate-900">{systemHealth.pool?.pool_size || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Overflow Limit:</span>
                          <span className="text-slate-900">{systemHealth.pool?.max_overflow || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Checked Out:</span>
                          <span className="text-slate-900">{systemHealth.pool?.checked_out || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Available:</span>
                          <span className="text-emerald-600 font-bold">{systemHealth.pool?.checked_in || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
                        <h4 className="font-syne font-bold text-sm tracking-wider uppercase text-slate-900 pb-2 border-b border-slate-200">
                          System Status
                        </h4>
                        <div className="flex justify-between">
                          <span className="text-slate-500">OS Node:</span>
                          <span className="text-slate-900">{systemHealth.system?.os || 'Windows'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Flask Mode:</span>
                          <span className="text-admin-600 font-bold">Development</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Telemetry Status:</span>
                          <span className="text-emerald-600 font-bold">ONLINE</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 p-6 rounded-2xl text-center">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                      <p className="font-mono text-xs font-semibold">Could not establish contact with system diagnostics endpoint.</p>
                    </div>
                  )}
                </div>
              )}

              {/* E. CUSTOMER MESSAGING Tab */}
              {activeTab === 'messages' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-150 font-sans animate-[fadeIn_0.3s_ease-out]">
                  {/* Left Column: Conversations List */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col h-full overflow-hidden">
                    <div className="pb-4 border-b border-slate-200 mb-4">
                      <h3 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider text-left">Active Channels</h3>
                      <p className="text-xs text-slate-500 mt-1 text-left">Live customer support nodes in this terminal session.</p>
                    </div>

                    <div className="grow overflow-y-auto space-y-2 pr-1">
                      {conversations.map((conv) => {
                        const lastMsg = conv.messages[conv.messages.length - 1];
                        const isSelected = selectedConvId === conv.user_id;
                        return (
                          <div
                            key={conv.user_id}
                            onClick={() => setSelectedConvId(conv.user_id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left flex items-start gap-3 ${
                              isSelected
                                ? 'bg-admin-50 border-admin-600 shadow-sm'
                                : 'bg-slate-50/40 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                            }`}
                          >
                            {/* Avatar */}
                            <div 
                              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 text-white"
                              style={{ backgroundColor: conv.avatar_color || '#A020F0' }}
                            >
                              {conv.user_name?.charAt(0).toUpperCase()}
                            </div>
                            
                            {/* Details */}
                            <div className="min-w-0 grow">
                              <div className="flex justify-between items-baseline">
                                <span className="font-bold text-slate-900 text-xs truncate max-w-30">
                                  {conv.user_name}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {lastMsg?.time || ''}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono truncate">
                                {conv.user_email}
                              </div>
                              <p className="text-xs text-slate-600 truncate mt-1.5 font-sans leading-none">
                                {lastMsg ? (
                                  <>
                                    <span className="font-bold text-admin-700">
                                      {lastMsg.sender === 'admin' ? 'You: ' : ''}
                                    </span>
                                    {lastMsg.text}
                                  </>
                                ) : (
                                  'No messages'
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {conversations.length === 0 && (
                        <div className="text-center py-12 text-slate-500 font-mono text-xs">
                          No active channel connections found.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Columns: Active Chat View */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-3xl flex flex-col h-full overflow-hidden">
                    {selectedConvId ? (
                      (() => {
                        const activeConv = conversations.find(c => c.user_id === selectedConvId);
                        if (!activeConv) return null;
                        return (
                          <>
                            {/* Chat Header */}
                            <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white"
                                  style={{ backgroundColor: activeConv.avatar_color || '#A020F0' }}
                                >
                                  {activeConv.user_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-left">
                                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide leading-none">{activeConv.user_name}</h4>
                                  <span className="text-[10px] font-mono text-slate-500 mt-1 block leading-none">{activeConv.user_email}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-widest font-bold">Secure Node Linked</span>
                              </div>
                            </div>

                            {/* Messages Scrollbox */}
                            <div className="flex-grow overflow-y-auto p-5 space-y-4 bg-slate-50/40">
                              {activeConv.messages.map((msg, index) => {
                                const isAdmin = msg.sender === 'admin';
                                return (
                                  <div
                                    key={index}
                                    className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                  >
                                    <div className={`max-w-[75%] flex gap-2 items-start ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                                      {/* Message bubble */}
                                      <div className="text-left space-y-1">
                                        <div
                                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                            isAdmin
                                              ? 'bg-admin-600 border border-admin-700 text-white shadow-sm font-medium animate-[scaleUp_0.15s_ease-out]'
                                              : 'bg-white border border-slate-200 text-slate-800 shadow-sm animate-[scaleUp_0.15s_ease-out]'
                                          }`}
                                        >
                                          {msg.text}
                                        </div>
                                        <div className={`text-[9px] font-mono text-slate-400 px-1 ${isAdmin ? 'text-right' : 'text-left'}`}>
                                          {msg.time}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Chat Footer Input */}
                            <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3 items-stretch">
                              <input
                                type="text"
                                value={chatReplyText}
                                onChange={(e) => setChatReplyText(e.target.value)}
                                placeholder="Transmit message reply..."
                                className="flex-grow bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-admin-600 transition-all outline-none"
                                required
                              />
                              <div className="flex gap-2 justify-end sm:justify-start">
                                <button
                                  type="button"
                                  onClick={() => handleAIDraft(activeConv)}
                                  className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-4 py-2.5 sm:py-0 rounded-xl hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold"
                                  title="Draft intelligent response with AI"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider">AI Draft</span>
                                </button>
                                <button
                                  type="submit"
                                  disabled={sendingReply || !chatReplyText.trim()}
                                  className="bg-admin-600 hover:bg-admin-700 text-white font-semibold shadow-sm transition-all px-5 py-2.5 sm:py-0 rounded-xl hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Transmit</span>
                                </button>
                              </div>
                            </form>
                          </>
                        );
                      })()
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-4 font-mono text-xs">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 animate-pulse">
                          <MessageSquare className="w-6 h-6 text-admin-600" />
                        </div>
                        <div>
                          <p className="text-slate-600 font-semibold">SELECT CUSTOMER NODE CHANNEL</p>
                          <span className="text-xs text-slate-400 block mt-1">Select an active client link to initialize support protocol.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reviews & Ratings Tab */}
              {activeTab === 'reviews' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  {/* Reviews Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-lg">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Total Reviews</span>
                        <span className="text-2xl font-mono font-black text-slate-900 mt-1 block">{reviews.length}</span>
                      </div>
                      <div className="p-3 bg-admin-100 border border-admin-200 rounded-xl text-admin-600">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-lg">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Average Rating</span>
                        <span className="text-2xl font-mono font-black text-emerald-600 mt-1 block">
                          {(reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1)).toFixed(1)} / 5.0
                        </span>
                      </div>
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
                        <Star className="w-5 h-5 fill-emerald-50 text-emerald-600" />
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-lg">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Pending Review</span>
                        <span className="text-2xl font-mono font-black text-amber-600 mt-1 block">
                          {reviews.filter(r => r.status === 'Pending').length}
                        </span>
                      </div>
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-600 animate-pulse">
                        <Clock className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Reviews Moderation Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-slate-200 bg-slate-50">
                      <h4 className="font-syne font-bold text-sm tracking-wider uppercase text-slate-900 font-syne">Reviews Moderation</h4>
                      <p className="text-xs text-slate-500">Approve or delete user reviews on products.</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-mono tracking-widest text-slate-600 font-semibold">
                            <th className="p-4">Item</th>
                            <th className="p-4">Reviewer</th>
                            <th className="p-4">Rating</th>
                            <th className="p-4">Comment</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {reviews.map((rev) => (
                            <tr key={rev.id} className="hover:bg-slate-50/50 transition-all border-b border-slate-100">
                              <td className="p-4 flex items-center gap-3">
                                <div className="w-8 h-10 bg-slate-50 border border-slate-200 rounded overflow-hidden shrink-0">
                                  <img 
                                    src={rev.product_image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80'} 
                                    alt={rev.product_name} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80';
                                    }}
                                  />
                                </div>
                                <span className="font-bold text-slate-900 max-w-30 truncate block text-left" title={rev.product_name}>
                                  {rev.product_name}
                                </span>
                              </td>
                              <td className="p-4 text-left">
                                <div className="font-bold text-slate-900">{rev.reviewer_name}</div>
                                <div className="text-xs text-slate-500 font-mono mt-0.5">{rev.reviewer_email}</div>
                              </td>
                              <td className="p-4">
                                {renderStars(rev.rating)}
                              </td>
                              <td className="p-4 max-w-sm text-left">
                                <p className="text-slate-700 leading-relaxed font-sans">{rev.comment}</p>
                                <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                                  {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : ''}
                                </span>
                              </td>
                              <td className="p-4 text-left">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono border ${
                                  rev.status === 'Approved' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {rev.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  {rev.status === 'Pending' && (
                                    <button
                                      onClick={() => handleUpdateReviewStatus(rev.id, 'Approved')}
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 text-emerald-700 rounded-lg transition-all cursor-pointer"
                                      title="Approve Review"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteReview(rev.id)}
                                    className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-600 rounded-lg transition-all cursor-pointer"
                                    title="Delete Review"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {reviews.length === 0 && (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-slate-500 font-mono text-xs">
                                No customer reviews submitted yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Dashboard Tab */}
              {activeTab === 'revenue-dash' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] text-left">
                  {/* Top Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 shadow-lg flex items-center justify-between">
                      <div>
                        <span className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest block">Gross Revenue</span>
                        <span className="text-xl font-mono font-black text-emerald-600 mt-1 block">
                          ₹{stats?.metrics?.total_revenue?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
                        </span>
                      </div>
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 shadow-lg flex items-center justify-between">
                      <div>
                        <span className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest block">Total Sales Ledger</span>
                        <span className="text-xl font-mono font-black text-slate-900 mt-1 block">
                          {stats?.metrics?.total_orders || '0'} orders
                        </span>
                      </div>
                      <div className="p-3 bg-admin-100 border border-admin-200 rounded-xl text-admin-600">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 shadow-lg flex items-center justify-between">
                      <div>
                        <span className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest block">Average Ticket Size (AOV)</span>
                        <span className="text-xl font-mono font-black text-slate-900 mt-1 block">
                          ${stats?.metrics?.aov?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-600">
                        <CreditCard className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 shadow-lg flex items-center justify-between">
                      <div>
                        <span className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest block">Customer Base</span>
                        <span className="text-xl font-mono font-black text-slate-900 mt-1 block">
                          {stats?.metrics?.total_users || '0'} users
                        </span>
                      </div>
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Category Share Breakdown */}
                    <div className="lg:col-span-1 bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col justify-between">
                      <div>
                        <h4 className="font-syne font-bold text-xs uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-200 mb-4">Category Shares</h4>
                        <div className="space-y-4">
                          {stats?.category_performance?.map((cat, idx) => {
                            const totalRev = stats.category_performance.reduce((sum, c) => sum + c.revenue, 0) || 1;
                            const share = (cat.revenue / totalRev) * 100;
                            return (
                              <div key={idx} className="space-y-1.5 text-left">
                                <div className="flex justify-between text-xs font-mono">
                                  <span className="text-slate-500 capitalize">{cat.category?.replace('-', ' ')}</span>
                                  <span className="text-slate-900 font-bold">{share.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-admin-50 rounded-full h-1.5 overflow-hidden border border-admin-200">
                                  <div 
                                    className="bg-linear-to-r from-indigo-500 to-admin-600 h-full rounded-full" 
                                    style={{ width: `${share}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                  <span>{cat.sales} items sold</span>
                                  <span>₹{cat.revenue.toLocaleString()}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Recent Transactions Feed */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
                      <h4 className="font-syne font-bold text-xs uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-200 mb-4">Recent Ledger Entries</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-mono tracking-widest text-slate-600 font-semibold">
                              <th className="p-3">Reference</th>
                              <th className="p-3">User Node</th>
                              <th className="p-3">Amount</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Date Placed</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {stats?.recent_orders?.map((order) => (
                              <tr key={order.id} className="hover:bg-slate-50/50 transition-all border-b border-slate-100">
                                <td className="p-3 font-mono font-bold text-slate-900">#{order.id}</td>
                                <td className="p-3 font-semibold text-slate-900">{order.user_name}</td>
                                <td className="p-3 font-mono text-admin-600">₹{order.total}</td>
                                <td className="p-3">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono border ${
                                    order.status === 'Delivered' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : order.status === 'Cancelled'
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-mono text-slate-500 text-xs">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sales Trends & Charts Tab */}
              {activeTab === 'sales-charts' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] text-left">
                  {renderSalesTrendsChart()}

                  {/* Additional charts / info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg">
                      <h4 className="font-syne font-bold text-xs uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-200 mb-4">Volume Frequency Distribution</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-mono">
                        Daily transactional frequency aggregates. Peak volumes indicate high traffic concurrency on main clothing category catalogs.
                      </p>
                      <div className="mt-4 space-y-3 font-mono">
                        {stats?.daily_sales?.slice(-5).map((day, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-slate-700 py-1 border-b border-slate-100">
                            <span>{day.date}</span>
                            <span className="text-admin-600 font-bold">{day.orders} transactions</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                      <div>
                        <h4 className="font-syne font-bold text-xs uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-200 mb-4">Conversion Rate Telemetry</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-mono mb-4">
                          Registered client vs checkout order ratio. Current global checkout conversion rate is indexed below:
                        </p>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-mono font-black text-emerald-600">{stats?.metrics?.conversion_rate || '5.4'}%</span>
                        <span className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest font-bold">Global conversion index</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Business Reports Tab */}
              {activeTab === 'business-reports' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] text-left">
                  {/* Category Performance Breakdown */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 shadow-lg">
                    <h4 className="font-syne font-bold text-xs uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-200 mb-4">Product Category Performance Matrix</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-mono tracking-widest text-slate-600 font-semibold">
                            <th className="p-4">Category Sector</th>
                            <th className="p-4">Units Dispatched</th>
                            <th className="p-4">Total Realized Revenue</th>
                            <th className="p-4">Average Unit Price Realized</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {stats?.category_performance?.map((cat, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-all border-b border-slate-100">
                              <td className="p-4 font-bold text-slate-900 capitalize">{cat.category?.replace('-', ' ')}</td>
                              <td className="p-4 font-mono">{cat.sales} units</td>
                              <td className="p-4 font-mono text-emerald-600">₹{cat.revenue?.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                              <td className="p-4 font-mono text-slate-500">
                                ₹{(cat.revenue / (cat.sales || 1)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Customer Audit Feed */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 shadow-lg">
                    <h4 className="font-syne font-bold text-xs uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-200 mb-4">Newly Provisioned Accounts</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {stats?.recent_users?.map((user) => (
                        <div key={user.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-left shadow-sm">
                          <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block truncate" title={user.name}>{user.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono block truncate">{user.email}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Export Data Tab */}
              {activeTab === 'export-data' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Revenue Card */}
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between shadow-lg space-y-4">
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <h4 className="font-syne font-bold text-sm text-slate-900 uppercase tracking-wider">Revenue Stream CSV</h4>
                        <p className="text-xs text-slate-500 font-mono leading-relaxed">
                          Download daily gross revenue reports, transaction aggregates, and sales history parameters in spreadsheet-compatible format.
                        </p>
                      </div>
                      <button 
                        onClick={() => handleExportData('revenue', 'shopease_revenue_report.csv')}
                        className="py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-emerald-200 text-center hover:shadow-sm"
                      >
                        Download Revenue Ledger
                      </button>
                    </div>

                    {/* Catalog Card */}
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between shadow-lg space-y-4">
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-admin-50 border border-admin-100 flex items-center justify-center text-admin-600">
                          <Package className="w-5 h-5" />
                        </div>
                        <h4 className="font-syne font-bold text-sm text-slate-900 uppercase tracking-wider">Product Catalog CSV</h4>
                        <p className="text-xs text-slate-500 font-mono leading-relaxed">
                          Extract full database specifications including price index, category assignments, stock status thresholds, ratings, and slug links.
                        </p>
                      </div>
                      <button 
                        onClick={() => handleExportData('products', 'shopease_products_catalog.csv')}
                        className="py-3 bg-admin-50 hover:bg-admin-100 text-admin-700 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-admin-200 text-center hover:shadow-sm"
                      >
                        Download Product Catalog
                      </button>
                    </div>

                    {/* Fulfillments Card */}
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between shadow-lg space-y-4">
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <h4 className="font-syne font-bold text-sm text-slate-900 uppercase tracking-wider">Fulfillments Queue CSV</h4>
                        <p className="text-xs text-slate-500 font-mono leading-relaxed">
                          Download transactions parameters: billing shipping profiles, active delivery modes, customer tags, values, and fulfillment states.
                        </p>
                      </div>
                      <button 
                        onClick={() => handleExportData('orders', 'shopease_orders_queue.csv')}
                        className="py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-purple-200 text-center hover:shadow-sm"
                      >
                        Download Fulfillments Database
                      </button>
                    </div>

                    {/* Users Card */}
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between shadow-lg space-y-4">
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                          <Users className="w-5 h-5" />
                        </div>
                        <h4 className="font-syne font-bold text-sm text-slate-900 uppercase tracking-wider">Registered Client Directory CSV</h4>
                        <p className="text-xs text-slate-500 font-mono leading-relaxed">
                          Download daily customer directory details, creation logs, and spend statistics in spreadsheet format.
                        </p>
                      </div>
                      <button 
                        onClick={() => handleExportData('users', 'shopease_users_directory.csv')}
                        className="py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-amber-200 text-center hover:shadow-sm"
                      >
                        Download Client Directory
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Coupons & Promos Tab */}
              {activeTab === 'seller-promotions' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] text-left">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Add Coupon Card */}
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 shadow-lg h-fit space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-pink-500" />
                        <h4 className="font-syne font-bold text-sm text-slate-900 uppercase tracking-wider">Create Coupon Rule</h4>
                      </div>
                      <form onSubmit={handleCreateCoupon} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] sm:text-xs font-mono text-slate-500 uppercase tracking-wider block">Promo Code</label>
                          <input 
                            type="text"
                            value={newCouponCode}
                            onChange={(e) => setNewCouponCode(e.target.value)}
                            placeholder="e.g. DUSTY30"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-all outline-none"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] sm:text-xs font-mono text-slate-500 uppercase tracking-wider block">Discount Type</label>
                          <select 
                            value={newCouponType}
                            onChange={(e) => setNewCouponType(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-all outline-none"
                          >
                            <option value="Percentage">Percentage Discount (%)</option>
                            <option value="Fixed Amount">Fixed USD Discount ($)</option>
                            <option value="Free Shipping">Free Shipping</option>
                          </select>
                        </div>
                        {newCouponType !== 'Free Shipping' && (
                          <div className="space-y-1.5">
                            <label className="text-[11px] sm:text-xs font-mono text-slate-500 uppercase tracking-wider block">Discount Value</label>
                            <input 
                              type="number"
                              value={newCouponValue}
                              onChange={(e) => setNewCouponValue(e.target.value)}
                              placeholder="e.g. 20"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-all outline-none"
                              required
                            />
                          </div>
                        )}
                        <button 
                          type="submit"
                          className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer hover:shadow-md text-center"
                        >
                          Activate Coupon
                        </button>
                      </form>
                    </div>

                    {/* Coupons Ledger Table */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 shadow-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-admin-600" />
                          <h4 className="font-syne font-bold text-sm text-slate-900 uppercase tracking-wider">Coupons Registry</h4>
                        </div>
                        <span className="text-[10px] sm:text-xs font-mono bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                          Active Campaigns: {coupons.length}
                        </span>
                      </div>
                      
                      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/30">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
                              <th className="p-3">Promo Code</th>
                              <th className="p-3">Discount Type</th>
                              <th className="p-3 text-right">Value</th>
                              <th className="p-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {coupons.map((coupon) => (
                              <tr key={coupon.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                                <td className="p-3 font-mono font-bold text-slate-900 tracking-widest">{coupon.code}</td>
                                <td className="p-3">{coupon.type}</td>
                                <td className="p-3 text-right font-mono font-bold text-pink-600">
                                  {coupon.type === 'Percentage' ? `${coupon.value}%` : coupon.type === 'Free Shipping' ? 'FREE' : `$${coupon.value}`}
                                </td>
                                <td className="p-3 text-center">
                                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold uppercase tracking-wider font-mono">
                                    {coupon.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Role-Based Staff Management Tab */}
              {activeTab === 'seller-roles' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] text-left">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 shadow-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-red-500" />
                        <h4 className="font-syne font-bold text-sm text-slate-900 uppercase tracking-wider">Staff Permissions Simulator</h4>
                      </div>
                      <span className="text-[10px] sm:text-xs font-mono text-slate-500">RBAC Node Active</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {teamRoles.map((member) => (
                        <div key={member.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold uppercase text-sm">
                                {member.name.charAt(0)}
                              </div>
                              <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                                member.active 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {member.active ? 'Operational' : 'Suspended'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs tracking-wide">{member.name}</h4>
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{member.email}</span>
                            </div>
                            <div className="pt-2">
                              <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">Active Role Profile:</span>
                              <span className="text-xs font-bold text-admin-600 font-mono uppercase mt-0.5 block">{member.role}</span>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-slate-200">
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">Modify Role Profile:</span>
                              <select 
                                value={member.role}
                                onChange={(e) => handleToggleRole(member.id, e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-admin-600 transition-all outline-none"
                              >
                                <option value="Super Admin">Super Admin</option>
                                <option value="Support Rep">Support Rep</option>
                                <option value="Inventory Manager">Inventory Manager</option>
                              </select>
                            </div>
                            <button 
                              onClick={() => handleToggleMemberActive(member.id)}
                              className={`w-full py-2 border font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center ${
                                member.active
                                  ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {member.active ? 'Deactivate Staff Node' : 'Activate Staff Node'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* System Alerts Settings Tab */}
              {activeTab === 'seller-notifications' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] text-left">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 shadow-lg space-y-4 max-w-xl">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                      <Bell className="w-4 h-4 text-yellow-500" />
                      <h4 className="font-syne font-bold text-sm text-slate-900 uppercase tracking-wider">System Alert Configurations</h4>
                    </div>

                    <div className="space-y-4 divide-y divide-slate-100 text-slate-700">
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">Critical Stock Telemetry alerts</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Trigger alert when inventory drops below 15 operational units.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={notifyStock} 
                          onChange={() => setNotifyStock(!notifyStock)}
                          className="w-4 h-4 text-yellow-500 bg-slate-50 border-slate-200 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">Customer Messaging sound indicator</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Play acoustic telemetry chime when clients link communication channels.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={notifyMsg} 
                          onChange={() => setNotifyMsg(!notifyMsg)}
                          className="w-4 h-4 text-yellow-500 bg-slate-50 border-slate-200 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">Webhooks transactional notifications</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Generate dashboard flashes for checkout event telemetry feeds.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={notifyWebhooks} 
                          onChange={() => setNotifyWebhooks(!notifyWebhooks)}
                          className="w-4 h-4 text-yellow-500 bg-slate-50 border-slate-200 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">API Endpoint telemetry failure alerts</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Notify sysops queue immediately if server endpoints return 5xx errors.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={notifyFailure} 
                          onChange={() => setNotifyFailure(!notifyFailure)}
                          className="w-4 h-4 text-yellow-500 bg-slate-50 border-slate-200 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleSaveNotifications}
                      className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-semibold font-mono text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer hover:shadow-md text-center mt-4"
                    >
                      Save Configurations
                    </button>
                  </div>
                </div>
              )}

              {/* API & Webhooks Tab */}
              {activeTab === 'seller-api' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] text-left">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 shadow-lg space-y-5 max-w-2xl">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-teal-600" />
                        <h4 className="font-syne font-bold text-sm text-slate-900 uppercase tracking-wider">Secure API Integrations Node</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase">Environment:</span>
                        <button 
                          onClick={() => {
                            setApiSandbox(!apiSandbox);
                            addLog('SYS', `Switched API connection profile to ${!apiSandbox ? 'Sandbox' : 'Production'} environment.`);
                          }}
                          className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider font-mono transition-colors ${
                            apiSandbox 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {apiSandbox ? 'Sandbox Mode' : 'Production Mode'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Public API Key */}
                      <div className="space-y-1">
                        <label className="text-[11px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest block">Public Publishable Key</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            readOnly 
                            value={apiSandbox ? 'pk_test_shopease_51NzW72LkyR3a9Z' : 'pk_live_shopease_51NzW72LkyR3a9Z'}
                            className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-admin-600"
                          />
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(apiSandbox ? 'pk_test_shopease_51NzW72LkyR3a9Z' : 'pk_live_shopease_51NzW72LkyR3a9Z');
                              addLog('SYS', 'Copied Publishable API Key to clipboard.');
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 rounded-xl border border-slate-200 transition-colors text-xs font-bold font-sans cursor-pointer hover:shadow-sm"
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      {/* Secret API Key */}
                      <div className="space-y-1">
                        <label className="text-[11px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest block">Secret API Key</label>
                        <div className="flex gap-2">
                          <input 
                            type={showApiSecret ? 'text' : 'password'} 
                            readOnly 
                            value={apiSandbox ? 'sk_test_shopease_secret_84102941092842' : 'sk_live_shopease_secret_84102941092842'}
                            className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-red-600 font-mono focus:outline-none focus:border-red-500"
                          />
                          <button 
                            onClick={() => setShowApiSecret(!showApiSecret)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 rounded-xl border border-slate-200 transition-colors text-xs font-bold font-sans cursor-pointer hover:shadow-sm"
                          >
                            {showApiSecret ? 'Hide' : 'Reveal'}
                          </button>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(apiSandbox ? 'sk_test_shopease_secret_84102941092842' : 'sk_live_shopease_secret_84102941092842');
                              addLog('SYS', 'Copied Secret API Key to clipboard.');
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 rounded-xl border border-slate-200 transition-colors text-xs font-bold font-sans cursor-pointer hover:shadow-sm"
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      {/* Connected Webhooks and third-parties */}
                      <div className="pt-2">
                        <span className="text-[11px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest block mb-2">Operational Webhook Nodes</span>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs shadow-sm">
                            <span className="font-mono text-slate-700 font-semibold">Stripe Payment Telemetry</span>
                            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Connected</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs shadow-sm">
                            <span className="font-mono text-slate-700 font-semibold">ShipEngine Fulfillment Telemetry</span>
                            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Connected</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* F. MODULE NOT IMPLEMENTED/WIP Tab */}
              {!([
                'dashboard', 'inventory', 'media-upload', 'low-stock', 
                'bulk-upload', 'orders', 'logistics', 'refunds', 'users', 'system', 'messages', 'reviews',
                'revenue-dash', 'sales-charts', 'business-reports', 'export-data',
                'seller-promotions', 'seller-roles', 'seller-notifications', 'seller-api'
              ].includes(activeTab)) && (
                <div className="min-h-[400px] bg-white border border-slate-200 shadow-sm rounded-3xl p-8 flex flex-col justify-center items-center text-center space-y-4 animate-[fadeIn_0.3s_ease-out]">
                  <div className="w-16 h-16 rounded-full bg-admin-100 border border-admin-200 flex items-center justify-center text-admin-600 animate-pulse">
                    <Server className="w-8 h-8" />
                  </div>
                  <h3 className="font-syne font-bold text-lg text-slate-900 uppercase tracking-wider">Module Coming Soon</h3>
                  <p className="text-xs text-slate-500 max-w-md font-mono leading-relaxed">
                    This admin console tab ("{activeTab}") is currently being migrated to React. Check back soon for full interactive operations!
                  </p>
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* CREATE NEW PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          <div className="absolute bg-white border border-slate-200 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl space-y-6 animate-[scaleUp_0.2s_ease-out_forwards] text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-syne font-bold text-lg text-slate-900">Create New Garment</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-900 hover:text-red-500 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest">Product Title</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-admin-600 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest">Price ($)</label>
                  <input 
                    type="number" 
                    value={newPrice} 
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-admin-600 focus:bg-white transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest">Stock (Units)</label>
                  <input 
                    type="number" 
                    value={newStock} 
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-admin-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest">Rating</label>
                  <input 
                    type="text" 
                    value={newRating} 
                    onChange={(e) => setNewRating(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-admin-600 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest">Category Tag</label>
                  <select 
                    value={newCategory} 
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-admin-600 focus:bg-white transition-all cursor-pointer font-medium"
                  >
                    <option value="mens-shirts">Men Shirts</option>
                    <option value="mens-tshirts">Men T-Shirts</option>
                    <option value="womens-dresses">Women Dresses</option>
                    <option value="womens-tshirts">Women T-Shirts</option>
                    <option value="footwear-sneakers">Footwear Sneakers</option>
                    <option value="watches-analog">Watches Analog</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest">Image Asset URL</label>
                <input 
                  type="text" 
                  value={newImage} 
                  onChange={(e) => setNewImage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-admin-600 focus:bg-white transition-all"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-admin-600 hover:bg-admin-700 text-white font-semibold shadow-sm transition-all font-extrabold text-xs uppercase tracking-wider rounded-full shadow-lg hover:shadow-md transition-all cursor-pointer mt-4 text-center"
              >
                Catalog New Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ORDER INSPECTION MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          <div className="absolute bg-white border border-slate-200 w-full max-w-lg p-6 rounded-[2.5rem] shadow-2xl space-y-5 animate-[scaleUp_0.2s_ease-out_forwards] text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-syne font-bold text-base text-slate-900 uppercase tracking-wider">Order Details</h3>
                <span className="text-[10px] font-mono text-admin-600 tracking-widest">REF #{selectedOrder.id}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 text-slate-500 hover:text-red-500 transition-colors cursor-pointer bg-slate-100 hover:bg-slate-200 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Client and Shipping Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 border border-slate-200 rounded-2xl p-4 font-sans text-slate-700">
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Billing Client</span>
                <div className="font-bold text-slate-900 text-[13px]">{selectedOrder.shipping_name || 'Customer'}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{selectedOrder.shipping_phone}</div>
                {selectedOrder.user_email && (
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedOrder.user_email}</div>
                )}
              </div>
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Shipping Address</span>
                <p className="text-[11px] leading-relaxed text-slate-600 break-words">{selectedOrder.shipping_address}</p>
                {selectedOrder.shipping_method && (
                  <div className="mt-1">
                    <span className="px-1.5 py-0.5 bg-admin-50 text-admin-700 border border-admin-200 rounded text-[9px] font-bold uppercase tracking-wider font-mono">
                      {selectedOrder.shipping_method}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Products Table */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Ordered Products ({selectedOrder.items?.length || 0})</span>
              <div className="max-h-[220px] overflow-y-auto border border-slate-200 rounded-2xl bg-slate-50/50">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[9px] text-slate-500 uppercase tracking-wider">
                      <th className="p-3">Thumbnail</th>
                      <th className="p-3">Product</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3">
                            <div className="w-8 h-10 bg-slate-50 border border-slate-200 rounded overflow-hidden">
                              <img 
                                src={item.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80'} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80';
                                }}
                              />
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-900 truncate max-w-[140px]" title={item.name}>
                              {item.name || `Product #${item.product_id}`}
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono">{item.quantity}</td>
                          <td className="p-3 text-right font-mono text-slate-500">${item.unit_price}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">${(item.quantity * item.unit_price).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-slate-500 font-mono text-[10px]">
                          No order line items available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Section */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-200 font-sans">
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Status</span>
                <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider font-mono ${
                  selectedOrder.status === 'Delivered' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : selectedOrder.status === 'Cancelled'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : selectedOrder.status === 'Shipped'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {selectedOrder.status || 'Processing'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Grand Total</span>
                <span className="text-lg font-mono font-black text-admin-600">₹{selectedOrder.total}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => handlePrintInvoice(selectedOrder)}
                className="flex-1 py-3 bg-admin-600 hover:bg-admin-700 text-white font-semibold shadow-sm transition-all text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
