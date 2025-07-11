import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product.model';

export interface CartItem extends Product {
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = signal<CartItem[]>([]);
  
  // Señales computadas
  totalItems = computed(() => this.cartItems().reduce((acc, item) => acc + item.quantity, 0));
  
  totalPrice = computed(() => 
    this.cartItems().reduce((acc, item) => acc + (item.price * item.quantity), 0)
  );

  constructor() {
    this.loadCartFromStorage();
  }

  private saveToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(this.cartItems()));
  }

  private loadCartFromStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      this.cartItems.set(JSON.parse(savedCart));
    }
  }

  addToCart(product: Product, quantity: number = 1) {
    const currentItems = this.cartItems();
    const existingItemIndex = currentItems.findIndex(item => item.id === product.id);
    
    if (existingItemIndex > -1) {
      // Si el producto ya está en el carrito, actualizamos la cantidad
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity
      };
      this.cartItems.set(updatedItems);
    } else {
      // Si es un producto nuevo, lo agregamos al carrito
      this.cartItems.update(items => [...items, { ...product, quantity }]);
    }
    
    this.saveToLocalStorage();
  }

  removeFromCart(productId: number) {
    this.cartItems.update(items => items.filter(item => item.id !== productId));
    this.saveToLocalStorage();
  }

  updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    
    this.cartItems.update(items => 
      items.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    );
    this.saveToLocalStorage();
  }

  clearCart() {
    this.cartItems.set([]);
    localStorage.removeItem('cart');
  }

  getCartItems() {
    return this.cartItems.asReadonly();
  }

  getItemQuantity(productId: number): number {
    const item = this.cartItems().find(item => item.id === productId);
    return item ? item.quantity : 0;
  }
}
