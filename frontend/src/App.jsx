import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import Brands from './pages/Brands';
import Support from './pages/Support';
import InfoPage from './pages/InfoPage';

export default function App() {
  useEffect(() => {
    const loader = document.getElementById('page-loader');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('opacity-0', '-translate-y-full');
        setTimeout(() => loader.remove(), 700);
      }, 800); // 800ms sleek loading delay
    }
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Standalone Admin Console (No Storefront Header/Footer) */}
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Universal Storefront Layout */}
              <Route path="*" element={
                <div className="min-h-screen flex flex-col justify-between bg-white dark:bg-[#070A11]">
                  <Navbar />
                  <main className="flex-grow">
                    <Routes>
                      {/* Public Storefront Routes */}
                      <Route path="/" element={<Home />} />
                      <Route path="/category/:categoryId" element={<CategoryPage />} />
                      <Route path="/product/:slug" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/brands" element={<Brands />} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/about" element={<InfoPage />} />
                      <Route path="/features" element={<InfoPage />} />
                      <Route path="/works" element={<InfoPage />} />
                      <Route path="/career" element={<InfoPage />} />
                      <Route path="/delivery" element={<InfoPage />} />
                      <Route path="/delivery-details" element={<InfoPage />} />
                      <Route path="/terms" element={<InfoPage />} />
                      <Route path="/privacy" element={<InfoPage />} />
                      <Route path="/faq-account" element={<InfoPage />} />
                      <Route path="/faq-deliveries" element={<InfoPage />} />
                      <Route path="/faq-orders" element={<InfoPage />} />
                      <Route path="/faq-payments" element={<InfoPage />} />
                      
                      {/* Session Auth Screens */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />

                      {/* Protected Customer Routes */}
                      <Route 
                        path="/checkout" 
                        element={
                          <ProtectedRoute>
                            <Checkout />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/profile" 
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/wishlist" 
                        element={
                          <ProtectedRoute>
                            <Wishlist />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/orders" 
                        element={
                          <ProtectedRoute>
                            <Orders />
                          </ProtectedRoute>
                        } 
                      />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              } />
            </Routes>
          </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
