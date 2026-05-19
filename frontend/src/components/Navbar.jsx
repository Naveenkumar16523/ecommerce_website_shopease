import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  User, Heart, ShoppingCart, Sun, Moon, 
  Menu, X, Shield, Search, ChevronDown, Percent 
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* Top Promotional Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white text-center text-xs py-2 px-4 font-medium tracking-wide shadow-inner">
        Sign up and get 20% off to your first order.
        <Link to="/signup" className="underline font-semibold ml-1.5 hover:text-yellow-300 transition-colors">Sign Up Now</Link>
      </div>

      {/* Main Glassmorphic Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm transition-colors duration-300">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-3 md:py-4 flex items-center justify-between gap-4 md:gap-8">
          
          {/* Logo & Navigation Menu */}
          <div className="flex items-center gap-6 md:gap-10 text-[15px] font-semibold">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1 text-gray-700 dark:text-gray-300 hover:opacity-70 transition-opacity"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" className="text-2xl font-black tracking-tight font-syne dark:text-white mr-4">
              SHOP EASE
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-7">
              <Link to="/" className="text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-neonCyan transition-colors py-4">{t('nav_home', 'Home')}</Link>
              
              {/* Women Dropdown */}
              <div className="group relative py-4">
                <Link to="/category/womens" className="flex items-center gap-1 text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-neonCyan transition-colors">
                  {t('nav_women', 'Women')} <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
                </Link>
                <div className="absolute top-full left-0 w-[500px] bg-white dark:bg-[#0A0E17] border border-gray-150 dark:border-gray-800/50 shadow-2xl rounded-2xl p-6 grid grid-cols-2 gap-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 uppercase text-xs tracking-wider">{t('shop_categories', 'Categories')}</h3>
                    <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                      <li><Link to="/category/womens-tshirts" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">T-Shirts</Link></li>
                      <li><Link to="/category/womens-dresses" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">Dresses</Link></li>
                      <li><Link to="/category/womens-jeans" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">Jeans</Link></li>
                      <li><Link to="/category/womens-shorts" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">Shorts</Link></li>
                      <li><Link to="/category/womens-hoodies" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">Hoodies</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 uppercase text-xs tracking-wider">Highlight</h3>
                    <div className="relative rounded-xl overflow-hidden h-32 group/img">
                      <img 
                        src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80" 
                        alt="Summer Collection" 
                        className="w-full h-full object-cover transition duration-500 group-hover/img:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-3">
                        <p className="text-white font-bold text-sm">Summer Collection</p>
                        <p className="text-white/80 text-[10px]">Up to 40% Off</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Men Dropdown */}
              <div className="group relative py-4">
                <Link to="/category/mens" className="flex items-center gap-1 text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-neonCyan transition-colors">
                  {t('nav_men', 'Men')} <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
                </Link>
                <div className="absolute top-full left-0 w-[500px] bg-white dark:bg-[#0A0E17] border border-gray-150 dark:border-gray-800/50 shadow-2xl rounded-2xl p-6 grid grid-cols-2 gap-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 uppercase text-xs tracking-wider">{t('shop_categories', 'Categories')}</h3>
                    <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                      <li><Link to="/category/mens-tshirts" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">T-Shirts</Link></li>
                      <li><Link to="/category/mens-shirts" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">Shirts</Link></li>
                      <li><Link to="/category/mens-jeans" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">Jeans</Link></li>
                      <li><Link to="/category/mens-shorts" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">Shorts</Link></li>
                      <li><Link to="/category/mens-jackets" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">Jackets</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 uppercase text-xs tracking-wider">Featured</h3>
                    <div className="relative rounded-xl overflow-hidden h-32 group/img">
                      <img 
                        src="https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400&q=80" 
                        alt="Formal Essentials" 
                        className="w-full h-full object-cover transition duration-500 group-hover/img:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-3">
                        <p className="text-white font-bold text-sm">Formal Essentials</p>
                        <p className="text-white/80 text-[10px]">Premium Quality</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kids Dropdown */}
              <div className="group relative py-4">
                <Link to="/category/kids" className="flex items-center gap-1 text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-neonCyan transition-colors">
                  {t('nav_kids', 'Kids')} <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
                </Link>
                <div className="absolute top-full left-0 w-[400px] bg-white dark:bg-[#0A0E17] border border-gray-150 dark:border-gray-800/50 shadow-2xl rounded-2xl p-6 grid grid-cols-2 gap-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 uppercase text-xs tracking-wider">{t('shop_categories', 'Categories')}</h3>
                    <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                      <li><Link to="/category/kids-babyboys" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">Baby Boys</Link></li>
                      <li><Link to="/category/kids-babygirls" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">Baby Girls</Link></li>
                      <li><Link to="/category/kids-toddlers" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">Toddlers</Link></li>
                    </ul>
                  </div>
                  <div>
                    <div className="relative rounded-xl overflow-hidden h-28 group/img">
                      <img 
                        src="https://images.unsplash.com/photo-1519235106638-30cc49daeb66?w=300&q=80" 
                        alt="Festive Styles" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Link to="/brands" className="text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-neonCyan transition-colors py-4">{t('nav_brands', 'Brands')}</Link>
            </div>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm hidden md:block">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                placeholder={t('search_placeholder', 'Search for products...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-full text-xs text-gray-800 dark:text-white placeholder-gray-500 focus:bg-white dark:focus:bg-black focus:border-purple-500/30 outline-none transition-all duration-300"
              />
            </div>
          </form>

          {/* Interactive Icons */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Dynamic Admin Badge */}
            {user?.is_admin === 1 && (
              <Link 
                to="/admin" 
                className="w-10 h-10 flex items-center justify-center rounded-full text-purple-600 dark:text-neonCyan hover:bg-purple-50 dark:hover:bg-neonCyan/10 transition-colors"
                title="Admin Control Centre"
              >
                <Shield className="w-5 h-5 animate-pulse" />
              </Link>
            )}

            <Link 
              to="/profile" 
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              title="Profile"
            >
              <User className="w-5 h-5" />
            </Link>

            <Link 
              to="/wishlist" 
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            <Link 
              to="/cart" 
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors relative"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-600 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 animate-bounce">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Dark Mode Switch */}
            <button 
              onClick={toggleTheme} 
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ml-1"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-700" />}
            </button>
          </div>
        </div>

        {/* Subcategories Horizontal Scrolling Bar */}
        <div className="border-t border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-black/20 overflow-x-auto scrollbar-hide py-2 whitespace-nowrap text-xs font-semibold">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-start md:justify-center gap-8 text-gray-600 dark:text-gray-400">
            <Link to="/category/on-sale" className="flex items-center hover:scale-105 transition-transform flex-shrink-0">
              <span className="bg-red-500 text-white px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shadow-sm shadow-red-500/30 flex items-center gap-0.5">
                <Percent className="w-2.5 h-2.5" /> {t('cat_sale', 'Sale')}
              </span>
            </Link>

            <Link to="/category/indian-wear" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">{t('cat_indian', 'Indian Wear')}</Link>
            <Link to="/category/western-wear" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">{t('cat_western', 'Western Wear')}</Link>
            <Link to="/category/footwear" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">{t('cat_footwear', 'Footwear')}</Link>
            <Link to="/category/lingerie" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">{t('cat_lingerie', 'Lingerie')}</Link>
            <Link to="/category/bags" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">{t('cat_bags', 'Bags')}</Link>
            <Link to="/category/jewellery" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">{t('cat_jewellery', 'Jewellery')}</Link>
            <Link to="/category/active-wear" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">{t('cat_active', 'Active & Sports')}</Link>
            <Link to="/category/watches" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">{t('cat_watches', 'Watches')}</Link>
            <Link to="/category/tech-accessories" className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">{t('cat_tech', 'Tech Accessories')}</Link>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Sidebar) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="absolute left-0 top-0 bottom-0 w-4/5 max-w-xs bg-white dark:bg-[#0A0E17] border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between shadow-2xl animate-[slideRight_0.3s_ease-out_forwards]">
            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="font-syne text-xl font-black dark:text-white">SHOP EASE</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 dark:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Links */}
              <nav className="flex flex-col gap-4 text-base font-semibold text-gray-800 dark:text-gray-200">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">{t('nav_home', 'Home')}</Link>
                
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                  <p className="text-[10px] uppercase text-gray-400 tracking-wider mb-2 font-bold">{t('shop_categories', 'Categories')}</p>
                  <div className="flex flex-col gap-3 pl-2">
                    <Link to="/category/mens" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">{t('nav_men', 'Men')}</Link>
                    <Link to="/category/womens" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">{t('nav_women', 'Women')}</Link>
                    <Link to="/category/kids" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors">{t('nav_kids', 'Kids')}</Link>
                  </div>
                </div>

                <Link to="/brands" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-600 dark:hover:text-neonCyan transition-colors border-t border-gray-100 dark:border-gray-800 pt-3">{t('nav_brands', 'Brands')}</Link>
              </nav>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex flex-col gap-3 text-sm font-semibold">
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-purple-600">
                <User className="w-5 h-5" /> {t('profile', 'Profile')}
              </Link>
              <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-purple-600">
                <ShoppingCart className="w-5 h-5" /> {t('my_cart', 'My Cart')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
