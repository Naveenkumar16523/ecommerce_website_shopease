import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, ArrowLeft, CheckCircle } from 'lucide-react';

export default function Checkout() {
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const shippingFee = 15;
  const discount = Math.round(subtotal * 0.2);
  const grandTotal = subtotal + shippingFee - discount;

  // Load Razorpay Script dynamically on mount
  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !address || !city || !pincode) {
      setError("Please complete all shipping coordinates.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const submitOrderToBackend = async (finalMethod) => {
      const orderData = {
        items: cart.map(item => ({
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          image: item.image
        })),
        total: grandTotal,
        shipping: {
          name,
          address: `${address}, ${city}, ${pincode}`,
          phone,
          method: finalMethod
        }
      };

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
        
        if (res.ok) {
          setSuccess(true);
          clearCart();
        } else {
          const data = await res.json();
          setError(data.message || "Failed to finalize order.");
        }
      } catch (err) {
        console.error(err);
        setError("Network connection failure. Try again.");
      } finally {
        setSubmitting(false);
      }
    };

    if (paymentMethod === 'Razorpay') {
      if (!window.Razorpay) {
        setError("Razorpay SDK is still loading or failed to load. Please check your internet connection.");
        setSubmitting(false);
        return;
      }

      const options = {
        key: "rzp_test_SpEf15KaCAj2po",
        amount: Math.round(grandTotal * 100),
        currency: "USD",
        name: "SHOP EASE",
        description: "Zero-Gravity Checkout Payment",
        prefill: {
          name: name,
          email: email,
          contact: phone
        },
        theme: {
          color: "#8B5CF6" // Purple matching our cosmic theme
        },
        handler: async function (response) {
          await submitOrderToBackend(`Razorpay (${response.razorpay_payment_id})`);
        },
        modal: {
          ondismiss: function() {
            setSubmitting(false);
          }
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (res) {
          setError("Payment failed: " + res.error.description);
          setSubmitting(false);
        });
        rzp.open();
      } catch (err) {
        console.error("Razorpay error:", err);
        setError("Could not launch Razorpay checkout.");
        setSubmitting(false);
      }
    } else {
      await submitOrderToBackend("COD");
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-6 px-6">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
        <h2 className="text-2xl md:text-3xl font-black font-syne dark:text-white uppercase">Order Confirmed!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed">
          Your payment has been successfully completed. We have transmitted order coordinates to the fulfillment terminal. Thank you for shopping with ShopEase!
        </p>
        <button 
          onClick={() => navigate('/orders')}
          className="inline-block px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs rounded-full uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all duration-300"
        >
          View My Orders
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <ShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto" />
        <h2 className="text-xl font-bold dark:text-white">Your Cart is Empty</h2>
        <button 
          onClick={() => navigate('/')} 
          className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs rounded-full hover:opacity-90 active:scale-95 transition-all duration-300"
        >
          Shop Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 text-left space-y-8">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/cart')} className="p-2 border dark:border-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
          <ArrowLeft className="w-4 h-4 dark:text-white" />
        </button>
        <h1 className="text-3xl md:text-5xl font-black font-syne dark:text-white uppercase">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-10 items-start">
        {/* Shipping Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#0A0D14] border border-gray-150 dark:border-gray-800 rounded-[2.5rem] p-8 space-y-6">
            <h3 className="font-syne font-bold text-lg text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">Shipping Coordinates</h3>
            
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-2xl border border-red-100 dark:border-red-900/50">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500/40"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500/40"
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Phone Connection</label>
                <input 
                  type="tel" 
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500/40"
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Delivery Address</label>
                <input 
                  type="text" 
                  placeholder="Street address, Apartment, Suite"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500/40"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">City</label>
                <input 
                  type="text" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500/40"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Postal / Pin Code</label>
                <input 
                  type="text" 
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500/40"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white dark:bg-[#0A0D14] border border-gray-150 dark:border-gray-800 rounded-[2.5rem] p-8 space-y-6">
            <h3 className="font-syne font-bold text-lg text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">Payment Settlement</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <label className={`p-4 border rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                paymentMethod === 'COD' 
                  ? 'border-purple-600 bg-purple-500/5 dark:border-neonCyan dark:bg-neonCyan/5' 
                  : 'border-gray-200 dark:border-gray-800 hover:border-purple-500/30'
              }`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="COD" 
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="hidden"
                />
                <div>
                  <p className="font-bold text-xs dark:text-white">Cash On Delivery (COD)</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Pay in cash during shipment dropoff.</p>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'COD' ? 'border-purple-600 dark:border-neonCyan' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'COD' && <div className="w-2.5 h-2.5 rounded-full bg-purple-600 dark:bg-neonCyan" />}
                </div>
              </label>

              <label className={`p-4 border rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                paymentMethod === 'Razorpay' 
                  ? 'border-purple-600 bg-purple-500/5 dark:border-neonCyan dark:bg-neonCyan/5' 
                  : 'border-gray-200 dark:border-gray-800 hover:border-purple-500/30'
              }`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="Razorpay" 
                  checked={paymentMethod === 'Razorpay'}
                  onChange={() => setPaymentMethod('Razorpay')}
                  className="hidden"
                />
                <div>
                  <p className="font-bold text-xs dark:text-white">Razorpay Secure Checkout</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Support Card, UPI, and local payments.</p>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'Razorpay' ? 'border-purple-600 dark:border-neonCyan' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'Razorpay' && <div className="w-2.5 h-2.5 rounded-full bg-purple-600 dark:bg-neonCyan" />}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Breakdown sidebar */}
        <div className="lg:col-span-1 bg-white dark:bg-[#0A0D14] border border-gray-150 dark:border-gray-800 rounded-[2.5rem] p-6 space-y-6">
          <h3 className="font-syne font-bold text-lg text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">Checkout Receipt</h3>

          <div className="space-y-3 font-semibold text-xs text-gray-500 dark:text-gray-400">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-center gap-4">
                <span className="truncate max-w-[150px]">{item.name} <span className="font-mono text-gray-400">x{item.qty}</span></span>
                <span className="font-mono text-gray-900 dark:text-white">${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800/80 pt-4 space-y-3 text-xs font-semibold">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Subtotal</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>Discount</span>
              <span className="font-mono">-${discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Delivery Fee</span>
              <span className="font-mono">${shippingFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800/80 pt-3 flex justify-between text-sm font-black dark:text-white">
              <span>Total Payment</span>
              <span className="font-mono">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-extrabold rounded-full hover:opacity-90 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 text-xs tracking-wider uppercase disabled:opacity-50"
          >
            {submitting ? "Transmitting..." : "Initialize Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
