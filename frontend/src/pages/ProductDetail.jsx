import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { ChevronRight, Star, ShoppingCart, ShieldAlert } from 'lucide-react';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          const list = data.data || data;
          
          // Match by id or slug
          let found = list.find(p => String(p.id) === String(slug) || p.slug === slug);
          if (found) {
            setProduct(found);
            // Get recommendations in same category
            const recs = list.filter(p => p.id !== found.id && p.category === found.category).slice(0, 4);
            setRecommendations(recs.length ? recs : list.filter(p => p.id !== found.id).slice(0, 4));
          }
        }
      } catch (err) {
        console.error("Failed to load details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold dark:text-white">Product Not Found</h2>
        <p className="text-xs text-gray-500 font-medium">The garment slug or catalog ID you requested does not exist.</p>
        <Link to="/" className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full text-xs">
          Back to Store
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const renderStars = (rating) => {
    const stars = [];
    const r = Math.round(parseFloat(rating || 5));
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`w-4 h-4 ${i <= r ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-700'}`} 
        />
      );
    }
    return stars;
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 text-left space-y-16">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
        <Link to="/" className="hover:text-purple-600">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={`/category/${product.category}`} className="hover:text-purple-600 capitalize">{product.category}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 dark:text-white capitalize">{product.name}</span>
      </div>

      {/* Main product display */}
      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Left Side: Product Image */}
        <div className="rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-gray-800/60 bg-gray-50 dark:bg-[#0A0D15] aspect-[3/4]">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover object-top"
          />
        </div>

        {/* Right Side: Product Details */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black font-syne dark:text-white uppercase leading-tight tracking-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center">{renderStars(product.rating)}</div>
              <span className="text-xs font-mono font-semibold text-gray-400">({product.reviews_count || 0} reviews)</span>
            </div>
          </div>

          <div className="flex items-baseline gap-3 border-b border-gray-100 dark:border-gray-800 pb-6">
            <span className="text-3xl font-black text-gray-900 dark:text-white font-mono">
              ${parseFloat(product.price).toFixed(2)}
            </span>
            {product.discount_price && (
              <span className="text-lg text-gray-400 line-through font-mono">
                ${parseFloat(product.discount_price).toFixed(2)}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-gray-400">Description</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-light">
              This premium item brings state of the art aesthetics and modern fashion right to your wardrobe. Carefully curated, locally woven, and tailored to fit.
            </p>
          </div>

          {/* Size Selector */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-gray-400">Select Size</h4>
            <div className="flex gap-3">
              {['S', 'M', 'L', 'XL'].map((size, index) => (
                <button 
                  key={index}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 rounded-full border font-bold text-xs flex items-center justify-center transition-all ${
                    selectedSize === size 
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg' 
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-black'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity and Checkout buttons */}
          <div className="flex flex-wrap gap-4 items-center pt-4">
            <div className="flex items-center bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-full py-1.5 px-4 gap-4">
              <button 
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="text-lg font-bold text-gray-500 hover:text-black dark:hover:text-white"
              >
                -
              </button>
              <span className="font-mono font-bold dark:text-white w-6 text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(prev => prev + 1)}
                className="text-lg font-bold text-gray-500 hover:text-black dark:hover:text-white"
              >
                +
              </button>
            </div>

            <button 
              onClick={handleAddToCart}
              className="flex-1 py-3 px-8 bg-black dark:bg-white text-white dark:text-black font-extrabold rounded-full hover:bg-purple-600 dark:hover:bg-neonCyan dark:hover:text-black transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic recommendations section */}
      {recommendations.length > 0 && (
        <section className="space-y-8 pt-10 border-t border-gray-100 dark:border-gray-850">
          <div className="text-left">
            <h2 className="text-2xl md:text-3xl font-black font-syne dark:text-white uppercase">
              You Might Also Like
            </h2>
            <p className="text-xs text-gray-400 font-semibold font-mono mt-0.5">Recommendations from the same category</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recommendations.map(recs => (
              <ProductCard key={recs.id} product={recs} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
