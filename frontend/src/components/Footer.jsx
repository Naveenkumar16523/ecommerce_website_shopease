import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-950 dark:bg-black text-white px-6 md:px-16 pt-20 pb-8 mt-16 rounded-t-[3rem] border-t border-gray-800/40">
      <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
        <div className="col-span-2 md:col-span-1">
          <div className="font-syne text-4xl mb-4 tracking-tight font-black">SHOP EASE</div>
          <p className="text-sm text-gray-400 leading-relaxed mb-6 font-light">
            Elevate your style with our premium collection of modern fashion. Premium quality, cosmic aesthetics.
          </p>
        </div>

        <div>
          <div className="font-bold text-sm mb-6 tracking-widest text-gray-300 uppercase">Company</div>
          <ul className="space-y-3 text-sm font-light text-gray-400">
            <li><Link to="/about" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">About Us</Link></li>
            <li><Link to="/features" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">Features</Link></li>
            <li><Link to="/works" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">Works</Link></li>
            <li><Link to="/career" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">Career</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-bold text-sm mb-6 tracking-widest text-gray-300 uppercase">Help</div>
          <ul className="space-y-3 text-sm font-light text-gray-400">
            <li><Link to="/support" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">Customer Support</Link></li>
            <li><Link to="/delivery" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">Delivery Details</Link></li>
            <li><Link to="/terms" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">Terms & Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">Privacy Policy</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-bold text-sm mb-6 tracking-widest text-gray-300 uppercase">FAQ</div>
          <ul className="space-y-3 text-sm font-light text-gray-400">
            <li><Link to="/faq-account" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">Account</Link></li>
            <li><Link to="/faq-deliveries" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">Manage Deliveries</Link></li>
            <li><Link to="/faq-orders" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">Orders</Link></li>
            <li><Link to="/faq-payments" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">Payments</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto border-t border-gray-900 mb-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-xs font-light text-gray-500">SHOP EASE © 2025–2026, All Rights Reserved</p>
        <div className="flex items-center gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded px-3 py-1 text-[10px] font-bold text-white tracking-wide">VISA</div>
          <div className="bg-gray-900 border border-gray-800 rounded px-3 py-1 text-[10px] font-bold text-white tracking-wide">PayPal</div>
          <div className="bg-gray-900 border border-gray-800 rounded px-3 py-1 text-[10px] font-bold text-white tracking-wide">UPI</div>
        </div>
      </div>
    </footer>
  );
}
