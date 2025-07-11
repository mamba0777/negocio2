import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product.model';

export interface FilterOptions {
  categories?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  sortBy?: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'rating' | 'newest' | 'popular';
  searchTerm?: string;
  inStock?: boolean;
  onSale?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private filterOptions = signal<FilterOptions>({
    sortBy: 'name-asc', // Ordenamiento por defecto
  });

  // Exponer las opciones de filtro como señal de solo lectura
  currentFilters = this.filterOptions.asReadonly();

  // Aplicar filtros a una lista de productos
  applyFilters(products: Product[]): Product[] {
    return products
      .filter(product => this.filterBySearchTerm(product))
      .filter(product => this.filterByPrice(product))
      .filter(product => this.filterByCategory(product))
      .filter(product => this.filterInStock(product))
      .filter(product => this.filterOnSale(product))
      .sort((a, b) => this.sortProducts(a, b));
  }

  // Actualizar las opciones de filtrado
  updateFilters(updates: Partial<FilterOptions>): void {
    this.filterOptions.update(current => ({
      ...current,
      ...updates
    }));
  }

  // Reiniciar todos los filtros
  resetFilters(): void {
    this.filterOptions.set({
      sortBy: 'name-asc',
    });
  }

  // Métodos de filtrado individuales
  private filterBySearchTerm(product: Product): boolean {
    const searchTerm = this.filterOptions().searchTerm?.toLowerCase();
    if (!searchTerm) return true;
    
    return (
      product.title.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category?.name.toLowerCase().includes(searchTerm) ||
      false
    );
  }

  private filterByPrice(product: Product): boolean {
    const { minPrice, maxPrice } = this.filterOptions();
    let matches = true;
    
    if (minPrice !== undefined && minPrice !== null) {
      matches = matches && product.price >= minPrice;
    }
    
    if (maxPrice !== undefined && maxPrice !== null) {
      matches = matches && product.price <= maxPrice;
    }
    
    return matches;
  }

  private filterByCategory(product: Product): boolean {
    const categories = this.filterOptions().categories;
    if (!categories || categories.length === 0) return true;
    
    return categories.includes(product.category?.name || '');
  }

  private filterInStock(product: Product): boolean {
    if (this.filterOptions().inStock === undefined) return true;
    return this.filterOptions().inStock ? (product.stock ?? 0) > 0 : true;
  }

  private filterOnSale(product: Product): boolean {
    if (this.filterOptions().onSale === undefined) return true;
    return this.filterOptions().onSale ? (product.discountPercentage ?? 0) > 0 : true;
  }

  // Método de ordenamiento
  private sortProducts(a: Product, b: Product): number {
    const sortBy = this.filterOptions().sortBy || 'name-asc';
    
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'name-asc':
        return a.title.localeCompare(b.title);
      case 'name-desc':
        return b.title.localeCompare(a.title);
      case 'rating':
        return (b.rating ?? 0) - (a.rating ?? 0);
      case 'newest':
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      case 'popular':
        return (b.popularity ?? 0) - (a.popularity ?? 0);
      default:
        return 0;
    }
  }

  // Métodos de ayuda para componentes de UI
  getAvailableCategories(products: Product[]): string[] {
    const categories = new Set<string>();
    products.forEach(product => {
      if (product.category?.name) {
        categories.add(product.category.name);
      }
    });
    return Array.from(categories).sort();
  }

  getPriceRange(products: Product[]): { min: number; max: number } {
    if (!products.length) return { min: 0, max: 0 };
    
    return products.reduce(
      (acc, product) => ({
        min: Math.min(acc.min, product.price),
        max: Math.max(acc.max, product.price)
      }),
      { min: Infinity, max: -Infinity }
    );
  }
}
