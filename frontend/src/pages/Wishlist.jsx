import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { Heart } from 'lucide-react';

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { wishlistIds } = useAuth();

  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/wishlist');
        if (res.ok) {
          const data = await res.json();
          setWishlistItems(data.data || data || []);
        }
      } catch (err) {
        console.error("Failed to fetch products for wishlist:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [wishlistIds]);

  if (loading) {
    return (
      <div className="min-h-125 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-360 mx-auto px-6 md:px-12 py-10 text-left space-y-8 animate-fadeIn">
      <h1 className="text-3xl md:text-5xl font-black font-syne dark:text-white uppercase">Your Wishlist</h1>

      {wishlistItems.length === 0 ? (
        <div className="bg-white dark:bg-[#0A0D14] border border-gray-200/50 dark:border-gray-800 rounded-[2.5rem] py-20 text-center space-y-4">
          <Heart className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto" />
          <p className="text-gray-400 font-medium">Your wishlist is currently empty.</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-bold text-xs rounded-full"
          >
            Explore Garments
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {wishlistItems.map(prod => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
}
