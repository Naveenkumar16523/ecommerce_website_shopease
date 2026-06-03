import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User } from 'lucide-react';

export default function ChatBot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hi there! I'm the ShopEase AI Assistant. How can I help you today?" }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');

    // Simulate AI thinking delay
    setTimeout(() => {
      const botResponse = generateResponse(userMsg);
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 600);
  };

  const generateResponse = (input) => {
    const text = input.toLowerCase();
    
    if (text.includes('shipping') || text.includes('delivery')) {
      return "We offer standard (3-5 days) and express (1-2 days) shipping. You get free shipping on orders over ₹50!";
    }
    if (text.includes('return') || text.includes('refund')) {
      return "You can return items within 30 days of receipt. Refunds are usually processed within 5-7 business days.";
    }
    if (text.includes('order') || text.includes('tracking') || text.includes('track')) {
      return "You can track your order status by logging into your account and visiting the Orders page.";
    }
    if (text.includes('hello') || text.includes('hi ') || text.includes('hey')) {
      return "Hello! How can I assist you with your shopping today?";
    }
    if (text.includes('contact') || text.includes('support') || text.includes('human')) {
      return "If you'd like to speak with a human agent, please fill out the contact form on this page or call us at +1 (800) 555-0123.";
    }
    
    return "I'm an AI assistant in training! While I don't know the answer to that yet, our human support team will review your message soon if you use the contact form.";
  };

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white dark:bg-[#0A0D14] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden font-sans animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="bg-purple-600 dark:bg-[#0E1321] text-white p-4 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-neonCyan" />
          <h3 className="font-bold tracking-wider text-sm uppercase">ShopEase AI</h3>
        </div>
        <button 
          onClick={onClose}
          className="text-white hover:text-red-400 transition-colors"
          title="Close Chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto min-h-75 max-h-100 bg-gray-50 dark:bg-transparent space-y-4">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-purple-600' : 'bg-gray-200 dark:bg-[#1A2235]'}`}>
              {msg.sender === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-gray-700 dark:text-neonCyan" />}
            </div>
            <div 
              className={`p-3 rounded-2xl max-w-[75%] text-sm ${
                msg.sender === 'user' 
                  ? 'bg-purple-600 text-white rounded-tr-sm' 
                  : 'bg-white dark:bg-[#1A2235] border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mt-4 animate-[fadeIn_0.5s_ease-out_0.3s_both]">
            {["Shipping options", "Return policy", "Track my order"].map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const userMsg = suggestion;
                  setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
                  setTimeout(() => {
                    const botResponse = generateResponse(userMsg);
                    setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
                  }, 600);
                }}
                className="text-xs px-3 py-1.5 rounded-full border border-purple-200 dark:border-white/10 bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-white/10 transition-colors text-left"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-[#0E1321] border-t border-gray-200 dark:border-white/10">
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-gray-100 dark:bg-[#1A2235] text-gray-900 dark:text-gray-100 rounded-xl pl-4 pr-10 py-2.5 outline-none focus:ring-1 focus:ring-purple-500 dark:focus:ring-neonCyan text-sm transition-all"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-1 top-1 bottom-1 w-8 flex items-center justify-center text-purple-600 dark:text-neonCyan hover:text-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
