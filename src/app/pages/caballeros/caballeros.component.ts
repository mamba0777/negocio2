import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';


@Component({
  selector: 'app-caballeros',
  imports:  [
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
  templateUrl: './caballeros.component.html',
  styleUrls: ['./caballeros.component.scss']
})
export class CaballerosComponent implements OnInit {
  private productService = inject(ProductService);
  private modal = inject(NzModalService );
  private router = inject(Router);

  products = this.productService.products;
  loading = this.productService.loading;
  error = this.productService.error;
  pagination = this.productService.pagination;

  searchText = '';
  searchTimeout: any = null;
  debounceTime  = 300; // 300ms de retraso para la búsqueda

  carrito = signal<Product[]>([]);

  currentPage = computed(() => {
    return (this.pagination()?.offset / this.pagination()?.limit) + 1 || 1;
  });

  onPageChange(page: number): void {
    const offset = (page - 1) * this.pagination().limit;
    this.productService.updatePagination({ offset });
    this.loadProducts(page);
  }

  searchResultsMessage = computed(() => {
    if (this.loading()) return 'Buscando productos...';
    if (this.error()) return this.error();
    if (this.products().length === 0) return 'No se encontraron productos';
    return `Mostrando ${this.products().length} de ${this.pagination().total} productos`;
  });

  constructor() {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(pageIndex: number = 1): void {
    const offset = (pageIndex - 1) * this.pagination().limit;
    if (this.searchText.trim()) {
      this.productService.searchProducts(this.searchText, offset, this.pagination().limit);
    } else {
      this.productService.loadProducts(offset, this.pagination().limit);
    }
  }

  onSearch(): void {
    // Cancelar el timeout anterior si existe
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Establecer un nuevo timeout
    this.searchTimeout = setTimeout(() => {
      this.loadProducts(1); 
    }, this.debounceTime);
  }

  onPageSizeChange(pageSize: number): void {
   
    // Actualizar el límite y volver a cargar la primera página
    this.productService.updatePagination({ limit: pageSize, offset: 0 });
    this.loadProducts(1);
  }
  
  addToCart(product: Product) {
    this.carrito.update(items => [...items, product]);
    this.modal.success({
      nzTitle: '¡Producto agregado!',
      nzContent: `${product.title} ha sido agregado al carrito.`,
      nzOkText: 'Aceptar'
    });
  }

  verDetalles(product: Product) {
    this.modal.create({
      nzTitle: product.title,
      nzContent: `
        <p><strong>Descripción:</strong> ${product.description}</p>
        <p><strong>Precio:</strong> $${product.price}</p>
        <img src="${product.images[0]}" alt="${product.title}" style="max-width: 100%;">
      `,
      nzOkText: 'Cerrar'
    });
  }

  irAlCarrito() {
    this.router.navigate(['/carrito']);
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/default-product.png';
  }

  
}

