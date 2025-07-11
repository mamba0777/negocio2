import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-damas',
  imports: [
    CommonModule, 
    NzCardModule, 
    NzGridModule, 
    NzModalModule, 
    NzButtonModule, 
    NzFormModule, 
    NzInputModule,
    NzIconModule,
    NzSpinModule,
    NzAlertModule,
    NzEmptyModule,
    NzToolTipModule,
    NzPaginationModule,
    DecimalPipe,
    FormsModule
  ],
  templateUrl: './damas.component.html',
  styleUrls: ['./damas.component.scss'],
  standalone: true
})
export class DamasComponent implements OnInit {
  private productService = inject(ProductService);
  private modal = inject(NzModalService);
  private notification = inject(NzNotificationService);
  private router = inject(Router);
  
  // Señales reactivas
  products = this.productService.products;
  loading = this.productService.loading;
  error = this.productService.error;
  pagination = this.productService.pagination;

  // Estado local
  searchText = '';
  searchTimeout: any = null;
  debounceTime = 300; // 300ms de retraso para la búsqueda
  
  // Carrito
  carrito = signal<Product[]>([]);

  // Página actual
  currentPage = computed(() => {
    return (this.pagination()?.offset / this.pagination()?.limit) + 1 || 1;
  });

  // Computed para el mensaje de resultados
  searchResultsMessage = computed(() => {
    if (this.loading()) return 'Buscando productos...';
    if (this.error()) return this.error();
    if (this.products().length === 0) return 'No se encontraron productos';
    return `Mostrando ${this.products().length} de ${this.pagination().total} productos`;
  });
  
  constructor() {}
  
  ngOnInit() {
    this.loadProducts();
  }

  // Cargar productos con paginación
  loadProducts(pageIndex: number = 1): void {
    const offset = (pageIndex - 1) * this.pagination().limit;
    if (this.searchText.trim()) {
      this.productService.searchProducts(this.searchText, offset, this.pagination().limit);
    } else {
      this.productService.loadProducts(offset, this.pagination().limit);
    }
  }

  // Manejar búsqueda con debounce
  onSearch(): void {
    // Cancelar el timeout anterior si existe
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Establecer un nuevo timeout
    this.searchTimeout = setTimeout(() => {
      this.loadProducts(1); // Volver a la primera página
    }, this.debounceTime);
  }
  
  // Cambiar tamaño de página
  onPageSizeChange(pageSize: number): void {
    // Actualizar el límite y volver a cargar la primera página
    this.productService.updatePagination({ limit: pageSize, offset: 0 });
    this.loadProducts(1);
  }

  // Manejar cambio de página
  onPageChange(page: number): void {
    const offset = (page - 1) * this.pagination().limit;
    this.productService.updatePagination({ offset });
    this.loadProducts(page);
  }
  
  // Agregar al carrito
  addToCart(product: Product) {
    this.carrito.update(items => [...items, product]);
    this.modal.success({
      nzTitle: '¡Producto agregado!',
      nzContent: `${product.title} ha sido agregado al carrito.`,
      nzOkText: 'Aceptar'
    });
  }
  
  // Ver detalles del producto
  verDetalles(product: Product) {
    this.modal.info({
      nzTitle: product.title,
      nzContent: `
        <p><strong>Descripción:</strong> ${product.description}</p>
        <p><strong>Precio:</strong> $${product.price}</p>
        <img src="${product.images[0]}" alt="${product.title}" style="max-width: 100%;">
      `,
      nzOkText: 'Cerrar'
    });
  }
  
  // Ir al carrito
  irAlCarrito() {
    this.router.navigate(['/carrito']);
  }
}
