import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ImageReveal from '../components/ImageReveal';
import ScrollReveal from '../components/ScrollReveal';
import { useLanguage } from '../context/LanguageContext';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.data || data || []);
        }
      } catch (err) {
        console.error("Failed to load products on Home:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const newArrivals = products.slice(0, 4);
  const topSelling = products.slice(Math.max(0, products.length - 4));

  // Dynamic Flow Menu list with matching background illustrations
  const categoryFlowItems = [
    { id: 'casual', link: '/category/casual', text: 'Casual', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80' },
    { id: 'formal', link: '/category/formal', text: 'Formal', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1000&q=80' },
    { id: 'party-wear', link: '/category/party-wear', text: 'Party', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1000&q=80' },
    { id: 'gym-wear', link: '/category/gym-wear', text: 'Gym', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80' }
  ];

  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section className="relative px-6 md:px-12 lg:px-16 py-12 lg:py-20 max-w-[1440px] mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          
          {/* Left Column: Text, CTAs & Stats */}
          <div className="lg:col-span-6 flex flex-col justify-center text-left">
            <ScrollReveal delay={0.1}>
              {/* Exclusive Brand Subtitle */}
              <span className="text-purple-600 dark:text-purple-400 font-bold uppercase tracking-[0.2em] text-xs sm:text-sm mb-4 block">
                EXCLUSIVE BRAND
              </span>
              
              {/* Premium Serif Display Title */}
              <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[4.5rem] font-bold text-gray-900 dark:text-white leading-[1.05] tracking-tight mb-6">
                Exclusive<br />
                Offers For<br />
                You
              </h1>
              
              {/* Brand Description */}
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base font-normal leading-relaxed max-w-lg mb-8 md:mb-10">
                Clothing is more than just a way to cover the body—it's a form of self-expression, culture, and identity.
              </p>
              
              {/* CTA Buttons Row */}
              <div className="flex flex-wrap gap-4 mb-12 md:mb-16">
                {/* Shop Now Primary Button */}
                <button 
                  onClick={() => document.getElementById('new-arrivals-container')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-3 bg-purple-700 hover:bg-purple-800 text-white pl-8 pr-3 py-3 rounded-full hover:shadow-xl hover:shadow-purple-700/20 hover:scale-102 active:scale-98 transition-all duration-300 group font-bold text-sm sm:text-base shadow-md cursor-pointer"
                >
                  <span>Shop Now</span>
                  <span className="w-10 h-10 rounded-full bg-white text-purple-700 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </button>
                
                {/* Learn More Secondary Button */}
                <button 
                  onClick={() => document.getElementById('browse-style-container')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center justify-center bg-transparent border-2 border-gray-300 dark:border-gray-800 hover:border-gray-900 dark:hover:border-white text-gray-800 dark:text-gray-200 px-8 py-4 rounded-full hover:bg-gray-50 hover:dark:bg-white/5 active:scale-98 transition-all duration-300 font-bold text-sm sm:text-base cursor-pointer"
                >
                  <span>Learn More</span>
                </button>
              </div>

              {/* Stats Bar */}
              <div className="border-t border-gray-150 dark:border-gray-800/80 pt-8 grid grid-cols-3 gap-6 md:gap-8 max-w-md">
                <div>
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">
                    120+
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider leading-snug">
                    Brand Outlets
                  </p>
                </div>
                <div className="border-l border-gray-150 dark:border-gray-800/80 pl-6 md:pl-8">
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">
                    76K+
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider leading-snug">
                    Happy Customers
                  </p>
                </div>
                <div className="border-l border-gray-150 dark:border-gray-800/80 pl-6 md:pl-8">
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">
                    12+
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider leading-snug">
                    Years Excellence
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Model Container Card with Overlays */}
          <div className="lg:col-span-6 relative w-full h-[500px] sm:h-[600px] lg:h-[650px] flex justify-center items-center">
            <ScrollReveal delay={0.2} yOffset={40} className="w-full h-full">
              {/* Rich Visual Container Card */}
              <div className="relative w-full h-full rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden shadow-2xl border border-gray-200/30 dark:border-white/10 bg-gradient-to-tr from-[#2A4B52] via-[#4E7E89] to-indigo-900/40">
                
                {/* Model Image */}
                <img 
                  src="/Rectangle3.png" 
                  alt="Fashion Models" 
                  className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80";
                  }} 
                />

                {/* Floating Card 1: Our Story (Bottom Left) */}
                <div className="absolute bottom-6 left-6 z-20 max-w-[200px] sm:max-w-[260px] backdrop-blur-xl bg-white/10 dark:bg-black/25 border border-white/20 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl text-left transform hover:-translate-y-1 transition-transform duration-300">
                  <h4 className="text-white font-bold text-sm sm:text-base mb-1">Our Story</h4>
                  <p className="text-white/80 text-[10px] sm:text-xs leading-relaxed mb-3 font-medium">
                    Discover exclusive designs crafted for your unique self-expression and cultural identity.
                  </p>
                  <Link 
                    to="/about" 
                    className="text-white text-[10px] sm:text-xs font-bold underline hover:text-white/80 transition-colors inline-flex items-center gap-1"
                  >
                    Learn More &rarr;
                  </Link>
                </div>

                {/* Floating Card 2: Google Ratings & Discounts (Bottom Right) */}
                <div className="absolute bottom-6 right-6 z-20 w-[160px] sm:w-[220px] bg-[#120F17]/95 text-white border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl text-left transform hover:-translate-y-1 transition-transform duration-300">
                  <div className="grid grid-cols-2 gap-4 items-center">
                    {/* Google Rating Column */}
                    <div className="flex flex-col border-r border-white/10 pr-2">
                      <span className="text-xl sm:text-3xl font-black tracking-tight leading-none mb-1 text-white">4.7</span>
                      <span className="text-[8px] sm:text-[9px] text-gray-400 font-semibold uppercase tracking-wider leading-tight">Rating on Google</span>
                    </div>
                    {/* Avatars Column */}
                    <div className="flex flex-col pl-1">
                      {/* Avatar bubbles */}
                      <div className="flex items-center -space-x-2 mb-2">
                        <img className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-gray-800 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&crop=faces&q=80" alt="Reviewer 1" />
                        <img className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-gray-800 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&crop=faces&q=80" alt="Reviewer 2" />
                        <img className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-gray-800 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&crop=faces&q=80" alt="Reviewer 3" />
                        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-purple-600 border border-gray-800 flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-white cursor-pointer">+</div>
                      </div>
                      <span className="text-[8px] sm:text-[9px] text-gray-400 font-semibold uppercase tracking-wider leading-tight">Members Get 10% Off</span>
                    </div>
                  </div>
                </div>

              </div>
            </ScrollReveal>
          </div>

        </div>
      </section>

      {/* Brand Bar Marquee */}
      <div className="bg-black py-6 overflow-hidden shadow-inner">
        <div className="animate-marquee inline-block w-max whitespace-nowrap items-center brand-bar text-white text-2xl md:text-3xl opacity-80 hover:opacity-100 transition-opacity duration-300">
          <span className="mx-8 font-extrabold tracking-widest">VERSACE</span>
          <span className="mx-8 italic font-light tracking-wide">ZARA</span>
          <span className="mx-8 font-extrabold">GUCCI</span>
          <span className="mx-8 font-black tracking-widest">PRADA</span>
          <span className="mx-8 font-light">Calvin Klein</span>
          
          <span className="mx-8 font-extrabold tracking-widest">VERSACE</span>
          <span className="mx-8 italic font-light tracking-wide">ZARA</span>
          <span className="mx-8 font-extrabold">GUCCI</span>
          <span className="mx-8 font-black tracking-widest">PRADA</span>
          <span className="mx-8 font-light">Calvin Klein</span>
        </div>
      </div>

      {/* New Arrivals Feed */}
      <section className="px-6 md:px-16 py-20 bg-white dark:bg-[#0a0a0a]">
        <ScrollReveal>
          <div>
            <h2 className="text-center text-4xl md:text-5xl font-black tracking-tight mb-14 hero-title dark:text-white uppercase">
              {t('new_arrivals', 'NEW ARRIVALS')}
            </h2>
          </div>
          
          <div id="new-arrivals-container" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="aspect-[3/4] rounded-3xl bg-gray-100 dark:bg-gray-900 animate-pulse" />
              ))
            ) : (
              newArrivals.map(prod => (
                <ProductCard key={prod.id} product={prod} />
              ))
            )}
          </div>

          <div className="text-center mt-14">
            <Link 
              to="/category/new-arrivals" 
              className="btn-view-all inline-block border-2 border-gray-200 dark:border-gray-800 px-12 py-3 rounded-full text-base font-medium hover:scale-105 hover:shadow-xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300"
            >
              {t('view_all', 'View All Products')}
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <hr className="border-gray-100 dark:border-gray-800/80 mx-6 md:mx-16"/>

      {/* Top Selling Feed */}
      <section className="px-6 md:px-16 py-20 bg-white dark:bg-[#0a0a0a]">
        <ScrollReveal>
          <div>
            <h2 className="text-center text-4xl md:text-5xl font-black tracking-tight mb-14 hero-title dark:text-white uppercase">
              {t('top_selling', 'TOP SELLING')}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="aspect-[3/4] rounded-3xl bg-gray-100 dark:bg-gray-900 animate-pulse" />
              ))
            ) : (
              topSelling.map(prod => (
                <ProductCard key={prod.id} product={prod} />
              ))
            )}
          </div>

          <div className="text-center mt-14">
            <Link 
              to="/category/top-selling" 
              className="btn-view-all inline-block border-2 border-gray-200 dark:border-gray-800 px-12 py-3 rounded-full text-base font-medium hover:scale-105 hover:shadow-xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300"
            >
              {t('view_all', 'View All Products')}
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* Browse By Style: Integrated ImageReveal Component */}
      <section id="browse-style-container" className="px-6 md:px-16 py-10 bg-white dark:bg-[#0a0a0a]">
        <ScrollReveal>
          <div className="bg-[#120F17] dark:bg-[#0d0d0d] border border-[#ffffff10] rounded-[2.5rem] py-14 shadow-sm overflow-hidden text-center">
            <h2 className="text-center text-3xl md:text-5xl font-black mb-10 hero-title text-white tracking-widest uppercase">
              {t('browse_style', 'BROWSE BY DRESS STYLE')}
            </h2>
            <ImageReveal />
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
