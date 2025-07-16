import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal, effect } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';
import { User } from './models/user.model';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterLink, RouterOutlet, NzIconModule, NzLayoutModule, NzMenuModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  isAdmin = signal(false);
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // Usar effect para reaccionar a cambios en el usuario
    effect(() => {
      const user = this.authService.user();
      const isAdmin = user?.role === 'admin';
      this.isAdmin.set(isAdmin);
    });
  }

  ngOnInit() {
    // Verificar el estado inicial del usuario
    const currentUser = this.authService.user();
    this.isAdmin.set(currentUser?.role === 'admin');
  }

  // No necesitamos limpiar nada ya que usamos effect() que se limpia automáticamente
  ngOnDestroy() {}
  
  // Método para verificar si el usuario tiene un rol específico
  hasRole(role: string): boolean {
    const user = this.authService.user();
    return user?.role === role;
  }

  get isLoginRoute(): boolean {
    return this.router.url.startsWith('/auth');
  }
}
