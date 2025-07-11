import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private favorites = signal<Record<number, Product>>({});
  
  // Usamos computed para obtener un array de productos favoritos
  favoritesList = computed(() => Object.values(this.favorites()));
  
  // Contador de favoritos
  favoritesCount = computed(() => Object.keys(this.favorites()).length);
  
  // Almacenamiento local
  private readonly STORAGE_KEY = 'user_favorites';

  constructor(private authService: AuthService) {
    this.loadFavorites();
  }

  private getStorageKey(): string {
    const userId = this.authService.user()?.id || 'anonymous';
    return `${this.STORAGE_KEY}_${userId}`;
  }

  private loadFavorites() {
    const savedFavorites = localStorage.getItem(this.getStorageKey());
    if (savedFavorites) {
      try {
        const parsedFavorites = JSON.parse(savedFavorites);
        this.favorites.set(parsedFavorites);
      } catch (error) {
        console.error('Error al cargar favoritos:', error);
        this.clearFavorites();
      }
    }
  }

  private saveFavorites() {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.favorites()));
    } catch (error) {
      console.error('Error al guardar favoritos:', error);
    }
  }

  addToFavorites(product: Product): void {
    this.favorites.update(favs => ({
      ...favs,
      [product.id]: product
    }));
    this.saveFavorites();
  }

  removeFromFavorites(productId: number): void {
    this.favorites.update(favs => {
      const newFavs = { ...favs };
      delete newFavs[productId];
      return newFavs;
    });
    this.saveFavorites();
  }

  toggleFavorite(product: Product): void {
    if (this.isFavorite(product.id)) {
      this.removeFromFavorites(product.id);
    } else {
      this.addToFavorites(product);
    }
  }

  isFavorite(productId: number): boolean {
    return this.favorites().hasOwnProperty(productId);
  }

  clearFavorites(): void {
    this.favorites.set({});
    localStorage.removeItem(this.getStorageKey());
  }

  // Método para sincronizar favoritos con el servidor (ejemplo)
  syncWithServer(): void {
    // Aquí iría la lógica para sincronizar con el backend
    const favorites = this.favorites();
    console.log('Sincronizando favoritos con el servidor:', favorites);
    
    // Ejemplo de cómo podría ser la llamada HTTP:
    // this.http.post('/api/user/favorites/sync', { favorites }).subscribe({
    //   next: (response) => {
    //     console.log('Favoritos sincronizados correctamente', response);
    //   },
    //   error: (error) => {
    //     console.error('Error al sincronizar favoritos:', error);
    //   }
    // });
  }
  
  // Método para cargar favoritos desde el servidor (ejemplo)
  loadFromServer(): void {
    // Aquí iría la lógica para cargar desde el backend
    // this.http.get('/api/user/favorites').subscribe({
    //   next: (serverFavorites: Product[]) => {
    //     const favoritesMap = serverFavorites.reduce((acc, product) => {
    //       acc[product.id] = product;
    //       return acc;
    //     }, {} as Record<number, Product>);
    //     this.favorites.set(favoritesMap);
    //     this.saveFavorites();
    //   },
    //   error: (error) => {
    //     console.error('Error al cargar favoritos del servidor:', error);
    //   }
    // });
  }
}
