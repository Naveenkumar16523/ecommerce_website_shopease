import React, { useState } from 'react';
import ChatBot from '../components/ChatBot';

export default function Support() {
  const [formData, setFormData] = useState({ name: '', email: '', orderNumber: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', orderNumber: '', message: '' });
      } else {
        alert("Failed to send message. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#070A11] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header Section */}
      <section className="relative py-24 px-6 md:px-16 text-center overflow-hidden border-b border-gray-100 dark:border-gray-900/50 bg-gradient-to-b from-gray-50/50 to-white dark:from-[#0a0f1d] dark:to-[#070A11]">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/5 dark:bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="text-xs font-bold tracking-[0.25em] text-purple-600 dark:text-neonCyan uppercase mb-3 inline-block">
            Get in touch
          </span>
          <h1 className="font-syne text-5xl md:text-7xl font-black mb-6 tracking-tight uppercase dark:text-white">
            WE'RE HERE TO HELP
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-gray-600 dark:text-gray-400 font-light leading-relaxed">
            Have a question? Our support team is available 24/7 to assist you with your orders and styling needs.
          </p>
        </div>
      </section>

      {/* Cards & Form */}
      <main className="py-20 px-6 md:px-16 max-w-7xl mx-auto">
        {/* Contact info grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <div className="border border-gray-100 dark:border-gray-900 bg-gray-50/30 dark:bg-gray-950/40 rounded-[2rem] p-8 text-center hover:border-purple-500/20 transition-all duration-300">
            <div className="text-4xl mb-6">✉️</div>
            <h3 className="text-xl font-bold mb-2">Email Us</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm font-light">Response within 24 hours</p>
            <a href="mailto:support@shopease.com" className="text-purple-600 dark:text-neonCyan font-bold hover:underline">
              support@shopease.com
            </a>
          </div>

          <div className="border border-gray-100 dark:border-gray-900 bg-gray-50/30 dark:bg-gray-950/40 rounded-[2rem] p-8 text-center hover:border-purple-500/20 transition-all duration-300">
            <div className="text-4xl mb-6">📞</div>
            <h3 className="text-xl font-bold mb-2">Call Us</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm font-light">Mon-Fri, 9am - 6pm EST</p>
            <a href="tel:+18005550123" className="text-purple-600 dark:text-neonCyan font-bold hover:underline">
              +1 (800) 555-0123
            </a>
          </div>

          <div className="border border-gray-100 dark:border-gray-900 bg-gray-50/30 dark:bg-gray-950/40 rounded-[2rem] p-8 text-center hover:border-purple-500/20 transition-all duration-300">
            <div className="text-4xl mb-6">💬</div>
            <h3 className="text-xl font-bold mb-2">Live Chat</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm font-light">Instant support on our site</p>
            <button 
              onClick={() => setIsChatOpen(true)}
              className="text-purple-600 dark:text-neonCyan font-bold hover:underline"
            >
              Start Chat
            </button>
          </div>
        </div>

        {/* Message Form */}
        <div className="max-w-3xl mx-auto border border-gray-100 dark:border-gray-900/60 bg-gray-50/20 dark:bg-gray-950/20 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-purple-500/[0.01]">
          <h2 className="text-3xl font-black mb-10 text-center uppercase tracking-wider font-syne dark:text-white">
            Send Us a Message
          </h2>
          
          {submitted ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold mb-2 text-green-500">Thank you!</h3>
              <p className="text-gray-600 dark:text-gray-400 font-light">We have received your message and will get back to you shortly.</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="mt-6 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-[#0c101d] border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-purple-500 dark:focus:border-neonCyan transition-all duration-300"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-[#0c101d] border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-purple-500 dark:focus:border-neonCyan transition-all duration-300"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Order Number (Optional)</label>
                <input 
                  type="text" 
                  value={formData.orderNumber}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#0c101d] border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-purple-500 dark:focus:border-neonCyan transition-all duration-300"
                  placeholder="#SE-12345"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">How can we help?</label>
                <textarea 
                  required 
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#0c101d] border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-purple-500 dark:focus:border-neonCyan transition-all duration-300 resize-none"
                  placeholder="Tell us about your issue..."
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-4 rounded-2xl text-sm font-bold uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all duration-300"
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </main>
      
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
