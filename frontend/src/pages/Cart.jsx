import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Trash2, ArrowRight } from 'lucide-react';

export default function Cart() {
  const { cart, removeFromCart, updateQty, subtotal } = useCart();

  const shippingFee = 15;
  const discount = Math.round(subtotal * 0.2); // 20% discount
  const grandTotal = subtotal + shippingFee - discount;

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <ShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto" />
        <h2 className="text-xl font-bold dark:text-white">Your Cart is Empty</h2>
        <p className="text-xs text-gray-500 font-medium">Add some stellar garments to get started on your shopping journey!</p>
        <Link to="/" className="inline-block px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs rounded-full hover:opacity-90 active:scale-95 transition-all duration-300">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 text-left space-y-8">
      <h1 className="text-3xl md:text-5xl font-black font-syne dark:text-white uppercase">Your Cart</h1>

      <div className="grid lg:grid-cols-3 gap-10 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item, index) => (
            <div 
              key={index}
              className="flex items-center gap-5 p-4 bg-white dark:bg-[#0A0D14] border border-gray-150 dark:border-gray-800 rounded-3xl"
            >
              {/* Product Thumbnail */}
              <div className="w-20 h-24 bg-gray-50 dark:bg-[#0E1321] rounded-2xl overflow-hidden flex-shrink-0">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover object-top"
                />
              </div>

              {/* Title & Actions */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-1">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-sm">
                      {item.name}
                    </h3>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-mono font-black text-sm dark:text-white">${parseFloat(item.price).toFixed(2)}</span>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-full py-1 px-3 gap-3">
                    <button 
                      onClick={() => updateQty(item.product_id, item.qty - 1)}
                      className="font-bold text-gray-500 hover:text-black dark:hover:text-white"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-xs dark:text-white w-4 text-center">{item.qty}</span>
                    <button 
                      onClick={() => updateQty(item.product_id, item.qty + 1)}
                      className="font-bold text-gray-500 hover:text-black dark:hover:text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1 bg-white dark:bg-[#0A0D14] border border-gray-150 dark:border-gray-800 rounded-[2.5rem] p-6 space-y-6">
          <h3 className="font-syne font-bold text-lg text-gray-900 dark:text-white">Order Summary</h3>

          <div className="space-y-4 text-sm font-semibold">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Subtotal</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>Discount (-20%)</span>
              <span className="font-mono">-${discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Delivery Fee</span>
              <span className="font-mono">${shippingFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800/80 pt-4 flex justify-between text-base font-black dark:text-white">
              <span>Total</span>
              <span className="font-mono">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <Link 
            to="/checkout"
            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-extrabold rounded-full hover:opacity-90 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group text-xs tracking-wider uppercase"
          >
            Go to Checkout <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
