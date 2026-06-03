import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { motion } from 'motion/react';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { wishlistIds, toggleWishlist, user } = useAuth();
  const navigate = useNavigate();
  
  const slug = product.slug || product.id;
  const isWishlisted = wishlistIds.includes(product.id);

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    await toggleWishlist(product.id);
  };

  const handleAddToCart = (e) => {
    e.preventDefault(); // prevent navigation when clicking button!
    addToCart(product, 1);
  };

  const renderStars = (rating) => {
    const stars = [];
    const r = Math.round(parseFloat(rating || 5));
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`w-3.5 h-3.5 ${i <= r ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-700'}`} 
        />
      );
    }
    return stars;
  };

  return (
    <Link 
      to={`/product/${slug}`} 
      className="block h-full"
    >
      <motion.div
        whileHover={{ 
          y: -8,
          scale: 1.015
        }}
        transition={{ type: "spring", stiffness: 350, damping: 22 }}
        className="group bg-white dark:bg-[#0E1321]/50 border border-gray-100 dark:border-gray-800/40 rounded-3xl overflow-hidden flex flex-col h-full shadow-sm hover:border-purple-500/50 dark:hover:border-neonCyan/50 hover:shadow-[0_20px_40px_rgba(168,85,247,0.06)] dark:hover:shadow-[0_20px_40px_rgba(0,240,255,0.04)] transition-colors duration-300"
      >
      {/* Product Image Wrapper */}
      <div className="relative aspect-3/4 overflow-hidden bg-gray-50 dark:bg-[#080B12]">
        <img 
          src={product.image || null} 
          alt={product.name} 
          className="w-full h-full object-cover object-top transition duration-700 group-hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80';
          }}
        />
        
        {/* Wishlist Button */}
        <button 
          onClick={handleToggleWishlist}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/70 dark:bg-[#0E1321]/70 backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-90 transition-all duration-350 shadow-sm hover:scale-105"
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-400'}`} />
        </button>

        {product.discount_price && (
          <span className="absolute top-4 left-4 bg-red-500 text-white font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md shadow-red-500/20">
            Sale
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-3 text-left">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center">
              {renderStars(product.rating)}
            </div>
            <span className="text-[10px] text-gray-400 font-semibold font-mono">
              ({product.reviews_count || 0})
            </span>
          </div>

          <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-neonCyan transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-gray-900 dark:text-white font-mono">
              ₹{parseFloat(product.price).toFixed(2)}
            </span>
            {product.discount_price && (
              <span className="text-xs text-gray-400 line-through font-mono">
                ₹{parseFloat(product.discount_price).toFixed(2)}
              </span>
            )}
          </div>

          <button 
            onClick={handleAddToCart}
            className="w-9 h-9 flex items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-black rounded-full hover:bg-purple-600 dark:hover:bg-neonCyan dark:hover:text-black transition-all duration-300 hover:scale-105 shadow-sm active:scale-95"
            title="Add to Cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  </Link>
  );
}
