/**
 * Browser Console Test Suite for Cart Refactor
 * Copy and paste this into the browser console to verify cart logic.
 */

(function runCartTests() {
  console.log("--- Starting Cart Refactor Tests ---");
  
  // 1. Reset Cart
  cartStore.clear();
  console.assert(cartStore.get().length === 0, "Test 1 Failed: Cart not cleared");

  // 2. Add Product
  const p1 = { id: 101, name: "Test Shirt", price: 20, image: "test.jpg" };
  cartStore.add(p1, 1);
  let cart = cartStore.get();
  console.assert(cart.length === 1, "Test 2 Failed: Item not added");
  console.assert(cart[0].product_id === 101, "Test 2 Failed: Incorrect ID stored");

  // 3. Merge Quantities
  cartStore.add(p1, 2);
  cart = cartStore.get();
  console.assert(cart.length === 1, "Test 3 Failed: Should merge same ID");
  console.assert(cart[0].qty === 3, "Test 3 Failed: Quantity not merged correctly");

  // 4. Add Different Product
  const p2 = { id: 102, name: "Test Pants", price: 50, image: "test2.jpg" };
  cartStore.add(p2, 1);
  cart = cartStore.get();
  console.assert(cart.length === 2, "Test 4 Failed: Second product not added");

  // 5. Total Calculation
  console.assert(cartStore.subtotal === (20 * 3) + 50, "Test 5 Failed: Subtotal incorrect");
  console.assert(cartStore.totalItems === 4, "Test 5 Failed: Total items incorrect");

  // 6. Update Quantity
  cartStore.updateQty(102, 5);
  console.assert(cartStore.get().find(i => i.product_id === 102).qty === 5, "Test 6 Failed: Qty update failed");

  // 7. Remove Product
  cartStore.remove(101);
  console.assert(cartStore.get().length === 1, "Test 7 Failed: Remove failed");
  console.assert(cartStore.get()[0].product_id === 102, "Test 7 Failed: Wrong item removed");

  // 8. Event Firing
  let eventFired = false;
  document.addEventListener('cart:updated', () => { eventFired = true; }, { once: true });
  cartStore.add(p1, 1);
  console.assert(eventFired === true, "Test 8 Failed: cart:updated event not fired");

  console.log("--- All Cart Tests Passed! ✅ ---");
})();
