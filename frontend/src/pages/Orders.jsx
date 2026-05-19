import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShieldAlert, RotateCcw, Clock, CheckCircle, Truck, Home, ClipboardCheck, X, MapPin } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        // Backend returns orders as a list, let's verify format
        setOrders(data.orders || data.data || data || []);
      } else {
        setError("Could not retrieve order logs.");
      }
    } catch (err) {
      console.error(err);
      setError("Network connection error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        // Refresh orders list
        fetchOrders();
      } else {
        alert("Could not cancel this order. It might already be processed or shipped.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 text-left space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl md:text-5xl font-black font-syne dark:text-white uppercase">Your Orders</h1>
        <button 
          onClick={fetchOrders}
          className="p-2 border dark:border-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
          title="Refresh orders log"
        >
          <RotateCcw className="w-4 h-4 dark:text-white" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-2xl border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-[#0A0D14] border border-gray-200/50 dark:border-gray-800 rounded-[2.5rem] py-20 text-center space-y-4">
          <Package className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto" />
          <p className="text-gray-400 font-medium">You haven't placed any orders yet.</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-bold text-xs rounded-full"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            // Parse items list (frequently returned as JSON string or array in SQLite seeders)
            let items = [];
            try {
              items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            } catch (e) {
              items = [];
            }

            return (
              <div 
                key={order.id} 
                className="bg-white dark:bg-[#0A0D14] border border-gray-150 dark:border-gray-800 rounded-[2.5rem] p-6 space-y-6"
              >
                {/* Header Information */}
                <div className="flex flex-wrap justify-between items-center gap-4 border-b border-gray-100 dark:border-gray-800/80 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Order Reference</span>
                    <p className="text-xs font-mono font-bold dark:text-white">#{order.id}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Plancement Date</span>
                    <p className="text-xs font-mono font-bold dark:text-white">{order.created_at || 'Recently'}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Status</span>
                    <span className={`block px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-center ${
                      order.status === 'Cancelled' 
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                        : order.status === 'Delivered'
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    }`}>
                      {order.status || 'Processing'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Total Receipt</span>
                    <p className="text-sm font-mono font-black dark:text-white">${parseFloat(order.total).toFixed(2)}</p>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                  {Array.isArray(items) && items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-12 h-16 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.image || null} alt={item.name} className="w-full h-full object-cover object-top" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs dark:text-white truncate">{item.name}</h4>
                        <p className="text-[10px] text-gray-400 font-semibold font-mono mt-0.5">${parseFloat(item.price).toFixed(2)} x {item.qty}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping coordinate details and cancellation */}
                <div className="flex flex-wrap justify-between items-end gap-4 border-t border-gray-100 dark:border-gray-800/80 pt-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Shipping coordinates</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed max-w-sm">
                      {order.shipping_address || 'Handled by customer profiles'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status !== 'Cancelled' && (
                      <button 
                        onClick={() => setSelectedTrackingOrder(order)}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] uppercase tracking-widest font-mono font-extrabold rounded-full transition cursor-pointer shadow-lg shadow-purple-500/10 hover:shadow-purple-500/25"
                      >
                        Track Order
                      </button>
                    )}

                    {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                      <button 
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] uppercase tracking-wider font-extrabold rounded-full transition cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIVE TRACKING MODAL */}
      {selectedTrackingOrder && (() => {
        // Map order.status to step index:
        // Pending = 0, Processing = 1, Shipped = 2, Delivered = 3
        const getStepIndex = (status) => {
          switch (status) {
            case 'Pending': return 0;
            case 'Processing': return 1;
            case 'Shipped': return 2;
            case 'Delivered': return 3;
            default: return 0;
          }
        };

        const currentStep = getStepIndex(selectedTrackingOrder.status || 'Pending');

        // Progress line percentage
        const progressPercentage = (currentStep / 3) * 100;

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div onClick={() => setSelectedTrackingOrder(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div className="absolute bg-[#090D16] border border-white/10 w-full max-w-md p-6 rounded-[2.5rem] shadow-2xl space-y-6 animate-[scaleUp_0.2s_ease-out_forwards] text-left overflow-hidden">
              {/* Blur Light Backdrop */}
              <div className="absolute right-0 top-0 w-32 h-32 bg-purple-600/10 rounded-full filter blur-3xl -z-10"></div>
              
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                    <span className="text-[9px] font-mono font-bold tracking-widest text-purple-400 uppercase">Live Transit Feed</span>
                  </div>
                  <h3 className="font-syne font-black text-lg text-white uppercase tracking-wider">Tracking ID #{selectedTrackingOrder.id}</h3>
                </div>
                <button 
                  onClick={() => setSelectedTrackingOrder(null)} 
                  className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer rounded-full bg-white/5 border border-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* HIGH-FIDELITY VERTICAL TIMELINE */}
              <div className="relative pl-8 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                {/* Progress Fill bar in vertical timeline */}
                <div 
                  className="absolute left-3.5 top-2 w-0.5 bg-gradient-to-b from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-700 -translate-x-1/2"
                  style={{ height: `${(currentStep / 3) * 100}%` }}
                />

                {/* Step 0: Confirmed */}
                <div className="relative space-y-1.5">
                  <div className={`absolute -left-8 w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                    currentStep >= 0 
                      ? 'bg-[#0E1528] border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]' 
                      : 'bg-gray-900 border-gray-800 text-gray-600'
                  }`}>
                    <ClipboardCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex justify-between items-baseline">
                    <h4 className={`text-xs font-mono font-black uppercase tracking-wider ${currentStep >= 0 ? 'text-white' : 'text-gray-500'}`}>Order Confirmed</h4>
                    <span className="text-[9px] font-mono text-gray-500">10:02 UTC</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-light leading-relaxed">
                    Authorized payment cleared successfully. Garment inventory catalogued and queued.
                  </p>
                </div>

                {/* Step 1: Processing */}
                <div className="relative space-y-1.5">
                  <div className={`absolute -left-8 w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                    currentStep >= 1 
                      ? 'bg-[#0E1528] border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]' 
                      : 'bg-gray-900 border-gray-800 text-gray-600'
                  }`}>
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex justify-between items-baseline">
                    <h4 className={`text-xs font-mono font-black uppercase tracking-wider ${currentStep >= 1 ? 'text-white' : 'text-gray-500'}`}>Compilation & QA</h4>
                    <span className="text-[9px] font-mono text-gray-500">{currentStep >= 1 ? '10:45 UTC' : '--:--'}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-light leading-relaxed">
                    Fabric and garment logs verified. Parcel sealed and registered at central warehouse.
                  </p>
                </div>

                {/* Step 2: Shipped */}
                <div className="relative space-y-1.5">
                  <div className={`absolute -left-8 w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                    currentStep >= 2 
                      ? 'bg-[#0E1528] border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]' 
                      : 'bg-gray-900 border-gray-800 text-gray-600'
                  }`}>
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex justify-between items-baseline">
                    <h4 className={`text-xs font-mono font-black uppercase tracking-wider ${currentStep >= 2 ? 'text-white' : 'text-gray-500'}`}>Vessel In Transit</h4>
                    <span className="text-[9px] font-mono text-gray-500">{currentStep >= 2 ? '13:12 UTC' : '--:--'}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-light leading-relaxed">
                    Handed to logistics carrier. Departed warehouse sorting hub via ShopEase Prime Air.
                  </p>
                </div>

                {/* Step 3: Delivered */}
                <div className="relative space-y-1.5">
                  <div className={`absolute -left-8 w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                    currentStep >= 3 
                      ? 'bg-[#0E1528] border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]' 
                      : 'bg-gray-900 border-gray-800 text-gray-600'
                  }`}>
                    <Home className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex justify-between items-baseline">
                    <h4 className={`text-xs font-mono font-black uppercase tracking-wider ${currentStep >= 3 ? 'text-cyan-400 font-bold' : 'text-gray-500'}`}>Delivered Node</h4>
                    <span className="text-[9px] font-mono text-gray-500">{currentStep >= 3 ? '15:40 UTC' : '--:--'}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-light leading-relaxed">
                    Parcel securely handed over and signed for at shipping coordinates. Fulfillments completed!
                  </p>
                </div>
              </div>

              {/* Courier Info Registry */}
              <div className="bg-[#05080E]/60 border border-white/5 rounded-2xl p-4 text-[10px] font-mono space-y-2">
                <div className="flex justify-between items-center text-[#82889A]">
                  <span>Fulfillment Courier</span>
                  <span className="text-white font-bold">ShopEase Logistics</span>
                </div>
                <div className="flex justify-between items-center text-[#82889A]">
                  <span>Shipping Address</span>
                  <span className="text-white font-bold truncate max-w-[150px]" title={selectedTrackingOrder.shipping_address}>
                    {selectedTrackingOrder.shipping_address ? selectedTrackingOrder.shipping_address.split(',')[0] : 'Standard'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#82889A]">
                  <span>Estimated Transit</span>
                  <span className="text-purple-400 font-bold">1-2 Days</span>
                </div>
              </div>

              {/* Close Action */}
              <button 
                onClick={() => setSelectedTrackingOrder(null)}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] text-center"
              >
                Close Transit Console
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
