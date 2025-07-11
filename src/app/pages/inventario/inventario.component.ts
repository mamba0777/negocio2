import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { RouterLink } from '@angular/router';
import { NzResultModule } from 'ng-zorro-antd/result';
import { HasRoleDirective } from '../../directives/role.directive';

@Component({
  selector: 'app-inventario',
  imports: [
    CommonModule,
    NzCardModule,
    NzButtonModule,
    NzTableModule,
    NzDividerModule,
    NzModalModule,
    NzResultModule,
    RouterLink,
    HasRoleDirective
  ],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss']
})
export class InventarioComponent {
  isVisible = false;

  constructor(private message: NzMessageService) {}

  showModal(): void {
    this.isVisible = true;
  }

  handleOk(): void {
    this.isVisible = false;
    this.message.success('Operación exitosa');
  }

  handleCancel(): void {
    this.isVisible = false;
  }
}
