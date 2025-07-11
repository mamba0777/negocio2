import { Routes } from "@angular/router";
import { InventarioComponent } from "./inventario.component";
import { authGuard } from "../../guards/auth.guard";
import { RoleGuard } from "../../guards/role.guard";

export const INVENTARIO_ROUTES: Routes = [
  {
    path: '',
    component: InventarioComponent,
    canActivate: [authGuard, RoleGuard],
    data: { roles: ['admin'] }
  }
];