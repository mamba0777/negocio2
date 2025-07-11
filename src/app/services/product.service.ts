import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, tap, of, throwError, finalize } from 'rxjs';
import { Product } from '../models/product.model';

type ProductState = {
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
};


@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly API_URL = 'https://api.escuelajs.co/api/v1';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  
  
  // Estado inicial
  private state = signal<ProductState>({
    products: [],
    loading: false,
    error: null,
    pagination: {
      total: 0,
      limit: 10,
      offset: 0
    }
  });

  //Cache para busquedas
  private searchCache = signal<Record<string, {
    data: Product[];
    timestamp: number;
    total: number;
  }>>({});

  // Selectores
  products = computed(() => this.state().products);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);
  pagination = computed(() => this.state().pagination);

  // Actualizar la paginación
  updatePagination(updates: Partial<{ total: number; limit: number; offset: number }>) {
    this.state.update(state => ({
      ...state,
      pagination: {
        ...state.pagination,
        ...updates
      }
    }));
  }
  
  constructor(private http: HttpClient) {
  //limpiar cache
  setInterval(() => this.cleanupCache(), this.CACHE_DURATION);
}

  // Cargar todos los productos
  loadProducts(offset: number = 0, limit: number = 10): void {
    this.updateState({ 
      loading: true, 
      error: null,
      pagination: {
        ...this.state().pagination,
        offset,
        limit
      }
    });
    
    const cacheKey = `products_${offset}_${limit}`;
    const cachedData = this.getFromCache(cacheKey);
    
    if (cachedData) {
      this.updateState({
        products: cachedData.data,
        loading: false,
        pagination: {
          ...this.state().pagination,
          total: cachedData.total
        }
      });
      return;
    }
    
    const params = new HttpParams()
      .set('offset', offset.toString())
      .set('limit', limit.toString());
    
    this.http.get<Product[]>(`${this.API_URL}/products`, { params, observe: 'response' })
      .pipe(
        tap(response => {
          const products = response.body || [];
          const total = parseInt(response.headers.get('x-total-count') || '0', 10);
          
          this.addToCache(cacheKey, products, total);
          
          this.updateState({
            products,
            loading: false,
            pagination: {
              ...this.state().pagination,
              total
            }
          });
        }),
        catchError(error => this.handleError('Error al cargar los productos', error)),
        finalize(() => this.updateState({ loading: false }))
      )
      .subscribe();
  }

  // Buscar productos en el servidor
  searchProducts(query: string, offset: number = 0, limit: number = 10): void {
    if (!query.trim()) {
      this.loadProducts(offset, limit);
      return;
    }
    
    this.updateState({ 
      loading: true, 
      error: null,
      pagination: {
        ...this.state().pagination,
        offset,
        limit
      }
    });
    
    const cacheKey = `search_${query}_${offset}_${limit}`;
    const cachedData = this.getFromCache(cacheKey);
    
    if (cachedData) {
      this.updateState({
        products: cachedData.data,
        loading: false,
        pagination: {
          ...this.state().pagination,
          total: cachedData.total
        }
      });
      return;
    }
    
    const params = new HttpParams()
      .set('title', query)
      .set('offset', offset.toString())
      .set('limit', limit.toString());
    
    this.http.get<Product[]>(`${this.API_URL}/products/`, { params, observe: 'response' })
      .pipe(
        tap(response => {
          const products = response.body || [];
          const total = parseInt(response.headers.get('x-total-count') || products.length.toString(), 10);
          
          this.addToCache(cacheKey, products, total);
          
          this.updateState({
            products,
            loading: false,
            pagination: {
              ...this.state().pagination,
              total
            }
          });
        }),
        catchError(error => this.handleError('Error al buscar productos', error)),
        finalize(() => this.updateState({ loading: false }))
      )
      .subscribe();
  }


  // Obtener un producto por ID
  getProductById(id: number): Observable<Product> {
    this.updateState({ loading: true, error: null });
    
    return this.http.get<Product>(`${this.API_URL}/products/${id}`).pipe(
      tap(() => {
        this.updateState({ loading: false });
      }),
      catchError(error => {
        this.updateState({
          loading: false,
          error: 'Error al cargar el producto.'
        });
        throw error;
      })
    );
  }

  // Métodos de ayuda para el caché
  private getFromCache(key: string): { data: Product[], total: number } | null {
    const cached = this.searchCache()[key];
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    return isExpired ? null : { data: cached.data, total: cached.total };
  }

  private addToCache(key: string, data: Product[], total: number): void {
    this.searchCache.update(cache => ({
      ...cache,
      [key]: { 
        data, 
        total,
        timestamp: Date.now() 
      }
    }));
  }

  private cleanupCache(): void {
    const now = Date.now();
    this.searchCache.update(cache => {
      const newCache = { ...cache };
      Object.keys(newCache).forEach(key => {
        if (now - newCache[key].timestamp > this.CACHE_DURATION) {
          delete newCache[key];
        }
      });
      return newCache;
    });
  }

  private handleError(message: string, error: any) {
    console.error(message, error);
    this.updateState({
      error: message,
      loading: false
    });
    return throwError(() => error);
  }

  // Actualizar el estado de manera inmutable
  private updateState(partialState: Partial<ProductState>): void {
    this.state.update(current => ({
      ...current,
      ...partialState
    }));
  }
}
