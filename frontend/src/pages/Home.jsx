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
      <section className="relative min-h-[80vh] flex flex-col md:flex-row items-center px-6 md:px-16 overflow-hidden bg-white dark:bg-[#0a0a0a] mt-4 mx-4 md:mx-8 rounded-[2.5rem] shadow-[0_0_40px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-150 dark:border-gray-800/80 mb-10 text-left">
        
        {/* Background floating circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-yellow-100 dark:bg-yellow-500/5 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-50 dark:bg-purple-500/5 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-2xl z-10 py-16 md:py-24 w-full">
          <ScrollReveal delay={0.1}>
            {/* Live status tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-bold text-green-700 dark:text-green-400 tracking-wide uppercase">New Collection 2025</span>
            </div>

            <h1 className="hero-title text-5xl sm:text-6xl md:text-[5rem] font-extrabold leading-[1.05] mb-6 text-gray-900 dark:text-white tracking-tight">
              {t('hero_title', 'FIND CLOTHES THAT MATCHES YOUR STYLE')}
            </h1>

            <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg mb-10 max-w-md leading-relaxed font-light">
              {t('hero_subtitle', 'Browse through our diverse range of meticulously crafted garments designed to make you stand out and elevate your everyday wardrobe.')}
            </p>

            <button 
              onClick={() => document.getElementById('new-arrivals-container')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black px-10 py-4 rounded-full text-base font-semibold hover:opacity-85 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              {t('shop_now', 'Shop Now')}
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            {/* Stats Section */}
            <div className="flex flex-wrap gap-8 md:gap-12 mt-16 pt-8 border-t border-gray-100 dark:border-gray-800">
              <div className="hover:-translate-y-1 transition-transform duration-300">
                <p className="text-3xl md:text-4xl font-black text-black dark:text-white">200+</p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-medium">Brands</p>
              </div>
              <div className="hover:-translate-y-1 transition-transform duration-300">
                <p className="text-3xl md:text-4xl font-black text-black dark:text-white">2,000+</p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-medium">Products</p>
              </div>
              <div className="hover:-translate-y-1 transition-transform duration-300">
                <p className="text-3xl md:text-4xl font-black text-black dark:text-white">30k+</p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-medium">Customers</p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Hero image canvas */}
        <div className="flex-1 self-stretch flex justify-center items-center relative w-full mt-10 md:mt-0">
          <ScrollReveal delay={0.2} yOffset={60} className="w-full max-w-[480px]">
            <div className="relative w-full aspect-[4/5] bg-gray-50 dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-850 overflow-hidden flex items-end justify-center shadow-inner">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              
              <img 
                src="/Rectangle2.jpg" 
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80";
                }} 
                alt="Fashion Model" 
                className="relative z-10 w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700" 
              />

              {/* Floating Info Badges */}
              <div className="absolute top-12 -left-4 md:-left-8 bg-white/90 dark:bg-black/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-white/60 dark:border-gray-800 flex items-center gap-3 animate-[bounce_4s_ease-in-out_infinite] z-20">
                <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center text-yellow-600 dark:text-yellow-400 text-sm">✨</div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wide">New Arrival</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Just dropped</p>
                </div>
              </div>

              <div className="absolute bottom-24 -right-4 md:-right-8 bg-white/90 dark:bg-black/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-white/60 dark:border-gray-800 flex items-center gap-3 animate-[bounce_5s_ease-in-out_infinite_reverse] z-20">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-xs">%</div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wide">Big Sale</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Up to 50% Off</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
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
          
          <div id="new-arrivals-container" className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
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
      <section className="px-6 md:px-16 py-10 bg-white dark:bg-[#0a0a0a]">
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
