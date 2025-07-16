import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { UserRole } from '../models/user.types';

type Permission = 'create' | 'read' | 'update' | 'delete' | 'manage_users';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  private hasView = false;
  private requiredRoles: UserRole[] = [];
  private requiredPermissions: Permission[] = [];

  @Input() set appHasRole(roles: UserRole | UserRole[]) {
    this.requiredRoles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  @Input() set appHasPermission(permissions: Permission | Permission[]) {
    this.requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    this.updateView();
  }

  @Input() set appRequireAll(requireAll: boolean) {
    this.requireAll = requireAll;
    this.updateView();
  }
  private requireAll = false;

  ngOnInit() {
    this.authService.currentUser$.subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy() {
    this.viewContainer.clear();
  }

  private updateView() {
    const hasRole = this.requiredRoles.length === 0 || 
                   (this.requireAll 
                     ? this.authService.hasAllRoles(this.requiredRoles)
                     : this.authService.hasAnyRole(this.requiredRoles));

    const hasPermission = this.requiredPermissions.length === 0 ||
                        (this.requireAll
                          ? this.permissionService.hasAllPermissions(this.requiredPermissions)
                          : this.permissionService.hasAnyPermission(this.requiredPermissions));

    const shouldShow = hasRole && hasPermission;

    if (shouldShow && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!shouldShow && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
