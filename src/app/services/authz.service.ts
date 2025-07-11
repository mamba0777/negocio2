import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthzService {
  private authService = inject(AuthService);

  hasRole(role: string): boolean {
    const user = this.authService.currentUser;
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    if (!roles || roles.length === 0) return true;
    const user = this.authService.currentUser;
    if (!user) return false;
    return roles.some(role => user.role === role);
  }
}
