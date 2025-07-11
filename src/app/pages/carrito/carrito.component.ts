import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { Router, RouterModule, RouterLink } from '@angular/router';

interface CarritoItem {
  id: number;
  nombre: string;
  imagen: string;
  precio: number;
  cantidad: number;
  categoria: 'maquinas' | 'caballeros' | 'damas';
}

@Component({
  selector: 'app-carrito',
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    RouterModule,
    RouterLink,
  ],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.scss']
})
export class CarritoComponent {
  items: CarritoItem[] = [];
  total: number = 0;

  constructor(private router: Router) {

  }

  actualizarCantidad(id: number, cantidad: number): void {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.cantidad = cantidad;
      this.calcularTotal();
    }
  }

  removerItem(id: number): void {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto del carrito?')) {
      this.items = this.items.filter(item => item.id !== id);
      this.calcularTotal();
    }
  }

  vaciarCarrito(): void {
    this.items = [];
    this.total = 0;
  }

  calcularTotal(): void {
    this.total = this.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  }

  agregarItem(item: Omit<CarritoItem, 'cantidad'>): void {
    const existingItem = this.items.find(i => i.id === item.id);
    if (existingItem) {
      existingItem.cantidad += 1;
    } else {
      this.items.push({ ...item, cantidad: 1 });
    }
    this.calcularTotal();
  }
}
