import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Mail, Lock, Key, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function AdminLogin() {
  const { user, login, checkAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Redirect if already admin
  useEffect(() => {
    if (user && user.is_admin === 1) {
      navigate('/admin');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        // Double-check session to verify admin permissions
        const meRes = await fetch('/api/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.is_admin === 1) {
            navigate('/admin');
          } else {
            // Log out unauthorized user
            await fetch('/api/logout', { method: 'POST' });
            setErrorMsg('Access Denied: Administrative privileges required.');
          }
        } else {
          setErrorMsg('Verification failed. Unable to retrieve admin session.');
        }
      } else {
        setErrorMsg(res.message || 'Authentication rejected by security token.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error. Unable to connect to authorization server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-gray-100 flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background ambient grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40" 
        style={{
          backgroundSize: '40px 40px',
          backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`
        }}
      />
      {/* Cyan orb glow */}
      <div 
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px] pointer-events-none rounded-full"
        style={{
          filter: 'blur(150px)',
          background: 'radial-gradient(circle, rgba(0, 240, 255, 0.12) 0%, transparent 70%)'
        }}
      />
      {/* Violet orb glow */}
      <div 
        className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] pointer-events-none rounded-full"
        style={{
          filter: 'blur(150px)',
          background: 'radial-gradient(circle, rgba(160, 32, 240, 0.12) 0%, transparent 70%)'
        }}
      />

      <div className="w-full max-w-md mx-4 z-10">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-neonCyan p-[1px] flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <div className="w-full h-full bg-[#0D1321] rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-neonCyan" />
            </div>
          </div>
          <h1 className="font-syne font-bold text-lg tracking-widest text-white leading-none uppercase">SHOPEASE</h1>
          <span className="text-[9px] font-mono text-neonCyan uppercase tracking-[0.25em] mt-1.5 [text-shadow:0_0_12px_rgba(0,240,255,0.5)]">
            Secure Admin Gateway
          </span>
        </div>

        {/* Glass Console Box */}
        <div className="bg-[#0D1321]/70 backdrop-blur-xl border border-white/6 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Top cyber line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent" />

          <div className="mb-6 text-left">
            <h2 className="font-syne font-bold text-white text-base uppercase tracking-wider">Console Authentication</h2>
            <p className="text-[10px] text-gray-400 mt-1">Please enter administrative credentials to establish console session.</p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 bg-red-950/20 border border-red-500/30 text-red-400 p-3 rounded-lg flex items-center gap-3 text-xs text-left">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs text-left">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-gray-400 uppercase tracking-widest text-[9px] font-mono">Admin Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  placeholder="admin@shopease.com" 
                  className="w-full bg-[#080C14]/60 border border-white/8 focus:border-neonCyan focus:shadow-[0_0_15px_rgba(0,240,255,0.15)] focus:bg-[#080C14]/85 rounded-lg pl-11 pr-4 py-3.5 text-white placeholder-gray-600 outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-gray-400 uppercase tracking-widest text-[9px] font-mono">Security Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  placeholder="••••••••••••" 
                  className="w-full bg-[#080C14]/60 border border-white/8 focus:border-neonCyan focus:shadow-[0_0_15px_rgba(0,240,255,0.15)] focus:bg-[#080C14]/85 rounded-lg pl-11 pr-4 py-3.5 text-white placeholder-gray-600 outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-gradient-to-r from-neonCyan to-purple-600 text-white font-semibold text-xs py-3.5 rounded-lg hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating Node...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Establish Terminal Connection</span>
                </>
              )}
            </button>
          </form>

          {/* Return to Front */}
          <div className="mt-6 text-center border-t border-white/5 pt-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-neonCyan transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Front Storefront</span>
            </Link>
          </div>
        </div>

        {/* Telemetry Footer */}
        <div className="mt-6 text-center text-[9px] font-mono text-gray-600 tracking-wider">
          SYS PORTAL v1.2.0 // TLS SECURED // SHOP EASE CONTROL CENTRE
        </div>
      </div>
    </div>
  );
}
