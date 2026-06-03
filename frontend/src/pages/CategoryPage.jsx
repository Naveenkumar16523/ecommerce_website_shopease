import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { SlidersHorizontal, ChevronRight, Grid, List } from 'lucide-react';

export default function CategoryPage() {
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [priceRange, setPriceRange] = useState(1000);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  // Sidebar Menu mapping based on main tier category
  const getSubcategories = () => {
    const term = categoryId ? categoryId.toLowerCase() : '';
    if (term.includes('indian')) {
      return [
        { name: 'Kurtas & Suits', path: 'indian-kurtas' },
        { name: 'Sarees', path: 'indian-sarees' },
        { name: 'Lehengas', path: 'indian-lehengas' },
        { name: 'Anarkalis', path: 'indian-anarkalis' }
      ];
    } else if (term.includes('western')) {
      return [
        { name: 'Tops & Tees', path: 'western-tops' },
        { name: 'Jeans & Denim', path: 'western-jeans' },
        { name: 'Dresses', path: 'western-dresses' },
        { name: 'Shirts & Blazers', path: 'western-shirts' }
      ];
    } else if (term.includes('footwear')) {
      return [
        { name: 'Sneakers', path: 'footwear-sneakers' },
        { name: 'Flats & Heels', path: 'footwear-heels' },
        { name: 'Casual Shoes', path: 'footwear-casual' },
        { name: 'Formal Shoes', path: 'footwear-formal' }
      ];
    } else if (term.includes('lingerie')) {
      return [
        { name: 'Sleepwear', path: 'lingerie-sleepwear' },
        { name: 'Shapewear', path: 'lingerie-shapewear' },
        { name: 'Loungewear', path: 'lingerie-loungewear' }
      ];
    } else if (term.includes('bags')) {
      return [
        { name: 'Handbags', path: 'bags-handbags' },
        { name: 'Backpacks', path: 'bags-backpacks' },
        { name: 'Wallets & Clutches', path: 'bags-wallets' },
        { name: 'Travel Bags', path: 'bags-travel' }
      ];
    } else if (term.includes('jewellery')) {
      return [
        { name: 'Necklaces', path: 'jewellery-necklaces' },
        { name: 'Earrings', path: 'jewellery-earrings' },
        { name: 'Rings & Bracelets', path: 'jewellery-rings' },
        { name: 'Fine Jewellery', path: 'jewellery-fine' }
      ];
    } else if (term.includes('mens')) {
      return [
        { name: 'T-Shirts', path: 'mens-tshirts' },
        { name: 'Shirts', path: 'mens-shirts' },
        { name: 'Jeans', path: 'mens-jeans' },
        { name: 'Shorts', path: 'mens-shorts' },
        { name: 'Jackets', path: 'mens-jackets' }
      ];
    } else if (term.includes('womens')) {
      return [
        { name: 'T-Shirts', path: 'womens-tshirts' },
        { name: 'Dresses', path: 'womens-dresses' },
        { name: 'Jeans', path: 'womens-jeans' },
        { name: 'Shorts', path: 'womens-shorts' },
        { name: 'Hoodies', path: 'womens-hoodies' }
      ];
    } else if (term.includes('kids')) {
      return [
        { name: 'Baby Boys', path: 'kids-babyboys' },
        { name: 'Baby Girls', path: 'kids-babygirls' },
        { name: 'Toddlers', path: 'kids-toddlers' }
      ];
    }
    return [
      { name: 'Men Wear', path: 'mens' },
      { name: 'Women Wear', path: 'womens' },
      { name: 'Kids Wear', path: 'kids' },
      { name: 'Indian Wear', path: 'indian-wear' },
      { name: 'Western Wear', path: 'western-wear' },
      { name: 'Footwear', path: 'footwear' },
      { name: 'Watches', path: 'watches' }
    ];
  };

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/products?per_page=1000');
        if (res.ok) {
          const data = await res.json();
          const list = data.data || data;
          setProducts(list);
        }
      } catch (err) {
        console.error("Failed to load products on category page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryProducts();
  }, [categoryId]);

  useEffect(() => {
    if (!products.length) return;

    let result = [...products];

    // Helper mapping function to map URL category slugs to SQLite database category tags
    const getDatabaseCategories = (term) => {
      const t = term.toLowerCase().replace(/_/, '-');

      // 1. Indian Wear parent & subcategories
      if (t === 'indian-wear') return ['kurtas', 'sarees', 'lehengas', 'anarkalis'];
      if (t.includes('kurtas')) return ['kurtas'];
      if (t.includes('sarees')) return ['sarees'];
      if (t.includes('lehengas')) return ['lehengas'];
      if (t.includes('anarkalis')) return ['anarkalis'];

      // 2. Western Wear parent & subcategories
      if (t === 'western-wear') return ['tops', 'dresses', 'jeans', 'shirts'];
      if (t.includes('tops')) return ['tops', 'T-Shirts', 'tshirts'];
      if (t.includes('dresses')) return ['dresses', 'Dresses'];
      if (t.includes('jeans')) return ['jeans', 'Jeans'];
      if (t.includes('shirts')) return ['shirts', 'Shirts'];

      // 3. Footwear parent & subcategories
      if (t === 'footwear') return ['heels', 'sneakers', 'formal_shoes', 'casual_shoes'];
      if (t.includes('sneakers')) return ['sneakers'];
      if (t.includes('heels')) return ['heels'];
      if (t.includes('casual')) return ['casual_shoes', 'casual'];
      if (t.includes('formal')) return ['formal_shoes', 'formal'];

      // 4. Lingerie parent & subcategories
      if (t === 'lingerie') return ['sleepwear', 'shapewear', 'loungewear'];
      if (t.includes('sleepwear')) return ['sleepwear'];
      if (t.includes('shapewear')) return ['shapewear'];
      if (t.includes('loungewear')) return ['loungewear'];

      // 5. Bags parent & subcategories
      if (t === 'bags') return ['handbags', 'backpacks', 'travel_bags', 'wallets'];
      if (t.includes('handbags')) return ['handbags'];
      if (t.includes('backpacks')) return ['backpacks'];
      if (t.includes('wallets')) return ['wallets'];
      if (t.includes('travel')) return ['travel_bags'];

      // 6. Jewellery parent & subcategories
      if (t === 'jewellery') return ['earrings', 'necklaces', 'rings_bracelets', 'fine_jewellery'];
      if (t.includes('earrings')) return ['earrings'];
      if (t.includes('necklaces')) return ['necklaces'];
      if (t.includes('rings')) return ['rings_bracelets'];
      if (t.includes('fine')) return ['fine_jewellery'];

      // 7. Active Wear / Sports parent & subcategories
      if (t === 'active-wear' || t === 'active-sports' || t === 'sports') return ['sports_tees', 'sports_tights', 'sports_jackets', 'gym'];
      if (t.includes('tees')) return ['sports_tees'];
      if (t.includes('tights')) return ['sports_tights'];
      if (t.includes('jackets')) return ['sports_jackets', 'Jackets'];

      // 8. Watches parent & subcategories
      if (t === 'watches') return ['analog_watches', 'smartwatches', 'chronographs'];
      if (t.includes('analog')) return ['analog_watches'];
      if (t.includes('smartwatch')) return ['smartwatches'];
      if (t.includes('chrono')) return ['chronographs'];

      // 9. Tech Accessories / Acc parent & subcategories
      if (t === 'tech-accessories' || t === 'tech-acc' || t === 'tech') return ['phone_cases', 'wireless_earbuds', 'smart_gadgets'];
      if (t.includes('cases')) return ['phone_cases'];
      if (t.includes('earbuds')) return ['wireless_earbuds'];
      if (t.includes('gadgets')) return ['smart_gadgets'];

      // 10. Mens, Womens, Kids parent & subcategories
      if (t === 'mens' || t === 'men') return ['Men', 'casual', 'formal', 'gym', 'T-Shirts', 'Shirts', 'Jeans', 'Shorts', 'Jackets', 'Hoodies'];
      if (t === 'womens' || t === 'women') return ['Women', 'Dresses', 'Jeans', 'Shorts', 'Hoodies', 'T-Shirts', 'sarees', 'kurtas', 'lehengas', 'anarkalis'];
      if (t === 'kids') return ['Kids', 'kids', 'Baby Boys', 'Baby Girls', 'Toddlers'];

      // Default fallback
      return [term, term.toLowerCase(), term.replace(/-/g, '_'), term.replace(/-/g, ' ')];
    };

    // Filter by category slug using mapped database categories
    if (categoryId && categoryId !== 'all') {
      const term = categoryId.toLowerCase();
      result = result.filter(p => {
        const pCat = (p.category || '').toLowerCase();
        if (term === 'new-arrivals') return true; // Show everything for new arrivals
        if (term === 'top-selling') return p.rating >= 4.5;
        if (term === 'on-sale') return p.discount_price ? true : false;
        
        // Match against our mapped list of category tags
        const matchedCats = getDatabaseCategories(term).map(c => c.toLowerCase());
        return matchedCats.includes(pCat);
      });
    }

    // Filter by Price range slider
    result = result.filter(p => p.price <= priceRange);

    // Filter by Color
    if (selectedColor) {
      result = result.filter(p => p.color === selectedColor);
    }

    setFilteredProducts(result);
  }, [products, categoryId, priceRange, selectedColor]);

  const cleanCategoryTitle = () => {
    if (!categoryId) return 'Store Catalog';
    return categoryId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="max-w-360 mx-auto px-6 md:px-12 py-10 text-left">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold mb-6">
        <Link to="/" className="hover:text-purple-600">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 dark:text-white capitalize">{categoryId || 'Catalog'}</span>
      </div>

      <div className="grid lg:grid-cols-4 gap-10 items-start">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 border border-gray-200/60 dark:border-gray-800 rounded-3xl p-6 bg-white dark:bg-[#0A0D14] space-y-8">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-4">
            <h3 className="font-syne font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </h3>
          </div>

          {/* Subcategories sidebar mapping */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-gray-400">Categories</h4>
            <div className="flex flex-col gap-2 pl-1 font-semibold text-sm text-gray-600 dark:text-gray-400">
              {getSubcategories().map((sub, index) => (
                <Link 
                  key={index}
                  to={`/category/${sub.path}`} 
                  className={`hover:text-purple-600 dark:hover:text-neonCyan transition-colors flex justify-between items-center ${categoryId === sub.path ? 'text-purple-600 dark:text-neonCyan' : ''}`}
                >
                  {sub.name} <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </Link>
              ))}
            </div>
          </div>

          {/* Price range filter */}
          <div className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-6">
            <div className="flex justify-between items-center">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-gray-400">Max Price</h4>
              <span className="text-xs font-mono font-bold">₹{priceRange}</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="1500" 
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>

          {/* Colors filter */}
          <div className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-6">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-gray-400">Colors</h4>
            <div className="flex flex-wrap gap-2.5">
              {['White', 'Black', 'Blue', 'Red', 'Green', 'Yellow', 'Pink'].map((color, index) => (
                <button 
                  key={index}
                  onClick={() => setSelectedColor(selectedColor === color ? '' : color)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-all ${
                    selectedColor === color 
                      ? 'bg-purple-600 dark:bg-neonCyan text-white dark:text-black border-purple-600 dark:border-neonCyan' 
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-purple-600'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black font-syne dark:text-white uppercase tracking-tight">
                {cleanCategoryTitle()}
              </h1>
              <p className="text-xs text-gray-400 font-semibold font-mono mt-0.5">
                Showing {filteredProducts.length} premium products
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-3/4 rounded-3xl bg-gray-100 dark:bg-gray-900 animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-[#0A0D14] border border-gray-200/50 dark:border-gray-800 rounded-[2.5rem] py-20 text-center space-y-4">
              <p className="text-gray-400 font-medium">No products match your custom filters.</p>
              <button 
                onClick={() => { setPriceRange(1000); setSelectedColor(''); }}
                className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-bold text-xs rounded-full hover:opacity-85 transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map(prod => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
