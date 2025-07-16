import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpStatusCode,
  HttpEventType,
  HttpHeaders
} from '@angular/common/http';
import { Observable, throwError, from, of, BehaviorSubject, finalize } from 'rxjs';
import { catchError, switchMap, tap, filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  
  private authService = inject(AuthService);
  private message = inject(NzMessageService);
  private router = inject(Router);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // No interceptar solicitudes de autenticación o renovación de token
    if (this.isAuthRequest(request)) {
      return next.handle(request);
    }

    // Obtener el token de acceso
    const accessToken = this.authService.getAccessToken();
    
    // Si hay token, clonar la solicitud y agregar el encabezado de autorización
    if (accessToken) {
      request = this.addTokenToRequest(request, accessToken);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Solo manejar errores 401 (No autorizado) que no sean de autenticación
        if (error.status === HttpStatusCode.Unauthorized && !this.isAuthRequest(request)) {
          // Si ya estamos intentando renovar el token, esperar a que termine
          if (this.isRefreshing) {
            return this.handleRefreshInProgress(request, next);
          }
          
          // Intentar renovar el token
          return this.handle401Error(request, next);
        }
        
        // Para otros errores, simplemente propagar el error
        return throwError(() => error);
      })
    );
  }

  private isAuthRequest(request: HttpRequest<any>): boolean {
    // Lista de rutas que no requieren token
    const authRoutes = ['/auth/login', '/auth/register', '/auth/refresh-token'];
    return authRoutes.some(route => request.url.includes(route));
  }

  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    // No clonar si ya tiene el encabezado de autorización
    if (request.headers.has('Authorization')) {
      return request;
    }
    
    return request.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Si no hay token de refresco, cerrar sesión
    if (!this.authService.getRefreshToken()) {
      this.handleLogout();
      return throwError(() => new Error('No hay token de refresco disponible'));
    }

    // Si no se está renovando el token, iniciar el proceso
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);
      
      return from(this.authService.refreshToken()).pipe(
        switchMap(({ accessToken, refreshToken }) => {
          // Token renovado exitosamente
          this.isRefreshing = false;
          
          // Actualizar tokens
          this.authService.setTokens(accessToken, refreshToken);
          this.refreshTokenSubject.next(accessToken);
          
          // Reintentar la solicitud original con el nuevo token
          const newRequest = this.addTokenToRequest(request, accessToken);
          return next.handle(newRequest);
        }),
        catchError((error) => {
          // Error al renovar el token, cerrar sesión
          this.isRefreshing = false;
          this.handleLogout();
          return throwError(() => error);
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    }
    
    // Si ya se está renovando el token, esperar a que termine
    return this.handleRefreshInProgress(request, next);
  }

  private handleRefreshInProgress(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.refreshTokenSubject.pipe(
      // Esperar hasta que haya un nuevo token disponible
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        // Reintentar la solicitud original con el nuevo token
        const newRequest = this.addTokenToRequest(request, token);
        return next.handle(newRequest);
      })
    );
  }

  private handleLogout(): void {
    // Limpiar datos de autenticación
    this.authService.logout();
    
    // Redirigir a la página de login
    this.router.navigate(['/login'], {
      queryParams: { 
        sessionExpired: true,
        redirectUrl: this.router.routerState.snapshot.url
      },
      replaceUrl: true
    });
    
    // Mostrar mensaje al usuario
    this.message.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    
    // Resetear el estado del interceptor
    this.isRefreshing = false;
    this.refreshTokenSubject.next(null);
  }
}
