import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthzService } from '../services/authz.service';

@Directive({
  selector: '[appHasRole]',
})
export class HasRoleDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authzService = inject(AuthzService);

  @Input() set appHasRole(role: string | string[]) {
    const roles = Array.isArray(role) ? role : [role];
    const hasRole = this.authzService.hasAnyRole(roles);
    
    if (hasRole) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
