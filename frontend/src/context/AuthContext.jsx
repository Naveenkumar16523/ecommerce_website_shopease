import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlistIds, setWishlistIds] = useState([]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser({
            id: data.id || data.user_id,
            name: data.name,
            email: data.email,
            address: data.address,
            phone: data.phone,
            is_admin: data.is_admin,
          });
          setWishlistIds(data.wishlist_ids || []);
        } else {
          setUser(null);
          setWishlistIds([]);
        }
      } else {
        setUser(null);
        setWishlistIds([]);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setUser(null);
      setWishlistIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          is_admin: data.user.is_admin,
        });
        await checkAuth(); // Load wishlist IDs and other profile specs
        return { success: true };
      } else {
        setError(data.message || "Invalid credentials");
        return { success: false, message: data.message || "Invalid credentials" };
      }
    } catch (err) {
      setError("Network error. Please try again.");
      return { success: false, message: "Network error" };
    }
  };

  const signup = async (name, email, password) => {
    setError(null);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        // Automatically log in the user after successful registration
        return await login(email, password);
      } else {
        setError(data.message || "Signup failed");
        return { success: false, message: data.message || "Signup failed" };
      }
    } catch (err) {
      setError("Network error. Please try again.");
      return { success: false, message: "Network error" };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error("Logout failed on server:", err);
    } finally {
      setUser(null);
      localStorage.removeItem('cart');
    }
  };

  const toggleWishlist = async (productId) => {
    if (!user) return false;
    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId })
      });
      if (res.ok) {
        setWishlistIds(prev => 
          prev.includes(productId) 
            ? prev.filter(id => id !== productId) 
            : [...prev, productId]
        );
        return true;
      }
    } catch (err) {
      console.error("Failed to toggle wishlist:", err);
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, checkAuth, wishlistIds, toggleWishlist }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
