import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import BorderGlow from '../components/BorderGlow';
import ScrollReveal from '../components/ScrollReveal';

const BRANDS_DATA = [
  {
    name: 'VERSACE',
    category: 'Italian Luxury',
    description: 'Bold, opulent, and legendary Italian fashion designed to stand out.',
    link: '/category/casual',
    themeClass: 'from-amber-500/10 to-yellow-500/5 hover:border-amber-500/30',
    tagColor: 'text-amber-500 bg-amber-500/10',
    glowColor: '45 93 47',
    glowColors: ['#f59e0b', '#fbbf24', '#d97706']
  },
  {
    name: 'ZARA',
    category: 'Contemporary Style',
    description: 'Fast-paced, modern trends capturing the essence of global street fashion.',
    link: '/category/casual',
    themeClass: 'from-blue-500/10 to-indigo-500/5 hover:border-blue-500/30',
    tagColor: 'text-blue-500 bg-blue-500/10',
    glowColor: '220 89 60',
    glowColors: ['#3b82f6', '#6366f1', '#1d4ed8']
  },
  {
    name: 'GUCCI',
    category: 'High Fashion',
    description: 'Redefining luxury with an eccentric, contemporary, and romantic aesthetic.',
    link: '/category/casual',
    themeClass: 'from-emerald-500/10 to-teal-500/5 hover:border-emerald-500/30',
    tagColor: 'text-emerald-500 bg-emerald-500/10',
    glowColor: '160 84 39',
    glowColors: ['#10b981', '#14b8a6', '#047857']
  },
  {
    name: 'PRADA',
    category: 'Minimalist Luxury',
    description: 'Intellectual elegance and refined craftsmanship meeting innovative design.',
    link: '/category/formal',
    themeClass: 'from-purple-500/10 to-fuchsia-500/5 hover:border-purple-500/30',
    tagColor: 'text-purple-500 bg-purple-500/10',
    glowColor: '270 91 65',
    glowColors: ['#8b5cf6', '#d946ef', '#6d28d9']
  },
  {
    name: 'Calvin Klein',
    category: 'Essential Fashion',
    description: 'Iconic minimalism, clean lines, and effortlessly modern everyday style.',
    link: '/category/casual',
    themeClass: 'from-rose-500/10 to-pink-500/5 hover:border-rose-500/30',
    tagColor: 'text-rose-500 bg-rose-500/10',
    glowColor: '340 89 60',
    glowColors: ['#f43f5e', '#ec4899', '#be123c']
  }
];

export default function Brands() {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'antigravity';

  return (
    <div className="min-h-screen bg-white dark:bg-[#070A11] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Hero Header Section */}
      <section className="relative py-24 px-6 md:px-16 text-center overflow-hidden border-b border-gray-100 dark:border-gray-900/50 bg-gradient-to-b from-gray-50/50 to-white dark:from-[#0a0f1d] dark:to-[#070A11]">
        {/* Decorative backdrop elements */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/5 dark:bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none" />
        
        <ScrollReveal className="relative z-10 max-w-4xl mx-auto">
          <span className="text-xs font-bold tracking-[0.25em] text-purple-600 dark:text-neonCyan uppercase mb-3 inline-block">
            Curated Couture
          </span>
          <h1 className="font-syne text-5xl md:text-7xl font-black mb-6 tracking-tight uppercase dark:text-white">
            GLOBAL BRANDS
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-gray-600 dark:text-gray-400 font-light leading-relaxed">
            We partner with the world's most prestigious fashion houses to bring you authentic, premium-quality styles directly to your cosmic wardrobe.
          </p>
        </ScrollReveal>
      </section>

      {/* Brands Grid Section */}
      <section className="py-20 px-6 md:px-16 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BRANDS_DATA.map((brand) => (
              <BorderGlow
                key={brand.name}
                edgeSensitivity={30}
                glowColor={brand.glowColor}
                backgroundColor={isDark ? '#0A0D14' : '#ffffff'}
                borderRadius={32}
                glowRadius={40}
                glowIntensity={isDark ? 0.7 : 0.3}
                coneSpread={25}
                animated={true}
                colors={brand.glowColors}
                className="group flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border-none"
              >
                <div className={`w-full h-full p-8 flex flex-col justify-between bg-gradient-to-br ${brand.themeClass} rounded-[2rem]`}>
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-6 ${brand.tagColor}`}>
                      {brand.category}
                    </span>
                    <h2 className="font-syne text-3xl md:text-4xl font-extrabold tracking-tight mb-4 dark:text-white">
                      {brand.name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-light leading-relaxed mb-8">
                      {brand.description}
                    </p>
                  </div>

                  <Link
                    to={brand.link}
                    className={`w-full text-center py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-white text-black' : 'bg-black text-white'} hover:opacity-90 active:scale-95 transition-all duration-300`}
                  >
                    View Collection
                  </Link>
                </div>
              </BorderGlow>
            ))}
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
