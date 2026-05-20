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
    <div className="min-h-screen bg-admin-50 text-slate-800 flex items-center justify-center relative overflow-hidden font-sans">
      <div className="w-full max-w-md mx-4 z-10">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-admin-600 p-[1px] flex items-center justify-center mb-3 shadow-lg shadow-admin-500/30">
            <div className="w-full h-full bg-admin-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="font-syne font-bold text-xl tracking-wide text-slate-900 leading-none">ShopEase Admin</h1>
          <span className="text-[10px] font-medium text-admin-600 uppercase tracking-widest mt-1.5">
            Management Portal
          </span>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-admin-200 relative overflow-hidden">
          <div className="mb-6 text-center">
            <h2 className="font-bold text-slate-900 text-lg">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">Please enter your details to sign in.</p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg flex items-center gap-3 text-sm text-left">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-sm text-left">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-slate-700 font-medium text-xs">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  placeholder="admin@shopease.com" 
                  className="w-full bg-white border border-slate-300 focus:border-admin-500 focus:ring-4 focus:ring-admin-100 rounded-lg pl-11 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-slate-700 font-medium text-xs">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  placeholder="••••••••••••" 
                  className="w-full bg-white border border-slate-300 focus:border-admin-500 focus:ring-4 focus:ring-admin-100 rounded-lg pl-11 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-admin-600 hover:bg-admin-700 text-white font-medium text-sm py-3 rounded-lg shadow-md shadow-admin-500/20 transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Return to Front */}
          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-admin-600 transition-colors text-sm">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} ShopEase Administration
        </div>
      </div>
    </div>
  );
}
