import { Injectable, computed, signal } from '@angular/core';
import { UserRole, ROLES } from '../models/user.types';

type Permission = 'create' | 'read' | 'update' | 'delete' | 'manage_users';

type RolePermissions = {
  [key in UserRole]: Permission[];
};

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly rolePermissions: RolePermissions = {
    admin: ['create', 'read', 'update', 'delete', 'manage_users'],
    editor: ['create', 'read', 'update'],
    viewer: ['read'],
    customer: ['read']
  } as const;

  private currentRole = signal<UserRole | null>(null);
  
  setCurrentRole(role: UserRole): void {
    this.currentRole.set(role);
  }

  hasPermission(permission: Permission): boolean {
    const role = this.currentRole();
    if (!role) return false;
    return this.rolePermissions[role]?.includes(permission) || false;
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }
}
