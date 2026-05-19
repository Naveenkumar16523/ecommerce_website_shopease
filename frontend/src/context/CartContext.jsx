import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const productId = parseInt(product.id || product.product_id);
      const existing = prev.find(item => item.product_id === productId);
      if (existing) {
        return prev.map(item =>
          item.product_id === productId
            ? { ...item, qty: item.qty + qty }
            : item
        );
      } else {
        return [...prev, {
          product_id: productId,
          name: product.name,
          price: parseFloat(product.price),
          image: product.image,
          qty: qty
        }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== parseInt(productId)));
  };

  const updateQty = (productId, qty) => {
    setCart(prev =>
      prev.map(item =>
        item.product_id === parseInt(productId)
          ? { ...item, qty: Math.max(1, parseInt(qty)) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
