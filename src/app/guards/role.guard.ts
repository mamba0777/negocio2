import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  private message = inject(NzMessageService);

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRoles = route.data['roles'] as string[];
    const user = this.authService.currentUser;
    
    if (!user) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    const userRole = user.role;
    if (!userRole) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    const hasRole = expectedRoles.includes(userRole);
    
    if (!hasRole) {
      this.message.error('No tienes permiso para acceder a esta sección');
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}
