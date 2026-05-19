import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, UserPlus } from 'lucide-react';

export default function Signup() {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please complete all registration parameters.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await signup(name, email, password);
    setSubmitting(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.message || "Failed to create account. Email may already be registered.");
    }
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center px-6 py-12 bg-gradient-to-tr from-[#05070C] via-[#0A0E17] to-indigo-950/20">
      <div className="w-full max-w-md bg-white dark:bg-[#0A0D14] border border-gray-150 dark:border-gray-800/80 p-8 rounded-[2.5rem] shadow-2xl space-y-6 text-left relative overflow-hidden">
        
        {/* Glow Element */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 dark:bg-neonCyan/10 blur-3xl pointer-events-none rounded-full" />
        
        <div className="text-center space-y-2 relative z-10">
          <div className="w-12 h-12 bg-purple-50 dark:bg-neonCyan/10 text-purple-600 dark:text-neonCyan rounded-full flex items-center justify-center mx-auto mb-2">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black font-syne dark:text-white uppercase">Register Account</h2>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Join our cosmic fashion universe</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-2xl border border-red-100 dark:border-red-900/50">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                <User className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/10"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input 
                type="email" 
                placeholder="e.g. fashionista@shopease.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/10"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/10"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-extrabold rounded-full hover:bg-purple-600 dark:hover:bg-neonCyan dark:hover:text-black transition-all duration-300 flex items-center justify-center gap-2 text-xs tracking-wider uppercase disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" /> {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-800/80 relative z-10">
          Already have an account? <Link to="/login" className="text-purple-600 dark:text-neonCyan hover:underline">Sign In</Link>
        </div>

      </div>
    </div>
  );
}
